const express = require("express");
const router = express.Router();

const { Assignment } = require("../../models");

/* ============================= */
/* AUTH MIDDLEWARE */
/* ============================= */
function requireClient(req, res, next) {
    if (!req.session.CLIENT_ID) {
        return res.redirect("/auth/login");
    }
    next();
}

/* ============================= */
/* GET DECLINED ASSIGNMENTS */
/* ============================= */
router.get("/", requireClient, async (req, res) => {

    try {

        const CLIENT_ID = req.session.CLIENT_ID;

        const assignments = await Assignment.find({
            CLIENT_ID,
            status: "declined"
        })
        .select("title reference declineReason declinedAt")
        .sort({ declinedAt: -1 });

        res.render("declined", {
            assignments,
            CLIENT_NAME: req.session.CLIENT_NAME
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }

});

module.exports = router;