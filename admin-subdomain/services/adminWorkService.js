const { Assignment, AssignmentFile } = require("../models");

/* ================= LIST ================= */
exports.fetchWorkAssignments = async () => {

    const rows = await Assignment.find({
        status: { $in: ["In Progress", "Revision Requested"] }
    })
    .select("reference title CLIENT_NAME EXPERT_NAME dueDate status")
    .sort({ dueDate: 1 });

    return rows;
};

/* ================= SINGLE ================= */
exports.fetchWorkAssignmentByReference = async (reference) => {

    const assignment = await Assignment.findOne({ reference });

    if (!assignment) return null;

    // ✅ manually compute profit (since Mongo doesn’t auto-calc like SQL)
    const profit = (assignment.budget || 0) - (assignment.payout || 0);

    // convert to plain object to attach new field
    const result = assignment.toObject();
    result.profit = profit;

    return result;
};

/* ================= FILES ================= */
exports.fetchAssignmentFiles = async (reference) => {

    const files = await AssignmentFile.find({ reference })
        .select({
            fileUrl: 1,
            fileName: 1,
            _id: 0
        });

    // match your old API shape
    return files.map(f => ({
        url: f.fileUrl,
        name: f.fileName
    }));
};