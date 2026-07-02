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
  reactToMessage ,
  editMessage ,
  toggleStar ,
  searchMessages
} = require("../controllers/messageControllers");


route.get("/:conversationId", authMiddleware, getMessages);

route.patch("/seen/:conversationId", authMiddleware, markMessagesSeen);

route.post("/", authMiddleware, upload.single("image"), sendMessage);

route.patch("/:id/delete-for-me", authMiddleware, deleteForMe);

route.patch("/:id/delete-for-everyone", authMiddleware, deleteForEveryone);

route.patch("/:messageId/reaction", authMiddleware , reactToMessage);

route.patch("/:messageId/edit", authMiddleware, editMessage);

route.patch("/:messageId/star", authMiddleware , toggleStar);


module.exports = route;
