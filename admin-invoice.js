const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const controller = require("../controllers/adminInvoiceController");

/* ================= PAGE ================= */
router.get("/", adminAuth, controller.renderPage);

/* ================= LOAD ================= */
router.get("/api/payroll", adminAuth, controller.getPayroll);

/* ================= PAY ONE ================= */
router.post("/api/payroll/pay-expert", adminAuth, controller.payExpert);

/* ================= PAY ALL ================= */
router.post("/api/payroll/pay-all", adminAuth, controller.payAll);

/* ================= DOWNLOAD ================= */
router.post("/api/payroll/download", adminAuth, controller.downloadPayroll);

/* ================= WEBHOOK ================= */
/* From config.env → INTASEND_ADMIN_WEBHOOK_URL */
router.post("/api/mpesa/callback", controller.mpesaCallback);

module.exports = router;