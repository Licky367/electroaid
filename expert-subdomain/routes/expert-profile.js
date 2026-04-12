require("dotenv").config({ path: "../config.env" });

const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");

/* ===================================================== */
/* ================= AUTH =============================== */
/* ===================================================== */

function requireExpert(req, res, next){
    if(!req.session.expert){
        return res.redirect("/expert/login");
    }
    next();
}

/* ===================================================== */
/* ================= MULTER SETUP ======================= */
/* ===================================================== */

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, "uploads/");
    },
    filename: function(req, file, cb){
        const uniqueName =
            Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/* ===================================================== */
/* ================= PROFILE ============================ */
/* ===================================================== */

router.get("/profile", requireExpert, async (req, res) => {
    try {

        const EXPERT_ID = req.session.EXPERT_ID;

        const [expertResult] = await db.execute(
            `SELECT 
                EXPERT_NAME,
                EXPERT_EMAIL,
                EXPERT_PHONE,
                REG_NO,
                EXPERT_PROFILE_IMAGE
             FROM experts
             WHERE id = ?`,
            [EXPERT_ID]
        );

        if (expertResult.length === 0){
            return res.send("Expert not found");
        }

        const expert = expertResult[0];

        const [assignments] = await db.execute(
            `SELECT rating, payout
             FROM assignments
             WHERE EXPERT_ID = ?
             AND status = 'completed'`,
            [EXPERT_ID]
        );

        const totalCompleted = assignments.length;

        let totalRating = 0;
        let totalPayout = 0;

        assignments.forEach(a => {
            totalRating += a.rating || 0;
            totalPayout += Number(a.payout) || 0;
        });

        const averageRating =
            totalCompleted ? totalRating / totalCompleted : 0;

        const averagePayout =
            totalCompleted ? totalPayout / totalCompleted : 0;

        res.render("expert-profile", {
            ...expert,
            totalCompleted,
            averageRating,
            totalPayout,
            averagePayout
        });

    } catch (err){
        console.error(err);
        res.status(500).send("Server error");
    }
});

/* ===================================================== */
/* ================= EDIT PROFILE ======================= */
/* ===================================================== */

router.get("/edit", requireExpert, async (req, res) => {
    try {

        const EXPERT_ID = req.session.EXPERT_ID;

        const [rows] = await db.execute(
            `SELECT 
                EXPERT_NAME,
                EXPERT_EMAIL,
                EXPERT_PHONE,
                REG_NO,
                EXPERT_PROFILE_IMAGE
             FROM experts
             WHERE id = ?`,
            [EXPERT_ID]
        );

        if (rows.length === 0){
            return res.send("Expert not found");
        }

        res.render("expert-edit", rows[0]);

    } catch (err){
        console.error(err);
        res.status(500).send("Server error");
    }
});

/* ===================================================== */
/* ================= UPDATE PROFILE ===================== */
/* ===================================================== */

router.post(
    "/edit",
    requireExpert,
    upload.single("EXPERT_PROFILE_IMAGE"),
    async (req, res) => {
        try {

            const EXPERT_ID = req.session.EXPERT_ID;

            const {
                EXPERT_NAME,
                EXPERT_PHONE,
                EXPERT_PASSWORD
            } = req.body;

            /* ===== GET CURRENT DATA ===== */
            const [rows] = await db.execute(
                `SELECT EXPERT_PROFILE_IMAGE FROM experts WHERE id = ?`,
                [EXPERT_ID]
            );

            if(rows.length === 0){
                return res.status(404).json({ message: "Expert not found" });
            }

            let profileImage = rows[0].EXPERT_PROFILE_IMAGE;

            /* ===== HANDLE IMAGE ===== */
            if(req.file){
                profileImage = `/uploads/${req.file.filename}`;
            }

            /* ===== BUILD QUERY DYNAMICALLY ===== */
            let query = `
                UPDATE experts 
                SET EXPERT_NAME = ?, EXPERT_PHONE = ?, EXPERT_PROFILE_IMAGE = ?
            `;

            let params = [EXPERT_NAME, EXPERT_PHONE, profileImage];

            /* ===== HANDLE PASSWORD ===== */
            if(EXPERT_PASSWORD){
                const hashedPassword = await bcrypt.hash(EXPERT_PASSWORD, 10);
                query += `, EXPERT_PASSWORD = ?`;
                params.push(hashedPassword);
            }

            query += ` WHERE id = ?`;
            params.push(EXPERT_ID);

            await db.execute(query, params);

            return res.json({
                message: "Profile updated successfully"
            });

        } catch (err){
            console.error(err);
            res.status(500).json({
                message: "Server error"
            });
        }
    }
);

module.exports = router;