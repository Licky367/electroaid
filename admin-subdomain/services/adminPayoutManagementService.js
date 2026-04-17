const {
  PaymentSetting,
  PayoutGroupRule,
  PayoutIndividualRule,
  Assignment
} = require("../models");

/* ================= LOAD ALL ================= */
exports.getPayoutSettings = async () => {

  const settings = await PaymentSetting.findOne();

  const groupRules = await PayoutGroupRule.find()
    .select("groupRange percentage -_id");

  const individualRules = await PayoutIndividualRule.find()
    .select("REG_NO percentage -_id");

  return {
    globalPercentage: settings
      ? settings.payoutPercentage
      : null,
    groupRules,
    individualRules
  };
};

/* ================= GLOBAL ================= */
exports.updateGlobalPayout = async (percentage) => {

  await PaymentSetting.updateOne(
    {},
    { $set: { payoutPercentage: percentage } },
    { upsert: true } // ensures record exists
  );
};

/* ================= GROUP ================= */
exports.upsertGroupRule = async (groupRange, percentage) => {

  await PayoutGroupRule.updateOne(
    { groupRange },
    { $set: { percentage } },
    { upsert: true }
  );
};

/* ================= INDIVIDUAL ================= */
exports.upsertIndividualRule = async (expertReg, percentage) => {

  await PayoutIndividualRule.updateOne(
    { REG_NO: expertReg },
    { $set: { percentage } },
    { upsert: true }
  );
};

/* ================= ASSIGNMENT ================= */
exports.getAssignmentByReference = async (reference) => {

  const assignment = await Assignment.findOne({ reference })
    .select("budget status");

  return assignment || null;
};

exports.updateAssignmentPayout = async (reference, payout, profit) => {

  await Assignment.updateOne(
    { reference },
    {
      $set: {
        payout,
        profit // ⚠️ kept for compatibility
      }
    }
  );
};