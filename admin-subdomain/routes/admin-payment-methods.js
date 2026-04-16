const express = require("express");
const router = express.Router();

const csrf = require("csurf");
const csrfProtection = csrf();

const adminAuth = require("../middleware/adminAuth");

const {
  getPaymentMethodsPage,
  updateDeposit,
  updateGlobalPayAfter,
  unlockClientPayAfter,
  unlockAssignmentPayAfter,
  setAssignmentRule
} = require("../controllers/adminPaymentMethodsController");

/* ================= ROUTES ================= */

router.get("/", adminAuth, csrfProtection, getPaymentMethodsPage);

router.post("/deposit", adminAuth, csrfProtection, updateDeposit);

router.post("/pay-after/global", adminAuth, csrfProtection, updateGlobalPayAfter);

router.post("/pay-after/client", adminAuth, csrfProtection, unlockClientPayAfter);

router.post("/pay-after/assignment", adminAuth, csrfProtection, unlockAssignmentPayAfter);

router.post("/pay-after/count", adminAuth, csrfProtection, setAssignmentRule);

module.exports = router;