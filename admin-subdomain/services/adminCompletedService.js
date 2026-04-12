/* ================= LIST ================= */

exports.fetchCompletedList = async () => {

    const [rows] = await db.query(`
        SELECT 
            reference,
            title,
            EXPERT_NAME,
            status
        FROM assignments
        WHERE status = 'completed'
        ORDER BY completedAt DESC
    `);

    return rows;
};

/* ================= SINGLE ================= */

exports.fetchCompletedSingle = async (reference) => {

    const [rows] = await db.query(`
        SELECT 
            a.reference,
            a.title,
            a.subject,
            a.CLIENT_NAME,
            a.completedAt,
            a.EXPERT_NAME,
            a.rating,
            a.feedback,

            e.REG_NO,
            e.EXPERT_EMAIL,
            e.EXPERT_PHONE,

            s.fileUrl,
            s.fileName

        FROM assignments a

        LEFT JOIN experts e 
        ON a.EXPERT_ID = e.id

        LEFT JOIN submissions s 
        ON a.reference = s.reference

        WHERE a.reference = ?
        AND a.status = 'completed'
    `, [reference]);

    return rows;
};