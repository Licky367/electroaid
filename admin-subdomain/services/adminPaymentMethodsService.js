/* ================= GET SETTINGS ================= */
exports.getSettings = async () => {
  const [rows] = await db.query(
    `SELECT depositPercentage, payAfterGlobal FROM payment_settings LIMIT 1`
  );

  return {
    deposit: {
      percentage: rows.length ? rows[0].depositPercentage : 30
    },
    payAfter: {
      global: rows.length ? rows[0].payAfterGlobal : false
    }
  };
};

/* ================= DEPOSIT ================= */
exports.setDepositPercentage = async (percentage) => {
  await db.query(
    `UPDATE payment_settings SET depositPercentage=?`,
    [percentage]
  );
};

/* ================= GLOBAL ================= */
exports.setGlobalPayAfter = async (enabled) => {
  await db.query(
    `UPDATE payment_settings SET payAfterGlobal=?`,
    [enabled]
  );
};

/* ================= CLIENT ================= */
exports.addClientPayAfter = async (email) => {
  await db.query(
    `INSERT INTO pay_after_clients (CLIENT_EMAIL)
     VALUES (?)
     ON DUPLICATE KEY UPDATE CLIENT_EMAIL=CLIENT_EMAIL`,
    [email]
  );
};

/* ================= ASSIGNMENT ================= */
exports.addAssignmentPayAfter = async (reference) => {
  await db.query(
    `INSERT INTO pay_after_assignments (reference)
     VALUES (?)
     ON DUPLICATE KEY UPDATE reference=reference`,
    [reference]
  );
};

/* ================= COUNT RULE ================= */
exports.addAssignmentRule = async (count) => {
  await db.query(
    `INSERT INTO pay_after_rules (assignmentCountThreshold)
     VALUES (?)`,
    [count]
  );
};