const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const adminProfileController = require("../controllers/adminProfileController");

// ✅ FIX: use named import (same as auth.js)
const { uploadAdminImage } = require("../utils/uploads");

const { validateProfileUpdate } = require("../validators/adminProfileValidator");

/* ===== GET PROFILE ===== */
router.get(
    "/",
    adminAuth,
    adminProfileController.getProfile
);

/* ===== UPDATE PROFILE ===== */
router.post(
    "/update",
    adminAuth,

    // ✅ FIXED: use uploadAdminImage instead of upload
    uploadAdminImage.single("ADMIN_PROFILE_IMAGE"),

    validateProfileUpdate,
    adminProfileController.updateProfile
);

module.exports = router;