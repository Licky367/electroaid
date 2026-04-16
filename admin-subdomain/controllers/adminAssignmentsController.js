const {
    getAssignmentCounts
} = require("../services/adminAssignmentsService");

/* ================= LOAD PAGE ================= */
exports.getAssignmentsDashboard = async (req, res) => {
    try {

        const {
            pendingCount,
            acceptedCount,
            inProgressCount,
            completedCount,
            declinedCount
        } = await getAssignmentCounts();

        res.render("admin-assignments", {
            pendingCount,
            acceptedCount,
            inProgressCount,
            completedCount,
            declinedCount
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};