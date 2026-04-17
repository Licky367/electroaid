const { Assignment, AssignmentFile } = require("../models");

/* ================= LIST ================= */
exports.fetchPendingAssignments = async () => {

    const assignments = await Assignment.find({
        status: "pending"
    })
    .select("reference title CLIENT_NAME dueDate budget payout status createdAt")
    .sort({ createdAt: -1 });

    // ✅ compute profit manually
    return assignments.map(a => {
        const obj = a.toObject();
        obj.profit = (a.budget || 0) - (a.payout || 0);
        return obj;
    });
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
exports.updateDeclineAssignment = async (reference, adminId, reason) => {

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