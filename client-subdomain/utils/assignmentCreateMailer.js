const nodemailer = require("nodemailer");

/* ================= TRANSPORT ================= */
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/* ================= SEND ASSIGNMENT EMAIL ================= */
async function sendAssignmentCreatedEmail({
    to,
    clientName,
    title,
    reference
}) {
    try {

        const EMAIL_FROM_NAME =
            process.env.EMAIL_FROM_NAME || "Electro-Aid Technologies";

        const CLIENT_URL = process.env.CLIENT_URL;

        const subject = "Assignment Received Successfully";

        /* TEXT VERSION (fallback) */
        const text = `
Dear ${clientName},

Your assignment has been successfully received.

Title: ${title}
Reference Code: ${reference}

You can track your assignment here:
${CLIENT_URL}/assignments/work

Our team is reviewing your submission and will assign an expert shortly.

Regards,
${EMAIL_FROM_NAME}

Support:
Email: ${process.env.SUPPORT_EMAIL}
Phone: ${process.env.SUPPORT_PHONE}
`;

        /* HTML VERSION */
        const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:10px;">

    <h2 style="color:#8B4513;margin-bottom:10px;">
        Assignment Received ✅
    </h2>

    <p>Dear ${clientName},</p>

    <p>
        Your assignment has been <strong>successfully received</strong>.
    </p>

    <div style="background:#f9f9f9;padding:15px;border-radius:8px;margin:20px 0;">
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Reference Code:</strong> ${reference}</p>
    </div>

    <p>
        You can track your assignment using the link below:
    </p>

    <p>
        <a href="${CLIENT_URL}/assignments/pending?reference"
           style="display:inline-block;padding:10px 15px;background:#8B4513;color:#fff;text-decoration:none;border-radius:5px;">
           View Assignment
        </a>
    </p>

    <p>
        Our team is currently reviewing your submission and will assign a suitable expert shortly.
    </p>

    <hr style="margin:25px 0;">

    <p style="font-size:14px;color:#555;">
        Need help? Contact us:<br>
        📧 ${process.env.SUPPORT_EMAIL}<br>
        📞 ${process.env.SUPPORT_PHONE}
    </p>

    <p style="margin-top:20px;">
        Regards,<br>
        <strong>${EMAIL_FROM_NAME}</strong>
    </p>

</div>
`;

        const mailOptions = {
            from: `"${EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html
        };

        const info = await transporter.sendMail(mailOptions);

        console.log("📧 Assignment email sent:", info.messageId);

        return info;

    } catch (error) {
        console.error("❌ Assignment email error:", error);
        throw error;
    }
}

module.exports = {
    sendAssignmentCreatedEmail
};