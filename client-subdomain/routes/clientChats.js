const express = require("express")
const router = express.Router()

const controller = require("../controllers/clientChatsController")
const clientAuth = require("../middleware/clientAuth")

router.get("/messages", clientAuth, controller.getMessages)
router.post("/messages", clientAuth, controller.sendMessage)

module.exports = router