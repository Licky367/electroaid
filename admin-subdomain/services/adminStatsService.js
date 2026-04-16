/* ============================= */
/* DAILY STATS */
/* ============================= */

exports.fetchDailyStats = async (date) => {

  const [rows] = await db.query(`
    SELECT 
      p.method,
      p.amountUSD,
      p.createdAt,
      a.status
    FROM payments p
    JOIN assignments a 
      ON p.reference = a.reference
    WHERE DATE(p.createdAt) = ?
    ORDER BY p.createdAt DESC
  `, [date]);

  return rows.map(r => {
    const paymentStatus =
      r.status === "completed"
        ? "Fully Paid"
        : "Partially Paid";

    return {
      time: new Date(r.createdAt)
        .toLocaleTimeString("en-KE", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }),
      method: r.method,
      amountUSD: parseFloat(r.amountUSD).toFixed(2),
      paymentStatus
    };
  });
};

/* ============================= */
/* MONTHLY STATS */
/* ============================= */

exports.fetchMonthlyStats = async (month, year) => {

  const [rows] = await db.query(`
    SELECT 
      p.method,
      p.amountUSD,
      p.createdAt,
      a.status
    FROM payments p
    JOIN assignments a 
      ON p.reference = a.reference
    WHERE MONTH(p.createdAt) = ?
    AND YEAR(p.createdAt) = ?
    ORDER BY p.createdAt DESC
  `, [month, year]);

  const [annualRows] = await db.query(`
    SELECT SUM(amountUSD) as total
    FROM payments
    WHERE YEAR(createdAt) = ?
  `, [year]);

  const records = rows.map(r => {
    const paymentStatus =
      r.status === "completed"
        ? "Fully Paid"
        : "Partially Paid";

    return {
      time: new Date(r.createdAt)
        .toLocaleString("en-KE", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }),
      method: r.method,
      amountUSD: parseFloat(r.amountUSD).toFixed(2),
      paymentStatus
    };
  });

  return {
    records,
    annualTotal: annualRows[0].total || 0
  };
};