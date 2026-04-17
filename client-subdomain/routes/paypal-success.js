const express = require("express");
const router = express.Router();
const paypal = require("@paypal/checkout-server-sdk");

const { Payment, Assignment } = require(../models");

/* ============================= */
/* PAYPAL CLIENT */
/* ============================= */
const paypalEnv = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
);

const paypalClient = new paypal.core.PayPalHttpClient(paypalEnv);

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

    if (type === PAYMENT_TYPE.DEPOSIT || type === PAYMENT_TYPE.FULL) {
        update.status = "In Progress";
    }

    await Assignment.updateOne(
        { reference, CLIENT_ID: clientId },
        update
    );
}

/* ============================= */
/* PAYPAL SUCCESS */
/* ============================= */
router.get("/paypal/success", async (req, res) => {

    try {
        const { token } = req.query;

        if (!token) return res.redirect("/assignments/work");

        /* 🔍 Find payment */
        const payment = await Payment.findOne({
            externalRef: token
        });

        if (!payment) return res.redirect("/assignments/work");

        /* ✅ Prevent duplicate execution */
        if (payment.status === "SUCCESS") {
            return res.redirect("/assignments/work");
        }

        /* ============================= */
        /* CAPTURE PAYMENT */
        /* ============================= */
        const request = new paypal.orders.OrdersCaptureRequest(token);
        request.requestBody({});

        const capture = await paypalClient.execute(request);

        const status = capture.result.status;

        if (status === "COMPLETED") {

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

        } else {

            await Payment.updateOne(
                { _id: payment._id },
                { status: "FAILED" }
            );
        }

        return res.redirect("/assignments/work");

    } catch (err) {
        console.error("❌ PayPal success error:", err);
        return res.redirect("/assignments/work");
    }
});

module.exports = router;