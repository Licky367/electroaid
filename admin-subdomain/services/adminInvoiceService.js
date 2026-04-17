const axios = require("axios");
const nodemailer = require("nodemailer");

const {
  Expert,
  Assignment,
  ExpertWeeklyPayment
} = require("../models");

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
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

/* ================= EMAIL ================= */
const sendPaymentEmail = async (payment, expert) => {
    try {

        const maskedPhone = expert.EXPERT_PHONE
            ? expert.EXPERT_PHONE.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2")
            : "N/A";

        const html = `
        Hello ${expert.EXPERT_NAME},

        We’re pleased to inform you that your weekly payout has been successfully processed.

        💰 Payment Details
        Amount (KES): ${payment.amountKES}
        Amount (USD): ${payment.amountUSD}
        M-Pesa Code: ${payment.transactionCode}
        Period: ${new Date(payment.weekStart).toLocaleDateString()} → ${new Date(payment.weekEnd).toLocaleDateString()}
        Sent to: ${maskedPhone}

        👉 ${EXPERT_BASE_URL}/expert/invoice

        📞 ${SUPPORT_EMAIL} | ${SUPPORT_PHONE}

        Regards,
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

    const rate = await exports.getExchangeRate();

    const assignments = await Assignment.find({
        EXPERT_ID: payment.EXPERT_ID,
        status: "completed",
        completedAt: {
            $gte: payment.weekStart,
            $lte: payment.weekEnd
        }
    });

    if (!assignments.length) return;

    const expert = await Expert.findById(payment.EXPERT_ID);

    const amountUSD = assignments.reduce(
        (sum, a) => sum + Number(a.payout || 0),
        0
    );

    const amountKES = Number((amountUSD * rate).toFixed(2));

    const response = await makePaymentRequest({
        amount: amountKES,
        phone_number: expert?.EXPERT_PHONE,
        currency: "KES",
        reference: `RETRY-${payment.REG_NO}-${Date.now()}`,
        callback_url: INTASEND_ADMIN_WEBHOOK_URL
    });

    const ref = response.data?.invoice?.invoice_id;

    await ExpertWeeklyPayment.updateOne(
        { _id: payment._id },
        {
            $set: {
                paymentReference: ref,
                status: "PROCESSING",
                nextRetryAt: null
            },
            $inc: { retryCount: 1 }
        }
    );
};

/* ================= WEBHOOK ================= */
exports.handleIntaSendCallback = async (body) => {

    const invoice = body?.invoice;
    if (!invoice?.invoice_id) return;

    const reference = invoice.invoice_id;
    const state = invoice.state;
    const receipt = invoice.mpesa_reference || null;

    const payment = await ExpertWeeklyPayment.findOne({
        paymentReference: reference
    });

    if (!payment) return;

    if (payment.status === "PAID") return;

    if (state === "COMPLETE") {

        await ExpertWeeklyPayment.updateOne(
            { _id: payment._id },
            {
                $set: {
                    status: "PAID",
                    transactionCode: receipt,
                    paidAt: new Date()
                }
            }
        );

        const expert = await Expert.findById(payment.EXPERT_ID);

        await sendPaymentEmail(
            { ...payment.toObject(), transactionCode: receipt },
            expert
        );

        return;

    } else if (state === "FAILED") {

        await ExpertWeeklyPayment.updateOne(
            { _id: payment._id },
            { $set: { status: "FAILED" } }
        );

        await retryPayment(payment);
        return;
    }
};

/* ================= AUTO RETRY WORKER ================= */
const processAutoRetries = async () => {

    const payments = await ExpertWeeklyPayment.find({
        status: "FAILED",
        retryCount: { $lt: MAX_RETRIES },
        nextRetryAt: { $ne: null, $lte: new Date() }
    }).limit(20);

    if (!payments.length) return;

    console.log(`🔁 Auto-retrying ${payments.length} payments...`);

    for (const payment of payments) {
        await retryPayment(payment);
    }
};

/* ================= START WORKER ================= */
setInterval(processAutoRetries, 2 * 60 * 1000);