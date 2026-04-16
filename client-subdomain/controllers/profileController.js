const bcrypt = require("bcrypt");
const profileService = require("../services/profileService");

/* ================= PROFILE PAGE ================= */
exports.getProfile = async (req, res) => {
    try {
        const rows = await profileService.getClientById(req.session.clientId);

        if (rows.length === 0) {
            req.session.destroy();
            return res.redirect("/auth/login");
        }

        res.render("profile", { client: rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};

/* ================= EDIT PROFILE (GET) ================= */
exports.getEditProfile = async (req, res) => {
    try {
        const rows = await profileService.getClientById(req.session.clientId);

        if (rows.length === 0) {
            req.session.destroy();
            return res.redirect("/auth/login");
        }

        res.render("edit", {
            client: rows[0],
            error: null,
            success: null
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};

/* ================= EDIT PROFILE (POST) ================= */
exports.updateProfile = async (req, res) => {
    try {
        const { CLIENT_NAME, CLIENT_PHONE_NUMBER } = req.body;

        if (!CLIENT_NAME || !CLIENT_PHONE_NUMBER) {
            return res.render("edit", {
                error: "All fields are required",
                success: null,
                client: req.body
            });
        }

        const rows = await profileService.getClientById(req.session.clientId);

        if (rows.length === 0) {
            req.session.destroy();
            return res.redirect("/auth/login");
        }

        const existingClient = rows[0];

        let imagePath = existingClient.CLIENT_PROFILE_IMAGE;

        if (req.file) {
            imagePath = "/uploads/" + req.file.filename;
        }

        await profileService.updateClientProfile(
            req.session.clientId,
            CLIENT_NAME,
            CLIENT_PHONE_NUMBER,
            imagePath
        );

        const updatedRows = await profileService.getClientById(req.session.clientId);

        res.render("edit", {
            client: updatedRows[0],
            error: null,
            success: "Profile updated successfully"
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};

/* ================= CHANGE PASSWORD (GET) ================= */
exports.getChangePassword = async (req, res) => {
    try {
        res.render("change-password", {
            error: null,
            success: null,
            client: req.session.clientId
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};

/* ================= CHANGE PASSWORD (POST) ================= */
exports.changePassword = async (req, res) => {
    try {
        const { OLD_PASSWORD, NEW_PASSWORD, CONFIRM_PASSWORD } = req.body;

        if (!OLD_PASSWORD || !NEW_PASSWORD || !CONFIRM_PASSWORD) {
            return res.render("change-password", {
                error: "All fields are required",
                success: null,
                client: req.session.clientId
            });
        }

        if (NEW_PASSWORD !== CONFIRM_PASSWORD) {
            return res.render("change-password", {
                error: "New passwords do not match",
                success: null,
                client: req.session.clientId
            });
        }

        const rows = await profileService.getClientById(req.session.clientId);

        if (rows.length === 0) {
            req.session.destroy();
            return res.redirect("/auth/login");
        }

        const client = rows[0];

        let match = false;

        /* HANDLE OLD + AUTO-UPGRADE */
        if (client.CLIENT_PASSWORD.startsWith("$2b$")) {
            match = await bcrypt.compare(OLD_PASSWORD, client.CLIENT_PASSWORD);
        } else {
            match = OLD_PASSWORD === client.CLIENT_PASSWORD;

            if (match) {
                const hashed = await bcrypt.hash(OLD_PASSWORD, 10);

                await profileService.updatePassword(client.id, hashed);
            }
        }

        if (!match) {
            return res.render("change-password", {
                error: "Incorrect old password",
                success: null,
                client: req.session.clientId
            });
        }

        const hashedNewPassword = await bcrypt.hash(NEW_PASSWORD, 10);

        await profileService.updatePassword(
            req.session.clientId,
            hashedNewPassword
        );

        res.render("change-password", {
            error: null,
            success: "Password changed successfully",
            client: req.session.clientId
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};