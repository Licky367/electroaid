const express = require("express")
const router = express.Router()

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

    /* ✅ STATUS ONLY FOR DEPOSIT OR FULL */
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
/* WEBHOOK */
/* ============================= */
router.post("/intasend/webhook", async (req, res) => {

    try {

        const data = req.body || {}

        /* ============================= */
        /* SAFE FIELD EXTRACTION */
        /* ============================= */
        const invoiceId =
            data.invoice_id ||
            data.invoice?.invoice_id ||
            data.id

        const state =
            data.state ||
            data.status

        if (!invoiceId) {
            console.warn("⚠️ Missing invoice_id in webhook")
            return res.sendStatus(400)
        }

        /* ============================= */
        /* FIND PAYMENT */
        /* ============================= */
        const [rows] = await db.query(
            `SELECT * FROM payments WHERE externalRef=? LIMIT 1`,
            [invoiceId]
        )

        if (!rows.length) {
            // Important: still return 200 so IntaSend doesn't retry forever
            return res.sendStatus(200)
        }

        const payment = rows[0]

        /* ============================= */
        /* IDEMPOTENCY (NO DOUBLE RUN) */
        /* ============================= */
        if (payment.status === "SUCCESS") {
            return res.sendStatus(200)
        }

        /* ============================= */
        /* SUCCESS */
        /* ============================= */
        if (state === "COMPLETE" || state === "SUCCESSFUL") {

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
        }

        /* ============================= */
        /* FAILED */
        /* ============================= */
        else if (state === "FAILED") {

            await db.query(
                `UPDATE payments SET status='FAILED' WHERE id=?`,
                [payment.id]
            )
        }

        /* ============================= */
        /* ALWAYS RESPOND 200 */
        /* ============================= */
        return res.sendStatus(200)

    } catch (err) {
        console.error("❌ IntaSend Webhook Error:", err)
        return res.sendStatus(500)
    }
})

module.exports = router