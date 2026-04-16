// controllers/clientChatsController.js

const service = require("../services/clientChatsService")

// GET /messages
const getMessages = async (req, res, next) => {
    try {
        const clientId = req.session?.clientId

        if (!clientId) {
            return res.status(401).json({ error: "Unauthorized" })
        }

        const messages = await service.getMessages(clientId)

        // Mark messages as read (non-blocking optional)
        await service.markAsRead(clientId)

        return res.status(200).json(messages)

    } catch (err) {
        console.error("getMessages error:", err)
        next(err) // pass to global error handler
    }
}


// POST /messages
const sendMessage = async (req, res, next) => {
    try {
        const clientId = req.session?.clientId
        const { message } = req.body

        if (!clientId) {
            return res.status(401).json({ error: "Unauthorized" })
        }

        if (!message || message.trim() === "") {
            return res.status(400).json({ error: "Message is required" })
        }

        const savedMessage = await service.createMessage(clientId, message)

        // Emit via socket.io if available
        if (req.io) {
            req.io.to(`client_${clientId}`).emit("newMessage", savedMessage)
        }

        return res.status(201).json(savedMessage)

    } catch (err) {
        console.error("sendMessage error:", err)
        next(err)
    }
}


module.exports = {
    getMessages,
    sendMessage
}