const express = require("express");
const router = express.Router();

const requireAdmin = require("../middleware/adminAuth");

const {
    getWaitingAssignments,
    getWaitingAssignmentByReference,
    declineWaitingAssignment
} = require("../controllers/adminWaitingController");

/* ================= LIST ================= */
router.get("/", requireAdmin, getWaitingAssignments);

/* ================= SINGLE VIEW ================= */
router.get("/view/:reference", requireAdmin, getWaitingAssignmentByReference);

/* ================= DECLINE ================= */
router.post("/:reference/decline", requireAdmin, declineWaitingAssignment);

module.exports = router;