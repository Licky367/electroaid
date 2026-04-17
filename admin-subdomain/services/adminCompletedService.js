const {
    Assignment,
    Expert,
    Submission
} = require("../../models");

/* ================= LIST ================= */

exports.fetchCompletedList =
async () => {

    const rows =
        await Assignment.find({
            status:
                "completed"
        })
            .select(
                "reference title EXPERT_NAME status completedAt"
            )
            .sort({
                completedAt: -1
            })
            .lean();

    return rows;
};

/* ================= SINGLE ================= */

exports.fetchCompletedSingle =
async (
    reference
) => {

    const rows =
        await Assignment.findOne({
            reference,
            status:
                "completed"
        })
            .populate({
                path:
                    "EXPERT_ID",
                model:
                    "Expert",
                select:
                    "REG_NO EXPERT_EMAIL EXPERT_PHONE"
            })
            .lean();

    if (!rows) {
        return [];
    }

    const submissions =
        await Submission.find({
            reference
        })
            .select(
                "fileUrl fileName"
            )
            .lean();

    return submissions.map(
        file => ({
            reference:
                rows.reference,

            title:
                rows.title,

            subject:
                rows.subject,

            CLIENT_NAME:
                rows.CLIENT_NAME,

            completedAt:
                rows.completedAt,

            EXPERT_NAME:
                rows.EXPERT_NAME,

            rating:
                rows.rating,

            feedback:
                rows.feedback,

            REG_NO:
                rows.EXPERT_ID
                    ?.REG_NO ||
                null,

            EXPERT_EMAIL:
                rows.EXPERT_ID
                    ?.EXPERT_EMAIL ||
                null,

            EXPERT_PHONE:
                rows.EXPERT_ID
                    ?.EXPERT_PHONE ||
                null,

            fileUrl:
                file.fileUrl,

            fileName:
                file.fileName
        })
    );
};