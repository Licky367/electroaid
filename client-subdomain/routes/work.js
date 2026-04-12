// routes/work.js
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const { requireClient, requireClientAPI } = require("../middlewares/clientAuth");

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

    const [assignments] = await db.query(
      `SELECT * FROM assignments 
       WHERE CLIENT_ID = ? 
       AND status IN ('In Progress', 'Revision Requested')
       ORDER BY createdAt DESC`,
      [CLIENT_ID]
    );

    for (const a of assignments) {
      const [files] = await db.query(
        `SELECT fileUrl, fileName 
         FROM assignment_files 
         WHERE reference = ?`,
        [a.reference]
      );
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

    const [[assignment]] = await db.query(
      `SELECT * FROM assignments WHERE reference = ? AND CLIENT_ID = ?`,
      [reference, req.session.client.id]
    );

    if (!assignment) return res.redirect("/assignments/work");

    const [assignmentFiles] = await db.query(
      `SELECT fileUrl, fileName 
       FROM assignment_files 
       WHERE reference = ?`,
      [reference]
    );

    const [submissionFiles] = await db.query(
      `SELECT fileUrl, fileName 
       FROM submissions 
       WHERE reference = ? 
       AND type = 'submission'
       AND fileUrl IS NOT NULL`,
      [reference]
    );

    const [[submissionTextRow]] = await db.query(
      `SELECT submissionText 
       FROM submissions 
       WHERE reference = ? 
       AND type = 'submission'
       AND submissionText IS NOT NULL
       ORDER BY createdAt DESC LIMIT 1`,
      [reference]
    );

    const submissionText = submissionTextRow?.submissionText || "";

    const [comments] = await db.query(
      `SELECT submissionText AS message, isClient 
       FROM submissions 
       WHERE reference = ? 
       AND type = 'comment'
       ORDER BY createdAt ASC`,
      [reference]
    );

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
    if (!reference || !message) return res.status(400).json({ error: "Invalid data" });

    await db.query(
      `INSERT INTO submissions 
       (reference, submissionText, type, isClient)
       VALUES (?, ?, 'comment', TRUE)`,
      [reference, message]
    );

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
    if (!reference) return res.status(400).json({ error: "Reference required" });

    const [[assignment]] = await db.query(
      `SELECT budget, depositPaid 
       FROM assignments 
       WHERE reference = ? AND CLIENT_ID = ?`,
      [reference, req.session.client.id]
    );

    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    const [subs] = await db.query(
      `SELECT id FROM submissions 
       WHERE reference = ? AND type = 'submission' LIMIT 1`,
      [reference]
    );

    const expertSubmitted = subs.length > 0;
    const arrearsExist = (Number(assignment.budget || 0) - Number(assignment.depositPaid || 0)) > 0;

    if (!expertSubmitted || arrearsExist) {
      return res.status(403).json({ error: "Action not allowed" });
    }

    await db.query(
      `UPDATE assignments 
       SET status = 'completed', rating = ?, feedback = ?, completedAt = NOW()
       WHERE reference = ?`,
      [rating || null, feedback || null, reference]
    );

    if (feedback) {
      await db.query(
        `INSERT INTO submissions 
         (reference, submissionText, type, isClient, rating)
         VALUES (?, ?, 'feedback', TRUE, ?)`,
        [reference, feedback, rating || null]
      );
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
    if (!reference || !request) return res.status(400).json({ error: "Invalid data" });

    const [[assignment]] = await db.query(
      `SELECT budget, depositPaid, EXPERT_ID, title 
       FROM assignments 
       WHERE reference = ? AND CLIENT_ID = ?`,
      [reference, req.session.client.id]
    );

    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    const [subs] = await db.query(
      `SELECT id FROM submissions 
       WHERE reference = ? AND type = 'submission' LIMIT 1`,
      [reference]
    );

    const expertSubmitted = subs.length > 0;
    const arrearsExist = (Number(assignment.budget || 0) - Number(assignment.depositPaid || 0)) > 0;

    if (!expertSubmitted || arrearsExist) {
      return res.status(403).json({ error: "Action not allowed" });
    }

    await db.query(
      `UPDATE assignments SET status = 'Revision Requested' WHERE reference = ?`,
      [reference]
    );

    await db.query(
      `INSERT INTO submissions 
       (reference, submissionText, type, isClient)
       VALUES (?, ?, 'revision_request', TRUE)`,
      [reference, request]
    );

    const [[expert]] = await db.query(
      `SELECT EXPERT_NAME, EXPERT_EMAIL FROM experts WHERE id = ?`,
      [assignment.EXPERT_ID]
    );

    if (!expert) return res.status(404).json({ error: "Expert not found" });

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