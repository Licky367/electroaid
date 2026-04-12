const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const adminProfileController = require("../controllers/adminProfileController");
const upload = require("../../utils/uploads"); // ✅ FIXED
const { validateProfileUpdate } = require("../validators/adminProfileValidator");

/* ===== GET PROFILE ===== */
router.get("/", adminAuth, adminProfileController.getProfile);

/* ===== UPDATE PROFILE ===== */
router.post(
    "/update",
    adminAuth,
    upload.single("ADMIN_PROFILE_IMAGE"), // ✅ SAME AS ORIGINAL
    validateProfileUpdate,
    adminProfileController.updateProfile
);

module.exports = router;