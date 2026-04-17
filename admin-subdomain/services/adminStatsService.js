const { Payment, Assignment } = require("../../models");

/* ============================= */
/* DAILY STATS */
/* ============================= */

exports.fetchDailyStats = async (date) => {

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const payments = await Payment.find({
    createdAt: { $gte: start, $lte: end }
  }).sort({ createdAt: -1 });

  // get all related assignments in one query (NO JOIN)
  const references = payments.map(p => p.reference);

  const assignments = await Assignment.find({
    reference: { $in: references }
  });

  const assignmentMap = {};
  assignments.forEach(a => {
    assignmentMap[a.reference] = a;
  });

  return payments.map(p => {

    const assignment = assignmentMap[p.reference];

    const paymentStatus =
      assignment?.status === "completed"
        ? "Fully Paid"
        : "Partially Paid";

    return {
      time: new Date(p.createdAt).toLocaleTimeString("en-KE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }),
      method: p.method,
      amountUSD: Number(p.amount_USD || 0).toFixed(2),
      paymentStatus
    };
  });
};

/* ============================= */
/* MONTHLY STATS */
/* ============================= */

exports.fetchMonthlyStats = async (month, year) => {

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const payments = await Payment.find({
    createdAt: { $gte: start, $lte: end }
  }).sort({ createdAt: -1 });

  const references = payments.map(p => p.reference);

  const assignments = await Assignment.find({
    reference: { $in: references }
  });

  const assignmentMap = {};
  assignments.forEach(a => {
    assignmentMap[a.reference] = a;
  });

  const records = payments.map(p => {

    const assignment = assignmentMap[p.reference];

    const paymentStatus =
      assignment?.status === "completed"
        ? "Fully Paid"
        : "Partially Paid";

    return {
      time: new Date(p.createdAt).toLocaleString("en-KE", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }),
      method: p.method,
      amountUSD: Number(p.amount_USD || 0).toFixed(2),
      paymentStatus
    };
  });

  /* ================= ANNUAL TOTAL ================= */

  const yearlyPayments = await Payment.find({
    createdAt: {
      $gte: new Date(year, 0, 1),
      $lte: new Date(year, 11, 31, 23, 59, 59, 999)
    }
  });

  const annualTotal = yearlyPayments.reduce(
    (sum, p) => sum + Number(p.amount_USD || 0),
    0
  );

  return {
    records,
    annualTotal
  };
};