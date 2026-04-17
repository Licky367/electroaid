const { Expert } = require("../models");

/* ===== GET EXPERTS ===== */
exports.getExperts = async ({
    page = 1,
    search = ""
}) => {

    const limit = 10;
    const skip =
        (page - 1) * limit;

    let filter = {};

    if (search) {
        filter.$or = [
            {
                REG_NO: {
                    $regex: search,
                    $options: "i"
                }
            },
            {
                EXPERT_NAME: {
                    $regex: search,
                    $options: "i"
                }
            },
            {
                EXPERT_EMAIL: {
                    $regex: search,
                    $options: "i"
                }
            }
        ];
    }

    const experts =
        await Expert.find(filter)
            .select(
                "_id REG_NO EXPERT_NAME EXPERT_EMAIL status createdAt"
            )
            .sort({
                createdAt: -1
            })
            .skip(skip)
            .limit(limit)
            .lean();

    return experts;
};

/* ===== SUSPEND ===== */
exports.suspendExpert =
async id => {

    await Expert.findByIdAndUpdate(
        id,
        {
            status:
                "suspended"
        }
    );
};

/* ===== UNSUSPEND ===== */
exports.unsuspendExpert =
async id => {

    await Expert.findByIdAndUpdate(
        id,
        {
            status:
                "active"
        }
    );
};

/* ===== DELETE ===== */
exports.deleteExpert =
async id => {

    await Expert.findByIdAndDelete(
        id
    );
};