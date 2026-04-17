const { Assignment, AssignmentFile } = require("../models");

/* ================= LIST ================= */
exports.fetchWaitingAssignments = async () => {

    const rows = await Assignment.find({
        status: "accepted"
    })
    .select("reference title CLIENT_NAME EXPERT_NAME dueDate acceptedAt status")
    .sort({ acceptedAt: -1 });

    return rows;
};

/* ================= SINGLE ================= */
exports.fetchAssignmentByReference = async (reference) => {

    const assignment = await Assignment.findOne({ reference });

    return assignment || null;
};

/* ================= FILES ================= */
exports.fetchAssignmentFiles = async (reference) => {

    const files = await AssignmentFile.find({ reference })
        .select({
            fileUrl: 1,
            fileName: 1,
            _id: 0
        });

    return files.map(f => ({
        url: f.fileUrl,
        name: f.fileName
    }));
};

/* ================= DECLINE ================= */
exports.declineAssignment = async (reference, adminId, reason) => {

    await Assignment.updateOne(
        { reference },
        {
            $set: {
                status: "declined",
                declinedByAdminId: adminId,
                declineReason: reason,
                declinedAt: new Date()
            }
        }
    );

};