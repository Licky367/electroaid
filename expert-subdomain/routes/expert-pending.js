const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

/* ✅ MODELS */
const { Assignment, AssignmentFile, Expert } = require("../../models");

/* ================= MAIL ================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ================= AUTH ================= */
function requireExpert(req, res, next){
  if(!req.session.expert){
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

/* ================= VIEWS ================= */

router.get("/", requireExpert, (req, res) => {
  res.render("expert-pending", {
    EXPERT_NAME: req.session.expert.name
  });
});

router.get("/view", requireExpert, (req, res) => {
  res.render("expert-assignment-view", {
    EXPERT_NAME: req.session.expert.name
  });
});

/* ================= API ================= */

/* GET PENDING ASSIGNMENTS */
router.get("/api/pending-assignments", requireExpert, async (req, res) => {
  try {

    const assignments = await Assignment.find({ status: "pending" })
      .select("reference title CLIENT_NAME dueDate payout approvalLocked")
      .sort({ createdAt: -1 });

    res.json(assignments);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* GET SINGLE ASSIGNMENT */
router.get("/api/assignment/:reference", requireExpert, async (req, res) => {
  try {

    const { reference } = req.params;

    const assignment = await Assignment.findOne({ reference });

    if (!assignment) {
      return res.status(404).json({ message: "Not found" });
    }

    const files = await AssignmentFile.find({ reference })
      .select("fileUrl fileName");

    const result = assignment.toObject();
    result.files = files.map(f => ({
      url: f.fileUrl,
      name: f.fileName
    }));

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ACCEPT ASSIGNMENT */
router.post("/api/assignment/:reference/accept", requireExpert, async (req, res) => {

  const session = await mongoose.startSession();
  session.startTransaction();

  try {

    const { reference } = req.params;

    const expertId = req.session.expert.id;
    const expertName = req.session.expert.name;
    const expertStatus = req.session.expert.status;

    /* ================= GET ASSIGNMENT ================= */
    const assignment = await Assignment.findOne({ reference }).session(session);

    if (!assignment) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Not found" });
    }

    if (assignment.approvalLocked) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Awaiting admin approval" });
    }

    if (assignment.status !== "pending") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Already taken" });
    }

    /* ================= SUSPENDED EXPERT ================= */
    if (expertStatus === "suspended") {

      assignment.approvalLocked = true;
      await assignment.save({ session });

      /* 🔥 EMAIL ADMIN INSTEAD OF NOTIFICATION */
      const adminEmail = process.env.ADMIN_EMAIL;

      if (adminEmail) {
        await transporter.sendMail({
          from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
          to: adminEmail,
          subject: "Approval Required",
          text: `
Suspended expert ${expertName} requested approval.

Assignment Reference: ${reference}
          `
        });
      }

      await session.commitTransaction();

      return res.json({
        message: "Approval request sent"
      });
    }

    /* ================= NORMAL ACCEPT ================= */
    const updated = await Assignment.findOneAndUpdate(
      {
        reference,
        status: "pending",
        approvalLocked: false
      },
      {
        status: "accepted",
        EXPERT_ID: expertId,
        EXPERT_NAME: expertName,
        acceptedAt: new Date()
      },
      { new: true, session }
    );

    if (!updated) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Already taken or locked" });
    }

    /* ================= EMAIL CLIENT ================= */
    if (updated.CLIENT_EMAIL) {
      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
        to: updated.CLIENT_EMAIL,
        subject: "Assignment Accepted",
        text: `
Dear ${updated.CLIENT_NAME},

Your assignment titled "${updated.title}" (Ref: ${reference}) has been accepted by ${expertName}.

Please log in to your dashboard to proceed.

Regards,
${process.env.EMAIL_FROM_NAME}
        `
      });
    }

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Assignment accepted"
    });

  } catch (err) {

    await session.abortTransaction();
    console.error(err);
    res.status(500).json({ message: "Server error" });

  } finally {
    session.endSession();
  }
});

module.exports = router;