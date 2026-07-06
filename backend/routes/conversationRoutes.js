const express = require("express");
const {
  createConversation,
  getConversations,
  markConversationRead,
  toggleConversationArchive,
} = require("../controllers/conversationController");
const route = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

route.get("/", authMiddleware, getConversations);

route.post("/", authMiddleware, createConversation);

route.patch("/:conversationId/read", authMiddleware, markConversationRead);
route.patch(
  "/:conversationId/archive",
  authMiddleware,
  toggleConversationArchive,
);

module.exports = route;
