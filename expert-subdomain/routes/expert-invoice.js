const express = require("express");
const router = express.Router();

const controller = require("../controllers/expertInvoiceController");

/* ================= AUTH ================= */
function requireExpert(req, res, next){
    if(!req.session.expert){
        return res.status(401).json({ message: "Unauthorized" });
    }
    next();
}

/* ================= ROUTES ================= */

router.get("/invoice", requireExpert, controller.renderPage);

router.get("/api/invoice", requireExpert, controller.getInvoice);
router.get("/api/invoice/by-date", requireExpert, controller.getInvoiceByDate);
router.get("/api/invoice/history", requireExpert, controller.getHistory);
router.get("/api/invoice/download", requireExpert, controller.downloadInvoice);

module.exports = router;