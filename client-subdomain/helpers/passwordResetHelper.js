exports.getValidToken = async (token) => {
    const [rows] = await db.query(
        "SELECT * FROM client_password_resets WHERE token=? AND expiresAt > NOW()",
        [token]
    );
    return rows[0];
};