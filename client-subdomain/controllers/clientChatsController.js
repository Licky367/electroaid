const service = require("../services/clientChatsService")

exports.getMessages = async (req, res) => {
    try {

        const clientId = req.session.clientId
        const messages = await service.getMessages(clientId)

        await service.markAsRead(clientId)

        res.json(messages)

    } catch (err) {
        console.error(err)
        res.status(500).json([])
    }
}

exports.sendMessage = async (req, res) => {
    try {

        const clientId = req.session.clientId
        const { message } = req.body

        if (!message) {
            return res.status(400).json({ error: "Message required" })
        }

        const saved = await service.createMessage(clientId, message)

        req.io.to(`client_${clientId}`).emit("newMessage", saved)

        res.json(saved)

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Server error" })
    }
}