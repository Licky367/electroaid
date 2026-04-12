const express = require("express");
const router = express.Router();

const csrf = require("csurf");
const csrfProtection = csrf();

/* ✅ IMPORT CLEAN LAYERS */
const requireSuperAdmin = require("../middleware/requireSuperAdmin");
const createController = require("../controllers/createController");

/* ================= ROUTES ================= */

router.get(
    "/",
    csrfProtection,
    requireSuperAdmin,
    createController.renderCreatePage
);

router.post(
    "/create-admin",
    csrfProtection,
    requireSuperAdmin,
    createController.createAdminInvite
);

router.put(
    "/update-admin-role",
    csrfProtection,
    requireSuperAdmin,
    createController.updateAdminRole
);

module.exports = router;