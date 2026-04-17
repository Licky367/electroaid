const { Admin } = require("../models");

/* ===== GET ALL ADMINS ===== */
exports.getAllAdmins = async () => {

    const admins = await Admin.find()
        .select("ADMIN_NAME ADMIN_EMAIL role status createdAt")
        .sort({ createdAt: -1 });

    return admins.map(a => ({
        id: a._id,
        ADMIN_NAME: a.ADMIN_NAME,
        ADMIN_EMAIL: a.ADMIN_EMAIL,
        role: a.role,
        status: a.status,
        is_active: a.status === "active"
    }));
};

/* ===== TOGGLE STATUS ===== */
exports.toggleAdminStatus = async (adminId, targetId) => {

    if (adminId === targetId) {
        throw { status: 400, message: "You cannot deactivate yourself" };
    }

    const admin = await Admin.findById(targetId);

    if (!admin) {
        throw { status: 404, message: "Admin not found" };
    }

    let newStatus;

    if (admin.status === "active") {
        newStatus = "inactive";
    } else if (admin.status === "inactive") {
        newStatus = "active";
    } else {
        throw { status: 400, message: "Cannot toggle suspended admin" };
    }

    await Admin.updateOne(
        { _id: targetId },
        { $set: { status: newStatus } }
    );
};

/* ===== DELETE ADMIN ===== */
exports.deleteAdmin = async (adminId, targetId) => {

    if (adminId === targetId) {
        throw { status: 400, message: "You cannot delete yourself" };
    }

    const admin = await Admin.findById(targetId);

    if (!admin) {
        throw { status: 404, message: "Admin not found" };
    }

    if (admin.role === "SUPER_ADMIN") {
        throw { status: 403, message: "Cannot delete SUPER ADMIN" };
    }

    await Admin.deleteOne({ _id: targetId });
};