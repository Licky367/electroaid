const express = require("express");
const router = express.Router();
const axios = require("axios");
const paypal = require("@paypal/checkout-server-sdk");

const { getUSDtoKES } = require("../../utils/exchangeRate");
const { Assignment, Payment } = require(../models");

/* ============================= */
/* CONSTANTS */
/* ============================= */
const PAYMENT_TYPE = {
    DEPOSIT: "deposit",
    FULL: "full",
    ARREARS: "arrears"
};

const VALID_TYPES = Object.values(PAYMENT_TYPE);

/* ============================= */
/* PAYPAL */
/* ============================= */
const paypalEnv = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
);

const paypalClient = new paypal.core.PayPalHttpClient(paypalEnv);

/* ============================= */
/* HELPERS */
/* ============================= */
function formatPhone(phone) {
    if (!phone) return "";
    if (phone.startsWith("0")) return "254" + phone.slice(1);
    if (phone.startsWith("+")) return phone.replace("+", "");
    return phone;
}

/* ============================= */
/* CALCULATOR */
/* ============================= */
function calculateAmount(type, assignment) {
    const totalPaid = assignment.totalPaid || 0;
    const budget = assignment.budget || 0;
    const depositAmount = assignment.depositAmount || 0;

    let amount = 0;

    if (type === PAYMENT_TYPE.DEPOSIT) amount = depositAmount;
    if (type === PAYMENT_TYPE.FULL) amount = budget;
    if (type === PAYMENT_TYPE.ARREARS) amount = budget - totalPaid;

    if (!amount || amount < 0) amount = 0;

    return amount;
}

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
/* INTASEND */
/* ============================= */
async function initiateIntaSendMpesa(phone, amount_KES, reference) {
    const res = await axios.post(
        `${process.env.INTASEND_BASE_URL}/v1/payment/collection/`,
        {
            public_key: process.env.INTASEND_PUBLISHABLE_KEY,
            amount: Math.round(amount_KES),
            currency: "KES",
            method: "M-PESA",
            phone_number: phone,
            reference: reference
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`
            }
        }
    );

    return res.data.invoice.invoice_id;
}

async function initiateIntaSendCheckout(amount_USD, email, reference) {
    const res = await axios.post(
        `${process.env.INTASEND_BASE_URL}/v1/checkout/`,
        {
            public_key: process.env.INTASEND_PUBLISHABLE_KEY,
            amount: amount_USD,
            currency: "USD",
            email: email,
            reference: reference,
            redirect_url: process.env.INTASEND_REDIRECT_URL
        }
    );

    return res.data.url;
}

/* ============================= */
/* PAYPAL */
/* ============================= */
async function createPaypalOrder(amount_USD, reference, type) {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");

    request.requestBody({
        intent: "CAPTURE",
        purchase_units: [{
            amount: {
                currency_code: "USD",
                value: amount_USD.toFixed(2)
            },
            custom_id: `${reference}|${type}`
        }],
        application_context: {
            return_url: process.env.PAYPAL_RETURN_URL,
            cancel_url: process.env.PAYPAL_CANCEL_URL
        }
    });

    const order = await paypalClient.execute(request);

    return {
        id: order.result.id,
        url: order.result.links.find(l => l.rel === "approve").href
    };
}

/* ============================= */
/* PAY PAGE */
/* ============================= */
router.get("/pay", async (req, res) => {
    if (!req.session.CLIENT_ID) return res.redirect("/auth/login");

    const { reference, type } = req.query;

    if (!reference || !VALID_TYPES.includes(type)) {
        return res.redirect("/assignments/work");
    }

    const assignment = await Assignment.findOne({
        reference,
        CLIENT_ID: req.session.CLIENT_ID
    }).select("budget depositAmount totalPaid");

    if (!assignment) return res.redirect("/assignments/work");

    const amount_USD = calculateAmount(type, assignment);

    if (!amount_USD || amount_USD <= 0) {
        return res.redirect("/assignments/work");
    }

    const rate = await getUSDtoKES();
    const amount_KES = amount_USD * rate;

    res.render("pay", {
        reference,
        type,
        amount_USD,
        amount_KES,
        rate,
        paymentMethods: ["MPESA", "PAYPAL", "CARD", "ACH"]
    });
});

/* ============================= */
/* PROCESS PAYMENT */
/* ============================= */
router.post("/api/process-payment", async (req, res) => {
    if (!req.session.CLIENT_ID) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { reference, type, method, accountIdentifier } = req.body;

    if (!reference || !VALID_TYPES.includes(type)) {
        return res.status(400).json({ message: "Invalid request" });
    }

    const assignment = await Assignment.findOne({
        reference,
        CLIENT_ID: req.session.CLIENT_ID
    }).select("budget depositAmount totalPaid depositPaid");

    if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
    }

    const totalPaid = assignment.totalPaid || 0;
    const budget = assignment.budget || 0;
    const arrears = budget - totalPaid;

    if (totalPaid >= budget) {
        return res.status(400).json({ message: "Already fully paid" });
    }

    if (
        (type === PAYMENT_TYPE.DEPOSIT || type === PAYMENT_TYPE.FULL) &&
        totalPaid > 0
    ) {
        return res.status(400).json({ message: "Initial payment already done" });
    }

    if (type === PAYMENT_TYPE.ARREARS && arrears <= 0) {
        return res.status(400).json({ message: "No arrears available" });
    }

    const amount_USD = calculateAmount(type, assignment);

    if (!amount_USD || amount_USD <= 0) {
        return res.status(400).json({ message: "Invalid payment amount" });
    }

    const rate = await getUSDtoKES();
    const amount_KES = amount_USD * rate;

    /* ===== MPESA ===== */
    if (method === "MPESA") {
        const phone = formatPhone(accountIdentifier);

        const invoiceId = await initiateIntaSendMpesa(
            phone,
            amount_KES,
            reference
        );

        await Payment.create({
            reference,
            CLIENT_ID: req.session.CLIENT_ID,
            method,
            accountIdentifier: phone,
            amount_USD,
            amount_KES,
            exchangeRate: rate,
            type,
            status: "PENDING",
            externalRef: invoiceId
        });

        return res.json({ success: true });
    }

    /* ===== PAYPAL ===== */
    if (method === "PAYPAL") {
        const order = await createPaypalOrder(amount_USD, reference, type);

        await Payment.create({
            reference,
            CLIENT_ID: req.session.CLIENT_ID,
            method,
            accountIdentifier: "paypal",
            amount_USD,
            amount_KES,
            exchangeRate: rate,
            type,
            status: "PENDING",
            externalRef: order.id
        });

        return res.json({ success: true, redirect: order.url });
    }

    /* ===== CARD / ACH ===== */
    if (method === "CARD" || method === "ACH") {
        const url = await initiateIntaSendCheckout(
            amount_USD,
            accountIdentifier,
            reference
        );

        await Payment.create({
            reference,
            CLIENT_ID: req.session.CLIENT_ID,
            method,
            accountIdentifier,
            amount_USD,
            amount_KES,
            exchangeRate: rate,
            type,
            status: "PENDING",
            externalRef: reference
        });

        return res.json({ success: true, redirect: url });
    }

    return res.status(400).json({ message: "Invalid method" });
});

module.exports = router;