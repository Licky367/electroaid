const adminAuth = (req, res, next) => {
    try {
        /* ================= SESSION CHECK ================= */

        if (!req.session || !req.session.admin) {
            return res.redirect("/admin/auth/login");
        }

        /* ================= BASIC STRUCTURE VALIDATION ================= */

        const admin = req.session.admin;

        if (!admin._id || !admin.ADMIN_EMAIL) {
            req.session.destroy(() => {
                return res.redirect("/admin/auth/login");
            });
            return;
        }

        /* ================= OPTIONAL: ROLE CHECK ================= */

        // Example if you want super-admin only routes later:
        // if (admin.role !== "super_admin") {
        //     return res.status(403).send("Access denied");
        // }

        /* ================= PASS USER ================= */

        res.locals.admin = admin; // ✅ makes admin available in EJS

        next();

    } catch (err) {
        console.error("AdminAuth Error:", err);
        return res.redirect("/admin/auth/login");
    }
};

module.exports = adminAuth;