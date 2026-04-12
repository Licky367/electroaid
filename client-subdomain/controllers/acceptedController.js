const acceptedService = require("../services/acceptedService");

// =============================
// VIEW: ACCEPTED LIST
// =============================
exports.getAcceptedList = async (req, res) => {
    try {
        const CLIENT_ID = req.session.CLIENT_ID;
        const assignments = await acceptedService.getAcceptedAssignments(CLIENT_ID);

        res.render("accepted", {
            assignments,
            CLIENT_NAME: req.session.CLIENT_NAME || "Client"
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};

// =============================
// API: FETCH ACCEPTED ASSIGNMENTS
// =============================
exports.apiAcceptedAssignments = async (req, res) => {
    try {
        const CLIENT_ID = req.session.CLIENT_ID;
        const assignments = await acceptedService.getAcceptedAssignments(CLIENT_ID);
        res.json(assignments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// =============================
// VIEW: INITIATE ASSIGNMENT
// =============================
exports.getInitiatePage = async (req, res) => {
    try {
        const CLIENT_ID = req.session.CLIENT_ID;
        const reference = req.query.ref;

        const pageData = await acceptedService.getInitiateAssignmentData(CLIENT_ID, req.session.CLIENT_EMAIL, reference);

        if (!pageData) return res.redirect("/assignments/accepted");

        res.render("initiate", {
            ...pageData,
            CLIENT_NAME: req.session.CLIENT_NAME || "Client",
            csrfToken: req.csrfToken()
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};

// =============================
// API: CONFIRM PAY AFTER
// =============================
exports.postConfirmPayment = async (req, res) => {
    try {
        const CLIENT_ID = req.session.CLIENT_ID;
        const CLIENT_EMAIL = req.session.CLIENT_EMAIL;
        const { reference, type } = req.body;

        const result = await acceptedService.confirmPayAfter(CLIENT_ID, CLIENT_EMAIL, reference, type);

        if (!result.success) {
            return res.status(result.status || 400).json({ message: result.message });
        }

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};