const mailer = require("../utils/adminMailer");

const {
  Assignment,
  Client,
  Expert
} = require("../models");

/* ===== GET WAITING ===== */
exports.getWaitingApprovals = async () => {

  const assignments = await Assignment.find({
    approvalLocked: true
  })
    .sort({ createdAt: -1 });

  const expertIds = assignments
    .map(a => a.EXPERT_ID)
    .filter(Boolean);

  // get all assignments with ratings for those experts
  const ratedAssignments = await Assignment.find({
    EXPERT_ID: { $in: expertIds },
    rating: { $ne: null }
  });

  // build rating map
  const ratingMap = {};

  ratedAssignments.forEach(a => {
    if (!ratingMap[a.EXPERT_ID]) {
      ratingMap[a.EXPERT_ID] = {
        total: 0,
        count: 0
      };
    }

    ratingMap[a.EXPERT_ID].total += a.rating;
    ratingMap[a.EXERT_ID].count += 1;
  });

  return assignments.map(a => {

    const stats = ratingMap[a.EXPERT_ID] || { total: 0, count: 0 };

    const avg =
      stats.count > 0
        ? (stats.total / stats.count).toFixed(1)
        : null;

    return {
      reference: a.reference,
      title: a.title,
      subject: a.subject,
      dueDate: a.dueDate,
      budget: a.budget,
      payout: a.payout,
      EXPERT_ID: a.EXPERT_ID,
      EXPERT_NAME: a.EXPERT_NAME,
      average_rating: avg,
      total_reviews: stats.count
    };
  });
};

/* ===== COUNT ===== */
exports.getWaitingCount = async () => {

  const count = await Assignment.countDocuments({
    approvalLocked: true
  });

  return count;
};

/* ===== APPROVE ===== */
exports.approveAssignment = async (reference) => {

  const assignment = await Assignment.findOne({
    reference,
    approvalLocked: true
  });

  if (!assignment) {
    throw new Error("NOT_FOUND");
  }

  const client = assignment.CLIENT_ID
    ? await Client.findById(assignment.CLIENT_ID)
    : null;

  const expert = assignment.EXPERT_ID
    ? await Expert.findById(assignment.EXPERT_ID)
    : null;

  /* UPDATE */
  await Assignment.updateOne(
    { reference },
    {
      $set: {
        status: "accepted",
        approvalLocked: false,
        acceptedAt: new Date()
      }
    }
  );

  /* ===== EMAILS ===== */

  /* CLIENT */
  if (client?.CLIENT_EMAIL) {
    await mailer.send({
      to: client.CLIENT_EMAIL,
      subject: "Assignment Accepted",
      text: `Dear ${assignment.CLIENT_NAME},

Your assignment (Ref: ${reference}) has been assigned to ${assignment.EXPERT_NAME}.

Login:
${process.env.CLIENT_URL}

Regards,
${process.env.EMAIL_FROM_NAME}`
    });
  }

  /* EXPERT */
  if (expert?.EXPERT_EMAIL) {
    await mailer.send({
      to: expert.EXPERT_EMAIL,
      subject: "Approval Granted",
      text: `Dear ${assignment.EXPERT_NAME},

Your request to handle assignment "${assignment.title}" (Ref: ${reference}) has been approved.

Login:
${process.env.EXPERT_URL}

Regards,
${process.env.EMAIL_FROM_NAME}`
    });
  }
};

/* ===== REJECT ===== */
exports.rejectAssignment = async (reference) => {

  const assignment = await Assignment.findOne({
    reference,
    approvalLocked: true
  });

  if (!assignment) {
    throw new Error("NOT_FOUND");
  }

  const expert = assignment.EXPERT_ID
    ? await Expert.findById(assignment.EXPERT_ID)
    : null;

  /* RESET */
  await Assignment.updateOne(
    { reference },
    {
      $set: {
        status: "pending",
        approvalLocked: false,
        EXPERT_ID: null,
        EXPERT_NAME: null
      }
    }
  );

  /* EMAIL */
  if (expert?.EXPERT_EMAIL) {
    await mailer.send({
      to: expert.EXPERT_EMAIL,
      subject: "Approval Declined",
      text: `Dear ${assignment.EXPERT_NAME},

Your request to handle assignment "${assignment.title}" (Ref: ${reference}) has been declined.

The assignment is now available again.

Regards,
${process.env.EMAIL_FROM_NAME}`
    });
  }
};