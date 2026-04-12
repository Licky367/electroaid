const mailer = require("../utils/adminMailer");

/* ===== GET WAITING ===== */
exports.getWaitingApprovals = async () => {

  const [rows] = await db.query(`
    SELECT 
      a.reference,
      a.title,
      a.subject,
      a.dueDate,
      a.budget,
      a.payout,
      a.EXPERT_ID,
      a.EXPERT_NAME,

      ROUND(AVG(b.rating),1) AS average_rating,
      COUNT(b.rating) AS total_reviews

    FROM assignments a

    LEFT JOIN assignments b
      ON a.EXPERT_ID = b.EXPERT_ID
      AND b.rating IS NOT NULL

    WHERE a.approvalLocked = TRUE

    GROUP BY a.reference
    ORDER BY a.createdAt DESC
  `);

  return rows;
};

/* ===== COUNT ===== */
exports.getWaitingCount = async () => {

  const [[row]] = await db.query(`
    SELECT COUNT(*) AS count
    FROM assignments
    WHERE approvalLocked = TRUE
  `);

  return row.count;
};

/* ===== APPROVE ===== */
exports.approveAssignment = async (reference) => {

  const connection = await db.getConnection();

  try {

    await connection.beginTransaction();

    const [[assignment]] = await connection.query(`
      SELECT 
        a.CLIENT_NAME,
        a.EXPERT_NAME,
        a.title,

        c.CLIENT_EMAIL,
        e.EXPERT_EMAIL

      FROM assignments a
      LEFT JOIN clients c ON a.CLIENT_ID = c.CLIENT_ID
      LEFT JOIN experts e ON a.EXPERT_ID = e.EXPERT_ID

      WHERE a.reference = ?
      AND a.approvalLocked = TRUE
      LIMIT 1
    `, [reference]);

    if (!assignment) {
      await connection.rollback();
      throw new Error("NOT_FOUND");
    }

    /* UPDATE */
    await connection.query(`
      UPDATE assignments
      SET
        status = 'accepted',
        approvalLocked = FALSE,
        acceptedAt = NOW()
      WHERE reference = ?
    `, [reference]);

    await connection.commit();

    /* ===== EMAILS ===== */

    /* CLIENT */
    if (assignment.CLIENT_EMAIL) {
      await mailer.send({
        to: assignment.CLIENT_EMAIL,
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
    if (assignment.EXPERT_EMAIL) {
      await mailer.send({
        to: assignment.EXPERT_EMAIL,
        subject: "Approval Granted",
        text: `Dear ${assignment.EXPERT_NAME},

Your request to handle assignment "${assignment.title}" (Ref: ${reference}) has been approved.

Login:
${process.env.EXPERT_URL}

Regards,
${process.env.EMAIL_FROM_NAME}`
      });
    }

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

/* ===== REJECT ===== */
exports.rejectAssignment = async (reference) => {

  const connection = await db.getConnection();

  try {

    await connection.beginTransaction();

    const [[assignment]] = await connection.query(`
      SELECT 
        a.EXPERT_NAME,
        a.title,
        e.EXPERT_EMAIL

      FROM assignments a
      LEFT JOIN experts e ON a.EXPERT_ID = e.EXPERT_ID

      WHERE a.reference = ?
      AND a.approvalLocked = TRUE
      LIMIT 1
    `, [reference]);

    if (!assignment) {
      await connection.rollback();
      throw new Error("NOT_FOUND");
    }

    /* RESET */
    await connection.query(`
      UPDATE assignments
      SET
        status = 'pending',
        approvalLocked = FALSE,
        EXPERT_ID = NULL,
        EXPERT_NAME = NULL
      WHERE reference = ?
    `, [reference]);

    await connection.commit();

    /* EMAIL */
    if (assignment.EXPERT_EMAIL) {
      await mailer.send({
        to: assignment.EXPERT_EMAIL,
        subject: "Approval Declined",
        text: `Dear ${assignment.EXPERT_NAME},

Your request to handle assignment "${assignment.title}" (Ref: ${reference}) has been declined.

The assignment is now available again.

Regards,
${process.env.EMAIL_FROM_NAME}`
      });
    }

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};