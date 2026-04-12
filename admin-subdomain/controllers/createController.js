const db = require("../../db");
const { generateInviteToken } = require("../../utils/inviteToken");
const { sendInviteEmail } = require("../../utils/inviteMailer");

/* ================= ROLE VALIDATION ================= */
const allowedRoles = [
    "FINANCIAL_ADMIN",
    "OPERATIONS_ADMIN",
    "OPERATIONAL_ADMIN"
];

/* ================= RENDER ================= */
exports.renderCreatePage = (req, res) => {
    res.render("admin-create", {
        csrfToken: req.csrfToken()
    });
};

/* ================= CREATE ADMIN ================= */
exports.createAdminInvite = async (req, res) => {
    try {
        let { ADMIN_EMAIL, role } = req.body;

        ADMIN_EMAIL = ADMIN_EMAIL?.toLowerCase().trim();

        if (!ADMIN_EMAIL || !role) {
            return res.status(400).json({ message: "Email and role are required" });
        }

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role selected" });
        }

        const [existingAdmin] = await db.query(
            "SELECT id FROM admins WHERE ADMIN_EMAIL=?",
            [ADMIN_EMAIL]
        );

        if (existingAdmin.length) {
            return res.status(400).json({ message: "Admin already exists" });
        }

        await db.query(`
            UPDATE admin_invites 
            SET status='expired' 
            WHERE status='pending' AND expiresAt < NOW()
        `);

        const [existingInvite] = await db.query(`
            SELECT id FROM admin_invites 
            WHERE ADMIN_EMAIL=? 
            AND status='pending' 
            AND expiresAt > NOW()
        `, [ADMIN_EMAIL]);

        if (existingInvite.length) {
            return res.status(400).json({ message: "Active invite already exists" });
        }

        const token = generateInviteToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await db.query(`
            INSERT INTO admin_invites 
            (ADMIN_EMAIL, role, token, expiresAt, status, createdBy)
            VALUES (?, ?, ?, ?, 'pending', ?)
        `, [ADMIN_EMAIL, role, token, expiresAt, req.session.admin.id]);

        const signupLink = `${process.env.ADMIN_AUTH_BASE_URL}/admin/auth/signup?token=${token}`;
        const displayRole = role.replace(/_/g, " ");

        const emailHTML = `
            <div style="font-family:Arial,sans-serif; line-height:1.6; color:#333;">
                <h2 style="color:#8B4513;">Electro-Aid Technologies</h2>
                <p>Hello,</p>
                <p>You have been invited as <strong>${displayRole}</strong>.</p>
                <a href="${signupLink}">Complete Signup</a>
                <p>Expires in 24 hours.</p>
            </div>
        `;

        try {
            await sendInviteEmail({
                to: ADMIN_EMAIL,
                subject: "Admin Invitation",
                html: emailHTML
            });
        } catch (e) {
            console.error("Email failed:", e);
        }

        res.json({ message: "Admin invite created successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

/* ================= UPDATE ROLE ================= */
exports.updateAdminRole = async (req, res) => {
    try {
        let { ADMIN_EMAIL, role } = req.body;

        ADMIN_EMAIL = ADMIN_EMAIL?.toLowerCase().trim();

        if (!ADMIN_EMAIL || !role) {
            return res.status(400).json({ message: "Email and role are required" });
        }

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const [admin] = await db.query(
            "SELECT id FROM admins WHERE ADMIN_EMAIL=?",
            [ADMIN_EMAIL]
        );

        if (!admin.length) {
            return res.status(404).json({ message: "Admin not found" });
        }

        await db.query(
            "UPDATE admins SET role=? WHERE ADMIN_EMAIL=?",
            [role, ADMIN_EMAIL]
        );

        res.json({ message: "Admin role updated successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};