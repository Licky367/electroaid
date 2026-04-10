const {
    fetchWaitingAssignments,
    fetchAssignmentByReference,
    fetchAssignmentFiles,
    declineAssignment
} = require("../services/adminWaitingService");

/* ================= LIST ================= */
exports.getWaitingAssignments = async (req, res) => {
    try {

        const assignments = await fetchWaitingAssignments();

        res.render("admin-waiting", {
            assignments
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};

/* ================= SINGLE VIEW ================= */
exports.getWaitingAssignmentByReference = async (req, res) => {
    try {

        const { reference } = req.params;

        const assignment = await fetchAssignmentByReference(reference);

        if (!assignment) {
            return res.status(404).send("Assignment not found");
        }

        const files = await fetchAssignmentFiles(reference);
        assignment.files = files;

        res.render("admin-waiting-view", {
            assignment
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};

/* ================= DECLINE ================= */
exports.declineWaitingAssignment = async (req, res) => {
    try {

        const { reference } = req.params;
        const { reason } = req.body;
        const adminId = req.adminId;

        if (!reason) {
            return res.status(400).send("Decline reason required");
        }

        await declineAssignment(reference, adminId, reason);

        res.redirect(`/admin/assignments/waiting/view/${reference}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};