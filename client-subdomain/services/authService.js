exports.findByEmail = async (email) => {
    const [rows] = await db.query(
        "SELECT * FROM clients WHERE CLIENT_EMAIL=?",
        [email]
    );
    return rows[0];
};

exports.createClient = async (data) => {
    return db.query(`
        INSERT INTO clients
        (CLIENT_NAME, CLIENT_EMAIL, CLIENT_PHONE_NUMBER, CLIENT_PROFILE_IMAGE, CLIENT_PASSWORD)
        VALUES (?, ?, ?, ?, ?)
    `, [
        data.CLIENT_NAME,
        data.CLIENT_EMAIL,
        data.CLIENT_PHONE_NUMBER,
        data.imagePath,
        data.hashedPassword
    ]);
};

exports.updatePassword = (id, password) => {
    return db.query(
        "UPDATE clients SET CLIENT_PASSWORD=? WHERE id=?",
        [password, id]
    );
};

exports.saveResetToken = (clientId, token, expires) => {
    return db.query(`
        INSERT INTO client_password_resets (clientId, token, expiresAt)
        VALUES (?, ?, ?)
    `, [clientId, token, expires]);
};

exports.deleteResetToken = (clientId) => {
    return db.query(
        "DELETE FROM client_password_resets WHERE clientId=?",
        [clientId]
    );
};