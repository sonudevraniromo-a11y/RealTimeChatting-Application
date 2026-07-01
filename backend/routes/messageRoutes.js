const express = require("express");
const route = express.Router();
const upload = require("../middlewares/uploadMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");

const {
  sendMessage,
  getMessages,
  markMessagesSeen ,
  deleteForMe ,
  deleteForEveryone ,
} = require("../controllers/messageControllers");


route.get("/:conversationId", authMiddleware, getMessages);

route.patch("/seen/:conversationId", authMiddleware, markMessagesSeen);

route.post("/", authMiddleware, upload.single("image"), sendMessage);

route.patch("/:id/delete-for-me", authMiddleware, deleteForMe);

route.patch("/:id/delete-for-everyone", authMiddleware, deleteForEveryone);

module.exports = route;
