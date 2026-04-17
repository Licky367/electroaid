const express = require("express");
const router = express.Router();

const { Payment, Assignment } = require("../models");

/* ============================= */
/* CONSTANTS */
/* ============================= */
const PAYMENT_TYPE = {
    DEPOSIT: "deposit",
    FULL: "full",
    ARREARS: "arrears"
};

/* ============================= */
/* UPDATE ASSIGNMENT */
/* ============================= */
async function updateAssignmentPayment(reference, clientId, type, paidAmount) {

    const assignment = await Assignment.findOne({
        reference,
        CLIENT_ID: clientId
    }).select("budget totalPaid depositAmount depositPaid");

    if (!assignment) return;

    let newTotalPaid = (assignment.totalPaid || 0) + paidAmount;
    let newDepositPaid = assignment.depositPaid || 0;

    if (type === PAYMENT_TYPE.DEPOSIT) {
        newDepositPaid = assignment.depositAmount;
    }

    if (type === PAYMENT_TYPE.FULL) {
        newDepositPaid = assignment.budget;
        newTotalPaid = assignment.budget;
    }

    if (newTotalPaid > assignment.budget) {
        newTotalPaid = assignment.budget;
    }

    const update = {
        totalPaid: newTotalPaid,
        depositPaid: newDepositPaid
    };

    /* ✅ STATUS ONLY FOR DEPOSIT OR FULL */
    if (type === PAYMENT_TYPE.DEPOSIT || type === PAYMENT_TYPE.FULL) {
        update.status = "In Progress";
    }

    await Assignment.updateOne(
        { reference, CLIENT_ID: clientId },
        update
    );
}

/* ============================= */
/* WEBHOOK */
/* ============================= */
router.post("/intasend/webhook", async (req, res) => {

    try {

        const data = req.body || {};

        /* ============================= */
        /* SAFE FIELD EXTRACTION */
/* ============================= */
        const invoiceId =
            data.invoice_id ||
            data.invoice?.invoice_id ||
            data.id;

        const state =
            data.state ||
            data.status;

        if (!invoiceId) {
            console.warn("⚠️ Missing invoice_id in webhook");
            return res.sendStatus(400);
        }

        /* ============================= */
        /* FIND PAYMENT */
/* ============================= */
        const payment = await Payment.findOne({
            externalRef: invoiceId
        });

        if (!payment) {
            // Important: still return 200 so IntaSend doesn't retry forever
            return res.sendStatus(200);
        }

        /* ============================= */
        /* IDEMPOTENCY (NO DOUBLE RUN) */
/* ============================= */
        if (payment.status === "SUCCESS") {
            return res.sendStatus(200);
        }

        /* ============================= */
        /* SUCCESS */
/* ============================= */
        if (state === "COMPLETE" || state === "SUCCESSFUL") {

            await Payment.updateOne(
                { _id: payment._id },
                { status: "SUCCESS" }
            );

            /* ✅ ONLY deposit/full updates assignment */
            if (
                payment.type === PAYMENT_TYPE.DEPOSIT ||
                payment.type === PAYMENT_TYPE.FULL
            ) {
                await updateAssignmentPayment(
                    payment.reference,
                    payment.CLIENT_ID,
                    payment.type,
                    payment.amount_USD
                );
            }
        }

        /* ============================= */
        /* FAILED */
/* ============================= */
        else if (state === "FAILED") {

            await Payment.updateOne(
                { _id: payment._id },
                { status: "FAILED" }
            );
        }

        /* ============================= */
        /* ALWAYS RESPOND 200 */
/* ============================= */
        return res.sendStatus(200);

    } catch (err) {
        console.error("❌ IntaSend Webhook Error:", err);
        return res.sendStatus(500);
    }
});

module.exports = router;