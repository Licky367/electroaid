const {
  fetchDailyStats,
  fetchMonthlyStats
} = require("../services/adminStatsService");

/* ============================= */
/* LOAD PAGE */
/* ============================= */

exports.getStatsPage = (req, res) => {
  res.render("admin-stats", {
    admin: req.session.admin
  });
};

/* ============================= */
/* DAILY STATS */
/* ============================= */

exports.getDailyStats = async (req, res) => {
  try {
    const { date } = req.query;

    const records = await fetchDailyStats(date);

    res.json({ records });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load daily stats" });
  }
};

/* ============================= */
/* MONTHLY STATS */
/* ============================= */

exports.getMonthlyStats = async (req, res) => {
  try {
    const { month, year } = req.query;

    const { records, annualTotal } = await fetchMonthlyStats(month, year);

    res.json({
      records,
      annualTotal
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load monthly stats" });
  }
};