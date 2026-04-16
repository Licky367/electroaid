const express = require("express");
const router = express.Router();

const controller = require("../controllers/adminPendingApprovalController");
const requireAdmin = require("../middleware/adminAuth");

/* VIEW */
router.get("/", requireAdmin, controller.renderPage);

/* API */
router.get("/api/waiting-approvals", requireAdmin, controller.getWaitingApprovals);

router.get("/api/waiting-approvals-count", requireAdmin, controller.getWaitingCount);

router.post("/api/approve-assignment/:reference", requireAdmin, controller.approveAssignment);

router.post("/api/reject-assignment/:reference", requireAdmin, controller.rejectAssignment);

module.exports = router;