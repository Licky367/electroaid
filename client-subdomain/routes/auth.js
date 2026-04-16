const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const upload = require("../utils/upload");

/* -------- SIGNUP -------- */
router.get("/signup", authController.getSignup);
router.post("/signup", upload.single("CLIENT_PROFILE_IMAGE"), authController.postSignup);

/* -------- LOGIN -------- */
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);

/* -------- LOGOUT -------- */
router.post("/logout", authController.logout);

/* -------- FORGOT PASSWORD -------- */
router.get("/forgot-password", authController.getForgotPassword);
router.post("/forgot-password", authController.postForgotPassword);

/* -------- RESET PASSWORD -------- */
router.get("/reset-password", authController.getResetPassword);
router.post("/reset-password", authController.postResetPassword);

module.exports = router;