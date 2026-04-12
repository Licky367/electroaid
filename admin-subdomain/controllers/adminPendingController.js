const {
    fetchPendingAssignments,
    fetchAssignmentByReference,
    fetchAssignmentFiles,
    updateDeclineAssignment
} = require("../services/adminPendingService");

/* ================= LIST ================= */
exports.getPendingAssignments = async (req, res) => {
    try {
        const assignments = await fetchPendingAssignments();

        res.render("admin-pending", {
            assignments
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};

/* ================= SINGLE VIEW ================= */
exports.getSingleAssignment = async (req, res) => {
    try {
        const { reference } = req.params;

        const assignment = await fetchAssignmentByReference(reference);

        if (!assignment) {
            return res.status(404).send("Assignment not found");
        }

        const files = await fetchAssignmentFiles(reference);
        assignment.files = files;

        res.render("admin-pending-view", {
            assignment
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};

/* ================= DECLINE ================= */
exports.declineAssignment = async (req, res) => {
    try {
        const { reference } = req.params;
        const { reason } = req.body;
        const adminId = req.adminId;

        await updateDeclineAssignment(reference, adminId, reason);

        res.redirect(`/admin/assignments/pending/view/${reference}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};