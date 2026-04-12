const axios = require("axios");

const {
    getWeekRangeFromDate,
    getWeekRangeFromWeek
} = require("../../utils/week");

/* ================= CONFIG ================= */

const USE_LIVE = process.env.USE_LIVE_EXCHANGE === "true";
const FALLBACK_RATE = Number(process.env.FALLBACK_USD_TO_KES || 130);
const API_URL = process.env.EXCHANGE_RATE_API;

/* ================= EXCHANGE RATE ================= */

let cachedRate = null;
let lastFetchTime = 0;

async function getExchangeRate() {

    const now = Date.now();

    /* cache 1 hour */
    if (cachedRate && (now - lastFetchTime < 3600000)) {
        return cachedRate;
    }

    if (!USE_LIVE) {
        return FALLBACK_RATE;
    }

    try {
        const res = await axios.get(API_URL);
        const rate = res.data?.rates?.KES;

        if (!rate) throw new Error("Invalid exchange response");

        cachedRate = rate;
        lastFetchTime = now;

        return rate;

    } catch (err) {
        console.error("Exchange failed, fallback used:", err.message);
        return FALLBACK_RATE;
    }
}

/* ================= EXPERT ================= */

async function getExpert(regNo) {

    const [rows] = await db.query(`
        SELECT id, EXPERT_NAME, REG_NO
        FROM experts
        WHERE REG_NO = ?
    `, [regNo]);

    if (!rows.length) return null;

    return rows[0];
}

/* ================= BY DATE ================= */

exports.getInvoiceByDate = async (date, regNo) => {

    const expert = await getExpert(regNo);
    if (!expert) return null;

    const { weekStart, weekEnd, week } = getWeekRangeFromDate(date);

    return exports.getInvoiceData(expert, weekStart, weekEnd, week);
};

/* ================= BY WEEK ================= */

exports.getInvoiceByWeek = async (week, regNo) => {

    const expert = await getExpert(regNo);
    if (!expert) return null;

    const { weekStart, weekEnd } = getWeekRangeFromWeek(week);

    return exports.getInvoiceData(expert, weekStart, weekEnd, week);
};

/* ================= CORE ================= */

exports.getInvoiceData = async (expert, weekStart, weekEnd, week) => {

    /* ===== ASSIGNMENTS ===== */
    const [rows] = await db.query(`
        SELECT reference, title, payout as payoutUSD
        FROM assignments
        WHERE EXPERT_ID = ?
        AND status = 'completed'
        AND completedAt BETWEEN ? AND ?
    `, [expert.id, weekStart, weekEnd]);

    const totalUSD = rows.reduce(
        (sum, r) => sum + Number(r.payoutUSD || 0),
        0
    );

    /* ===== EXCHANGE ===== */
    const rate = await getExchangeRate();
    const totalKES = Number((totalUSD * rate).toFixed(2));

    /* ===== PAYMENT STATUS ===== */
    const [paymentRows] = await db.query(`
        SELECT status, transactionCode
        FROM expert_weekly_payments
        WHERE EXPERT_ID = ?
        AND weekStart = ?
        LIMIT 1
    `, [expert.id, weekStart]);

    const payment = paymentRows[0];

    return {
        expert: {
            id: expert.id,
            name: expert.EXPERT_NAME,
            regNo: expert.REG_NO
        },

        week,
        weekRange: `${new Date(weekStart).toDateString()} - ${new Date(weekEnd).toDateString()}`,

        status: payment?.status || "PENDING",
        transactionCode: payment?.transactionCode || null,

        assignments: rows.map(r => ({
            reference: r.reference,
            title: r.title,
            payoutUSD: Number(r.payoutUSD),
            payoutKES: Number((r.payoutUSD * rate).toFixed(2))
        })),

        totalUSD,
        totalKES
    };
};

/* ================= HISTORY ================= */

exports.getHistory = async (regNo) => {

    const expert = await getExpert(regNo);
    if (!expert) return [];

    const [rows] = await db.query(`
        SELECT weekStart, weekEnd, amountUSD, amountKES, status
        FROM expert_weekly_payments
        WHERE EXPERT_ID = ?
        ORDER BY weekStart DESC
        LIMIT 50
    `, [expert.id]);

    return rows.map(r => ({
        week: formatWeek(r.weekStart),
        weekRange: `${new Date(r.weekStart).toDateString()} - ${new Date(r.weekEnd).toDateString()}`,
        amountUSD: r.amountUSD,
        amountKES: r.amountKES,
        status: r.status
    }));
};

/* ================= PDF ================= */

exports.generatePDF = async (week, regNo) => {

    const data = await exports.getInvoiceByWeek(week, regNo);

    if (!data) throw new Error("No invoice data");

    const content = `
Invoice: ${week}
Expert: ${data.expert.name} (${data.expert.regNo})

Total USD: ${data.totalUSD}
Total KES: ${data.totalKES}

Generated at: ${new Date().toISOString()}
`;

    return Buffer.from(content);
};

/* ================= HELPERS ================= */

function formatWeek(date) {
    const d = new Date(date);
    const year = d.getFullYear();

    const firstJan = new Date(year, 0, 1);
    const days = Math.floor((d - firstJan) / 86400000);
    const week = Math.ceil((days + firstJan.getDay() + 1) / 7);

    return `${year}-W${String(week).padStart(2, "0")}`;
}