const express = require("express");
const router = express.Router();
const csrf = require("csurf");

const acceptedController = require("../controllers/acceptedController");
const requireClient = require("../middleware/requireClient");

const csrfProtection = csrf();

// =============================
// VIEW: ACCEPTED LIST
// =============================
router.get("/", requireClient, acceptedController.getAcceptedList);

// =============================
// API: FETCH ACCEPTED ASSIGNMENTS
// =============================
router.get("/api/accepted-assignments", requireClient, acceptedController.apiAcceptedAssignments);

// =============================
// VIEW: INITIATE ASSIGNMENT
// =============================
router.get("/initiate", requireClient, csrfProtection, acceptedController.getInitiatePage);

// =============================
// API: CONFIRM PAY AFTER
// =============================
router.post("/api/confirm-payment", requireClient, acceptedController.postConfirmPayment);

module.exports = router;