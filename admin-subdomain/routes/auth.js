const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { uploadAdminImage } = require("../../utils/upload");
const authValidator = require("../validators/authValidator");

/* ================= SIGNUP ================= */
router.get("/signup", authController.getSignup);
router.post(
    "/signup",
    uploadAdminImage.single("ADMIN_PROFILE_IMAGE"),
    authValidator.validateSignup,
    authController.signup
);

/* ================= LOGIN ================= */
router.get("/login", authController.getLogin);
router.post("/login", authValidator.validateLogin, authController.login);

/* ================= LOGOUT ================= */
router.get("/logout", authController.logout);

/* ================= FORGOT PASSWORD ================= */
router.get("/forgot-password", authController.getForgotPassword);
router.post("/forgot-password", authController.forgotPassword);

/* ================= RESET PASSWORD ================= */
router.get("/reset-password", authController.getResetPassword);
router.post("/reset-password", authController.resetPassword);

module.exports = router;