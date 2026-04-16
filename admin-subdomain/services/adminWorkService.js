/* ================= LIST ================= */
exports.fetchWorkAssignments = async () => {

    const [rows] = await db.query(`
        SELECT 
            reference,
            title,
            CLIENT_NAME,
            EXPERT_NAME,
            dueDate,
            status
        FROM assignments
        WHERE status IN ('In Progress','Revision Requested')
        ORDER BY dueDate ASC
    `);

    return rows;
};

/* ================= SINGLE ================= */
exports.fetchWorkAssignmentByReference = async (reference) => {

    const [rows] = await db.query(`
        SELECT 
            a.*,
            (a.budget - a.payout) AS profit
        FROM assignments a
        WHERE a.reference = ?
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