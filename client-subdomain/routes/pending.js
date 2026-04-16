const express = require("express");
const router = express.Router();
const pendingController = require("../controllers/pendingController");
const requireClient = require("../middleware/requireClient");

/* ================= PAGE: LIST ================= */
router.get("/", requireClient, pendingController.renderPendingPage);

/* ================= PAGE: DETAILS ================= */
router.get("/details", requireClient, pendingController.renderPendingDetailsPage);

/* ================= API: LIST ================= */
router.get("/api/list", requireClient, pendingController.listPendingAssignments);

/* ================= API: DETAILS ================= */
router.get("/api/details", requireClient, pendingController.getAssignmentDetails);

/* ================= API: UPDATE ================= */
router.post("/api/update", requireClient, pendingController.updateAssignment);

module.exports = router;