module.exports = function requireSuperAdmin(req, res, next) {
    if (!req.session.admin) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.session.admin.role !== "SUPER_ADMIN") {
        return res.status(403).json({ message: "Super Admin only" });
    }

    next();
};