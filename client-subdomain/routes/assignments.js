const express = require("express");
const router = express.Router();

const db = require("../../db");

/* ✅ USE CENTRALIZED AUTH */
const {
    requireClient,
    requireClientAPI
} = require("../middleware/clientAuth");

/* ================= ASSIGNMENTS PAGE ================= */
router.get("/", (req, res) => {
    // 🔥 No need for optional auth anymore
    // attachClient already runs globally

    res.render("assignments");
});

/* ================= ASSIGNMENT SUMMARY (API) ================= */
router.get("/summary", requireClientAPI, async (req, res) => {
    try {
        const clientId = req.session.clientId; // ✅ source of truth

        const [rows] = await db.query(
            `SELECT status, COUNT(*) as count
             FROM assignments
             WHERE CLIENT_ID = ?
             GROUP BY status`,
            [clientId]
        );

        const summary = {
            pending: 0,
            accepted: 0,
            work: 0,
            completed: 0,
            declined: 0
        };

        rows.forEach(row => {
            const status = row.status;

            if (status === "pending") summary.pending = row.count;

            else if (status === "accepted") summary.accepted = row.count;

            else if (
                status === "In Progress" ||
                status === "Revision Requested"
            ) {
                summary.work += row.count;
            }

            else if (status === "completed") summary.completed = row.count;

            else if (status === "declined") summary.declined = row.count;
        });

        res.json(summary);

    } catch (err) {
        console.error(err);

        res.status(500).json({
            pending: 0,
            accepted: 0,
            work: 0,
            completed: 0,
            declined: 0
        });
    }
});

module.exports = router;