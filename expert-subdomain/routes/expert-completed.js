require("dotenv").config({ path: "../config.env" })

const express = require("express")
const router = express.Router()
const db = require("../db")

/* ============================= */
/* AUTH */
/* ============================= */

function requireExpert(req, res, next) {
    if (!req.session.expert) {
        return res.redirect("/login")
    }
    next()
}

/* ============================= */
/* COMPLETED LIST */
/* ============================= */

router.get("/completed", requireExpert, async (req, res) => {

    try {

        const EXPERT_ID = req.session.EXPERT_ID

        const [assignments] = await db.query(
            `SELECT reference, title, payout, rating
             FROM assignments
             WHERE EXPERT_ID=? AND status='completed'
             ORDER BY completedAt DESC`,
            [EXPERT_ID]
        )

        const totalCompleted = assignments.length

        let totalRating = 0
        assignments.forEach(a => {
            totalRating += a.rating || 0
        })

        const averageRating = totalCompleted > 0
            ? totalRating / totalCompleted
            : 0

        res.render("expert-completed", {
            assignments,
            totalCompleted,
            averageRating
        })

    } catch (err) {
        console.error(err)
        res.status(500).send("Server error")
    }

})

/* ============================= */
/* COMPLETED VIEW */
/* ============================= */

router.get("/completed-view", requireExpert, async (req, res) => {

    try {

        const EXPERT_ID = req.session.EXPERT_ID
        const reference = req.query.ref

        if (!reference) {
            return res.redirect("/expert/assignments/completed")
        }

        /* ============================= */
        /* ASSIGNMENT (SOURCE OF TRUTH) */
        /* ============================= */

        const [rows] = await db.query(
            `SELECT *
             FROM assignments
             WHERE reference=? AND EXPERT_ID=? AND status='completed'`,
            [reference, EXPERT_ID]
        )

        if (!rows.length) {
            return res.redirect("/expert/assignments/completed")
        }

        const assignment = rows[0]

        /* ============================= */
        /* EXPERT SUBMISSIONS */
        /* ============================= */

        const [submissionRows] = await db.query(
            `SELECT fileUrl, fileName, submissionText, createdAt
             FROM submissions
             WHERE reference=?
             AND type='submission'
             AND isClient=FALSE
             ORDER BY createdAt ASC`,
            [reference]
        )

        /* FILES */
        const submissionFiles = submissionRows
            .filter(s => s.fileUrl)
            .map(s => ({
                fileUrl: s.fileUrl,
                fileName: s.fileName
            }))

        /* TEXT */
        const textRow = submissionRows
            .filter(s => s.submissionText)
            .pop()

        const submissionText = textRow
            ? textRow.submissionText
            : ""

        /* DATE */
        const dateRow = submissionRows.length
            ? submissionRows[submissionRows.length - 1]
            : null

        const submissionDate = dateRow
            ? dateRow.createdAt
            : null

        /* ============================= */
        /* RENDER */
        /* ============================= */

        res.render("expert-completed-view", {
            assignment,          // includes rating + feedback
            submissionFiles,
            submissionText,
            submissionDate
        })

    } catch (err) {
        console.error(err)
        res.status(500).send("Server error")
    }

})

module.exports = router