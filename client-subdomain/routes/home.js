const express = require("express");
const router = express.Router();

/* ===============================
HOME (ENTRY POINT ONLY)
=============================== */
router.get("/", async (req, res) => {
    try {
        let client = null;

        /* ✅ ONLY USE clientId FROM SESSION */
        if (req.session && req.session.clientId) {
            const [rows] = await db.query(
                "SELECT * FROM clients WHERE id = ?",
                [req.session.clientId]
            );

            if (rows.length > 0) {
                client = rows[0];
            }
        }

        res.render("home", { client });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

module.exports = router;