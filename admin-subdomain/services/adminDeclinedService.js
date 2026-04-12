/* ================= LIST ================= */
exports.getDeclinedAssignments = async () => {

    const [rows] = await db.query(`
        SELECT 
            a.reference,
            a.title,
            a.CLIENT_NAME,
            a.declinedAt,
            adm.ADMIN_NAME
        FROM assignments a
        LEFT JOIN admins adm 
            ON a.declinedByAdminId = adm.id
        WHERE a.status = 'declined'
        ORDER BY a.declinedAt DESC
    `);

    return rows;
};