module.exports = function checkFinancialAdmin(req, res, next) {
  const role = req.session.role;

  if (!role || !["SUPER_ADMIN", "FINANCIAL_ADMIN"].includes(role)) {
    return res.status(403).send("Access denied");
  }

  next();
};