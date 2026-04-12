module.exports = (io) => {

    io.on("connection", (socket) => {

        const session = socket.request.session

        if (!session || !session.clientId) return

        const clientId = session.clientId

        socket.join(`client_${clientId}`)

        /* JOIN */
        socket.on("joinClientRoom", () => {
            socket.join(`client_${clientId}`)
        })

        /* TYPING */
        socket.on("typing", () => {
            socket.to(`client_${clientId}`).emit("typing", {
                sender: "client"
            })
        })

        socket.on("stopTyping", () => {
            socket.to(`client_${clientId}`).emit("stopTyping")
        })

        /* READ RECEIPT */
        socket.on("readMessages", () => {
            socket.to(`client_${clientId}`).emit("messagesRead")
        })

    })
}