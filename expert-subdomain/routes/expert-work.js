require("dotenv").config({ path: "../config.env" })

const express = require("express")
const fs = require("fs")
const path = require("path")
const multer = require("multer")
const db = require("../../db")

const router = express.Router()

/* ============================= */
/* STATIC FILES */
/* ============================= */

router.use("/uploads", express.static(path.join(__dirname, "../uploads")))

/* ============================= */
/* UPLOAD SETUP */
/* ============================= */

const BASE_UPLOAD = path.join(__dirname, "../uploads/expert-submissions")

if (!fs.existsSync(BASE_UPLOAD)) {
    fs.mkdirSync(BASE_UPLOAD, { recursive: true })
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const reference = req.body.reference
        const dir = path.join(BASE_UPLOAD, `assignment-${reference}`)

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        cb(null, dir)
    },
    filename: function (req, file, cb) {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9)
        const safeName = file.originalname.replace(/\s+/g, "_")
        cb(null, unique + "-" + safeName)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }
})

/* ============================= */
/* AUTH */
/* ============================= */

function requireExpert(req, res, next) {
    if (!req.session.EXPERT_ID) {
        return res.status(401).json({ message: "Expert login required" })
    }
    next()
}

/* ============================= */
/* VIEW ROUTES */
/* ============================= */

router.get("/work", requireExpert, (req, res) => {
    res.render("expert-work")
})

router.get("/view", requireExpert, (req, res) => {
    res.render("expert-work-view")
})

/* ============================= */
/* API ROUTES */
/* ============================= */

/* IN-PROGRESS */
router.get("/api/in-progress", requireExpert, async (req, res) => {
    try {
        const EXPERT_ID = req.session.EXPERT_ID

        const [rows] = await db.query(
            `SELECT 
                reference, 
                subject, 
                title, 
                status, 
                deadline AS dueDate,
                budget AS payout
             FROM assignments
             WHERE EXPERT_ID=? 
             AND status IN ('In Progress','Revision Requested')`,
            [EXPERT_ID]
        )

        res.json(rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Server error" })
    }
})

/* ASSIGNMENT DETAILS */
router.get("/api/assignment", requireExpert, async (req, res) => {
    try {
        const reference = req.query.ref

        if (!reference) {
            return res.status(400).json({ message: "Reference required" })
        }

        const [rows] = await db.query(
            `SELECT 
                subject,
                title,
                reference,
                status,
                deadline AS dueDate,
                budget AS payout
             FROM assignments
             WHERE reference=?`,
            [reference]
        )

        if (!rows.length) {
            return res.status(404).json({ message: "Assignment not found" })
        }

        res.json(rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Server error" })
    }
})

/* ============================= */
/* ✅ COMMENTS (CLEAN SEPARATION) */
/* ============================= */

router.get("/api/comments", requireExpert, async (req, res) => {
    try {
        const reference = req.query.ref

        const [rows] = await db.query(
            `SELECT submissionText, isClient
             FROM submissions
             WHERE reference=?
             AND type='comment'
             ORDER BY createdAt ASC`,
            [reference]
        )

        const formatted = rows.map(c => ({
            message: c.submissionText,
            isClient: !!c.isClient
        }))

        res.json(formatted)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error loading comments" })
    }
})

router.post("/api/comments", requireExpert, async (req, res) => {
    try {
        const { reference, message } = req.body

        await db.query(
            `INSERT INTO submissions 
            (reference, submissionText, type, isClient)
             VALUES (?,?,?,?)`,
            [reference, message, "comment", false]
        )

        res.json({ success: true })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Failed to save comment" })
    }
})

/* ============================= */
/* SUBMIT WORK */
/* ============================= */

router.post(
    "/api/submit-work",
    requireExpert,
    upload.array("submissionFiles"),
    async (req, res) => {
        try {
            const reference = req.body.reference
            const description = req.body.description || ""

            /* FILES */
            for (const file of req.files) {
                await db.query(
                    `INSERT INTO submissions 
                    (reference,fileUrl,fileName,type,isClient)
                     VALUES (?,?,?,?,?)`,
                    [
                        reference,
                        `/uploads/expert-submissions/assignment-${reference}/${file.filename}`,
                        file.originalname,
                        "submission",
                        false
                    ]
                )
            }

            /* TEXT (MAIN SUBMISSION NOTE) */
            if (description) {
                await db.query(
                    `INSERT INTO submissions 
                    (reference,submissionText,type,isClient)
                     VALUES (?,?,?,?)`,
                    [reference, description, "submission", false]
                )
            }

            res.json({ success: true, message: "Work submitted" })
        } catch (err) {
            console.error(err)
            res.status(500).json({ message: "Submission failed" })
        }
    }
)

/* ============================= */
/* EDIT SUBMISSION */
/* ============================= */

router.post(
    "/api/edit-submission",
    requireExpert,
    upload.array("submissionFiles"),
    async (req, res) => {
        try {
            const reference = req.body.reference
            const description = req.body.description || ""

            if (req.files.length > 0) {
                for (const file of req.files) {
                    await db.query(
                        `INSERT INTO submissions 
                        (reference,fileUrl,fileName,type,isClient)
                         VALUES (?,?,?,?,?)`,
                        [
                            reference,
                            `/uploads/expert-submissions/assignment-${reference}/${file.filename}`,
                            file.originalname,
                            "submission",
                            false
                        ]
                    )
                }
            }

            if (description) {
                await db.query(
                    `INSERT INTO submissions 
                    (reference,submissionText,type,isClient)
                     VALUES (?,?,?,?)`,
                    [reference, description, "submission", false]
                )
            }

            await db.query(
                `UPDATE assignments
                 SET status='In Progress'
                 WHERE reference=? 
                 AND status='Revision Requested'`,
                [reference]
            )

            res.json({ success: true, message: "Submission updated" })
        } catch (err) {
            console.error(err)
            res.status(500).json({ message: "Update failed" })
        }
    }
)

module.exports = router