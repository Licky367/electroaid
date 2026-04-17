const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");

const { Expert } = require("../../models");

/* ================== REG_NO VALIDATION ================== */
function validateREGNO(reg) {
    return /^EXP_\d{4}_[A-Z]{2}$/.test(reg);
}

/* ===================================================== */
/* ================= VIEW =============================== */
/* ===================================================== */
router.get("/login", (req, res) => {
    res.render("expert-login");
});


/* ===================================================== */
/* ================= LOGIN ============================== */
/* ===================================================== */
router.post("/login", async (req, res) => {

    try {

        const { REG_NO, EXPERT_PASSWORD } = req.body;

        /* ================== VALIDATION ================== */
        if (!REG_NO || !EXPERT_PASSWORD) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const REG = REG_NO.trim().toUpperCase();

        if (!validateREGNO(REG)) {
            return res.status(400).json({
                message: "Invalid registration number format"
            });
        }


        /* ================== FIND EXPERT ================== */
        const expert = await Expert.findOne({
            REG_NO: REG
        }).select("EXPERT_NAME REG_NO EXPERT_PASSWORD").lean();

        if (!expert) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }


        /* ================== CHECK PASSWORD ================== */
        const isMatch = await bcrypt.compare(
            EXPERT_PASSWORD,
            expert.EXPERT_PASSWORD
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }


        /* ================== SESSION ================== */
        req.session.expert = {
            id: expert._id, // 🔥 Mongo uses _id
            name: expert.EXPERT_NAME,
            reg_no: expert.REG_NO
        };


        /* ================== SUCCESS ================== */
        return res.redirect("/expert");

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: "Server error"
        });
    }
});


/* ===================================================== */
/* ================= LOGOUT ============================= */
/* ===================================================== */
router.get("/logout", (req, res) => {

    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Could not log out");
        }

        res.redirect("/expert/login");
    });

});


module.exports = router;