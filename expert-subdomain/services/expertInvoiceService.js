const db = require("../../db");
const {
    getWeekRange,
    getWeekFromDate,
    getCurrentWeek,
    getSafeRate
} = require("../utils/invoiceHelpers");

async function buildInvoice(expertId, week){

    const { sunday, saturday } = getWeekRange(week);
    const rate = await getSafeRate();

    const [payment] = await db.query(`
        SELECT status, transactionCode, amountUSD, amountKES
        FROM expert_weekly_payments
        WHERE EXPERT_ID = ?
        AND DATE(weekStart) = DATE(?)
    `,[expertId, sunday]);

    const [assignments] = await db.query(`
        SELECT reference, title, completedAt, payout
        FROM assignments
        WHERE EXPERT_ID = ?
        AND status = 'completed'
        AND completedAt BETWEEN ? AND ?
    `,[expertId, sunday, saturday]);

    let totalUSD = 0;

    const formatted = assignments.map(a=>{
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

    if(week === getCurrentWeek()){
        status = "WAITING_WEEKEND";
    }
    else if(payment.length){

        status = payment[0].status;
        transactionCode = payment[0].transactionCode;

        if(status === "PAID"){
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

async function getInvoiceByDate(expertId, date){
    const week = getWeekFromDate(date);
    return buildInvoice(expertId, week);
}

async function getHistory(expertId){

    const [rows] = await db.query(`
        SELECT weekStart, weekEnd, amountUSD, amountKES, status, transactionCode, paidAt
        FROM expert_weekly_payments
        WHERE EXPERT_ID = ?
        ORDER BY weekStart DESC
    `,[expertId]);

    return rows.map(r=>{
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