const express = require("express");
const router = express.Router();

const requireAdmin = require("../middleware/adminAuth");
const controller = require("../controllers/adminCompletedController");

/* ================= VIEWS ================= */
router.get("/", requireAdmin, controller.renderListPage);
router.get("/view", requireAdmin, controller.renderViewPage);

/* ================= API ================= */
router.get("/api/list", requireAdmin, controller.getCompletedList);
router.get("/api/:reference", requireAdmin, controller.getCompletedSingle);

module.exports = router;