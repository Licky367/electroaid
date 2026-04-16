const express = require("express");
const router = express.Router();

const controller = require("../controllers/adminExpertsController");
const requireAdmin = require("../middleware/adminAuth");

/* ===== GET ===== */
router.get("/", requireAdmin, controller.getExperts);

/* ===== ACTIONS ===== */
router.post("/suspend/:id", requireAdmin, controller.suspendExpert);
router.post("/unsuspend/:id", requireAdmin, controller.unsuspendExpert);
router.post("/delete/:id", requireAdmin, controller.deleteExpert);

module.exports = router;