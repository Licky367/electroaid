const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");

/* ✅ MODELS (from your single models.js) */
const { Expert, Assignment } = require("../../models");

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
    limits: { fileSize: 5 * 1024 * 1024 },
});

/* ===================================================== */
/* ================= PROFILE ============================ */
/* ===================================================== */

router.get("/profile", requireExpert, async (req, res) => {
    try {

        const EXPERT_ID = req.session.expert.id;

        /* ===== GET EXPERT ===== */
        const expert = await Expert.findById(EXPERT_ID).select(
            "EXPERT_NAME EXPERT_EMAIL EXPERT_PHONE REG_NO EXPERT_PROFILE_IMAGE"
        );

        if (!expert){
            return res.send("Expert not found");
        }

        /* ===== GET COMPLETED ASSIGNMENTS ===== */
        const assignments = await Assignment.find({
            EXPERT_ID: EXPERT_ID,
            status: "completed"
        }).select("rating payout");

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
            ...expert.toObject(),
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

        const EXPERT_ID = req.session.expert.id;

        const expert = await Expert.findById(EXPERT_ID).select(
            "EXPERT_NAME EXPERT_EMAIL EXPERT_PHONE REG_NO EXPERT_PROFILE_IMAGE"
        );

        if (!expert){
            return res.send("Expert not found");
        }

        res.render("expert-edit", expert.toObject());

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

            const EXPERT_ID = req.session.expert.id;

            const {
                EXPERT_NAME,
                EXPERT_PHONE,
                EXPERT_PASSWORD
            } = req.body;

            /* ===== GET CURRENT ===== */
            const expert = await Expert.findById(EXPERT_ID);

            if(!expert){
                return res.status(404).json({ message: "Expert not found" });
            }

            let profileImage = expert.EXPERT_PROFILE_IMAGE;

            /* ===== IMAGE ===== */
            if(req.file){
                profileImage = `/uploads/${req.file.filename}`;
            }

            /* ===== UPDATE OBJECT ===== */
            const updateData = {
                EXPERT_NAME,
                EXPERT_PHONE,
                EXPERT_PROFILE_IMAGE: profileImage
            };

            /* ===== PASSWORD ===== */
            if(EXPERT_PASSWORD){
                const hashedPassword = await bcrypt.hash(EXPERT_PASSWORD, 10);
                updateData.EXPERT_PASSWORD = hashedPassword;
            }

            await Expert.findByIdAndUpdate(EXPERT_ID, updateData);

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