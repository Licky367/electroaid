const {
    Message,
    Client
} = require("../models");

/* ================= USERS ================= */

exports.getChatUsers =
async () => {

    const clients =
        await Client.find()
            .select(
                "_id CLIENT_NAME CLIENT_EMAIL"
            )
            .lean();

    const result =
        await Promise.all(
            clients.map(
                async client => {

                    const unreadCount =
                        await Message.countDocuments(
                            {
                                clientId:
                                    client._id,

                                senderRole:
                                    "client",

                                isRead:
                                    false
                            }
                        );

                    const lastMessage =
                        await Message.findOne(
                            {
                                clientId:
                                    client._id
                            }
                        )
                            .sort({
                                createdAt: -1
                            })
                            .select(
                                "createdAt"
                            )
                            .lean();

                    const hasMessages =
                        await Message.exists(
                            {
                                clientId:
                                    client._id
                            }
                        );

                    if (!hasMessages) {
                        return null;
                    }

                    return {
                        clientId:
                            client._id,

                        clientName:
                            client.CLIENT_NAME,

                        clientEmail:
                            client.CLIENT_EMAIL,

                        unreadCount,

                        lastMessageAt:
                            lastMessage?.createdAt ||
                            null
                    };
                }
            )
        );

    return result
        .filter(Boolean)
        .sort(
            (a, b) =>
                new Date(b.lastMessageAt) -
                new Date(a.lastMessageAt)
        );
};

/* ================= MESSAGES ================= */

exports.getMessagesByClient =
async (clientId) => {

    await Message.updateMany(
        {
            clientId,
            senderRole:
                "client"
        },
        {
            $set: {
                isRead: true,
                seenAt: new Date()
            }
        }
    );

    const rows =
        await Message.find({
            clientId
        })
            .sort({
                createdAt: 1
            })
            .lean();

    return rows;
};

/* ================= SEND ================= */

exports.sendMessage =
async (
    clientId,
    message,
    file = null
) => {

    let fileUrl = null;
    let fileName = null;

    if (file) {
        fileUrl =
            "uploads/chat/" +
            file.filename;

        fileName =
            file.originalname;
    }

    const newMsg =
        await Message.create({
            clientId,
            message:
                message || "",

            senderRole:
                "admin",

            isRead: true,

            fileUrl,
            fileName,

            createdAt:
                new Date()
        });

    return newMsg._id;
};

/* ================= DELETE ================= */

exports.deleteMessage =
async id => {

    await Message.findByIdAndDelete(
        id
    );
};