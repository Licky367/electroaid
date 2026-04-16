const express = require("express")
const router = express.Router()
const db = require("../../db")

/* ============================= */
/* AUTH MIDDLEWARE */
/* ============================= */
function requireClient(req, res, next) {
    if (!req.session.CLIENT_ID) {
        return res.redirect("/auth/login")
    }
    next()
}

/* ============================= */
/* GET COMPLETED ASSIGNMENTS */
/* Route: /assignments/completed */
/* ============================= */
router.get("/", requireClient, async (req, res) => {

    try {

        const CLIENT_ID = req.session.CLIENT_ID

        const [rows] = await db.query(
            `SELECT title, reference, budget, completedAt
             FROM assignments
             WHERE CLIENT_ID=? 
             AND status='completed'
             ORDER BY completedAt DESC`,
            [CLIENT_ID]
        )

        res.render("completed", {
            assignments: rows
        })

    } catch (err) {
        console.error(err)
        res.status(500).send("Server error")
    }

})

/* ============================= */
/* GET DETAILS PAGE */
/* Route: /assignments/completed/details */
/* ============================= */
router.get("/details", requireClient, async (req, res) => {

    try {

        const CLIENT_ID = req.session.CLIENT_ID
        const reference = req.query.reference   // ✅ aligned across system

        if (!reference) {
            return res.redirect("/assignments/completed")
        }

        /* ============================= */
        /* ASSIGNMENT */
        /* ============================= */
        const [assignmentRows] = await db.query(
            `SELECT 
                subject,
                title,
                reference,
                deadline,
                feedback,
                rating,
                EXPERT_NAME
             FROM assignments
             WHERE reference=? 
             AND CLIENT_ID=? 
             AND status='completed'`,
            [reference, CLIENT_ID]
        )

        if (!assignmentRows.length) {
            return res.redirect("/assignments/completed")
        }

        const assignment = assignmentRows[0]

        /* ============================= */
        /* SUBMISSIONS */
        /* ============================= */
        const [submissionRows] = await db.query(
            `SELECT fileUrl, fileName, createdAt
             FROM submissions
             WHERE reference=?
             ORDER BY createdAt DESC`,
            [reference]
        )

        const submittedAt = submissionRows.length
            ? submissionRows[0].createdAt
            : null

        const submissionFiles = submissionRows.map(f => ({
            url: f.fileUrl,
            name: f.fileName
        }))

        /* ============================= */
        /* FINAL OBJECT */
/* ============================= */
        const finalData = {
            subject: assignment.subject,
            title: assignment.title,
            reference: assignment.reference,
            deadline: assignment.deadline,
            submittedAt,
            submissionFiles,
            rating: assignment.rating,
            feedback: assignment.feedback,
            EXPERT_NAME: assignment.EXPERT_NAME,
            REG_NO: "N/A"
        }

        res.render("details", {
            assignment: finalData
        })

    } catch (err) {
        console.error(err)
        res.status(500).send("Server error")
    }

})

module.exports = router