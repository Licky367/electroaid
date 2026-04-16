const { hashPassword, comparePassword } = require("../utils/hash");
const { generateToken } = require("../utils/tokens");
const { sendEmail } = require("../utils/mailer");

/* ================= INVITE VALIDATION ================= */
exports.validateInvite = async (token) => {

    await db.query(`
        UPDATE admin_invites 
        SET status='expired' 
        WHERE status='pending' AND expiresAt < NOW()
    `);

    const [rows] = await db.query(`
        SELECT * FROM admin_invites 
        WHERE token=? AND status='pending' AND expiresAt > NOW()
    `, [token]);

    return rows[0] || null;
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

    const [existing] = await db.query(
        "SELECT id FROM admins WHERE ADMIN_EMAIL=?",
        [invite.ADMIN_EMAIL]
    );

    if (existing.length) {
        throw { status: 400, message: "Admin already exists" };
    }

    const hash = await hashPassword(ADMIN_PASSWORD);

    const [result] = await db.query(`
        INSERT INTO admins 
        (ADMIN_EMAIL, ADMIN_NAME, ADMIN_PHONE, ADMIN_PASSWORD, ADMIN_PROFILE_IMAGE, role)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [
        invite.ADMIN_EMAIL,
        ADMIN_NAME,
        ADMIN_PHONE,
        hash,
        image,
        invite.role
    ]);

    await db.query(`
        UPDATE admin_invites 
        SET status='used', usedAt=NOW(), usedBy=? 
        WHERE token=?
    `, [result.insertId, token]);

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

    const [rows] = await db.query(
        "SELECT * FROM admins WHERE ADMIN_EMAIL=?",
        [ADMIN_EMAIL]
    );

    if (!rows.length) {
        throw { status: 400, message: "Invalid credentials" };
    }

    const admin = rows[0];

    /* 🔐 STATUS CHECK */
    if (admin.status !== "active") {
        throw { status: 403, message: "Account is not active" };
    }

    const match = await comparePassword(ADMIN_PASSWORD, admin.ADMIN_PASSWORD);

    if (!match) {
        throw { status: 400, message: "Invalid credentials" };
    }

    await db.query(`
        UPDATE admins 
        SET last_login_at=NOW(), last_login_ip=? 
        WHERE id=?
    `, [req.ip, admin.id]);

    /* ✅ INCLUDE STATUS HERE */
    return {
        id: admin.id,
        ADMIN_NAME: admin.ADMIN_NAME,
        ADMIN_EMAIL: admin.ADMIN_EMAIL,
        ADMIN_PHONE: admin.ADMIN_PHONE,
        ADMIN_PROFILE_IMAGE: admin.ADMIN_PROFILE_IMAGE,
        role: admin.role,
        status: admin.status   // ✅ FIXED
    };
};

/* ================= FORGOT PASSWORD ================= */
exports.forgotPassword = async (req) => {

    let { ADMIN_EMAIL } = req.body;

    /* 🔐 NORMALIZE */
    ADMIN_EMAIL = ADMIN_EMAIL?.toLowerCase().trim();

    const [rows] = await db.query(
        "SELECT id FROM admins WHERE ADMIN_EMAIL=?",
        [ADMIN_EMAIL]
    );

    if (!rows.length) return;

    const token = generateToken();

    await db.query(`
        UPDATE admins 
        SET reset_token=?, reset_expires=DATE_ADD(NOW(), INTERVAL 1 HOUR)
        WHERE ADMIN_EMAIL=?
    `, [token, ADMIN_EMAIL]);

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

    const [rows] = await db.query(`
        SELECT id FROM admins 
        WHERE reset_token=? AND reset_expires > NOW()
    `, [ADMIN_RESET_TOKEN]);

    if (!rows.length) {
        throw { status: 400, message: "Invalid or expired token" };
    }

    const hash = await hashPassword(ADMIN_NEW_PASSWORD);

    await db.query(`
        UPDATE admins 
        SET ADMIN_PASSWORD=?, reset_token=NULL, reset_expires=NULL
        WHERE id=?
    `, [hash, rows[0].id]);
};