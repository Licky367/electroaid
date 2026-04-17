const {
    Assignment
} = require("../models");

/* ================= COUNTS ================= */

exports.getAssignmentCounts =
async () => {

    const [
        pendingCount,
        acceptedCount,
        inProgressCount,
        completedCount,
        declinedCount
    ] = await Promise.all([
        Assignment.countDocuments({
            status: "pending"
        }),

        Assignment.countDocuments({
            status: "accepted"
        }),

        Assignment.countDocuments({
            status: {
                $in: [
                    "In Progress",
                    "Revision Requested"
                ]
            }
        }),

        Assignment.countDocuments({
            status: "completed"
        }),

        Assignment.countDocuments({
            status: "declined"
        })
    ]);

    return {
        pendingCount,
        acceptedCount,
        inProgressCount,
        completedCount,
        declinedCount
    };
};