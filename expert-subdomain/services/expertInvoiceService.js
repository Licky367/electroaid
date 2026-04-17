const {
    getWeekRange,
    getWeekFromDate,
    getCurrentWeek,
    getSafeRate
} = require("../utils/expertInvoiceHelpers");

const {
    ExpertPayment,
    Assignment
} = require("../../models");


/* ============================= */
/* BUILD INVOICE */
/* ============================= */
async function buildInvoice(expertId, week) {

    const { sunday, saturday } = getWeekRange(week);
    const rate = await getSafeRate();

    /* ============================= */
    /* PAYMENT RECORD */
/* ============================= */
    const payment = await ExpertPayment.find({
        EXPERT_ID: expertId,
        weekStart: new Date(sunday)
    }).limit(1).lean();


    /* ============================= */
    /* COMPLETED ASSIGNMENTS */
/* ============================= */
    const assignments = await Assignment.find({
        EXPERT_ID: expertId,
        status: "completed",
        completedAt: {
            $gte: new Date(sunday),
            $lte: new Date(saturday)
        }
    }).select("reference title completedAt payout").lean();


    /* ============================= */
    /* CALCULATION */
/* ============================= */
    let totalUSD = 0;

    const formatted = assignments.map(a => {

        const usd = Number(a.payout || 0);
        const kes = Math.floor(usd * rate);

        totalUSD += usd;

        return {
            ...a,
            payoutUSD: usd,
            payoutKES: kes
        };
    });

    let totalKES = Math.floor(totalUSD * rate);

    let status = "PENDING";
    let transactionCode = null;

    if (week === getCurrentWeek()) {
        status = "WAITING_WEEKEND";
    }

    else if (payment.length) {

        status = payment[0].status;
        transactionCode = payment[0].transactionCode;

        if (status === "PAID") {
            totalUSD = Number(payment[0].amountUSD || totalUSD);
            totalKES = Number(payment[0].amountKES || totalKES);
        }
    }

    return {
        week,
        sunday,
        saturday,
        assignments: formatted,
        totalUSD,
        totalKES,
        status,
        transactionCode
    };
}


/* ============================= */
/* GET INVOICE BY DATE */
/* ============================= */
async function getInvoiceByDate(expertId, date) {
    const week = getWeekFromDate(date);
    return buildInvoice(expertId, week);
}


/* ============================= */
/* HISTORY */
/* ============================= */
async function getHistory(expertId) {

    const rows = await ExpertPayment.find({
        EXPERT_ID: expertId
    })
    .sort({ weekStart: -1 })
    .lean();

    return rows.map(r => {

        const week = getWeekFromDate(r.weekStart);

        return {
            week,
            weekRange: `${new Date(r.weekStart).toDateString()} - ${new Date(r.weekEnd).toDateString()}`,
            amountUSD: r.amountUSD,
            amountKES: r.amountKES,
            status: r.status,
            transactionCode: r.transactionCode,
            paidAt: r.paidAt
        };
    });
}


module.exports = {
    buildInvoice,
    getInvoiceByDate,
    getHistory
};