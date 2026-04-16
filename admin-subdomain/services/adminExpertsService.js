/* ===== GET EXPERTS ===== */
exports.getExperts = async ({ page = 1, search = "" }) => {

    const limit = 10;
    const offset = (page - 1) * limit;

    let query = `
        SELECT 
            id,
            REG_NO,
            EXPERT_NAME,
            EXPERT_EMAIL,
            status,
            createdAt
        FROM experts
    `;

    let params = [];

    if (search) {
        query += `
            WHERE 
                REG_NO LIKE ? OR
                EXPERT_NAME LIKE ? OR
                EXPERT_EMAIL LIKE ?
        `;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += `
        ORDER BY createdAt DESC
        LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const [experts] = await db.query(query, params);

    return experts;
};

/* ===== SUSPEND ===== */
exports.suspendExpert = async (id) => {
    await db.query(
        "UPDATE experts SET status='suspended' WHERE id=?",
        [id]
    );
};

/* ===== UNSUSPEND ===== */
exports.unsuspendExpert = async (id) => {
    await db.query(
        "UPDATE experts SET status='active' WHERE id=?",
        [id]
    );
};

/* ===== DELETE ===== */
exports.deleteExpert = async (id) => {
    await db.query(
        "DELETE FROM experts WHERE id=?",
        [id]
    );
};