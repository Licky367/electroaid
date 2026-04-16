/* ================= COUNTS ================= */
exports.getAssignmentCounts = async () => {

    const [[pending]] = await db.query(
        `SELECT COUNT(*) AS count FROM assignments WHERE status = 'pending'`
    );

    const [[accepted]] = await db.query(
        `SELECT COUNT(*) AS count FROM assignments WHERE status = 'accepted'`
    );

    const [[inProgress]] = await db.query(
        `SELECT COUNT(*) AS count FROM assignments 
         WHERE status = 'In Progress' OR status = 'Revision Requested'`
    );

    const [[completed]] = await db.query(
        `SELECT COUNT(*) AS count FROM assignments WHERE status = 'completed'`
    );

    const [[declined]] = await db.query(
        `SELECT COUNT(*) AS count FROM assignments WHERE status = 'declined'`
    );

    return {
        pendingCount: pending.count,
        acceptedCount: accepted.count,
        inProgressCount: inProgress.count,
        completedCount: completed.count,
        declinedCount: declined.count
    };
};