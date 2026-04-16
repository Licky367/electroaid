const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.CLIENT_AUTH_EMAIL_USER,
        pass: process.env.CLIENT_AUTH_EMAIL_PASS
    }
});

exports.sendMail = (to, link) => {
    return transporter.sendMail({
        from: process.env.CLIENT_AUTH_EMAIL_USER,
        to,
        subject: "Password Reset",
        html: `
            <h3>Password Reset</h3>
            <p>Click below to reset your password:</p>
            <a href="${link}">${link}</a>
        `
    });
};