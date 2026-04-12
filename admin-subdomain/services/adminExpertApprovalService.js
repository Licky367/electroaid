const nodemailer = require("nodemailer");

/* ================= ENV ================= */
const SIGNUP_LINK = process.env.EXPERT_SIGNUP_LINK;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

/* ================= MAILER ================= */
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});

/* ================= HELPERS ================= */

function generateRegNo() {
    const numbers = Math.floor(1000 + Math.random() * 9000);
    const letters = String.fromCharCode(
        65 + Math.floor(Math.random() * 26),
        65 + Math.floor(Math.random() * 26)
    );
    return `EXP_${numbers}_${letters}`;
}

async function cleanExpiredRegNos() {
    await db.query(`
        DELETE FROM expert_registrations
        WHERE used = FALSE
        AND expiresAt < NOW()
    `);
}

function generateEmailHTML(REG_NO) {
    const link = `${SIGNUP_LINK}?reg=${REG_NO}`;

    return `
    <div style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
        <div style="max-width:600px;margin:auto;background:#fff;padding:25px;border-radius:10px">
            <h2 style="color:#8B4513">You're Invited to Join Electro-Aid</h2>

            <p>You have been invited to join as an expert.</p>

            <div style="font-size:22px;font-weight:bold;background:#f7f7f7;
                        padding:12px;text-align:center;border-radius:6px;letter-spacing:2px">
                ${REG_NO}
            </div>

            <a href="${link}" 
               style="display:inline-block;padding:12px 20px;background:#D2691E;
                      color:#fff;text-decoration:none;border-radius:6px;margin-top:15px">
                Complete Signup
            </a>

            <p>This link expires in <strong>24 hours</strong>.</p>

            <hr>
            <small>Electro-Aid Technologies</small>
        </div>
    </div>
    `;
}

/* ================= FETCH INVITES ================= */
exports.fetchExpertInvites = async () => {
    await cleanExpiredRegNos();

    const [experts] = await db.query(`
        SELECT 
            r.REG_NO,
            r.EXPERT_EMAIL,
            a.ADMIN_NAME
        FROM expert_registrations r
        LEFT JOIN admins a 
            ON r.createdByAdminId = a.id
        ORDER BY r.createdAt DESC
    `);

    return experts;
};

/* ================= CREATE INVITE ================= */
exports.createExpertInvite = async ({ adminId, role, email }) => {
    if (!adminId) {
        return { error: "Unauthorized", status: 401 };
    }

    if (!email) {
        return { error: "Email is required", status: 400 };
    }

    const cleanEmail = email.trim().toLowerCase();

    await cleanExpiredRegNos();

    /* ===== PREVENT DUPLICATE ===== */
    const [existing] = await db.query(`
        SELECT id FROM expert_registrations
        WHERE EXPERT_EMAIL = ?
        AND used = FALSE
        AND expiresAt > NOW()
    `, [cleanEmail]);

    if (existing.length > 0) {
        return {
            error: "This expert already has an active invitation",
            status: 400
        };
    }

    /* ===== WEEKLY LIMIT ===== */
    if (role !== "SUPER_ADMIN") {
        const [rows] = await db.query(`
            SELECT COUNT(*) AS count
            FROM expert_registrations
            WHERE createdByAdminId = ?
            AND createdAt >= NOW() - INTERVAL 7 DAY
        `, [adminId]);

        if (rows[0].count >= 5) {
            return {
                error: "Weekly REG_NO limit reached",
                status: 403
            };
        }
    }

    /* ===== GENERATE UNIQUE REG_NO ===== */
    let REG_NO;
    let exists = true;

    while (exists) {
        REG_NO = generateRegNo();

        const [check] = await db.query(
            "SELECT id FROM expert_registrations WHERE REG_NO = ?",
            [REG_NO]
        );

        if (check.length === 0) exists = false;
    }

    /* ===== INSERT ===== */
    await db.query(`
        INSERT INTO expert_registrations 
        (REG_NO, EXPERT_EMAIL, createdByAdminId, used, expiresAt)
        VALUES (?, ?, ?, FALSE, NOW() + INTERVAL 24 HOUR)
    `, [REG_NO, cleanEmail, adminId]);

    /* ===== SEND EMAIL ===== */
    await transporter.sendMail({
        from: `"Electro-Aid" <${EMAIL_USER}>`,
        to: cleanEmail,
        subject: "Your Expert Invitation – Electro-Aid",
        html: generateEmailHTML(REG_NO)
    });

    return { REG_NO };
};