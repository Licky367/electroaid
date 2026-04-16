module.exports = (io) => {

    const onlineAdmins = new Set();

    io.on("connection", (socket) => {

        /* ================= ADMIN JOIN ================= */

        socket.on("joinAdmin", () => {
            onlineAdmins.add(socket.id);
        });

        socket.on("adminOnline", () => {
            socket.broadcast.emit("adminOnline");
        });

        socket.on("disconnect", () => {
            onlineAdmins.delete(socket.id);
            socket.broadcast.emit("adminOffline");
        });

        /* ================= CLIENT ROOM ================= */

        socket.on("joinClientRoom", (room) => {
            socket.join(room);
        });

        /* ================= NEW MESSAGE ================= */

        socket.on("sendMessage", ({ clientId }) => {
            io.to(`client_${clientId}`).emit("newMessage");
            io.emit("newMessage");
        });

        /* ================= TYPING ================= */

        socket.on("typing", ({ clientId }) => {
            socket.to(`client_${clientId}`).emit("typing");
        });

        socket.on("stopTyping", ({ clientId }) => {
            socket.to(`client_${clientId}`).emit("stopTyping");
        });

    });

};