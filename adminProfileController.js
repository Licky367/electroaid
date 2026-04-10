const adminProfileService = require("../services/adminProfileService");

/* ===== GET PROFILE ===== */
exports.getProfile = (req, res) => {
    res.render("admin-profile", {
        admin: req.session.admin
    });
};

/* ===== UPDATE PROFILE ===== */
exports.updateProfile = async (req, res) => {
    try {

        const updatedAdmin = await adminProfileService.updateProfile(req);

        /* 🔄 UPDATE SESSION */
        req.session.admin = {
            ...req.session.admin,
            ...updatedAdmin
        };

        res.redirect("/admin/profile");

    } catch (err) {
        console.error(err);
        res.status(err.status || 500).send(err.message || "Update failed");
    }
};