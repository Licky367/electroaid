const service = require("../services/adminExpertsService");

/* ===== GET PAGE ===== */
exports.getExperts = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const search = req.query.search ? req.query.search.trim() : "";

        const experts = await service.getExperts({ page, search });

        res.render("admin-experts", {
            experts,
            page,
            search,
            admin: req.session.admin
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};

/* ===== SUSPEND ===== */
exports.suspendExpert = async (req, res) => {
    try {

        await service.suspendExpert(req.params.id);

        res.redirect("/admin/experts");

    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to suspend expert");
    }
};

/* ===== UNSUSPEND ===== */
exports.unsuspendExpert = async (req, res) => {
    try {

        await service.unsuspendExpert(req.params.id);

        res.redirect("/admin/experts");

    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to unsuspend expert");
    }
};

/* ===== DELETE ===== */
exports.deleteExpert = async (req, res) => {
    try {

        await service.deleteExpert(req.params.id);

        res.redirect("/admin/experts");

    } catch (err) {
        console.error(err);
        res.status(500).send("Delete failed");
    }
};