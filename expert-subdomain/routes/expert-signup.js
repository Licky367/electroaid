const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");

const {
    Expert,
    ExpertRegistration
} = require("../../models");


/* ================== MULTER ================== */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/experts");
    },
    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + "_" + Math.round(Math.random() * 1e9) +
            path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });


/* ================== REG_NO VALIDATION ================== */
function validateREGNO(reg) {
    return /^EXP_\d{4}_[A-Z]{2}$/.test(reg);
}


/* ===================================================== */
/* ================= VIEW =============================== */
/* ===================================================== */
router.get("/signup", (req, res) => {
    res.render("expert-signup");
});


/* ===================================================== */
/* ===== VALIDATE REG LINK ============================== */
/* ===================================================== */
router.get("/validate", async (req, res) => {

    try {

        const REG = req.query.reg?.trim().toUpperCase();

        if (!REG || !validateREGNO(REG)) {
            return res.status(400).json({
                valid: false,
                message: "Invalid link"
            });
        }

        const record = await ExpertRegistration.findOne({
            REG_NO: REG
        }).lean();

        if (!record) {
            return res.json({
                valid: false,
                message: "Invalid REG_NO"
            });
        }

        if (record.used) {
            return res.json({
                valid: false,
                message: "REG_NO already used"
            });
        }

        if (new Date() > new Date(record.expiresAt)) {
            return res.json({
                valid: false,
                message: "REG_NO expired"
            });
        }

        return res.json({
            valid: true,
            email: record.EXPERT_EMAIL,
            reg: REG
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            valid: false,
            message: "Server error"
        });
    }
});


/* ===================================================== */
/* ================= SIGNUP API ========================= */
/* ===================================================== */
router.post(
    "/signup",
    upload.single("EXPERT_PROFILE_IMAGE"),
    async (req, res) => {

        try {

            const {
                EXPERT_NAME,
                EXPERT_EMAIL,
                EXPERT_PHONE,
                EXPERT_PASSWORD
            } = req.body;

            let REG = req.query.reg || req.body.REG_NO;

            if (!REG) {
                return res.status(400).json({
                    message: "Missing registration link"
                });
            }

            REG = REG.trim().toUpperCase();
            const EMAIL = EXPERT_EMAIL.trim().toLowerCase();


            /* ================== VALIDATION ================== */
            if (!EXPERT_NAME || !EMAIL || !EXPERT_PHONE || !EXPERT_PASSWORD) {
                return res.status(400).json({
                    message: "All fields are required"
                });
            }

            if (!validateREGNO(REG)) {
                return res.status(400).json({
                    message: "Invalid REG_NO format"
                });
            }


            /* ================== CHECK REG ================== */
            const regRecord = await ExpertRegistration.findOne({
                REG_NO: REG
            });

            if (!regRecord) {
                return res.status(400).json({
                    message: "Invalid registration number"
                });
            }


            /* ================== EMAIL MATCH ================== */
            if (regRecord.EXPERT_EMAIL !== EMAIL) {
                return res.status(403).json({
                    message: "Email does not match invitation"
                });
            }


            /* ================== USED ================== */
            if (regRecord.used) {
                return res.status(400).json({
                    message: "REG_NO already used"
                });
            }


            /* ================== EXPIRY ================== */
            if (new Date() > new Date(regRecord.expiresAt)) {
                return res.status(400).json({
                    message: "REG_NO expired"
                });
            }


            /* ================== DUPLICATES ================== */
            const existing = await Expert.findOne({
                $or: [
                    { EXPERT_EMAIL: EMAIL },
                    { EXPERT_PHONE: EXPERT_PHONE.trim() },
                    { REG_NO: REG }
                ]
            });

            if (existing) {
                return res.status(400).json({
                    message: "Expert already exists"
                });
            }


            /* ================== HASH PASSWORD ================== */
            const hashedPassword = await bcrypt.hash(EXPERT_PASSWORD, 10);


            /* ================== IMAGE ================== */
            let imagePath = null;
            if (req.file) {
                imagePath = `/uploads/experts/${req.file.filename}`;
            }


            /* ================== CREATE EXPERT ================== */
            await Expert.create({
                EXPERT_NAME: EXPERT_NAME.trim(),
                EXPERT_EMAIL: EMAIL,
                EXPERT_PHONE: EXPERT_PHONE.trim(),
                REG_NO: REG,
                EXPERT_PROFILE_IMAGE: imagePath,
                EXPERT_PASSWORD: hashedPassword
            });


            /* ================== MARK REG USED ================== */
            await ExpertRegistration.updateOne(
                { REG_NO: REG },
                { used: true }
            );


            return res.json({
                message: "Signup successful"
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Server error"
            });
        }
    }
);

module.exports = router;