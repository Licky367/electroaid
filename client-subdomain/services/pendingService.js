module.exports = {

    getPendingAssignments: async (CLIENT_ID) => {
        const [rows] = await db.query(
            `SELECT reference, title
             FROM assignments
             WHERE CLIENT_ID = ? AND status = 'pending'
             ORDER BY createdAt DESC`,
            [CLIENT_ID]
        );
        return rows;
    },

    getAssignmentDetails: async (CLIENT_ID, reference) => {
        const [rows] = await db.query(
            `SELECT reference, title, budget, deadline, instructions
             FROM assignments
             WHERE reference = ? AND CLIENT_ID = ?`,
            [reference, CLIENT_ID]
        );

        if (!rows.length) return null;

        const assignment = rows[0];

        const [files] = await db.query(
            `SELECT fileName, fileUrl
             FROM assignment_files
             WHERE reference = ?`,
            [reference]
        );

        assignment.files = files;
        return assignment;
    },

    updateAssignment: async (CLIENT_ID, payload) => {
        const { reference, budget, deadline, instructions, fileName, fileUrl } = payload;

        await db.query(
            `UPDATE assignments
             SET budget = ?, deadline = ?, instructions = ?
             WHERE reference = ? AND CLIENT_ID = ?`,
            [budget || null, deadline || null, instructions || null, reference, CLIENT_ID]
        );

        if (fileName && fileUrl) {
            await db.query(
                `INSERT INTO assignment_files (reference, fileName, fileUrl)
                 VALUES (?, ?, ?)`,
                [reference, fileName, fileUrl]
            );
        }
    }

};