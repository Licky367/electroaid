const express = require("express");
const router = express.Router();

const requireAdmin = require("../middleware/adminAuth");

const {
    getAssignmentsDashboard
} = require("../controllers/adminAssignmentsController");

/* ================= LOAD PAGE ================= */
/* GET /admin/assignments */
router.get("/", requireAdmin, getAssignmentsDashboard);

module.exports = router;