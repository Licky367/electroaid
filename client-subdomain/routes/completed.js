const express = require("express");
const router = express.Router();

const { Assignment, Submission } = require("../../models");

/* ============================= */
/* AUTH MIDDLEWARE */
/* ============================= */
function requireClient(req, res, next) {
    if (!req.session.CLIENT_ID) {
        return res.redirect("/auth/login");
    }
    next();
}

/* ============================= */
/* GET COMPLETED ASSIGNMENTS */
/* Route: /assignments/completed */
/* ============================= */
router.get("/", requireClient, async (req, res) => {

    try {

        const CLIENT_ID = req.session.CLIENT_ID;

        const assignments = await Assignment.find({
            CLIENT_ID,
            status: "completed"
        })
        .select("title reference budget completedAt")
        .sort({ completedAt: -1 });

        res.render("completed", {
            assignments
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }

});

/* ============================= */
/* GET DETAILS PAGE */
/* Route: /assignments/completed/details */
/* ============================= */
router.get("/details", requireClient, async (req, res) => {

    try {

        const CLIENT_ID = req.session.CLIENT_ID;
        const reference = req.query.reference;

        if (!reference) {
            return res.redirect("/assignments/completed");
        }

        /* ============================= */
        /* ASSIGNMENT */
        /* ============================= */
        const assignment = await Assignment.findOne({
            reference,
            CLIENT_ID,
            status: "completed"
        }).select(
            "subject title reference deadline feedback rating EXPERT_NAME"
        );

        if (!assignment) {
            return res.redirect("/assignments/completed");
        }

        /* ============================= */
        /* SUBMISSIONS */
        /* ============================= */
        const submissionRows = await Submission.find({
            reference
        })
        .select("fileUrl fileName createdAt")
        .sort({ createdAt: -1 });

        const submittedAt = submissionRows.length
            ? submissionRows[0].createdAt
            : null;

        const submissionFiles = submissionRows.map(f => ({
            url: f.fileUrl,
            name: f.fileName
        }));

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
        };

        res.render("details", {
            assignment: finalData
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }

});

module.exports = router;