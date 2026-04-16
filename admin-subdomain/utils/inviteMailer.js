const nodemailer = require("nodemailer");

/* ================= TRANSPORTER ================= */
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.ADMIN_EMAIL_USER,
        pass: process.env.ADMIN_EMAIL_PASS
    }
});

/**
 * Send admin invite email
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 */
async function sendInviteEmail({ to, subject, html }) {
    return transporter.sendMail({
        from: `"Electro-Aid Technologies" <${process.env.ADMIN_EMAIL_USER}>`,
        to,
        subject,
        html
    });
}

module.exports = {
    sendInviteEmail
};