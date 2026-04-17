const { Client } = require("../../models");

/* GET CLIENT */
exports.getClientById = async (id) => {
    return await Client.findById(id);
};

/* UPDATE PROFILE */
exports.updateClientProfile = async (id, name, phone, image) => {
    return await Client.findByIdAndUpdate(
        id,
        {
            CLIENT_NAME: name,
            CLIENT_PHONE_NUMBER: phone,
            CLIENT_PROFILE_IMAGE: image
        },
        { new: true }
    );
};

/* UPDATE PASSWORD */
exports.updatePassword = async (id, password) => {
    return await Client.findByIdAndUpdate(
        id,
        { CLIENT_PASSWORD: password },
        { new: true }
    );
};