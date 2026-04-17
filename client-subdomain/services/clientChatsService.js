const { Message } = require("../../models");

exports.getMessages = async (clientId) => {
    return await Message.find({
        clientId
    })
    .select("message senderRole isRead createdAt")
    .sort({ createdAt: 1 });
};

exports.createMessage = async (clientId, message) => {

    const created = await Message.create({
        clientId,
        message,
        senderRole: "client",
        isRead: false
    });

    return await Message.findById(created._id)
        .select("message senderRole isRead createdAt");
};

exports.markAsRead = async (clientId) => {

    await Message.updateMany(
        {
            clientId,
            senderRole: "admin"
        },
        {
            isRead: true
        }
    );
};