const assignmentService = require("../services/assignmentService");
const assignmentMailer = require("../utils/assignmentCreateMailer");

/* ================= CREATE ASSIGNMENT ================= */
exports.createAssignment = async (req, res) => {

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const CLIENT_ID = req.session.CLIENT_ID;
        const CLIENT_NAME = req.session.CLIENT_NAME;
        const CLIENT_EMAIL = req.session.CLIENT_EMAIL;

        if (!CLIENT_ID || !CLIENT_EMAIL) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        /* ================= SERVICE ================= */
        const result = await assignmentService.createAssignment(connection, {
            clientId: CLIENT_ID,
            clientName: CLIENT_NAME,
            clientEmail: CLIENT_EMAIL,
            body: req.body,
            files: req.files
        });

        /* ================= EMAIL ================= */
        await assignmentMailer.sendAssignmentCreatedEmail({
            to: CLIENT_EMAIL,
            clientName: CLIENT_NAME,
            title: result.title,
            reference: result.reference
        });

        await connection.commit();

        res.json({
            success: true,
            reference: result.reference
        });

    } catch (err) {

        await connection.rollback();
        console.error(err);

        res.status(500).json({
            message: err.message || "Server error"
        });

    } finally {
        connection.release();
    }
};