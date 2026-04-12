exports.getMessages = async (clientId) => {

    const [rows] = await db.query(`
        SELECT id, message, senderRole, isRead, createdAt
        FROM messages
        WHERE clientId = ?
        ORDER BY createdAt ASC
    `, [clientId])

    return rows
}

exports.createMessage = async (clientId, message) => {

    const [result] = await db.query(`
        INSERT INTO messages (clientId, message, senderRole, isRead)
        VALUES (?, ?, 'client', 0)
    `, [clientId, message])

    const [rows] = await db.query(`
        SELECT id, message, senderRole, isRead, createdAt
        FROM messages
        WHERE id = ?
    `, [result.insertId])

    return rows[0]
}

exports.markAsRead = async (clientId) => {

    await db.query(`
        UPDATE messages
        SET isRead = 1
        WHERE clientId = ? AND senderRole = 'admin'
    `, [clientId])

}