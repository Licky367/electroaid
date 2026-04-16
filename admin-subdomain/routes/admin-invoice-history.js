const express = require("express");
const router = express.Router();

const requireAdmin = require("../middleware/adminAuth");
const controller = require("../controllers/adminInvoiceHistoryController");

/* ================= PAGE ================= */
router.get("/invoice-history", requireAdmin, controller.page);

/* ================= API ================= */

/* Load invoice by date */
router.get("/api/invoice/by-date", requireAdmin, controller.getByDate);

/* Load invoice by week */
router.get("/api/invoice", requireAdmin, controller.getByWeek);

/* Load history */
router.get("/api/invoice/history", requireAdmin, controller.getHistory);

/* Download PDF */
router.get("/api/invoice/download", requireAdmin, controller.downloadPDF);

module.exports = router;