/* ================= USERS ================= */

exports.getChatUsers = async () => {
    const [rows] = await db.query(`
        SELECT 
            c.id AS clientId,
            c.CLIENT_NAME AS clientName,
            c.CLIENT_EMAIL AS clientEmail,

            (
                SELECT COUNT(*) 
                FROM messages m 
                WHERE m.clientId = c.id 
                AND m.senderRole = 'client' 
                AND m.isRead = 0
            ) AS unreadCount,

            (
                SELECT MAX(createdAt) 
                FROM messages m 
                WHERE m.clientId = c.id
            ) AS lastMessageAt

        FROM clients c
        WHERE EXISTS (
            SELECT 1 FROM messages m WHERE m.clientId = c.id
        )
        ORDER BY lastMessageAt DESC
    `);

    return rows;
};

/* ================= MESSAGES ================= */

exports.getMessagesByClient = async (clientId) => {

    // mark client messages as read
    await db.query(`
        UPDATE messages
        SET isRead = 1,
            seenAt = NOW()
        WHERE clientId = ?
        AND senderRole = 'client'
    `, [clientId]);

    const [rows] = await db.query(`
        SELECT * FROM messages
        WHERE clientId = ?
        ORDER BY createdAt ASC
    `, [clientId]);

    return rows;
};

/* ================= SEND ================= */

exports.sendMessage = async (clientId, message, file = null) => {

    let fileUrl = null;
    let fileName = null;

    if (file) {
        fileUrl = "uploads/chat/" + file.filename;
        fileName = file.originalname;
    }

    const [result] = await db.query(`
        INSERT INTO messages 
        (clientId, message, senderRole, isRead, fileUrl, fileName, createdAt)
        VALUES (?, ?, 'admin', 1, ?, ?, NOW())
    `, [clientId, message || "", fileUrl, fileName]);

    return result.insertId;
};

/* ================= DELETE ================= */

exports.deleteMessage = async (id) => {
    await db.query(`DELETE FROM messages WHERE id = ?`, [id]);
};