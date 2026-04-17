const { ClientReset } = require("../../models");

exports.getValidToken = async (token) => {
    return await ClientReset.findOne({
        token,
        expiresAt: { $gt: new Date() }
    });
};