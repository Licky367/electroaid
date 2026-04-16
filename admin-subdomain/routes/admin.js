require("dotenv").config();

const express = require("express");
const router = express.Router();

/* ===================================================== */
/* ================= AUTH MIDDLEWARE ==================== */
/* ===================================================== */

function REQUIRE_ADMIN(req, res, next){
    if(!req.session || !req.session.admin){
        return res.redirect("/admin/auth/login");
    }
    next();
}

/* ===================================================== */
/* ================= ADMIN HOME ========================= */
/* ===================================================== */

/*
    Route: /admin
    File: admin.ejs
*/

router.get("/", REQUIRE_ADMIN, (req, res) => {

    const ADMIN_NAME = req.session.admin.name;
    const role = req.session.admin.role;

    res.render("admin", {
        ADMIN_NAME,
        role
    });
});

/* ===================================================== */
/* ================= EXPORT ============================= */
/* ===================================================== */

module.exports = router;