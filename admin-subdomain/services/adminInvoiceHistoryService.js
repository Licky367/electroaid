const axios = require("axios");

const {
    Expert,
    Assignment,
    ExpertWeeklyPayment
} = require("../models");

const {
    getWeekRangeFromDate,
    getWeekRangeFromWeek
} = require("../../utils/week");

/* ================= CONFIG ================= */

const USE_LIVE =
    process.env.USE_LIVE_EXCHANGE === "true";

const FALLBACK_RATE = Number(
    process.env.FALLBACK_USD_TO_KES || 130
);

const API_URL =
    process.env.EXCHANGE_RATE_API;

/* ================= EXCHANGE RATE ================= */

let cachedRate = null;
let lastFetchTime = 0;

async function getExchangeRate() {
    const now = Date.now();

    if (
        cachedRate &&
        now - lastFetchTime < 3600000
    ) {
        return cachedRate;
    }

    if (!USE_LIVE) {
        return FALLBACK_RATE;
    }

    try {
        const res =
            await axios.get(API_URL);

        const rate =
            res.data?.rates?.KES;

        if (!rate) {
            throw new Error(
                "Invalid exchange response"
            );
        }

        cachedRate = rate;
        lastFetchTime = now;

        return rate;

    } catch (err) {
        console.error(
            "Exchange failed, fallback used:",
            err.message
        );

        return FALLBACK_RATE;
    }
}

/* ================= EXPERT ================= */

async function getExpert(regNo) {
    return await Expert.findOne({
        REG_NO: regNo
    })
        .select(
            "_id EXPERT_NAME REG_NO"
        )
        .lean();
}

/* ================= BY DATE ================= */

exports.getInvoiceByDate =
async (date, regNo) => {

    const expert =
        await getExpert(regNo);

    if (!expert) {
        return null;
    }

    const {
        weekStart,
        weekEnd,
        week
    } =
        getWeekRangeFromDate(
            date
        );

    return exports.getInvoiceData(
        expert,
        weekStart,
        weekEnd,
        week
    );
};

/* ================= BY WEEK ================= */

exports.getInvoiceByWeek =
async (week, regNo) => {

    const expert =
        await getExpert(regNo);

    if (!expert) {
        return null;
    }

    const {
        weekStart,
        weekEnd
    } =
        getWeekRangeFromWeek(
            week
        );

    return exports.getInvoiceData(
        expert,
        weekStart,
        weekEnd,
        week
    );
};

/* ================= CORE ================= */

exports.getInvoiceData =
async (
    expert,
    weekStart,
    weekEnd,
    week
) => {

    const rows =
        await Assignment.find({
            EXPERT_ID:
                expert._id,

            status:
                "completed",

            completedAt: {
                $gte:
                    new Date(
                        weekStart
                    ),

                $lte:
                    new Date(
                        weekEnd
                    )
            }
        })
            .select(
                "reference title payout"
            )
            .lean();

    const totalUSD =
        rows.reduce(
            (sum, row) =>
                sum +
                Number(
                    row.payout || 0
                ),
            0
        );

    const rate =
        await getExchangeRate();

    const totalKES =
        Number(
            (
                totalUSD * rate
            ).toFixed(2)
        );

    const payment =
        await ExpertWeeklyPayment.findOne(
            {
                EXPERT_ID:
                    expert._id,

                weekStart:
                    new Date(
                        weekStart
                    )
            }
        )
            .select(
                "status transactionCode"
            )
            .lean();

    return {
        expert: {
            id: expert._id,
            name:
                expert.EXPERT_NAME,
            regNo:
                expert.REG_NO
        },

        week,

        weekRange:
            `${new Date(
                weekStart
            ).toDateString()} - ${new Date(
                weekEnd
            ).toDateString()}`,

        status:
            payment?.status ||
            "PENDING",

        transactionCode:
            payment?.transactionCode ||
            null,

        assignments:
            rows.map(
                row => ({
                    reference:
                        row.reference,

                    title:
                        row.title,

                    payoutUSD:
                        Number(
                            row.payout ||
                            0
                        ),

                    payoutKES:
                        Number(
                            (
                                (
                                    row.payout ||
                                    0
                                ) *
                                rate
                            ).toFixed(
                                2
                            )
                        )
                })
            ),

        totalUSD,
        totalKES
    };
};

/* ================= HISTORY ================= */

exports.getHistory =
async regNo => {

    const expert =
        await getExpert(regNo);

    if (!expert) {
        return [];
    }

    const rows =
        await ExpertWeeklyPayment.find(
            {
                EXPERT_ID:
                    expert._id
            }
        )
            .sort({
                weekStart: -1
            })
            .limit(50)
            .select(
                "weekStart weekEnd amountUSD amountKES status"
            )
            .lean();

    return rows.map(
        row => ({
            week:
                formatWeek(
                    row.weekStart
                ),

            weekRange:
                `${new Date(
                    row.weekStart
                ).toDateString()} - ${new Date(
                    row.weekEnd
                ).toDateString()}`,

            amountUSD:
                row.amountUSD,

            amountKES:
                row.amountKES,

            status:
                row.status
        })
    );
};

/* ================= PDF ================= */

exports.generatePDF =
async (week, regNo) => {

    const data =
        await exports.getInvoiceByWeek(
            week,
            regNo
        );

    if (!data) {
        throw new Error(
            "No invoice data"
        );
    }

    const content = `
Invoice: ${week}
Expert: ${data.expert.name} (${data.expert.regNo})

Total USD: ${data.totalUSD}
Total KES: ${data.totalKES}

Generated at: ${new Date().toISOString()}
`;

    return Buffer.from(
        content
    );
};

/* ================= HELPERS ================= */

function formatWeek(date) {
    const d =
        new Date(date);

    const year =
        d.getFullYear();

    const firstJan =
        new Date(
            year,
            0,
            1
        );

    const days =
        Math.floor(
            (d - firstJan) /
            86400000
        );

    const week =
        Math.ceil(
            (
                days +
                firstJan.getDay() +
                1
            ) / 7
        );

    return `${year}-W${String(
        week
    ).padStart(2, "0")}`;
}