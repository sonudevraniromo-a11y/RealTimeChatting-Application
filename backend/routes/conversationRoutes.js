const express = require('express') ;
const { createConversation , getConversations , markConversationRead} = require('../controllers/conversationController');
const route = express.Router() ;
const authMiddleware = require('../middlewares/authMiddleware')
createConversation

route.get("/", authMiddleware, getConversations);

route.post("/", authMiddleware, createConversation);

route.patch("/:conversationId/read", authMiddleware, markConversationRead);


module.exports = route ;