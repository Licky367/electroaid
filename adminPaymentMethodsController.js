const {
  getSettings,
  setDepositPercentage,
  setGlobalPayAfter,
  addClientPayAfter,
  addAssignmentPayAfter,
  addAssignmentRule
} = require("../services/adminPaymentMethodsService");

/* ================= GET PAGE ================= */
exports.getPaymentMethodsPage = async (req, res) => {
  try {
    const settings = await getSettings();

    res.render("admin-payment-methods", {
      csrfToken: req.csrfToken(),
      settings,
      admin: req.session.admin
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

/* ================= UPDATE DEPOSIT ================= */
exports.updateDeposit = async (req, res) => {
  try {
    const { depositPercentage } = req.body;

    if (depositPercentage < 0 || depositPercentage > 100) {
      return res.status(400).send("Invalid percentage");
    }

    await setDepositPercentage(depositPercentage);

    res.redirect("/admin/payment-methods");

  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to update deposit");
  }
};

/* ================= GLOBAL ================= */
exports.updateGlobalPayAfter = async (req, res) => {
  try {
    const enabled = req.body.unlockGlobal === "on";

    await setGlobalPayAfter(enabled);

    res.redirect("/admin/payment-methods");

  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to update setting");
  }
};

/* ================= CLIENT ================= */
exports.unlockClientPayAfter = async (req, res) => {
  try {
    const { CLIENT_EMAIL } = req.body;

    if (!CLIENT_EMAIL) {
      return res.status(400).send("Email required");
    }

    await addClientPayAfter(CLIENT_EMAIL.trim().toLowerCase());

    res.redirect("/admin/payment-methods");

  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to unlock client");
  }
};

/* ================= ASSIGNMENT ================= */
exports.unlockAssignmentPayAfter = async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).send("Reference required");
    }

    await addAssignmentPayAfter(reference);

    res.redirect("/admin/payment-methods");

  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to unlock assignment");
  }
};

/* ================= COUNT RULE ================= */
exports.setAssignmentRule = async (req, res) => {
  try {
    const { assignmentCountThreshold } = req.body;

    if (!assignmentCountThreshold || assignmentCountThreshold < 0) {
      return res.status(400).send("Invalid count");
    }

    await addAssignmentRule(assignmentCountThreshold);

    res.redirect("/admin/payment-methods");

  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to update rule");
  }
};