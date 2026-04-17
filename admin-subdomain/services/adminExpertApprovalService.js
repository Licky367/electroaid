const nodemailer = require("nodemailer");

const {
    ExpertRegistration,
    Admin
} = require("../../models");

/* ================= ENV ================= */

const SIGNUP_LINK =
    process.env.EXPERT_SIGNUP_LINK;

const EMAIL_USER =
    process.env.EMAIL_USER;

const EMAIL_PASS =
    process.env.EMAIL_PASS;

/* ================= MAILER ================= */

const transporter =
    nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS
        }
    });

/* ================= HELPERS ================= */

function generateRegNo() {
    const numbers =
        Math.floor(
            1000 +
            Math.random() * 9000
        );

    const letters =
        String.fromCharCode(
            65 +
            Math.floor(
                Math.random() * 26
            ),
            65 +
            Math.floor(
                Math.random() * 26
            )
        );

    return `EXP_${numbers}_${letters}`;
}

async function cleanExpiredRegNos() {
    await ExpertRegistration.deleteMany({
        used: false,
        expiresAt: {
            $lt: new Date()
        }
    });
}

function generateEmailHTML(
    REG_NO
) {
    const link =
        `${SIGNUP_LINK}?reg=${REG_NO}`;

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

exports.fetchExpertInvites =
async () => {

    await cleanExpiredRegNos();

    const experts =
        await ExpertRegistration.find()
            .populate(
                {
                    path: "createdByAdminId",
                    model: "Admin",
                    select:
                        "ADMIN_NAME"
                }
            )
            .sort({
                createdAt: -1
            })
            .lean();

    return experts.map(
        row => ({
            REG_NO:
                row.REG_NO,

            EXPERT_EMAIL:
                row.EXPERT_EMAIL,

            ADMIN_NAME:
                row
                    .createdByAdminId
                    ?.ADMIN_NAME ||
                null
        })
    );
};

/* ================= CREATE INVITE ================= */

exports.createExpertInvite =
async ({
    adminId,
    role,
    email
}) => {

    if (!adminId) {
        return {
            error:
                "Unauthorized",
            status: 401
        };
    }

    if (!email) {
        return {
            error:
                "Email is required",
            status: 400
        };
    }

    const cleanEmail =
        email
            .trim()
            .toLowerCase();

    await cleanExpiredRegNos();

    /* ===== PREVENT DUPLICATE ===== */

    const existing =
        await ExpertRegistration.findOne(
            {
                EXPERT_EMAIL:
                    cleanEmail,

                used: false,

                expiresAt: {
                    $gt:
                        new Date()
                }
            }
        ).lean();

    if (existing) {
        return {
            error:
                "This expert already has an active invitation",
            status: 400
        };
    }

    /* ===== WEEKLY LIMIT ===== */

    if (
        role !==
        "SUPER_ADMIN"
    ) {
        const sevenDaysAgo =
            new Date(
                Date.now() -
                7 *
                24 *
                60 *
                60 *
                1000
            );

        const count =
            await ExpertRegistration.countDocuments(
                {
                    createdByAdminId:
                        adminId,

                    createdAt: {
                        $gte:
                            sevenDaysAgo
                    }
                }
            );

        if (count >= 5) {
            return {
                error:
                    "Weekly REG_NO limit reached",
                status: 403
            };
        }
    }

    /* ===== GENERATE UNIQUE REG_NO ===== */

    let REG_NO;
    let exists = true;

    while (exists) {
        REG_NO =
            generateRegNo();

        const check =
            await ExpertRegistration.findOne(
                {
                    REG_NO
                }
            ).lean();

        if (!check) {
            exists = false;
        }
    }

    /* ===== INSERT ===== */

    await ExpertRegistration.create(
        {
            REG_NO,
            EXPERT_EMAIL:
                cleanEmail,

            createdByAdminId:
                adminId,

            used: false,

            expiresAt:
                new Date(
                    Date.now() +
                    24 *
                    60 *
                    60 *
                    1000
                )
        }
    );

    /* ===== SEND EMAIL ===== */

    await transporter.sendMail(
        {
            from:
                `"Electro-Aid" <${EMAIL_USER}>`,

            to: cleanEmail,

            subject:
                "Your Expert Invitation – Electro-Aid",

            html: generateEmailHTML(
                REG_NO
            )
        }
    );

    return { REG_NO };
};