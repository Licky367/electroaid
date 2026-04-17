const {
  PaymentSetting,
  PayAfterClient,
  PayAfterAssignment,
  PayAfterRule
} = require("../models");

/* ================= GET SETTINGS ================= */
exports.getSettings = async () => {

  const settings = await PaymentSetting.findOne();

  return {
    deposit: {
      percentage: settings?.depositPercentage ?? 30
    },
    payAfter: {
      global: settings?.payAfterGlobal ?? false
    }
  };
};

/* ================= DEPOSIT ================= */
exports.setDepositPercentage = async (percentage) => {

  await PaymentSetting.updateOne(
    {},
    { $set: { depositPercentage: percentage } },
    { upsert: true }
  );
};

/* ================= GLOBAL ================= */
exports.setGlobalPayAfter = async (enabled) => {

  await PaymentSetting.updateOne(
    {},
    { $set: { payAfterGlobal: enabled } },
    { upsert: true }
  );
};

/* ================= CLIENT ================= */
exports.addClientPayAfter = async (email) => {

  await PayAfterClient.updateOne(
    { CLIENT_EMAIL: email },
    { $set: { CLIENT_EMAIL: email } },
    { upsert: true }
  );
};

/* ================= ASSIGNMENT ================= */
exports.addAssignmentPayAfter = async (reference) => {

  await PayAfterAssignment.updateOne(
    { reference },
    { $set: { reference } },
    { upsert: true }
  );
};

/* ================= COUNT RULE ================= */
exports.addAssignmentRule = async (count) => {

  await PayAfterRule.create({
    assignmentCountThreshold: count
  });
};