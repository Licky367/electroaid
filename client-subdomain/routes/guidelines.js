const express = require("express");
const router = express.Router();

/* ===============================
GUIDELINES (PUBLIC)
=============================== */
router.get("/guidelines", (req, res) => {
    try {
        res.render("guidelines", {
            client: req.session.clientId || null
        });
    } catch (err) {
        console.error(err);
        res.send("Server error");
    }
});

module.exports = router;