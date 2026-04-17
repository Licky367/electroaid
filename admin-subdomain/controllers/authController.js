const authService = require("../services/authService");

/* ================= SIGNUP PAGE ================= */

exports.getSignup = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).send("Invalid signup link");
        }

        const invite =
            await authService.validateInvite(token);

        if (!invite) {
            return res.status(400).send("Invalid or expired invite");
        }

        res.render("signup", {
            email: invite.ADMIN_EMAIL,
            token
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};

/* ================= SIGNUP ================= */

exports.signup = async (req, res) => {
    try {
        const result =
            await authService.signup(req.body);

        return res.json(result);

    } catch (err) {
        console.error(err);

        return res.status(err.status || 500).json({
            message: err.message || "Server error"
        });
    }
};

/* ================= LOGIN PAGE ================= */

exports.getLogin = (req, res) => {
    res.render("login");
};

/* ================= LOGIN ================= */

exports.login = async (req, res) => {
    try {
        const admin =
            await authService.login(req.body);

        req.session.admin = {
            id: admin._id,
            ADMIN_EMAIL: admin.ADMIN_EMAIL,
            role: admin.role
        };

        return res.redirect("/admin");

    } catch (err) {
        console.error(err);

        return res.status(err.status || 500).json({
            message: err.message || "Server error"
        });
    }
};

/* ================= LOGOUT ================= */

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect("/admin/auth/login");
    });
};

/* ================= FORGOT PASSWORD PAGE ================= */

exports.getForgotPassword = (req, res) => {
    res.render("forgot-password");
};

/* ================= FORGOT PASSWORD ================= */

exports.forgotPassword = async (req, res) => {
    try {
        await authService.forgotPassword(req.body);

        return res.json({
            message: "Reset link sent"
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

/* ================= RESET PASSWORD PAGE ================= */

exports.getResetPassword = (req, res) => {
    res.render("reset-password");
};

/* ================= RESET PASSWORD ================= */

exports.resetPassword = async (req, res) => {
    try {
        await authService.resetPassword(req.body);

        return res.json({
            message: "Password updated"
        });

    } catch (err) {
        console.error(err);

        return res.status(err.status || 500).json({
            message: err.message || "Server error"
        });
    }
};