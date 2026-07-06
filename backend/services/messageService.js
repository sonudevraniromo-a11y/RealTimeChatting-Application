const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { getIO } = require("../socket/io");
const onlineUsers = require("../socket/onlineUsers");

async function createMessage({
  conversationId,
  senderId,
  text = "",
  image = "",
  replyTo = null,
}) {
  if (!conversationId) {
    const error = new Error("Conversation ID is required");
    error.status = 400;
    throw error;
  }

  if (!text.trim() && !image) {
    const error = new Error("Message cannot be empty");
    error.status = 400;
    throw error;
  }

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    const error = new Error("Conversation not found");
    error.status = 404;
    throw error;
  }

  const message = new Message({
    conversation: conversation._id,
    sender: senderId,
    text,
    image,
    replyTo,
  });

  await message.save();

  await message.populate("sender", "name avatar");
  await message.populate({
    path: "replyTo",
    populate: {
      path: "sender",
      select: "name avatar",
    },
  });

  conversation.lastMessage = message._id;
  const receiverId = conversation.participants.find(
    (id) => id.toString() !== senderId.toString(),
  );

  conversation.unreadCount.set(
    receiverId.toString(),
    (conversation.unreadCount.get(receiverId.toString()) || 0) + 1,
  );

  await conversation.save();

  const io = getIO();
  const senderSocket = onlineUsers.get(senderId.toString());
  const receiverSocket = onlineUsers.get(receiverId.toString());
  const payload = message.toObject();

  if (receiverSocket) {
    io.to(receiverSocket).emit("receive_message", payload);
    io.to(receiverSocket).emit("conversation_updated");
  }

  if (senderSocket) {
    io.to(senderSocket).emit("receive_message", payload);
  }

  return payload;
}

async function getConversationMessages(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    const error = new Error("Conversation not found");
    error.status = 404;
    throw error;
  }

  await conversation.populate({
    path: "pinnedMessage",
    populate: {
      path: "sender",
      select: "name avatar",
    },
  });

  const messages = await Message.find({
    conversation: conversationId,
    deletedFor: {
      $ne: userId,
    },
  })
    .populate("sender", "name avatar")
    .populate({
      path: "replyTo",
      populate: {
        path: "sender",
        select: "name",
      },
    })
    .sort({ createdAt: 1 });

  return { messages, conversation };
}

async function markMessagesSeen(conversationId, userId) {
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

  const conversation = await Conversation.findById(conversationId);
  const otherUser = conversation.participants.find(
    (id) => id.toString() !== userId.toString(),
  );

  const otherSocket = onlineUsers.get(otherUser.toString());
  const io = getIO();

  if (otherSocket) {
    io.to(otherSocket).emit("messages_seen", {
      conversationId,
    });
  }
}

async function deleteMessageForMe(messageId, userId) {
  const message = await Message.findById(messageId);

  if (!message) {
    const error = new Error("Message not found");
    error.status = 404;
    throw error;
  }

  if (message.deletedFor.includes(userId)) {
    return message;
  }

  message.deletedFor.push(userId);
  await message.save();
  return message;
}

async function deleteMessageForEveryone(messageId, userId) {
  const message = await Message.findById(messageId);

  if (!message) {
    const error = new Error("Message not found");
    error.status = 404;
    throw error;
  }

  if (message.sender.toString() !== userId.toString()) {
    const error = new Error("Not authorized");
    error.status = 403;
    throw error;
  }

  if (message.deletedForEveryone) {
    const error = new Error("Message already deleted");
    error.status = 400;
    throw error;
  }

  message.deletedForEveryone = true;
  message.text = "";
  message.image = "";
  await message.save();

  const conversation = await Conversation.findById(message.conversation);
  const receiverId = conversation.participants.find(
    (id) => id.toString() !== userId.toString(),
  );
  const receiverSocket = onlineUsers.get(receiverId.toString());
  const io = getIO();

  if (receiverSocket) {
    io.to(receiverSocket).emit("message_deleted", {
      messageId: message._id,
    });
  }

  return message;
}

async function reactToMessage(messageId, userId, emoji) {
  const message = await Message.findById(messageId);

  if (!message) {
    const error = new Error("Message not found");
    error.status = 404;
    throw error;
  }

  const existingReaction = message.reactions.find(
    (reaction) => reaction.user.toString() === userId.toString(),
  );

  if (!existingReaction) {
    message.reactions.push({ user: userId, emoji });
  } else if (existingReaction.emoji === emoji) {
    message.reactions = message.reactions.filter(
      (reaction) => reaction.user.toString() !== userId.toString(),
    );
  } else {
    existingReaction.emoji = emoji;
  }

  await message.save();

  getIO().emit("message_reaction", {
    messageId,
    reactions: message.reactions,
  });

  return message.reactions;
}

async function editMessage(messageId, userId, text) {
  if (!text.trim()) {
    const error = new Error("Message cannot be empty");
    error.status = 400;
    throw error;
  }

  const message = await Message.findById(messageId);

  if (!message) {
    const error = new Error("Message not found");
    error.status = 404;
    throw error;
  }

  if (message.sender.toString() !== userId.toString()) {
    const error = new Error("Unauthorized");
    error.status = 403;
    throw error;
  }

  message.text = text;
  message.edited = true;
  await message.save();

  getIO().emit("message_edited", {
    messageId: message._id,
    text: message.text,
    edited: true,
  });

  return message;
}

async function toggleStar(messageId, userId) {
  const message = await Message.findById(messageId);

  if (!message) {
    const error = new Error("Message not found");
    error.status = 404;
    throw error;
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

  return message.starredBy;
}

async function togglePin(messageId) {
  const message = await Message.findById(messageId);

  if (!message) {
    const error = new Error("Message not found");
    error.status = 404;
    throw error;
  }

  const conversation = await Conversation.findById(message.conversation);

  if (!conversation) {
    const error = new Error("Conversation not found");
    error.status = 404;
    throw error;
  }

  if (conversation.pinnedMessage?.toString() === messageId) {
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

  return conversation.pinnedMessage;
}

async function searchMessages(conversationId, query) {
  const messages = await Message.find({
    conversation: conversationId,
    text: {
      $regex: query,
      $options: "i",
    },
  }).populate("sender", "name");

  return messages;
}

async function getStarredMessages(userId) {
  return Message.find({
    starredBy: userId,
    deletedFor: { $ne: userId },
    deletedForEveryone: false,
  })
    .populate("sender", "name avatar")
    .populate("conversation", "participants pinnedMessage")
    .sort({ createdAt: -1 });
}

async function getPinnedMessages(userId) {
  const conversations = await Conversation.find({
    participants: userId,
    pinnedMessage: { $ne: null },
  }).populate({
    path: "pinnedMessage",
    populate: { path: "sender", select: "name avatar" },
  });

  return conversations
    .filter((conversation) => conversation.pinnedMessage)
    .map((conversation) => ({
      conversationId: conversation._id,
      pinnedMessage: conversation.pinnedMessage,
    }));
}

async function getSharedMedia(userId) {
  return Message.find({
    conversation: {
      $in: await Conversation.find({ participants: userId }).distinct("_id"),
    },
    image: { $ne: "" },
    deletedFor: { $ne: userId },
    deletedForEveryone: false,
  })
    .populate("sender", "name avatar")
    .populate("conversation", "participants")
    .sort({ createdAt: -1 });
}

module.exports = {
  createMessage,
  getConversationMessages,
  markMessagesSeen,
  deleteMessageForMe,
  deleteMessageForEveryone,
  reactToMessage,
  editMessage,
  toggleStar,
  togglePin,
  searchMessages,
  getStarredMessages,
  getPinnedMessages,
  getSharedMedia,
};
