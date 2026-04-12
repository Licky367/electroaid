const express = require("express");
const router = express.Router();
/* ================= AUTH ================= */
function requireExpert(req, res, next){
  if(!req.session.expert){
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

/* ================= VIEWS ================= */

/* MAIN PAGE */
router.get("/", requireExpert, (req, res) => {
  res.render("expert-pending", {
    EXPERT_NAME: req.session.expert.name
  });
});

/* VIEW SINGLE */
router.get("/view", requireExpert, (req, res) => {
  res.render("expert-assignment-view", {
    EXPERT_NAME: req.session.expert.name
  });
});

/* ================= API ================= */

/* GET PENDING ASSIGNMENTS */
router.get("/api/pending-assignments", requireExpert, async (req, res) => {
  try {

    const [rows] = await db.query(`
      SELECT reference, title, CLIENT_NAME, dueDate, payout, approvalLocked
      FROM assignments
      WHERE status = 'pending'
      ORDER BY createdAt DESC
    `);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* GET SINGLE ASSIGNMENT */
router.get("/api/assignment/:reference", requireExpert, async (req, res) => {
  try {

    const { reference } = req.params;

    const [rows] = await db.query(`
      SELECT *
      FROM assignments
      WHERE reference = ?
      LIMIT 1
    `, [reference]);

    if (!rows.length) {
      return res.status(404).json({ message: "Not found" });
    }

    const assignment = rows[0];

    const [files] = await db.query(`
      SELECT fileUrl AS url, fileName AS name
      FROM assignment_files
      WHERE reference = ?
    `, [reference]);

    assignment.files = files;

    res.json(assignment);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ACCEPT ASSIGNMENT */
router.post("/api/assignment/:reference/accept", requireExpert, async (req, res) => {

  const connection = await db.getConnection();

  try {

    const { reference } = req.params;

    const expertId = req.session.expert.id;
    const expertName = req.session.expert.name;
    const status = req.session.expert.status; // active | suspended

    await connection.beginTransaction();

    /* ================= CHECK STATE ================= */
    const [[current]] = await connection.query(`
      SELECT status, approvalLocked
      FROM assignments
      WHERE reference = ?
      LIMIT 1
    `, [reference]);

    if (!current) {
      await connection.rollback();
      return res.status(404).json({ message: "Not found" });
    }

    if (current.approvalLocked) {
      await connection.rollback();
      return res.status(400).json({ message: "Awaiting admin approval" });
    }

    if (current.status !== "pending") {
      await connection.rollback();
      return res.status(400).json({ message: "Already taken" });
    }

    /* ================= SUSPENDED EXPERT ================= */
    if (status === "suspended") {

      /* LOCK (allowed — you approved this design) */
      await connection.query(`
        UPDATE assignments
        SET approvalLocked = TRUE
        WHERE reference = ?
      `, [reference]);

      /* SEND APPROVAL REQUEST (NO EXTRA LOGIC) */
      await connection.query(`
        INSERT INTO notifications (ADMIN_ID, title, message, type, reference)
        VALUES (?, ?, ?, ?, ?)
      `, [
        req.session.expert.adminTarget || null, // uses your system if available
        "Approval Required",
        `Suspended expert ${expertName} requested approval for assignment ${reference}.`,
        "admin-approval",
        reference
      ]);

      await connection.commit();

      return res.json({
        message: "Approval request sent"
      });
    }

    /* ================= NORMAL ACCEPT ================= */
    const [result] = await connection.query(`
      UPDATE assignments
      SET
        status = 'accepted',
        EXPERT_ID = ?,
        EXPERT_NAME = ?,
        acceptedAt = NOW()
      WHERE reference = ?
      AND status = 'pending'
      AND approvalLocked = FALSE
    `, [expertId, expertName, reference]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Already taken or locked" });
    }

    /* ================= GET CLIENT ================= */
    const [[assignment]] = await connection.query(`
      SELECT CLIENT_ID, CLIENT_NAME, title
      FROM assignments
      WHERE reference = ?
    `, [reference]);

    /* ================= CLIENT NOTIFICATION ================= */
    await connection.query(`
      INSERT INTO notifications (CLIENT_ID, title, message, type, reference)
      VALUES (?, ?, ?, ?, ?)
    `, [
      assignment.CLIENT_ID,
      "Assignment Accepted",
      `Dear ${assignment.CLIENT_NAME},

Your assignment titled "${assignment.title}" (Ref: ${reference}) has been successfully assigned to ${expertName}.

Please proceed to your assignments dashboard to initiate the work process.

Regards,  
Electro-Aid Technologies`,
      "assignment",
      reference
    ]);

    await connection.commit();

    res.json({
      success: true,
      message: "Assignment accepted"
    });

  } catch (err) {

    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });

  } finally {
    connection.release();
  }
});

module.exports = router;