const express = require("express");
const router = express.Router();

const { Assignment, AssignmentFile } = require("../../models");

/* ============================= */
/* AUTH (EXPERT) */
/* ============================= */
function requireExpert(req, res, next) {
    if (!req.session.expert) {
        return res.status(401).send("Unauthorized");
    }
    next();
}

/* ============================= */
/* LOAD WAITING PAGE */
/* ============================= */
router.get("/waiting", requireExpert, (req, res) => {
    res.render("waiting", {
        EXPERT_NAME: req.session.expert.name || "Expert"
    });
});

/* ============================= */
/* LOAD VIEW PAGE */
/* ============================= */
router.get("/waiting-view", requireExpert, (req, res) => {
    res.render("waiting-view", {
        EXPERT_NAME: req.session.expert.name || "Expert"
    });
});

/* ============================= */
/* GET WAITING ASSIGNMENTS */
/* ============================= */
router.get("/api/waiting-assignments", requireExpert, async (req, res) => {
    try {
        const expertId = req.session.expert.id;

        const assignments = await Assignment.find({
            EXPERT_ID: expertId,
            status: "accepted"
        })
        .select("reference title dueDate acceptedAt")
        .sort({ acceptedAt: -1 })
        .lean();

        res.json(assignments);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

/* ============================= */
/* GET SINGLE ASSIGNMENT */
/* ============================= */
router.get("/api/waiting-assignment/:reference", requireExpert, async (req, res) => {
    try {
        const expertId = req.session.expert.id;
        const reference = req.params.reference;

        /* ASSIGNMENT */
        const assignment = await Assignment.findOne({
            reference,
            EXPERT_ID: expertId
        })
        .select("reference title CLIENT_NAME dueDate instructions status")
        .lean();

        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        /* FILES */
        const files = await AssignmentFile.find({ reference })
            .select("fileUrl fileName -_id")
            .lean();

        assignment.files = files.map(f => ({
            url: f.fileUrl,
            name: f.fileName
        }));

        res.json(assignment);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;