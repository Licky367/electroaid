const express = require("express")
const router = express.Router()

const controller = require("../controllers/clientChatsController")
const { requireClientAPI } = require("../middleware/clientAuth")

router.get("/messages", requireClientAPI, controller.getMessages)
router.post("/messages", requireClientAPI, controller.sendMessage)

module.exports = router