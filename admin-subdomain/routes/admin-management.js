const express = require("express");
const router = express.Router();

const controller = require("../controllers/adminManagementController");

const requireAdmin = require("../middleware/adminAuth");
const requireSuperAdmin = require("../middleware/requireSuperAdmin");

/* ===== GET PAGE ===== */
router.get("/", requireAdmin, controller.getAdminManagement);

/* ===== TOGGLE ===== */
router.post("/toggle/:id",
    requireAdmin,
    requireSuperAdmin,
    controller.toggleAdmin
);

/* ===== DELETE ===== */
router.post("/delete/:id",
    requireAdmin,
    requireSuperAdmin,
    controller.deleteAdmin
);

module.exports = router;