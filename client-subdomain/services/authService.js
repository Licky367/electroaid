const { Client, ClientPasswordReset } = require("../models");

// Find client by email
exports.findByEmail = async (email) => {
    return await Client.findOne({ CLIENT_EMAIL: email });
};

// Create new client
exports.createClient = async (data) => {
    const client = new Client({
        CLIENT_NAME: data.CLIENT_NAME,
        CLIENT_EMAIL: data.CLIENT_EMAIL,
        CLIENT_PHONE_NUMBER: data.CLIENT_PHONE_NUMBER,
        CLIENT_PROFILE_IMAGE: data.imagePath,
        CLIENT_PASSWORD: data.hashedPassword
    });

    return await client.save();
};

// Update password
exports.updatePassword = async (id, password) => {
    return await Client.findByIdAndUpdate(
        id, // ⚠️ must be MongoDB _id
        { CLIENT_PASSWORD: password },
        { new: true }
    );
};

// Save reset token
exports.saveResetToken = async (clientId, token, expires) => {
    return await ClientPasswordReset.create({
        clientId,
        token,
        expiresAt: expires
    });
};

// Delete reset token
exports.deleteResetToken = async (clientId) => {
    return await ClientPasswordReset.deleteOne({ clientId });
};