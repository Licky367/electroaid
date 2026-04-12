const service = require("../services/adminChatsService");

/* ================= USERS ================= */

exports.getUsers = async (req, res) => {
    try {
        const users = await service.getChatUsers();
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch users" });
    }
};

/* ================= MESSAGES ================= */

exports.getMessages = async (req, res) => {
    try {
        const clientId = req.params.clientId;

        const messages = await service.getMessagesByClient(clientId);

        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
};

/* ================= SEND ================= */

exports.sendMessage = async (req, res) => {
    try {
        const clientId = req.params.clientId;
        const message = req.body.message;

        const id = await service.sendMessage(clientId, message, req.file);

        res.json({ success: true, id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to send message" });
    }
};

/* ================= DELETE ================= */

exports.deleteMessage = async (req, res) => {
    try {
        const id = req.params.id;

        await service.deleteMessage(id);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete message" });
    }
};