/* ================= LIST ================= */
exports.fetchWaitingAssignments = async () => {

    const [rows] = await db.query(`
        SELECT 
            reference,
            title,
            CLIENT_NAME,
            EXPERT_NAME,
            dueDate,
            acceptedAt,
            status
        FROM assignments
        WHERE status = 'accepted'
        ORDER BY acceptedAt DESC
    `);

    return rows;
};

/* ================= SINGLE ================= */
exports.fetchAssignmentByReference = async (reference) => {

    const [rows] = await db.query(`
        SELECT *
        FROM assignments
        WHERE reference = ?
    `, [reference]);

    return rows[0];
};

/* ================= FILES ================= */
exports.fetchAssignmentFiles = async (reference) => {

    const [files] = await db.query(`
        SELECT 
            fileUrl AS url,
            fileName AS name
        FROM assignment_files
        WHERE reference = ?
    `, [reference]);

    return files;
};

/* ================= DECLINE ================= */
exports.declineAssignment = async (reference, adminId, reason) => {

    await db.query(`
        UPDATE assignments
        SET 
            status = 'declined',
            declinedByAdminId = ?,
            declineReason = ?,
            declinedAt = NOW()
        WHERE reference = ?
    `, [adminId, reason, reference]);

};