const express = require("express");
const router = express.Router();

const { Assignment, Submission } = require("../../models");

/* ============================= */
/* AUTH */
/* ============================= */
function requireExpert(req, res, next) {
    if (!req.session.expert) {
        return res.redirect("/expert/login");
    }
    next();
}

/* ============================= */
/* COMPLETED LIST */
/* ============================= */
router.get("/completed", requireExpert, async (req, res) => {
    try {
        const expertId = req.session.expert;

        const assignments = await Assignment.find({
            EXPERT_ID: expertId,
            status: "completed"
        })
        .select("reference title payout rating completedAt")
        .sort({ completedAt: -1 })
        .lean();

        const totalCompleted = assignments.length;

        let totalRating = 0;
        assignments.forEach(a => {
            totalRating += a.rating || 0;
        });

        const averageRating = totalCompleted
            ? totalRating / totalCompleted
            : 0;

        res.render("expert-completed", {
            assignments,
            totalCompleted,
            averageRating
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

/* ============================= */
/* COMPLETED VIEW */
/* ============================= */
router.get("/completed-view", requireExpert, async (req, res) => {
    try {
        const expertId = req.session.expert.id;
        const reference = req.query.ref;

        if (!reference) {
            return res.redirect("/expert/completed");
        }

        /* ============================= */
        /* ASSIGNMENT */
        /* ============================= */
        const assignment = await Assignment.findOne({
            reference,
            EXPERT_ID: expertId,
            status: "completed"
        }).lean();

        if (!assignment) {
            return res.redirect("/expert/completed");
        }

        /* ============================= */
        /* SUBMISSIONS */
        /* ============================= */
        const submissionRows = await Submission.find({
            reference,
            type: "submission",
            isClient: false
        })
        .sort({ createdAt: 1 })
        .select("fileUrl fileName submissionText createdAt")
        .lean();

        /* FILES */
        const submissionFiles = submissionRows
            .filter(s => s.fileUrl)
            .map(s => ({
                fileUrl: s.fileUrl,
                fileName: s.fileName
            }));

        /* TEXT */
        const textRow = submissionRows
            .filter(s => s.submissionText)
            .pop();

        const submissionText = textRow
            ? textRow.submissionText
            : "";

        /* DATE */
        const lastRow = submissionRows.length
            ? submissionRows[submissionRows.length - 1]
            : null;

        const submissionDate = lastRow
            ? lastRow.createdAt
            : null;

        /* ============================= */
        /* RENDER */
        /* ============================= */
        res.render("expert-completed-view", {
            assignment,
            submissionFiles,
            submissionText,
            submissionDate
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

module.exports = router;