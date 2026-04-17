const bcrypt = require("bcrypt");

const authService = require("../services/authService");
const mailer = require("../utils/mailer");
const { generateToken } = require("../utils/token");
const { getValidToken } = require("../helpers/passwordResetHelper");

/* -------- SIGNUP -------- */
exports.getSignup = (req, res) => {
    res.render("signup");
};

exports.postSignup = async (req, res) => {
    const {
        CLIENT_NAME,
        CLIENT_EMAIL,
        CLIENT_PHONE_NUMBER,
        CLIENT_PASSWORD,
        CLIENT_CONFIRM_PASSWORD
    } = req.body;

    try {
        if (!CLIENT_NAME || !CLIENT_EMAIL || !CLIENT_PASSWORD) {
            return res.render("signup", { error: "All fields are required" });
        }

        if (CLIENT_PASSWORD !== CLIENT_CONFIRM_PASSWORD) {
            return res.render("signup", { error: "Passwords do not match" });
        }

        const exists = await authService.findByEmail(CLIENT_EMAIL);
        if (exists) {
            return res.render("signup", { error: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(CLIENT_PASSWORD, 10);

        const imagePath = req.file
            ? `/uploads/${req.file.filename}`
            : null;

        await authService.createClient({
            CLIENT_NAME,
            CLIENT_EMAIL,
            CLIENT_PHONE_NUMBER,
            imagePath,
            hashedPassword
        });

        res.render("signup", { success: "Account created successfully" });

    } catch (err) {
        console.error(err);
        res.render("signup", { error: "Server error" });
    }
};

/* -------- LOGIN -------- */
exports.getLogin = (req, res) => {
    res.render("login");
};

exports.postLogin = async (req, res) => {
    const { CLIENT_EMAIL, CLIENT_PASSWORD } = req.body;

    try {
        if (!CLIENT_EMAIL || !CLIENT_PASSWORD) {
            return res.render("login", { error: "All fields are required" });
        }

        const user = await authService.findByEmail(CLIENT_EMAIL);

        if (!user) {
            return res.render("login", { error: "Invalid credentials" });
        }

        if (user.status === "suspended") {
            return res.render("login", { error: "Account suspended" });
        }

        let match = false;

        // Handle hashed vs legacy plain passwords
        if (user.CLIENT_PASSWORD.startsWith("$2b$")) {
            match = await bcrypt.compare(CLIENT_PASSWORD, user.CLIENT_PASSWORD);
        } else {
            match = CLIENT_PASSWORD === user.CLIENT_PASSWORD;

            if (match) {
                const hashed = await bcrypt.hash(CLIENT_PASSWORD, 10);
                await authService.updatePassword(user._id, hashed); // ✅ FIXED
            }
        }

        if (!match) {
            return res.render("login", { error: "Invalid credentials" });
        }

        /* 🔐 SESSION HANDLING */
        req.session.regenerate((err) => {
            if (err) {
                console.error(err);
                return res.render("login", { error: "Session error" });
            }

            /* ✅ BACKWARD COMPATIBILITY */
            req.session.clientId = user._id; // ✅ FIXED
            req.session.CLIENT_NAME = user.CLIENT_NAME;
            req.session.CLIENT_ID = user._id; // ✅ FIXED (Mongo has no CLIENT_ID)
            req.session.CLIENT_EMAIL = user.CLIENT_EMAIL;

            /* 🔥 CLEAN CLIENT OBJECT */
            req.session.client = {
                id: user._id, // ✅ FIXED
                name: user.CLIENT_NAME,
                image: user.CLIENT_PROFILE_IMAGE || null
            };

            req.session.save(() => {
                res.redirect(process.env.CLIENT_URL || "/");
            });
        });

    } catch (err) {
        console.error(err);
        res.render("login", { error: "Server error" });
    }
};

/* -------- LOGOUT -------- */
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.redirect("/");
        }

        res.clearCookie("electroaid_sid");
        res.redirect("/auth/login");
    });
};

/* -------- FORGOT PASSWORD -------- */
exports.getForgotPassword = (req, res) => {
    res.render("forgot-password");
};

exports.postForgotPassword = async (req, res) => {
    const { CLIENT_EMAIL } = req.body;

    try {
        const user = await authService.findByEmail(CLIENT_EMAIL);

        const message = "If this email exists, a reset link has been sent.";

        if (!user) {
            return res.render("forgot-password", { message });
        }

        const token = generateToken();
        const expires = new Date(Date.now() + 1000 * 60 * 30);

        await authService.saveResetToken(user._id, token, expires); // ✅ FIXED

        const resetLink =
            `${process.env.CLIENT_AUTH_BASE_URL}?token=${token}`;

        await mailer.sendMail(CLIENT_EMAIL, resetLink);

        res.render("forgot-password", { message });

    } catch (err) {
        console.error(err);
        res.render("forgot-password", {
            error: "Server error. Try again later."
        });
    }
};

/* -------- RESET PASSWORD -------- */
exports.getResetPassword = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.render("reset-password", { tokenError: true });
    }

    try {
        const validToken = await getValidToken(token);

        if (!validToken) {
            return res.render("reset-password", { tokenError: true });
        }

        res.render("reset-password", { token });

    } catch (err) {
        console.error(err);
        res.render("reset-password", { tokenError: true });
    }
};

exports.postResetPassword = async (req, res) => {
    const { token, CLIENT_NEW_PASSWORD, CLIENT_CONFIRM_PASSWORD } = req.body;

    try {
        if (CLIENT_NEW_PASSWORD !== CLIENT_CONFIRM_PASSWORD) {
            return res.render("reset-password", {
                token,
                error: "Passwords do not match"
            });
        }

        const validToken = await getValidToken(token);

        if (!validToken) {
            return res.render("reset-password", { tokenError: true });
        }

        const hashed = await bcrypt.hash(CLIENT_NEW_PASSWORD, 10);

        await authService.updatePassword(validToken.clientId, hashed);
        await authService.deleteResetToken(validToken.clientId);

        res.render("reset-password", {
            success: "Password reset successful"
        });

    } catch (err) {
        console.error(err);
        res.render("reset-password", {
            error: "Server error"
        });
    }
};