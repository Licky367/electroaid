const { Admin } = require("../models");

exports.updateProfile = async (req) => {

    const adminId = req.session.admin;

    let { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE } = req.body;

    /* 🔐 NORMALIZE */
    ADMIN_EMAIL = ADMIN_EMAIL?.toLowerCase().trim();
    ADMIN_NAME = ADMIN_NAME?.trim();
    ADMIN_PHONE = ADMIN_PHONE?.trim();

    let imagePath = req.session.admin.ADMIN_PROFILE_IMAGE;

    if (req.file) {
        imagePath = `/uploads/admin/${req.file.filename}`;
    }

    /* 🔐 FETCH CURRENT ADMIN */
    const currentAdmin = await Admin.findById(adminId);

    if (!currentAdmin) {
        throw { status: 404, message: "Admin not found" };
    }

    /* 🔐 CHECK STATUS */
    if (currentAdmin.status !== "active") {
        throw { status: 403, message: "Account not active" };
    }

    /* 🔒 RESTRICT EMAIL CHANGE */
    if (req.session.admin.role !== "SUPER_ADMIN") {
        ADMIN_EMAIL = currentAdmin.ADMIN_EMAIL;
    }

    /* 🚫 CHECK PHONE DUPLICATE */
    if (ADMIN_PHONE) {
        const phoneCheck = await Admin.findOne({
            ADMIN_PHONE,
            _id: { $ne: adminId }
        });

        if (phoneCheck) {
            throw { status: 400, message: "Phone already in use" };
        }
    }

    /* ✅ UPDATE */
    await Admin.updateOne(
        { _id: adminId },
        {
            $set: {
                ADMIN_NAME,
                ADMIN_EMAIL,
                ADMIN_PHONE,
                ADMIN_PROFILE_IMAGE: imagePath
            }
        }
    );

    return {
        ADMIN_NAME,
        ADMIN_EMAIL,
        ADMIN_PHONE,
        ADMIN_PROFILE_IMAGE: imagePath
    };
};