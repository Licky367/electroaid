/* ================= LOAD ALL ================= */
exports.getPayoutSettings = async () => {
  const [settings] = await db.query(
    "SELECT payoutPercentage FROM payment_settings LIMIT 1"
  );

  const [groupRules] = await db.query(
    "SELECT groupRange, percentage FROM payout_group_rules"
  );

  const [individualRules] = await db.query(
    "SELECT expertReg, percentage FROM payout_individual_rules"
  );

  return {
    globalPercentage: settings.length
      ? settings[0].payoutPercentage
      : null,
    groupRules,
    individualRules
  };
};

/* ================= GLOBAL ================= */
exports.updateGlobalPayout = async (percentage) => {
  await db.query(
    "UPDATE payment_settings SET payoutPercentage = ?",
    [percentage]
  );
};

/* ================= GROUP ================= */
exports.upsertGroupRule = async (groupRange, percentage) => {
  await db.query(`
    INSERT INTO payout_group_rules (groupRange, percentage)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE percentage = VALUES(percentage)
  `, [groupRange, percentage]);
};

/* ================= INDIVIDUAL ================= */
exports.upsertIndividualRule = async (expertReg, percentage) => {
  await db.query(`
    INSERT INTO payout_individual_rules (REG_NO, percentage)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE percentage = VALUES(percentage)
  `, [expertReg, percentage]);
};

/* ================= ASSIGNMENT ================= */
exports.getAssignmentByReference = async (reference) => {
  const [rows] = await db.query(
    "SELECT budget, status FROM assignments WHERE reference = ?",
    [reference]
  );

  return rows.length ? rows[0] : null;
};

exports.updateAssignmentPayout = async (reference, payout, profit) => {
  await db.query(`
    UPDATE assignments
    SET payout = ?, profit = ?
    WHERE reference = ?
  `, [payout, profit, reference]);
};