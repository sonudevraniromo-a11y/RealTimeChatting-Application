const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { getIO } = require("../socket/io");
const onlineUsers = require("../socket/onlineUsers");

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, text = "", replyTo } = req.body;
    const senderId = req.user.userId;

    const image = req.file ? `/uploads/${req.file.filename}` : "";

    if (!conversationId) {
      return res.status(400).json({
        message: "Conversation ID is required",
      });
    }

    if (!text.trim() && !image) {
      return res.status(400).json({
        message: "Message cannot be empty",
      });
    }

    const convo = await Conversation.findById(conversationId);

    if (!convo) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    } 

    const message = new Message({
      conversation: convo._id,
      sender: senderId,
      text,
      image,
      replyTo: replyTo || null,
    });

    await message.save();

    // Populate sender
    await message.populate("sender", "name avatar");

    // Populate replied message
    await message.populate({
      path: "replyTo",
      populate: {
        path: "sender",
        select: "name avatar",
      },
    });

    convo.lastMessage = message._id;

    const receiverId = convo.participants.find(
      (id) => id.toString() !== senderId.toString(),
    );

    convo.unreadCount.set(
      receiverId.toString(),
      (convo.unreadCount.get(receiverId.toString()) || 0) + 1,
    );

    await convo.save();

    const io = getIO();

    const senderSocket = onlineUsers.get(senderId.toString());
    const receiverSocket = onlineUsers.get(receiverId.toString());

    const payload = message.toObject();

    // Receiver
    if (receiverSocket) {
      io.to(receiverSocket).emit("receive_message", payload);
      io.to(receiverSocket).emit("conversation_updated");
    }

    // Sender
    if (senderSocket) {
      io.to(senderSocket).emit("receive_message", payload);
    }

    return res.status(201).json({
      message: "Message created successfully",
      data: payload,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const convo = await Conversation.findById(conversationId);

    if (!convo) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

   await convo.populate({
     path: "pinnedMessage",
     populate: {
       path: "sender",
       select: "name avatar",
     },
   }); 

    const messages = await Message.find({
      conversation: conversationId,
      deletedFor: {
        $ne: req.user.userId,
      },
    })
      .populate("sender", "name avatar")
      .populate({
    path: "replyTo",
    populate: {
        path: "sender",
        select: "name",
    },})
      .sort({ createdAt: 1 });

    return res.status(200).json({
      messages,
      conversation : convo ,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.markMessagesSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const userId = req.user.userId;

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        seen: false,
      },
      {
        seen: true,
        seenAt: new Date(),
      },
    );

    const io = getIO();

    const conversation = await Conversation.findById(conversationId);

    const otherUser = conversation.participants.find(
      (id) => id.toString() !== userId.toString(),
    );

    const otherSocket = onlineUsers.get(otherUser.toString());

    if (otherSocket) {
      console.log("Emitting messages_seen to:", otherSocket);
      io.to(otherSocket).emit("messages_seen", {
        conversationId,
      });
    }

    return res.status(200).json({
      message: "Messages marked as seen",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.deleteForMe = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    // Already deleted for this user
    if (message.deletedFor.includes(userId)) {
      return res.status(200).json({
        message: "Already deleted",
      });
    }

    message.deletedFor.push(userId);

    await message.save();

    return res.status(200).json({
      message: "Deleted for me",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

exports.deleteForEveryone = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    // Only the sender can delete for everyone
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    // Already deleted
    if (message.deletedForEveryone) {
      return res.status(400).json({
        message: "Message already deleted",
      });
    }

    message.deletedForEveryone = true;
    message.text = "";
    message.image = "";

    await message.save();

    // Get conversation
    const convo = await Conversation.findById(message.conversation);

    const receiverId = convo.participants.find(
      (id) => id.toString() !== userId.toString(),
    );

    const io = getIO();

    const receiverSocket = onlineUsers.get(receiverId.toString());

    if (receiverSocket) {
      io.to(receiverSocket).emit("message_deleted", {
        messageId: message._id,
      });
    }

    return res.status(200).json({
      message: "Deleted for everyone",
      messageId: message._id,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

exports.reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.userId;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    const existingReaction = message.reactions.find(
      (r) => r.user.toString() === userId.toString(),
    );

    if (!existingReaction) {
      message.reactions.push({
        user: userId,
        emoji,
      });
    } else if (existingReaction.emoji === emoji) {
      message.reactions = message.reactions.filter(
        (r) => r.user.toString() !== userId.toString(),
      );
    } else {
      existingReaction.emoji = emoji;
    }

    await message.save();

    const io = getIO();

    io.emit("message_reaction", {
      messageId,
      reactions: message.reactions,
    });

    return res.status(200).json({
      reactions: message.reactions,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user.userId;

    if (!text.trim()) {
      return res.status(400).json({
        message: "Message cannot be empty",
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    message.text = text;
    message.edited = true;

    await message.save();

    const io = getIO();

    io.emit("message_edited", {
      messageId: message._id,
      text: message.text,
      edited: true,
    });

    res.json({
      message: "Edited successfully",
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

exports.toggleStar = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    const index = message.starredBy.findIndex(
      (id) => id.toString() === userId.toString(),
    );

    if (index === -1) {
      message.starredBy.push(userId);
    } else {
      message.starredBy.splice(index, 1);
    }

    await message.save();

    getIO().emit("message_starred", {
      messageId,
      starredBy: message.starredBy,
    });

    res.json({
      starredBy: message.starredBy,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

exports.pinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    const conversation = await Conversation.findById(message.conversation);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    if (
      conversation.pinnedMessage &&
      conversation.pinnedMessage.toString() === messageId
    ) {
      conversation.pinnedMessage = null;
    } else {
      conversation.pinnedMessage = messageId;
    }

    await conversation.save();

    await conversation.populate({
      path: "pinnedMessage",
      populate: {
        path: "sender",
        select: "name",
      },
    });

    getIO().emit("message_pinned", {
      conversationId: conversation._id,
      pinnedMessage: conversation.pinnedMessage,
    });

    res.json({
      pinnedMessage: conversation.pinnedMessage,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

exports.searchMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { q } = req.query;

    const messages = await Message.find({
      conversation: conversationId,
      text: {
        $regex: q,
        $options: "i",
      },
    }).populate("sender", "name");

    res.json(messages);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};