/* GET CLIENT */
exports.getClientById = async (id) => {
    const [rows] = await db.query(
        "SELECT * FROM clients WHERE id = ?",
        [id]
    );
    return rows;
};

/* UPDATE PROFILE */
exports.updateClientProfile = async (id, name, phone, image) => {
    await db.query(
        `UPDATE clients 
         SET CLIENT_NAME = ?, CLIENT_PHONE_NUMBER = ?, CLIENT_PROFILE_IMAGE = ?
         WHERE id = ?`,
        [name, phone, image, id]
    );
};

/* UPDATE PASSWORD */
exports.updatePassword = async (id, password) => {
    await db.query(
        "UPDATE clients SET CLIENT_PASSWORD = ? WHERE id = ?",
        [password, id]
    );
};