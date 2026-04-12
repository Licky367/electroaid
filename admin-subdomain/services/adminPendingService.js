/* ================= LIST ================= */
exports.fetchPendingAssignments = async () => {
    const [rows] = await db.query(`
        SELECT 
            reference,
            title,
            CLIENT_NAME,
            dueDate,
            budget,
            payout,
            profit,
            status
        FROM assignments
        WHERE status = 'pending'
        ORDER BY createdAt DESC
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

    return rows[0] || null;
};

/* ================= FILES ================= */
exports.fetchAssignmentFiles = async (reference) => {
    const [rows] = await db.query(`
        SELECT 
            fileUrl AS url,
            fileName AS name
        FROM assignment_files
        WHERE reference = ?
    `, [reference]);

    return rows;
};

/* ================= DECLINE ================= */
exports.updateDeclineAssignment = async (reference, adminId, reason) => {
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