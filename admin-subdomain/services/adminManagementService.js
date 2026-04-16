/* ===== GET ALL ADMINS ===== */
exports.getAllAdmins = async () => {

    const [admins] = await db.query(`
        SELECT 
            id,
            ADMIN_NAME,
            ADMIN_EMAIL,
            role,
            status,
            (status = 'active') AS is_active
        FROM admins
        ORDER BY createdAt DESC
    `);

    return admins;
};

/* ===== TOGGLE STATUS ===== */
exports.toggleAdminStatus = async (adminId, targetId) => {

    if (adminId == targetId) {
        throw { status: 400, message: "You cannot deactivate yourself" };
    }

    const [rows] = await db.query(
        "SELECT status FROM admins WHERE id=?",
        [targetId]
    );

    if (!rows.length) {
        throw { status: 404, message: "Admin not found" };
    }

    const currentStatus = rows[0].status;

    let newStatus;
    if (currentStatus === "active") {
        newStatus = "inactive";
    } else if (currentStatus === "inactive") {
        newStatus = "active";
    } else {
        throw { status: 400, message: "Cannot toggle suspended admin" };
    }

    await db.query(
        "UPDATE admins SET status=? WHERE id=?",
        [newStatus, targetId]
    );
};

/* ===== DELETE ADMIN ===== */
exports.deleteAdmin = async (adminId, targetId) => {

    if (adminId == targetId) {
        throw { status: 400, message: "You cannot delete yourself" };
    }

    const [rows] = await db.query(
        "SELECT role FROM admins WHERE id=?",
        [targetId]
    );

    if (!rows.length) {
        throw { status: 404, message: "Admin not found" };
    }

    if (rows[0].role === "SUPER_ADMIN") {
        throw { status: 403, message: "Cannot delete SUPER ADMIN" };
    }

    await db.query(
        "DELETE FROM admins WHERE id=?",
        [targetId]
    );
};