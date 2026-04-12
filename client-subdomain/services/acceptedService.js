// =============================
// GET ACCEPTED ASSIGNMENTS
// =============================
exports.getAcceptedAssignments = async (CLIENT_ID) => {
    const [rows] = await db.query(
        `SELECT reference, title, deadline, EXPERT_NAME
         FROM assignments
         WHERE CLIENT_ID=? AND status='accepted'
         ORDER BY deadline ASC`,
        [CLIENT_ID]
    );
    return rows;
};

// =============================
// GET INITIATE ASSIGNMENT DATA
// =============================
exports.getInitiateAssignmentData = async (CLIENT_ID, CLIENT_EMAIL, reference) => {
    if (!reference) return null;

    const [rows] = await db.query(
        `SELECT reference, title, budget, deadline, status
         FROM assignments
         WHERE reference=? AND CLIENT_ID=?`,
        [reference, CLIENT_ID]
    );

    if (!rows.length || rows[0].status !== "accepted") return null;

    const assignment = rows[0];

    // === DEPOSIT SETTINGS ===
    const [settingsRows] = await db.query(
        `SELECT depositPercentage, payAfterGlobal FROM payment_settings LIMIT 1`
    );

    const depositPercentage = settingsRows.length ? settingsRows[0].depositPercentage : 30;
    const depositAmount = (assignment.budget * depositPercentage / 100).toFixed(2);
    let payAfterAllowed = settingsRows.length ? !!settingsRows[0].payAfterGlobal : false;

    // === PAY AFTER CHECKS ===
    if (!payAfterAllowed) {
        const [assignmentUnlock] = await db.query(
            `SELECT id FROM pay_after_assignments WHERE reference=?`,
            [reference]
        );
        if (assignmentUnlock.length) payAfterAllowed = true;
    }

    if (!payAfterAllowed) {
        const [clientUnlock] = await db.query(
            `SELECT id FROM pay_after_clients WHERE clientEmail=?`,
            [CLIENT_EMAIL]
        );
        if (clientUnlock.length) payAfterAllowed = true;
    }

    if (!payAfterAllowed) {
        const [rules] = await db.query(
            `SELECT assignmentCountThreshold FROM pay_after_rules ORDER BY id DESC LIMIT 1`
        );
        if (rules.length) {
            const threshold = rules[0].assignmentCountThreshold;
            const [completed] = await db.query(
                `SELECT COUNT(*) as total FROM assignments WHERE CLIENT_ID=? AND status='completed'`,
                [CLIENT_ID]
            );
            if (completed[0].total >= threshold) payAfterAllowed = true;
        }
    }

    return {
        reference: assignment.reference,
        title: assignment.title,
        budget: assignment.budget,
        deadline: assignment.deadline,
        depositPercentage,
        depositAmount,
        payAfterServiceUnlocked: payAfterAllowed
    };
};

// =============================
// CONFIRM PAY AFTER
// =============================
exports.confirmPayAfter = async (CLIENT_ID, CLIENT_EMAIL, reference, type) => {
    if (type !== "after") {
        return { success: false, status: 400, message: "Invalid request" };
    }

    const [rows] = await db.query(
        `SELECT status, deadline FROM assignments WHERE reference=? AND CLIENT_ID=?`,
        [reference, CLIENT_ID]
    );

    if (!rows.length || rows[0].status !== "accepted") {
        return { success: false, status: 404, message: "Assignment not found" };
    }

    const assignment = rows[0];

    if (new Date() > new Date(assignment.deadline)) {
        return { success: false, status: 400, message: "Assignment initiation time expired" };
    }

    // === PAY AFTER LOGIC (SAME AS INITIATE PAGE) ===
    let payAfterAllowed = false;

    const [globalRow] = await db.query(`SELECT payAfterGlobal FROM payment_settings LIMIT 1`);
    if (globalRow.length && globalRow[0].payAfterGlobal) payAfterAllowed = true;

    if (!payAfterAllowed) {
        const [assignmentUnlock] = await db.query(
            `SELECT id FROM pay_after_assignments WHERE reference=?`,
            [reference]
        );
        if (assignmentUnlock.length) payAfterAllowed = true;
    }

    if (!payAfterAllowed) {
        const [clientUnlock] = await db.query(
            `SELECT id FROM pay_after_clients WHERE clientEmail=?`,
            [CLIENT_EMAIL]
        );
        if (clientUnlock.length) payAfterAllowed = true;
    }

    if (!payAfterAllowed) {
        const [rules] = await db.query(
            `SELECT assignmentCountThreshold FROM pay_after_rules ORDER BY id DESC LIMIT 1`
        );
        if (rules.length) {
            const threshold = rules[0].assignmentCountThreshold;
            const [completed] = await db.query(
                `SELECT COUNT(*) as total FROM assignments WHERE CLIENT_ID=? AND status='completed'`,
                [CLIENT_ID]
            );
            if (completed[0].total >= threshold) payAfterAllowed = true;
        }
    }

    if (!payAfterAllowed) {
        return { success: false, status: 403, message: "Pay after service not allowed" };
    }

    // === UPDATE STATUS ===
    await db.query(
        `UPDATE assignments SET status='In Progress' WHERE reference=? AND CLIENT_ID=?`,
        [reference, CLIENT_ID]
    );

    return { success: true };
};