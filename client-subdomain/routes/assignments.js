const express = require("express");
const router = express.Router();

const { Assignment } = require("../../models");

/* ✅ CENTRALIZED AUTH */
const {
    requireClientAPI
} = require("../middleware/clientAuth");


/* ================= ASSIGNMENTS PAGE ================= */
router.get("/", (req, res) => {
    // attachClient already runs globally
    res.render("assignments");
});


/* ================= ASSIGNMENT SUMMARY (API) ================= */
router.get("/summary", requireClientAPI, async (req, res) => {

    try {

        const clientId = req.session.client.id;

        /* ============================= */
        /* MONGOOSE AGGREGATION */
/* ============================= */
        const rows = await Assignment.aggregate([
            {
                $match: {
                    CLIENT_ID: clientId
                }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const summary = {
            pending: 0,
            accepted: 0,
            work: 0,
            completed: 0,
            declined: 0
        };

        rows.forEach(row => {

            const status = row._id;

            if (status === "pending") {
                summary.pending = row.count;
            }

            else if (status === "accepted") {
                summary.accepted = row.count;
            }

            else if (
                status === "In Progress" ||
                status === "Revision Requested"
            ) {
                summary.work += row.count;
            }

            else if (status === "completed") {
                summary.completed = row.count;
            }

            else if (status === "declined") {
                summary.declined = row.count;
            }
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