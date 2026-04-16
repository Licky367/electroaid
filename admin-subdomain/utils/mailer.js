require("dotenv").config({ path: "../config.env" });

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.ADMIN_EMAIL_USER,
        pass: process.env.ADMIN_EMAIL_PASS
    }
});

const sendEmail = async ({ to, subject, html }) => {
    return transporter.sendMail({
        from: `"Electro-Aid Technologies" <${process.env.ADMIN_EMAIL_USER}>`,
        to,
        subject,
        html
    });
};

module.exports = { sendEmail };