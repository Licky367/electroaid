const axios = require("axios");
const nodemailer = require("nodemailer");

/* ================= ENV ================= */
const INTASEND_SECRET = process.env.INTASEND_SECRET_KEY;
const INTASEND_BASE_URL = process.env.INTASEND_BASE_URL;
const INTASEND_ADMIN_WEBHOOK_URL = process.env.INTASEND_ADMIN_WEBHOOK_URL;

const USE_LIVE_EXCHANGE = process.env.USE_LIVE_EXCHANGE === "true";
const FALLBACK_RATE = Number(process.env.FALLBACK_USD_TO_KES);
const EXCHANGE_API = process.env.EXCHANGE_RATE_API;

const MAX_RETRIES = 3;

/* ================= EMAIL ENV ================= */
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME;

const EXPERT_BASE_URL = process.env.EXPERT_BASE_URL;

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL;
const SUPPORT_PHONE = process.env.SUPPORT_PHONE;
const SUPPORT_WHATSAPP = process.env.SUPPORT_WHATSAPP;

/* ================= MAILER ================= */
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});

/* ================= EMAIL ================= */
const sendPaymentEmail = async (payment, expert) => {
    try {

        const maskedPhone = expert.EXPERT_PHONE.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2");

        const html = `
        Hello ${expert.EXPERT_NAME},

        We’re pleased to inform you that your weekly payout has been successfully processed.

        ──────────────────────────────

        💰 Payment Details

        Amount (KES): ${payment.amountKES}
        Amount (USD): ${payment.amountUSD}
        M-Pesa Code: ${payment.transactionCode}
        Period: ${new Date(payment.weekStart).toLocaleDateString()} → ${new Date(payment.weekEnd).toLocaleDateString()}
        Sent to: ${maskedPhone}

        ──────────────────────────────

        📊 View Your Earnings
        👉 ${EXPERT_BASE_URL}/expert/invoice

        ──────────────────────────────

        📞 Need Help?
        Email: ${SUPPORT_EMAIL}
        Phone: ${SUPPORT_PHONE}
        WhatsApp: ${SUPPORT_WHATSAPP}

        ──────────────────────────────

        Best regards,  
        ${EMAIL_FROM_NAME}
        `;

        await transporter.sendMail({
            from: `"${EMAIL_FROM_NAME}" <${EMAIL_USER}>`,
            to: expert.EXPERT_EMAIL,
            subject: `Payment Successful – KES ${payment.amountKES}`,
            text: html,
            html
        });

    } catch (err) {
        console.error("EMAIL ERROR:", err.message);
    }
};

/* ================= UTIL ================= */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const makePaymentRequest = async (payload, retries = 3) => {
    try {
        return await axios.post(
            `${INTASEND_BASE_URL}/payment/mpesa-stk-push/`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${INTASEND_SECRET}`,
                    "Content-Type": "application/json"
                }
            }
        );
    } catch (err) {
        if (retries <= 0) throw err;
        await sleep(2000);
        return makePaymentRequest(payload, retries - 1);
    }
};

/* ================= EXCHANGE ================= */
exports.getExchangeRate = async () => {
    try {
        if (USE_LIVE_EXCHANGE && EXCHANGE_API) {
            const res = await axios.get(EXCHANGE_API);
            const rate = res.data?.rates?.KES;
            if (rate && rate > 0) return Number(rate);
        }
    } catch (err) {
        console.error("Exchange API failed:", err.message);
    }

    if (!FALLBACK_RATE || FALLBACK_RATE <= 0) {
        throw new Error("Invalid FALLBACK_USD_TO_KES");
    }

    return FALLBACK_RATE;
};

/* ================= RETRY PAYMENT ================= */
const retryPayment = async (payment) => {

    if ((payment.retryCount || 0) >= MAX_RETRIES) return;

    const conn = await db.pool.getConnection();

    try {
        await conn.beginTransaction();

        const rate = await exports.getExchangeRate();

        const [rows] = await conn.query(`
            SELECT a.*, e.EXPERT_PHONE
            FROM assignments a
            JOIN experts e ON a.EXPERT_ID = e.id
            WHERE a.EXPERT_ID = ?
            AND a.completedAt BETWEEN ? AND ?
            AND a.status = 'completed'
        `, [payment.EXPERT_ID, payment.weekStart, payment.weekEnd]);

        if (!rows.length) {
            await conn.commit();
            return;
        }

        const amountUSD = rows.reduce((s, r) => s + Number(r.payout || 0), 0);
        const amountKES = Number((amountUSD * rate).toFixed(2));

        const response = await makePaymentRequest({
            amount: amountKES,
            phone_number: rows[0].EXPERT_PHONE,
            currency: "KES",
            reference: `RETRY-${payment.REG_NO}-${Date.now()}`,
            callback_url: INTASEND_ADMIN_WEBHOOK_URL
        });

        const ref = response.data?.invoice?.invoice_id;

        await conn.query(`
            UPDATE expert_weekly_payments
            SET 
                paymentReference = ?,
                status = 'PROCESSING',
                retryCount = retryCount + 1,
                nextRetryAt = NULL
            WHERE id = ?
        `, [ref, payment.id]);

        await conn.commit();

    } catch (err) {
        await conn.rollback();

        const newRetry = (payment.retryCount || 0) + 1;

        await conn.query(`
            UPDATE expert_weekly_payments
            SET 
                retryCount = ?,
                nextRetryAt = CASE
                    WHEN ? >= ? THEN NULL
                    ELSE DATE_ADD(NOW(), INTERVAL 10 MINUTE)
                END
            WHERE id = ?
        `, [newRetry, newRetry, MAX_RETRIES, payment.id]);

    } finally {
        conn.release();
    }
};

/* ================= WEBHOOK ================= */
exports.handleIntaSendCallback = async (body) => {

    const conn = await db.pool.getConnection();

    try {
        await conn.beginTransaction();

        const invoice = body?.invoice;
        if (!invoice?.invoice_id) {
            await conn.commit();
            return;
        }

        const reference = invoice.invoice_id;
        const state = invoice.state;
        const receipt = invoice.mpesa_reference || null;

        const [rows] = await conn.query(`
            SELECT * FROM expert_weekly_payments
            WHERE paymentReference = ?
            FOR UPDATE
        `, [reference]);

        if (!rows.length) {
            await conn.commit();
            return;
        }

        const payment = rows[0];

        if (payment.status === "PAID") {
            await conn.commit();
            return;
        }

        if (state === "COMPLETE") {

            await conn.query(`
                UPDATE expert_weekly_payments
                SET status = 'PAID', transactionCode = ?, paidAt = NOW()
                WHERE id = ?
            `, [receipt, payment.id]);

            const [[expert]] = await conn.query(`
                SELECT EXPERT_NAME, EXPERT_EMAIL, EXPERT_PHONE
                FROM experts
                WHERE id = ?
            `, [payment.EXPERT_ID]);

            await conn.commit();

            await sendPaymentEmail(
                { ...payment, transactionCode: receipt },
                expert
            );

            return;

        } else if (state === "FAILED") {

            await conn.query(`
                UPDATE expert_weekly_payments
                SET status = 'FAILED'
                WHERE id = ?
            `, [payment.id]);

            await conn.commit();

            await retryPayment(payment);
            return;
        }

        await conn.commit();

    } catch (err) {
        await conn.rollback();
        console.error("WEBHOOK ERROR:", err.message);
    } finally {
        conn.release();
    }
};

/* ================= AUTO RETRY WORKER ================= */

const processAutoRetries = async () => {

    const conn = await db.pool.getConnection();

    try {

        const [payments] = await conn.query(`
            SELECT *
            FROM expert_weekly_payments
            WHERE status = 'FAILED'
            AND retryCount < ?
            AND nextRetryAt IS NOT NULL
            AND nextRetryAt <= NOW()
            ORDER BY nextRetryAt ASC
            LIMIT 20
        `, [MAX_RETRIES]);

        if (!payments.length) return;

        console.log(`🔁 Auto-retrying ${payments.length} payments...`);

        for (const payment of payments) {
            await retryPayment(payment);
        }

    } catch (err) {
        console.error("AUTO RETRY ERROR:", err.message);
    } finally {
        conn.release();
    }
};

/* ================= START WORKER ================= */
setInterval(processAutoRetries, 2 * 60 * 1000);