const {
    Assignment
} = require("../../models");

/* ================= LIST ================= */

exports.getDeclinedAssignments =
async () => {

    const rows =
        await Assignment.find({
            status:
                "declined"
        })
            .populate({
                path:
                    "declinedByAdminId",
                model:
                    "Admin",
                select:
                    "ADMIN_NAME"
            })
            .select(
                "reference title CLIENT_NAME declinedAt declinedByAdminId"
            )
            .sort({
                declinedAt: -1
            })
            .lean();

    return rows.map(
        row => ({
            reference:
                row.reference,

            title:
                row.title,

            CLIENT_NAME:
                row.CLIENT_NAME,

            declinedAt:
                row.declinedAt,

            ADMIN_NAME:
                row
                    .declinedByAdminId
                    ?.ADMIN_NAME ||
                null
        })
    );
};