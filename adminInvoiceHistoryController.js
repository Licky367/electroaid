const service = require("../services/adminInvoiceHistoryService");

/* ================= PAGE ================= */
exports.page = (req, res) => {
    res.render("admin-invoice-history");
};

/* ================= BY DATE ================= */
exports.getByDate = async (req, res) => {
    try {
        const { date, regNo } = req.query;

        if (!date || !regNo) {
            return res.status(400).json({ message: "date and regNo required" });
        }

        const data = await service.getInvoiceByDate(date, regNo);

        if (!data) {
            return res.status(404).json({ message: "Expert not found" });
        }

        res.json(data);

    } catch (err) {
        console.error("BY DATE ERROR:", err.message);
        res.status(500).json({ message: "Server error" });
    }
};

/* ================= BY WEEK ================= */
exports.getByWeek = async (req, res) => {
    try {
        const { week, regNo } = req.query;

        if (!week || !regNo) {
            return res.status(400).json({ message: "week and regNo required" });
        }

        const data = await service.getInvoiceByWeek(week, regNo);

        if (!data) {
            return res.status(404).json({ message: "Expert not found" });
        }

        res.json(data);

    } catch (err) {
        console.error("BY WEEK ERROR:", err.message);
        res.status(500).json({ message: "Server error" });
    }
};

/* ================= HISTORY ================= */
exports.getHistory = async (req, res) => {
    try {
        const { regNo } = req.query;

        if (!regNo) {
            return res.status(400).json({ message: "regNo required" });
        }

        const history = await service.getHistory(regNo);

        res.json({ history });

    } catch (err) {
        console.error("HISTORY ERROR:", err.message);
        res.status(500).json({ message: "Server error" });
    }
};

/* ================= PDF ================= */
exports.downloadPDF = async (req, res) => {
    try {
        const { week, regNo } = req.query;

        if (!week || !regNo) {
            return res.status(400).send("week and regNo required");
        }

        const pdfBuffer = await service.generatePDF(week, regNo);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=invoice-${week}.pdf`);
        res.send(pdfBuffer);

    } catch (err) {
        console.error("PDF ERROR:", err.message);
        res.status(500).send("PDF generation failed");
    }
};