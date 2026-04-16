const express = require("express");
const router = express.Router();

const requireAdmin = require("../middleware/adminAuth");

const {
    getPendingAssignments,
    getSingleAssignment,
    declineAssignment
} = require("../controllers/adminPendingController");

/* ================= LIST ================= */
router.get("/", requireAdmin, getPendingAssignments);

/* ================= SINGLE VIEW ================= */
router.get("/view/:reference", requireAdmin, getSingleAssignment);

/* ================= DECLINE ================= */
router.post("/:reference/decline", requireAdmin, declineAssignment);

module.exports = router;