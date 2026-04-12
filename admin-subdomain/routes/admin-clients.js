const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");

const {
  getClientsPage,
  deleteClient
} = require("../controllers/adminClientsController");

/* ================= ROUTES ================= */

router.get("/", adminAuth, getClientsPage);

router.post("/delete/:id", adminAuth, deleteClient);

module.exports = router;