const express = require("express");
const router = express.Router();

/* ===================================================== */
/* AUTH MIDDLEWARE */
/* ===================================================== */
function requireExpertAuth(req, res, next) {
    if (!req.session.expert) {
        return res.redirect("/expert/login");
    }
    next();
}

/* ===================================================== */
/* DASHBOARD */
/* GET /expert */
/* ===================================================== */
router.get("/", requireExpertAuth, (req, res) => {
    res.render("expert", {
        expert: req.session.expert
    });
});

/* ===================================================== */
/* LOGIN PAGE */
/* GET /expert/login */
/* ===================================================== */
router.get("/login", (req, res) => {
    res.render("expert-login");
});

/* ===================================================== */
/* LOGOUT */
/* GET /expert/logout */
/* ===================================================== */
router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).send("Unable to logout");
        }
        res.redirect("/expert/login");
    });
});

module.exports = router;