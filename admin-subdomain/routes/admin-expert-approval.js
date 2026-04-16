const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");

const {
    getExpertApprovalPage,
    generateExpertInvite
} = require("../controllers/adminExpertApprovalController");

/* ================= ROUTES ================= */

router.get("/expert-approval", adminAuth, getExpertApprovalPage);

router.post("/expert-approval/generate", adminAuth, generateExpertInvite);

module.exports = router;