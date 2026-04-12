const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const FROM = `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`;

/* ===== GENERIC ===== */
exports.send = async ({ to, subject, text }) => {
  await transporter.sendMail({
    from: FROM,
    to,
    subject,
    text
  });
};