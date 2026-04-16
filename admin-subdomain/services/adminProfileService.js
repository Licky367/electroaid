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

    /* 🔐 CHECK STATUS */
    const [currentAdmin] = await db.query(
        "SELECT status FROM admins WHERE id=?",
        [adminId]
    );

    if (currentAdmin[0].status !== "active") {
        throw { status: 403, message: "Account not active" };
    }

    /* 🔒 RESTRICT EMAIL CHANGE */
    if (req.session.admin.role !== "SUPER_ADMIN") {
        const [rows] = await db.query(
            "SELECT ADMIN_EMAIL FROM admins WHERE id=?",
            [adminId]
        );
        ADMIN_EMAIL = rows[0].ADMIN_EMAIL;
    }

    /* 🚫 CHECK PHONE DUPLICATE */
    if (ADMIN_PHONE) {
        const [phoneCheck] = await db.query(
            "SELECT id FROM admins WHERE ADMIN_PHONE=? AND id != ?",
            [ADMIN_PHONE, adminId]
        );

        if (phoneCheck.length) {
            throw { status: 400, message: "Phone already in use" };
        }
    }

    /* ✅ UPDATE */
    await db.query(`
        UPDATE admins
        SET ADMIN_NAME=?, ADMIN_EMAIL=?, ADMIN_PHONE=?, ADMIN_PROFILE_IMAGE=?
        WHERE id=?
    `, [ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, imagePath, adminId]);

    return {
        ADMIN_NAME,
        ADMIN_EMAIL,
        ADMIN_PHONE,
        ADMIN_PROFILE_IMAGE: imagePath
    };
};