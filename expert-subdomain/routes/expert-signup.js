require("dotenv").config({ path: "../config.env" });

const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");

const db = require("../db");

/* ================== MULTER ================== */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/experts");
    },
    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + "_" + Math.round(Math.random() * 1e9) +
            path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

/* ================== REG_NO VALIDATION ================== */
function validateREGNO(reg) {
    return /^EXP_\d{4}_[A-Z]{2}$/.test(reg);
}

/* ===================================================== */
/* ================= VIEW =============================== */
/* GET /expert/signup */
/* ===================================================== */

router.get("/signup", (req, res) => {
    res.render("expert-signup");
});

/* ===================================================== */
/* ===== VALIDATE REG LINK (FOR FRONTEND LOCKING) ======= */
/* GET /expert/validate?reg=XXX */
/* ===================================================== */

router.get("/validate", async (req, res) => {
    try {
        const REG = req.query.reg?.trim().toUpperCase();

        if (!REG || !validateREGNO(REG)) {
            return res.status(400).json({ valid: false, message: "Invalid link" });
        }

        const [rows] = await db.execute(
            `SELECT EXPERT_EMAIL, isUsed, expiresAt 
             FROM expert_registrations 
             WHERE REG_NO = ?`,
            [REG]
        );

        if (rows.length === 0) {
            return res.json({ valid: false, message: "Invalid REG_NO" });
        }

        const record = rows[0];

        if (record.isUsed) {
            return res.json({ valid: false, message: "REG_NO already used" });
        }

        if (new Date() > new Date(record.expiresAt)) {
            return res.json({ valid: false, message: "REG_NO expired" });
        }

        return res.json({
            valid: true,
            email: record.EXPERT_EMAIL,
            reg: REG
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ valid: false, message: "Server error" });
    }
});

/* ===================================================== */
/* ================= SIGNUP API ========================= */
/* POST /expert/signup */
/* ===================================================== */

router.post(
    "/signup",
    upload.single("EXPERT_PROFILE_IMAGE"),
    async (req, res) => {
        try {
            const {
                EXPERT_NAME,
                EXPERT_EMAIL,
                EXPERT_PHONE,
                EXPERT_PASSWORD
            } = req.body;

            /* ================== GET REG_NO FROM URL FIRST ================== */
            let REG = req.query.reg || req.body.REG_NO;

            if (!REG) {
                return res.status(400).json({
                    message: "Missing registration link"
                });
            }

            REG = REG.trim().toUpperCase();
            const EMAIL = EXPERT_EMAIL.trim().toLowerCase();

            /* ================== BASIC VALIDATION ================== */
            if (
                !EXPERT_NAME ||
                !EMAIL ||
                !EXPERT_PHONE ||
                !EXPERT_PASSWORD
            ) {
                return res.status(400).json({
                    message: "All fields are required"
                });
            }

            if (!validateREGNO(REG)) {
                return res.status(400).json({
                    message: "Invalid REG_NO format"
                });
            }

            /* ================== CHECK REG_NO ================== */
            const [regRows] = await db.execute(
                `SELECT * FROM expert_registrations 
                 WHERE REG_NO = ?`,
                [REG]
            );

            if (regRows.length === 0) {
                return res.status(400).json({
                    message: "Invalid registration number"
                });
            }

            const regRecord = regRows[0];

            /* ================== EMAIL MUST MATCH INVITE ================== */
            if (regRecord.EXPERT_EMAIL !== EMAIL) {
                return res.status(403).json({
                    message: "Email does not match invitation"
                });
            }

            /* ================== CHECK USED ================== */
            if (regRecord.isUsed) {
                return res.status(400).json({
                    message: "REG_NO already used"
                });
            }

            /* ================== CHECK EXPIRY ================== */
            if (new Date() > new Date(regRecord.expiresAt)) {
                return res.status(400).json({
                    message: "REG_NO expired"
                });
            }

            /* ================== CHECK DUPLICATES ================== */
            const [existing] = await db.execute(
                `SELECT id FROM experts 
                 WHERE EXPERT_EMAIL = ? OR EXPERT_PHONE = ? OR REG_NO = ?`,
                [EMAIL, EXPERT_PHONE, REG]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    message: "Expert already exists"
                });
            }

            /* ================== HASH PASSWORD ================== */
            const hashedPassword = await bcrypt.hash(EXPERT_PASSWORD, 10);

            /* ================== IMAGE ================== */
            let imagePath = null;
            if (req.file) {
                imagePath = `/uploads/experts/${req.file.filename}`;
            }

            /* ================== INSERT EXPERT ================== */
            await db.execute(
                `INSERT INTO experts 
                (EXPERT_NAME, EXPERT_EMAIL, EXPERT_PHONE, REG_NO, EXPERT_PROFILE_IMAGE, EXPERT_PASSWORD)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    EXPERT_NAME.trim(),
                    EMAIL,
                    EXPERT_PHONE.trim(),
                    REG,
                    imagePath,
                    hashedPassword
                ]
            );

            /* ================== MARK REG_NO AS USED ================== */
            await db.execute(
                `UPDATE expert_registrations 
                 SET isUsed = TRUE 
                 WHERE REG_NO = ?`,
                [REG]
            );

            return res.json({
                message: "Signup successful"
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Server error"
            });
        }
    }
);

module.exports = router;