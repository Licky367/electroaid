const {
    fetchWorkAssignments,
    fetchWorkAssignmentByReference,
    fetchAssignmentFiles
} = require("../services/adminWorkService");

/* ================= LIST ================= */
exports.getWorkAssignments = async (req, res) => {
    try {

        const assignments = await fetchWorkAssignments();

        res.render("admin-work", {
            assignments
        });

    } catch (err) {
        console.error("WORK LIST ERROR:", err);
        res.status(500).send("Server error");
    }
};

/* ================= SINGLE VIEW ================= */
exports.getWorkAssignmentByReference = async (req, res) => {
    try {

        const { reference } = req.params;

        const assignment = await fetchWorkAssignmentByReference(reference);

        if (!assignment) {
            return res.status(404).send("Assignment not found");
        }

        const files = await fetchAssignmentFiles(reference);
        assignment.files = files;

        res.render("admin-work-view", {
            assignment
        });

    } catch (err) {
        console.error("WORK VIEW ERROR:", err);
        res.status(500).send("Server error");
    }
};