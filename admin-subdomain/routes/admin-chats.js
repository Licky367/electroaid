const express = require("express");
const router = express.Router();

const controller = require("../controllers/adminChatsController");
const upload = require("../utils/chatUploads");

/* ================= MIDDLEWARE ================= */

function REQUIRE_ADMIN(req, res, next) {
    if (!req.session || !req.session.admin) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
}

/* ================= USERS ================= */

router.get(
    "/api/admin/chat-users",
    REQUIRE_ADMIN,
    controller.getUsers
);

/* ================= MESSAGES ================= */

router.get(
    "/api/admin/messages/:clientId",
    REQUIRE_ADMIN,
    controller.getMessages
);

/* ================= SEND ================= */

router.post(
    "/api/admin/messages/:clientId",
    REQUIRE_ADMIN,
    upload.single("file"),
    controller.sendMessage
);

/* ================= DELETE ================= */

router.delete(
    "/api/admin/messages/:id",
    REQUIRE_ADMIN,
    controller.deleteMessage
);

module.exports = router;