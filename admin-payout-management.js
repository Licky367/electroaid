const express = require("express");
const router = express.Router();

const checkFinancialAdmin = require("../middleware/checkFinancialAdmin");

const {
  checkAccess,
  getPayoutPage,
  setGlobalPayout,
  setGroupRule,
  setIndividualRule,
  overrideAssignmentPayout
} = require("../controllers/adminPayoutManagementController");

/* ================= ROUTES ================= */

router.get("/check-access", checkAccess);

router.get("/", checkFinancialAdmin, getPayoutPage);

router.post("/global", checkFinancialAdmin, setGlobalPayout);

router.post("/group", checkFinancialAdmin, setGroupRule);

router.post("/individual", checkFinancialAdmin, setIndividualRule);

router.post("/assignment", checkFinancialAdmin, overrideAssignmentPayout);

module.exports = router;