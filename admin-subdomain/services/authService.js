const { hashPassword, comparePassword } = require("../utils/hash");
const { generateToken } = require("../utils/tokens");
const { sendEmail } = require("../utils/mailer");

const { Admin, AdminInvite } = require("../models");

/* ================= INVITE VALIDATION ================= */
exports.validateInvite = async (token) => {

    // expire old invites
    await AdminInvite.updateMany(
        {
            status: "pending",
            expiresAt: { $lt: new Date() }
        },
        { $set: { status: "expired" } }
    );

    const invite = await AdminInvite.findOne({
        token,
        status: "pending",
        expiresAt: { $gt: new Date() }
    });

    return invite || null;
};

/* ================= SIGNUP ================= */
exports.signup = async (req) => {

    const { token, ADMIN_NAME, ADMIN_PHONE, ADMIN_PASSWORD } = req.body;

    if (!token || !ADMIN_NAME || !ADMIN_PASSWORD) {
        throw { status: 400, message: "Missing required fields" };
    }

    const image = req.file ? `/uploads/admin/${req.file.filename}` : null;

    const invite = await exports.validateInvite(token);

    if (!invite) {
        throw { status: 400, message: "Invalid or expired invite" };
    }

    const existing = await Admin.findOne({
        ADMIN_EMAIL: invite.ADMIN_EMAIL
    });

    if (existing) {
        throw { status: 400, message: "Admin already exists" };
    }

    const hash = await hashPassword(ADMIN_PASSWORD);

    const newAdmin = await Admin.create({
        ADMIN_EMAIL: invite.ADMIN_EMAIL,
        ADMIN_NAME,
        ADMIN_PHONE,
        ADMIN_PASSWORD: hash,
        ADMIN_PROFILE_IMAGE: image,
        role: invite.role
    });

    await AdminInvite.updateOne(
        { token },
        {
            $set: {
                status: "used",
                usedAt: new Date(),
                usedBy: newAdmin._id
            }
        }
    );

    return { message: "Signup successful. You can now login." };
};

/* ================= LOGIN ================= */
exports.login = async (req) => {

    let { ADMIN_EMAIL, ADMIN_PASSWORD } = req.body;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        throw { status: 400, message: "All fields required" };
    }

    /* 🔐 NORMALIZE EMAIL */
    ADMIN_EMAIL = ADMIN_EMAIL.toLowerCase().trim();

    const admin = await Admin.findOne({ ADMIN_EMAIL });

    if (!admin) {
        throw { status: 400, message: "Invalid credentials" };
    }

    /* 🔐 STATUS CHECK */
    if (admin.status !== "active") {
        throw { status: 403, message: "Account is not active" };
    }

    const match = await comparePassword(ADMIN_PASSWORD, admin.ADMIN_PASSWORD);

    if (!match) {
        throw { status: 400, message: "Invalid credentials" };
    }

    await Admin.updateOne(
        { _id: admin._id },
        {
            $set: {
                last_login_at: new Date(),
                last_login_ip: req.ip
            }
        }
    );

    return {
        id: admin._id,
        ADMIN_NAME: admin.ADMIN_NAME,
        ADMIN_EMAIL: admin.ADMIN_EMAIL,
        ADMIN_PHONE: admin.ADMIN_PHONE,
        ADMIN_PROFILE_IMAGE: admin.ADMIN_PROFILE_IMAGE,
        role: admin.role,
        status: admin.status
    };
};

/* ================= FORGOT PASSWORD ================= */
exports.forgotPassword = async (req) => {

    let { ADMIN_EMAIL } = req.body;

    ADMIN_EMAIL = ADMIN_EMAIL?.toLowerCase().trim();

    const admin = await Admin.findOne({ ADMIN_EMAIL });

    if (!admin) return;

    const token = generateToken();

    await Admin.updateOne(
        { ADMIN_EMAIL },
        {
            $set: {
                reset_token: token,
                reset_expires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
            }
        }
    );

    const link = `${process.env.ADMIN_AUTH_BASE_URL}/admin/auth/reset-password?token=${token}`;

    await sendEmail({
        to: ADMIN_EMAIL,
        subject: "Password Reset",
        html: `<a href="${link}">${link}</a>`
    });
};

/* ================= RESET PASSWORD ================= */
exports.resetPassword = async (req) => {

    const { ADMIN_RESET_TOKEN, ADMIN_NEW_PASSWORD } = req.body;

    const admin = await Admin.findOne({
        reset_token: ADMIN_RESET_TOKEN,
        reset_expires: { $gt: new Date() }
    });

    if (!admin) {
        throw { status: 400, message: "Invalid or expired token" };
    }

    const hash = await hashPassword(ADMIN_NEW_PASSWORD);

    await Admin.updateOne(
        { _id: admin._id },
        {
            $set: {
                ADMIN_PASSWORD: hash,
                reset_token: null,
                reset_expires: null
            }
        }
    );
};