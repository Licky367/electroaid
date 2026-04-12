const express = require("express")
const router = express.Router()

/* ============================= */
/* AUTH MIDDLEWARE */
/* ============================= */
function requireClient(req, res, next) {
    if (!req.session.CLIENT_ID) {
        return res.redirect("/auth/login")
    }
    next()
}

/* ============================= */
/* GET DECLINED ASSIGNMENTS */
/* ============================= */
router.get("/", requireClient, async (req, res) => {

    try {

        const CLIENT_ID = req.session.CLIENT_ID

        const [rows] = await db.query(
            `SELECT 
                title, 
                reference, 
                declineReason, 
                declinedAt
             FROM assignments
             WHERE CLIENT_ID=? 
             AND status='declined'
             ORDER BY declinedAt DESC`,
            [CLIENT_ID]
        )

        res.render("declined", {
            assignments: rows,
            CLIENT_NAME: req.session.CLIENT_NAME
        })

    } catch (err) {
        console.error(err)
        res.status(500).send("Server error")
    }

})

module.exports = router