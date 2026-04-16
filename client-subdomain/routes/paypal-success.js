const express = require("express")
const router = express.Router()
const paypal = require("@paypal/checkout-server-sdk")
const db = require("../../db")

/* ============================= */
/* PAYPAL CLIENT */
/* ============================= */
const paypalEnv = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
)
const paypalClient = new paypal.core.PayPalHttpClient(paypalEnv)

/* ============================= */
/* CONSTANTS */
/* ============================= */
const PAYMENT_TYPE = {
    DEPOSIT: "deposit",
    FULL: "full",
    ARREARS: "arrears"
}

/* ============================= */
/* UPDATE ASSIGNMENT */
/* ============================= */
async function updateAssignmentPayment(reference, clientId, type, paidAmount) {

    const [rows] = await db.query(
        `SELECT budget, totalPaid, depositAmount, depositPaid 
         FROM assignments 
         WHERE reference=? AND CLIENT_ID=?`,
        [reference, clientId]
    )

    if (!rows.length) return

    const assignment = rows[0]

    let newTotalPaid = (assignment.totalPaid || 0) + paidAmount
    let newDepositPaid = assignment.depositPaid || 0

    if (type === PAYMENT_TYPE.DEPOSIT) {
        newDepositPaid = assignment.depositAmount
    }

    if (type === PAYMENT_TYPE.FULL) {
        newDepositPaid = assignment.budget
        newTotalPaid = assignment.budget
    }

    if (newTotalPaid > assignment.budget) {
        newTotalPaid = assignment.budget
    }

    let statusQuery = ""
    if (type === PAYMENT_TYPE.DEPOSIT || type === PAYMENT_TYPE.FULL) {
        statusQuery = `, status='In Progress'`
    }

    await db.query(
        `UPDATE assignments 
         SET totalPaid=?, depositPaid=? ${statusQuery}
         WHERE reference=? AND CLIENT_ID=?`,
        [newTotalPaid, newDepositPaid, reference, clientId]
    )
}

/* ============================= */
/* PAYPAL SUCCESS */
/* ============================= */
router.get("/paypal/success", async (req, res) => {

    try {
        const { token } = req.query

        if (!token) return res.redirect("/assignments/work")

        /* 🔍 Find payment */
        const [rows] = await db.query(
            `SELECT * FROM payments WHERE externalRef=? LIMIT 1`,
            [token]
        )

        if (!rows.length) return res.redirect("/assignments/work")

        const payment = rows[0]

        /* ✅ Prevent duplicate execution */
        if (payment.status === "SUCCESS") {
            return res.redirect("/assignments/work")
        }

        /* ============================= */
        /* CAPTURE PAYMENT */
        /* ============================= */
        const request = new paypal.orders.OrdersCaptureRequest(token)
        request.requestBody({})

        const capture = await paypalClient.execute(request)

        const status = capture.result.status

        if (status === "COMPLETED") {

            await db.query(
                `UPDATE payments SET status='SUCCESS' WHERE id=?`,
                [payment.id]
            )

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
                )
            }

        } else {

            await db.query(
                `UPDATE payments SET status='FAILED' WHERE id=?`,
                [payment.id]
            )
        }

        return res.redirect("/assignments/work")

    } catch (err) {
        console.error("❌ PayPal success error:", err)
        return res.redirect("/assignments/work")
    }
})

module.exports = router