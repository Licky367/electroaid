const express = require("express");
const router = express.Router();

const requireAdmin = require("../middleware/adminAuth");
const controller = require("../controllers/adminDeclinedController");

/* ================= LIST: DECLINED ================= */

router.get("/", requireAdmin, controller.getDeclinedAssignments);

module.exports = router;