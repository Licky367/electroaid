const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

/* ✅ IMPORT FROM SINGLE MODELS FILE */
const { Expert, ExpertPasswordReset } = require("../../models");

/* ================= MAIL ================= */

const transporter = nodemailer.createTransport({
    service: "gmail",
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
        const expert = await Expert.findOne({ EXPERT_EMAIL: EMAIL });

        if (!expert) {
            return res.status(400).json({
                message: "Email not found"
            });
        }

        /* ===== GENERATE TOKEN ===== */
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        /* ===== DELETE OLD TOKENS ===== */
        await ExpertPasswordReset.deleteMany({ expertId: expert._id });

        /* ===== SAVE TOKEN ===== */
        await ExpertPasswordReset.create({
            expertId: expert._id,
            token,
            expiresAt
        });

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
                <p>Click below:</p>
                <a href="${resetLink}">${resetLink}</a>
                <p>Expires in 10 minutes.</p>
            `
        });

        return res.json({
            message: "Reset link sent"
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

router.get("/reset-password", (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.redirect("/expert/forgot-password");
    }

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
        const reset = await ExpertPasswordReset.findOne({ token });

        if (!reset) {
            return res.status(400).json({
                message: "Invalid or expired token"
            });
        }

        /* ===== CHECK EXPIRY ===== */
        if (reset.expiresAt < new Date()) {
            await ExpertPasswordReset.deleteOne({ _id: reset._id });

            return res.status(400).json({
                message: "Token expired"
            });
        }

        /* ===== HASH PASSWORD ===== */
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        /* ===== UPDATE PASSWORD ===== */
        await Expert.findByIdAndUpdate(reset.expertId, {
            EXPERT_PASSWORD: hashedPassword
        });

        /* ===== DELETE TOKEN ===== */
        await ExpertPasswordReset.deleteOne({ _id: reset._id });

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