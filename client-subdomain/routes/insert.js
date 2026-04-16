const express = require("express");
const router = express.Router();

/* ✅ USE CENTRALIZED AUTH */
const { requireClient } = require("../middleware/clientAuth");

/* ===============================
ROUTE: INSERT DASHBOARD
=============================== */
router.get("/", requireClient, (req, res) => {
    res.render("insert");
});

/* ===============================
ROUTE: ASSIGNMENT TYPES
=============================== */
router.get("/academic", requireClient, (req, res) => {
    res.render("academic");
});

router.get("/article", requireClient, (req, res) => {
    res.render("article");
});

router.get("/coding", requireClient, (req, res) => {
    res.render("coding");
});

module.exports = router;