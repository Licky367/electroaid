const express = require("express");
const router = express.Router();

const requireAdmin = require("../middleware/adminAuth");

const {
    getWorkAssignments,
    getWorkAssignmentByReference
} = require("../controllers/adminWorkController");

/* ================= LIST ================= */
router.get("/", requireAdmin, getWorkAssignments);

/* ================= SINGLE VIEW ================= */
router.get("/view/:reference", requireAdmin, getWorkAssignmentByReference);

module.exports = router;