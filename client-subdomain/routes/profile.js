const express = require("express");
const router = express.Router();

const profileController = require("../controllers/profileController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

/* PROFILE PAGE */
router.get("/", authMiddleware, profileController.getProfile);

/* EDIT PROFILE */
router.get("/edit", authMiddleware, profileController.getEditProfile);
router.post(
  "/edit",
  authMiddleware,
  upload.single("CLIENT_PROFILE_IMAGE"),
  profileController.updateProfile
);

/* CHANGE PASSWORD */
router.get(
  "/change-password",
  authMiddleware,
  profileController.getChangePassword
);

router.post(
  "/change-password",
  authMiddleware,
  profileController.changePassword
);

module.exports = router;