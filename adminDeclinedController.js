const service = require("../services/adminDeclinedService");

/* ================= LIST ================= */
exports.getDeclinedAssignments = async (req, res) => {
    try {

        const rows = await service.getDeclinedAssignments();

        res.render("admin-declined", {
            assignments: rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};