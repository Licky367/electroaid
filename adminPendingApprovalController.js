const service = require("../services/adminPendingApprovalService");

/* ===== VIEW ===== */
exports.renderPage = (req, res) => {
  res.render("admin-pending-approval", {
    ADMIN_NAME: req.session.admin.name
  });
};

/* ===== GET ===== */
exports.getWaitingApprovals = async (req, res) => {
  try {
    const data = await service.getWaitingApprovals();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ===== COUNT ===== */
exports.getWaitingCount = async (req, res) => {
  try {
    const count = await service.getWaitingCount();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ===== APPROVE ===== */
exports.approveAssignment = async (req, res) => {
  try {
    await service.approveAssignment(req.params.reference);
    res.json({ success: true });
  } catch (err) {
    if (err.message === "NOT_FOUND") {
      return res.status(404).json({ message: "Not found or already handled" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

/* ===== REJECT ===== */
exports.rejectAssignment = async (req, res) => {
  try {
    await service.rejectAssignment(req.params.reference);
    res.json({ success: true });
  } catch (err) {
    if (err.message === "NOT_FOUND") {
      return res.status(404).json({ message: "Not found or already handled" });
    }
    res.status(500).json({ message: "Server error" });
  }
};