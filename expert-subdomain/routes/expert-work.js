const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const { Assignment, Submission } = require("../../models");

const router = express.Router();

/* ============================= */
/* STATIC FILES */
/* ============================= */
router.use("/uploads", express.static(path.join(__dirname, "../uploads")));

/* ============================= */
/* UPLOAD SETUP */
/* ============================= */
const BASE_UPLOAD = path.join(__dirname, "../uploads/expert-submissions");

if (!fs.existsSync(BASE_UPLOAD)) {
    fs.mkdirSync(BASE_UPLOAD, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const reference = req.body.reference;
        const dir = path.join(BASE_UPLOAD, `assignment-${reference}`);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const safeName = file.originalname.replace(/\s+/g, "_");
        cb(null, unique + "-" + safeName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }
});

/* ============================= */
/* AUTH */
/* ============================= */
function requireExpert(req, res, next) {
    if (!req.session.expert) {
        return res.status(401).json({ message: "Expert login required" });
    }
    next();
}

/* ============================= */
/* VIEW ROUTES */
/* ============================= */
router.get("/work", requireExpert, (req, res) => {
    res.render("expert-work");
});

router.get("/view", requireExpert, (req, res) => {
    res.render("expert-work-view");
});

/* ============================= */
/* API ROUTES */
/* ============================= */

/* IN-PROGRESS */
router.get("/api/in-progress", requireExpert, async (req, res) => {
    try {
        const expertId = req.session.expert.id;

        const assignments = await Assignment.find({
            EXPERT_ID: expertId,
            status: { $in: ["In Progress", "Revision Requested"] }
        })
        .select("reference subject title status deadline budget")
        .lean();

        const formatted = assignments.map(a => ({
            ...a,
            dueDate: a.deadline,
            payout: a.budget
        }));

        res.json(formatted);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

/* ASSIGNMENT DETAILS */
router.get("/api/assignment", requireExpert, async (req, res) => {
    try {
        const reference = req.query.ref;

        if (!reference) {
            return res.status(400).json({ message: "Reference required" });
        }

        const assignment = await Assignment.findOne({ reference })
            .select("subject title reference status deadline budget")
            .lean();

        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        res.json({
            ...assignment,
            dueDate: assignment.deadline,
            payout: assignment.budget
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

/* ============================= */
/* COMMENTS */
/* ============================= */

router.get("/api/comments", requireExpert, async (req, res) => {
    try {
        const reference = req.query.ref;

        const comments = await Submission.find({
            reference,
            type: "comment"
        })
        .sort({ createdAt: 1 })
        .select("submissionText isClient")
        .lean();

        const formatted = comments.map(c => ({
            message: c.submissionText,
            isClient: !!c.isClient
        }));

        res.json(formatted);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error loading comments" });
    }
});

router.post("/api/comments", requireExpert, async (req, res) => {
    try {
        const { reference, message } = req.body;

        await Submission.create({
            reference,
            submissionText: message,
            type: "comment",
            isClient: false
        });

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to save comment" });
    }
});

/* ============================= */
/* SUBMIT WORK */
/* ============================= */

router.post(
    "/api/submit-work",
    requireExpert,
    upload.array("submissionFiles"),
    async (req, res) => {
        try {
            const { reference, description = "" } = req.body;

            /* FILES */
            if (req.files?.length) {
                const fileDocs = req.files.map(file => ({
                    reference,
                    fileUrl: `/uploads/expert-submissions/assignment-${reference}/${file.filename}`,
                    fileName: file.originalname,
                    type: "submission",
                    isClient: false
                }));

                await Submission.insertMany(fileDocs);
            }

            /* TEXT */
            if (description) {
                await Submission.create({
                    reference,
                    submissionText: description,
                    type: "submission",
                    isClient: false
                });
            }

            res.json({ success: true, message: "Work submitted" });

        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Submission failed" });
        }
    }
);

/* ============================= */
/* EDIT SUBMISSION */
/* ============================= */

router.post(
    "/api/edit-submission",
    requireExpert,
    upload.array("submissionFiles"),
    async (req, res) => {
        try {
            const { reference, description = "" } = req.body;

            /* FILES */
            if (req.files?.length) {
                const fileDocs = req.files.map(file => ({
                    reference,
                    fileUrl: `/uploads/expert-submissions/assignment-${reference}/${file.filename}`,
                    fileName: file.originalname,
                    type: "submission",
                    isClient: false
                }));

                await Submission.insertMany(fileDocs);
            }

            /* TEXT */
            if (description) {
                await Submission.create({
                    reference,
                    submissionText: description,
                    type: "submission",
                    isClient: false
                });
            }

            /* UPDATE STATUS */
            await Assignment.updateOne(
                {
                    reference,
                    status: "Revision Requested"
                },
                {
                    $set: { status: "In Progress" }
                }
            );

            res.json({ success: true, message: "Submission updated" });

        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Update failed" });
        }
    }
);

module.exports = router;