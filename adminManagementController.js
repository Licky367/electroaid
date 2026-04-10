const service = require("../services/adminManagementService");

/* ===== GET PAGE ===== */
exports.getAdminManagement = async (req, res) => {
    try {

        const admins = await service.getAllAdmins();

        res.render("admin-management", {
            admins,
            admin: req.session.admin.id
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};

/* ===== TOGGLE ===== */
exports.toggleAdmin = async (req, res) => {
    try {

        await service.toggleAdminStatus(
            req.session.admin.id,
            req.params.id
        );

        res.redirect("/admin/management");

    } catch (err) {
        console.error(err);
        res.status(err.status || 500).send(err.message || "Failed to update admin");
    }
};

/* ===== DELETE ===== */
exports.deleteAdmin = async (req, res) => {
    try {

        await service.deleteAdmin(
            req.session.admin.id,
            req.params.id
        );

        res.redirect("/admin/management");

    } catch (err) {
        console.error(err);
        res.status(err.status || 500).send(err.message || "Delete failed");
    }
};