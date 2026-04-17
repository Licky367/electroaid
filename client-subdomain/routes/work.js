const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

const {
  Assignment,
  AssignmentFile,
  Submission,
  Expert
} = require("../models");

const { requireClient, requireClientAPI } = require("../middleware/clientAuth");

/* ================= EMAIL SETUP ================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* =========================================
   GET: WORK LIST PAGE
========================================= */
router.get("/", requireClient, async (req, res) => {
  try {
    const CLIENT_ID = req.session.client.id;

    const assignments = await Assignment.find({
      CLIENT_ID,
      status: { $in: ["In Progress", "Revision Requested"] }
    }).sort({ createdAt: -1 });

    for (const a of assignments) {
      const files = await AssignmentFile.find({
        reference: a.reference
      }).select("fileUrl fileName");

      a.files = files;

      const depositPaid = Number(a.depositPaid || 0);
      const budget = Number(a.budget || 0);

      a.arrears = budget - depositPaid;
    }

    res.render("work", {
      assignments,
      client: req.session.client
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading work page");
  }
});


/* =========================================
   GET: WORK CHAT PAGE
========================================= */
router.get("/chat", requireClient, async (req, res) => {
  try {
    const reference = req.query.ref;
    if (!reference) return res.redirect("/assignments/work");

    const assignment = await Assignment.findOne({
      reference,
      CLIENT_ID: req.session.client.id
    });

    if (!assignment) return res.redirect("/assignments/work");

    const assignmentFiles = await AssignmentFile.find({
      reference
    }).select("fileUrl fileName");

    const submissionFiles = await Submission.find({
      reference,
      type: "submission",
      fileUrl: { $ne: null }
    }).select("fileUrl fileName");

    const latestSubmission = await Submission.findOne({
      reference,
      type: "submission",
      submissionText: { $ne: null }
    }).sort({ createdAt: -1 });

    const submissionText = latestSubmission?.submissionText || "";

    const comments = await Submission.find({
      reference,
      type: "comment"
    }).sort({ createdAt: 1 }).select("submissionText isClient");

    const expertSubmitted =
      submissionFiles.length > 0 || submissionText.length > 0;

    const depositPaid = Number(assignment.depositPaid || 0);
    const budget = Number(assignment.budget || 0);
    const arrearsAmount = budget - depositPaid;
    const arrearsExist = arrearsAmount > 0;

    res.render("workchat", {
      assignment,
      assignmentFiles,
      submissionFiles,
      submissionText,
      comments,
      expertSubmitted,
      arrearsAmount,
      arrearsExist,
      client: req.session.client
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading chat");
  }
});


/* =========================================
   POST: ADD COMMENT
========================================= */
router.post("/api/comments", requireClientAPI, async (req, res) => {
  try {
    const { reference, message } = req.body;
    if (!reference || !message)
      return res.status(400).json({ error: "Invalid data" });

    await Submission.create({
      reference,
      submissionText: message,
      type: "comment",
      isClient: true
    });

    res.sendStatus(200);

  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});


/* =========================================
   POST: COMPLETE ASSIGNMENT
========================================= */
router.post("/api/complete-assignment", requireClientAPI, async (req, res) => {
  try {
    const { reference, rating, feedback } = req.body;
    if (!reference)
      return res.status(400).json({ error: "Reference required" });

    const assignment = await Assignment.findOne({
      reference,
      CLIENT_ID: req.session.client.id
    }).select("budget depositPaid");

    if (!assignment)
      return res.status(404).json({ error: "Assignment not found" });

    const subs = await Submission.find({
      reference,
      type: "submission"
    }).limit(1);

    const expertSubmitted = subs.length > 0;

    const arrearsExist =
      (Number(assignment.budget || 0) - Number(assignment.depositPaid || 0)) > 0;

    if (!expertSubmitted || arrearsExist) {
      return res.status(403).json({ error: "Action not allowed" });
    }

    await Assignment.updateOne(
      { reference },
      {
        status: "completed",
        rating: rating || null,
        feedback: feedback || null,
        completedAt: new Date()
      }
    );

    if (feedback) {
      await Submission.create({
        reference,
        submissionText: feedback,
        type: "feedback",
        isClient: true,
        rating: rating || null
      });
    }

    res.sendStatus(200);

  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});


/* =========================================
   POST: REQUEST REVISION
========================================= */
router.post("/api/request-revision", requireClientAPI, async (req, res) => {
  try {
    const { reference, request } = req.body;
    if (!reference || !request)
      return res.status(400).json({ error: "Invalid data" });

    const assignment = await Assignment.findOne({
      reference,
      CLIENT_ID: req.session.client.id
    }).select("budget depositPaid EXPERT_ID title");

    if (!assignment)
      return res.status(404).json({ error: "Assignment not found" });

    const subs = await Submission.find({
      reference,
      type: "submission"
    }).limit(1);

    const expertSubmitted = subs.length > 0;

    const arrearsExist =
      (Number(assignment.budget || 0) - Number(assignment.depositPaid || 0)) > 0;

    if (!expertSubmitted || arrearsExist) {
      return res.status(403).json({ error: "Action not allowed" });
    }

    await Assignment.updateOne(
      { reference },
      { status: "Revision Requested" }
    );

    await Submission.create({
      reference,
      submissionText: request,
      type: "revision_request",
      isClient: true
    });

    const expert = await Expert.findById(assignment.EXPERT_ID)
      .select("EXPERT_NAME EXPERT_EMAIL");

    if (!expert)
      return res.status(404).json({ error: "Expert not found" });

    const workLink = `${process.env.BASE_URL}/assignments/work/chat?ref=${reference}`;

    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to: expert.EXPERT_EMAIL,
      subject: `Revision Requested – Assignment ${reference}`,
      text: `
Hello ${expert.EXPERT_NAME},

A revision has been requested.

Reference: ${reference}
Title: ${assignment.title}

Request:
"${request}"

${workLink}

Regards,
${process.env.EMAIL_FROM_NAME}
      `
    });

    res.sendStatus(200);

  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

module.exports = router;