const express = require("express");
const router = express.Router();

/* ===================================================== */
/* ================= LOGOUT PAGE ======================== */
/* ===================================================== */

router.get("/logout", (req, res) => {

    /* Destroy session */
    req.session.destroy(err => {
        if (err) {
            console.error(err);
        }

        /* Clear cookie */
        res.clearCookie("expert_sid");

        /* Render logout page */
        res.render("expert-logout");
    });

});

module.exports = router;