const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");

const {
  getStatsPage,
  getDailyStats,
  getMonthlyStats
} = require("../controllers/adminStatsController");

/* ============================= */
/* ROUTES */
/* ============================= */

router.get("/", adminAuth, getStatsPage);

router.get("/api/admin/payment-stats/daily", adminAuth, getDailyStats);

router.get("/api/admin/payment-stats/monthly", adminAuth, getMonthlyStats);

module.exports = router;