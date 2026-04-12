const express = require("express");
const router = express.Router();

const { requireClientAPI } = require("../middleware/clientAuth");
const upload = require("../utils/uploadConfig");

const assignmentController = require("../controllers/assignmentController");

/* FINAL ROUTE */
router.post(
    "/",
    requireClientAPI,
    upload.array("files[]"),
    assignmentController.createAssignment
);

module.exports = router;