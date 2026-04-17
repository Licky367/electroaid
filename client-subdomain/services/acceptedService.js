const {
    Assignment,
    PaymentSettings,
    PayAfterAssignment,
    PayAfterClient,
    PayAfterRule
} = require("../../models");

/* ============================= */
/* GET ACCEPTED ASSIGNMENTS */
/* ============================= */
exports.getAcceptedAssignments = async (CLIENT_ID) => {

    return await Assignment.find({
        CLIENT_ID,
        status: "accepted"
    })
    .select("reference title deadline EXPERT_NAME")
    .sort({ deadline: 1 });
};


/* ============================= */
/* GET INITIATE ASSIGNMENT DATA */
/* ============================= */
exports.getInitiateAssignmentData = async (CLIENT_ID, CLIENT_EMAIL, reference) => {

    if (!reference) return null;

    const assignment = await Assignment.findOne({
        reference,
        CLIENT_ID
    }).select("reference title budget deadline status");

    if (!assignment || assignment.status !== "accepted") return null;

    /* ============================= */
    /* PAYMENT SETTINGS */
    /* ============================= */
    const settings = await PaymentSettings.findOne().lean();

    const depositPercentage = settings?.depositPercentage ?? 30;
    const depositAmount = ((assignment.budget * depositPercentage) / 100).toFixed(2);

    let payAfterAllowed = settings?.payAfterGlobal || false;

    /* ============================= */
    /* PAY AFTER CHECKS */
    /* ============================= */

    if (!payAfterAllowed) {
        const assignmentUnlock = await PayAfterAssignment.findOne({ reference });
        if (assignmentUnlock) payAfterAllowed = true;
    }

    if (!payAfterAllowed) {
        const clientUnlock = await PayAfterClient.findOne({
            clientEmail: CLIENT_EMAIL
        });
        if (clientUnlock) payAfterAllowed = true;
    }

    if (!payAfterAllowed) {
        const rule = await PayAfterRule.findOne().sort({ _id: -1 });

        if (rule) {
            const threshold = rule.assignmentCountThreshold;

            const completed = await Assignment.countDocuments({
                CLIENT_ID,
                status: "completed"
            });

            if (completed >= threshold) payAfterAllowed = true;
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


/* ============================= */
/* CONFIRM PAY AFTER */
/* ============================= */
exports.confirmPayAfter = async (CLIENT_ID, CLIENT_EMAIL, reference, type) => {

    if (type !== "after") {
        return { success: false, status: 400, message: "Invalid request" };
    }

    const assignment = await Assignment.findOne({
        reference,
        CLIENT_ID
    }).select("status deadline");

    if (!assignment || assignment.status !== "accepted") {
        return { success: false, status: 404, message: "Assignment not found" };
    }

    if (new Date() > new Date(assignment.deadline)) {
        return {
            success: false,
            status: 400,
            message: "Assignment initiation time expired"
        };
    }

    /* ============================= */
    /* PAY AFTER LOGIC */
/* ============================= */
    let payAfterAllowed = false;

    const global = await PaymentSettings.findOne().select("payAfterGlobal");

    if (global?.payAfterGlobal) {
        payAfterAllowed = true;
    }

    if (!payAfterAllowed) {
        const assignmentUnlock = await PayAfterAssignment.findOne({ reference });
        if (assignmentUnlock) payAfterAllowed = true;
    }

    if (!payAfterAllowed) {
        const clientUnlock = await PayAfterClient.findOne({
            clientEmail: CLIENT_EMAIL
        });
        if (clientUnlock) payAfterAllowed = true;
    }

    if (!payAfterAllowed) {
        const rule = await PayAfterRule.findOne().sort({ _id: -1 });

        if (rule) {
            const threshold = rule.assignmentCountThreshold;

            const completed = await Assignment.countDocuments({
                CLIENT_ID,
                status: "completed"
            });

            if (completed >= threshold) payAfterAllowed = true;
        }
    }

    if (!payAfterAllowed) {
        return {
            success: false,
            status: 403,
            message: "Pay after service not allowed"
        };
    }

    /* ============================= */
    /* UPDATE STATUS */
/* ============================= */
    await Assignment.updateOne(
        { reference, CLIENT_ID },
        { status: "In Progress" }
    );

    return { success: true };
};