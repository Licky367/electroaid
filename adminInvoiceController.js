const service = require("../services/adminInvoiceService");
const { getWeekRange } = require("../../utils/week");

/* ================= PAGE ================= */
exports.renderPage = async (req, res) => {
    try {
        const rate = await service.getExchangeRate();
        res.render("admin-invoice", { rate });
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to load page");
    }
};

/* ================= PARSE DATE ================= */
function resolveWeek(date, res){
    const parsed = new Date(date);

    if (!date || isNaN(parsed)) {
        res.status(400).json({ message: "Invalid date" });
        return null;
    }

    return getWeekRange(parsed.toISOString().slice(0,10));
}

/* ================= LOAD ================= */
exports.getPayroll = async (req, res) => {
    try {
        const { date } = req.query;

        const range = resolveWeek(date, res);
        if (!range) return;

        const { weekStart, weekEnd } = range;

        const experts = await service.getPayroll(weekStart, weekEnd);

        res.json({ experts });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to load payroll" });
    }
};

/* ================= PAY ONE ================= */
exports.payExpert = async (req, res) => {
    try {
        const { date, regNo } = req.body;

        if (!regNo) {
            return res.status(400).json({ message: "Missing regNo" });
        }

        const range = resolveWeek(date, res);
        if (!range) return;

        const { weekStart, weekEnd } = range;

        const result = await service.initiatePayment(
            weekStart,
            weekEnd,
            regNo
        );

        res.json(result);

    } catch (err) {
        console.error(err);
        res.status(400).json({ message: err.message });
    }
};

/* ================= PAY ALL ================= */
exports.payAll = async (req, res) => {
    try {
        const { date } = req.body;

        const range = resolveWeek(date, res);
        if (!range) return;

        const { weekStart, weekEnd } = range;

        const result = await service.initiateBulkPayment(
            weekStart,
            weekEnd
        );

        res.json(result);

    } catch (err) {
        console.error(err);
        res.status(400).json({ message: err.message });
    }
};

/* ================= DOWNLOAD ================= */
exports.downloadPayroll = async (req, res) => {
    try {
        const { date } = req.body;

        const range = resolveWeek(date, res);
        if (!range) return;

        const { weekStart, weekEnd } = range;

        const file = await service.generatePayrollFile(
            weekStart,
            weekEnd
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=Payroll.csv`
        );
        res.setHeader("Content-Type", "text/csv");

        res.send(file);

    } catch (err) {
        console.error(err);
        res.status(500).send("Download failed");
    }
};

/* ================= WEBHOOK ================= */
exports.mpesaCallback = async (req, res) => {
    try {
        await service.handleIntaSendCallback(req.body);

        res.status(200).json({ received: true });

    } catch (err) {
        console.error(err);
        res.status(200).json({ received: false });
    }
};