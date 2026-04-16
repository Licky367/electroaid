const {
  getPayoutSettings,
  updateGlobalPayout,
  upsertGroupRule,
  upsertIndividualRule,
  getAssignmentByReference,
  updateAssignmentPayout
} = require("../services/adminPayoutManagementService");

/* ================= ACCESS CHECK ================= */
exports.checkAccess = (req, res) => {
  const role = req.session.role;

  if (!role || !["SUPER_ADMIN", "FINANCIAL_ADMIN"].includes(role)) {
    return res.status(403).end();
  }

  res.status(200).end();
};

/* ================= LOAD PAGE ================= */
exports.getPayoutPage = async (req, res) => {
  try {
    const {
      globalPercentage,
      groupRules,
      individualRules
    } = await getPayoutSettings();

    res.render("admin-payout-management", {
      globalPercentage,
      groupRules,
      individualRules,
      admin: req.session.admin
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

/* ================= GLOBAL ================= */
exports.setGlobalPayout = async (req, res) => {
  try {
    const { percentage } = req.body;

    await updateGlobalPayout(percentage);

    res.redirect("/admin/payout-management");

  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to update global payout");
  }
};

/* ================= GROUP ================= */
exports.setGroupRule = async (req, res) => {
  try {
    const { groupRange, percentage } = req.body;

    await upsertGroupRule(groupRange, percentage);

    res.redirect("/admin/payout-management");

  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to update group rule");
  }
};

/* ================= INDIVIDUAL ================= */
exports.setIndividualRule = async (req, res) => {
  try {
    const { REG_NO, percentage } = req.body;

    if (!REG_NO) {
      return res.status(400).send("Registration number required");
    }

    await upsertIndividualRule(REG_NO.trim());

    // NOTE: keep percentage passed correctly
    await upsertIndividualRule(REG_NO.trim(), percentage);

    res.redirect("/admin/payout-management");

  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to update individual rule");
  }
};

/* ================= ASSIGNMENT ================= */
exports.overrideAssignmentPayout = async (req, res) => {
  try {
    const { reference, percentage } = req.body;

    const assignment = await getAssignmentByReference(reference);

    if (!assignment) {
      return res.status(404).send("Assignment not found");
    }

    if (assignment.status === "completed") {
      return res.status(400).send("Cannot modify completed assignment");
    }

    const budget = Number(assignment.budget);

    const payout = (budget * percentage) / 100;
    const profit = budget - payout;

    await updateAssignmentPayout(reference, payout, profit);

    res.redirect("/admin/payout-management");

  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to update assignment payout");
  }
};