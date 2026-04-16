const pendingService = require("../services/pendingService");

module.exports = {

    renderPendingPage: (req, res) => {
        res.render("pending", {
            CLIENT_NAME: req.session.CLIENT_NAME || null
        });
    },

    renderPendingDetailsPage: (req, res) => {
        res.render("pending-details", {
            CLIENT_NAME: req.session.CLIENT_NAME || null
        });
    },

    listPendingAssignments: async (req, res) => {
        try {
            const list = await pendingService.getPendingAssignments(req.session.CLIENT_ID);
            res.json(list);
        } catch (err) {
            console.error(err);
            res.status(500).json([]);
        }
    },

    getAssignmentDetails: async (req, res) => {
        try {
            const reference = req.query.ref;
            if (!reference) return res.status(400).json({});

            const assignment = await pendingService.getAssignmentDetails(req.session.CLIENT_ID, reference);
            if (!assignment) return res.status(404).json({});

            res.json(assignment);
        } catch (err) {
            console.error(err);
            res.status(500).json({});
        }
    },

    updateAssignment: async (req, res) => {
        try {
            const payload = req.body;
            const CLIENT_ID = req.session.CLIENT_ID;

            if (!payload.reference) return res.status(400).json({});

            await pendingService.updateAssignment(CLIENT_ID, payload);

            res.json({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({});
        }
    }

};