const express = require("express");
const router = express.Router();

const { Client } = require("../../models");

/* ===============================
GUIDELINES (PUBLIC)
=============================== */
router.get("/guidelines", async (req, res) => {
    try {
        let client = null;

        /* ✅ OPTIONAL LOGIN */
        if (req.session && req.session.clientId) {
            const user = await Client.findById(req.session.clientId);

            if (user) {
                client = user;
            }
        }

        res.render("guidelines", { client });

    } catch (err) {
        console.error(err);
        res.send("Server error");
    }
});

module.exports = router;