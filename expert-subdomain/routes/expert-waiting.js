require("dotenv").config({ path: "../config.env" })

const express = require("express")
const router = express.Router()

/* ============================= */
/* AUTH (EXPERT) */
/* ============================= */

function requireExpert(req, res, next) {
    if (!req.session.expert) {
        return res.status(401).send("Unauthorized")
    }
    next()
}

/* ============================= */
/* LOAD WAITING PAGE */
/* ============================= */

router.get("/waiting", requireExpert, (req, res) => {

    res.render("waiting", {
        EXPERT_NAME: req.session.EXPERT_NAME || "Expert"
    })

})

/* ============================= */
/* LOAD VIEW PAGE */
/* ============================= */

router.get("/waiting-view", requireExpert, (req, res) => {

    res.render("waiting-view", {
        EXPERT_NAME: req.session.EXPERT_NAME || "Expert"
    })

})

/* ============================= */
/* GET WAITING ASSIGNMENTS */
/* ============================= */

router.get("/api/waiting-assignments", requireExpert, async (req, res) => {

    try {

        const EXPERT_ID = req.session.EXPERT_ID

        const [rows] = await db.query(
            `SELECT reference, title, dueDate, acceptedAt
             FROM assignments
             WHERE EXPERT_ID=? 
             AND status='accepted'   -- ✅ FIXED HERE
             ORDER BY acceptedAt DESC`,
            [EXPERT_ID]
        )

        res.json(rows)

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Server error" })
    }

})

/* ============================= */
/* GET SINGLE ASSIGNMENT */
/* ============================= */

router.get("/api/waiting-assignment/:reference", requireExpert, async (req, res) => {

    try {

        const EXPERT_ID = req.session.EXPERT_ID
        const reference = req.params.reference

        /* ASSIGNMENT */

        const [rows] = await db.query(
            `SELECT reference, title, CLIENT_NAME, dueDate, instructions, status
             FROM assignments
             WHERE reference=? AND EXPERT_ID=?`,
            [reference, EXPERT_ID]
        )

        if (!rows.length) {
            return res.status(404).json({ message: "Assignment not found" })
        }

        const assignment = rows[0]

        /* FILES */

        const [files] = await db.query(
            `SELECT fileUrl AS url, fileName AS name
             FROM assignment_files
             WHERE reference=?`,
            [reference]
        )

        assignment.files = files

        res.json(assignment)

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Server error" })
    }

})

module.exports = router