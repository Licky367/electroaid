require("dotenv").config({ path: "../config.env" });

const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const db = require("../../db");

/* ================= MAIL ================= */

const transporter = nodemailer.createTransport({
    service
    : "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/* ================= TOKEN ================= */

function generateToken() {
    return crypto.randomBytes(32).toString("hex");
}

/* ===================================================== */
/* ================= FORGOT PASSWORD PAGE =============== */
/* ===================================================== */

router.get("/forgot-password", (req, res) => {
    res.render("expert-forgot-password");
});

/* ===================================================== */
/* ================= SEND RESET LINK ==================== */
/* ===================================================== */

router.post("/forgot-password", async (req, res) => {
    try {
        const { EXPERT_EMAIL } = req.body;

        if (!EXPERT_EMAIL) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const EMAIL = EXPERT_EMAIL.trim().toLowerCase();

        /* ===== FIND EXPERT ===== */
        const [experts] = await db.execute(
            `SELECT id FROM experts WHERE EXPERT_EMAIL = ?`,
            [EMAIL]
        );

        if (experts.length === 0) {
            return res.status(400).json({
                message: "Email not found"
            });
        }

        const expertId = experts[0].id;

        /* ===== GENERATE TOKEN ===== */
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        /* ===== DELETE OLD TOKENS ===== */
        await db.execute(
            `DELETE FROM expert_password_resets WHERE expertId = ?`,
            [expertId]
        );

        /* ===== SAVE TOKEN ===== */
        await db.execute(
            `INSERT INTO expert_password_resets 
            (expertId, token, expiresAt) 
            VALUES (?, ?, ?)`,
            [expertId, token, expiresAt]
        );

        /* ===== BUILD RESET LINK (FIXED) ===== */
        const resetLink =
            `${process.env.BASE_URL}/expert/reset-password?token=${token}`;

        /* ===== SEND EMAIL ===== */
        await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
            to: EMAIL,
            subject: "Password Reset Request",
            html: `
                <h3>Password Reset</h3>
                <p>You requested to reset your password.</p>
                <p>Click the link below:</p>
                <a href="${resetLink}">${resetLink}</a>
                <p>This link expires in 10 minutes.</p>
            `
        });

        return res.json({
            message: "Reset link sent to your email"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Server error"
        });
    }
});

/* ===================================================== */
/* ================= RESET PAGE ========================= */
/* ===================================================== */

router.get("/reset-password", async (req, res) => {
    const token = req.query.token;

    if (!token) {
        return res.redirect("/expert/forgot-password");
    }

    /* Optional: you can verify token exists before rendering */

    res.render("expert-reset-password", { token });
});

/* ===================================================== */
/* ================= RESET PASSWORD ===================== */
/* ===================================================== */

router.post("/reset-password", async (req, res) => {
    try {
        const { EXPERT_RESET_TOKEN, EXPERT_NEW_PASSWORD } = req.body;

        if (!EXPERT_RESET_TOKEN || !EXPERT_NEW_PASSWORD) {
            return res.status(400).json({
                message: "Invalid request"
            });
        }

        const token = EXPERT_RESET_TOKEN.trim();
        const newPassword = EXPERT_NEW_PASSWORD.trim();

        /* ===== FIND TOKEN ===== */
        const [rows] = await db.execute(
            `SELECT * FROM expert_password_resets WHERE token = ?`,
            [token]
        );

        if (rows.length === 0) {
            return res.status(400).json({
                message: "Invalid or expired token"
            });
        }

        const reset = rows[0];

        /* ===== CHECK EXPIRY ===== */
        if (new Date(reset.expiresAt) < new Date()) {
            await db.execute(
                `DELETE FROM expert_password_resets WHERE id = ?`,
                [reset.id]
            );

            return res.status(400).json({
                message: "Token expired"
            });
        }

        /* ===== HASH PASSWORD ===== */
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        /* ===== UPDATE PASSWORD ===== */
        await db.execute(
            `UPDATE experts SET EXPERT_PASSWORD = ? WHERE id = ?`,
            [hashedPassword, reset.expertId]
        );

        /* ===== DELETE TOKEN ===== */
        await db.execute(
            `DELETE FROM expert_password_resets WHERE id = ?`,
            [reset.id]
        );

        return res.json({
            message: "Password reset successful"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Server error"
        });
    }
});

module.exports = router;