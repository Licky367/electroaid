const express = require("express");
const router = express.Router();

const { Client } = require("../../models");

/* ===============================
HOME (ENTRY POINT ONLY)
=============================== */
router.get("/", async (req, res) => {
    try {
        let client = null;

        /* ✅ LOGIN IS OPTIONAL */
        if (req.session && req.session.clientId) {
            const user = await Client.findById(req.session.clientId);

            if (user) {
                client = user;
            }
        }

        res.render("home", { client });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

module.exports = router;