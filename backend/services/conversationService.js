const Conversation = require("../models/Conversation");
const User = require("../models/userSchema");

async function getConversationsForUser(userId) {
  return Conversation.find({ participants: userId })
    .populate("participants", "name avatar isOnline lastSeen")
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "name avatar",
      },
    })
    .populate({
      path: "pinnedMessage",
      populate: {
        path: "sender",
        select: "name avatar",
      },
    })
    .sort({ updatedAt: -1 });
}

async function createOrReturnConversation(senderId, receiverId) {
  if (!receiverId) {
    const error = new Error("Receiver ID is required");
    error.status = 400;
    throw error;
  }

  if (senderId === receiverId) {
    const error = new Error("You cannot create a conversation with yourself");
    error.status = 400;
    throw error;
  }

  const receiver = await User.findById(receiverId);

  if (!receiver) {
    const error = new Error("Receiver user not found");
    error.status = 404;
    throw error;
  }

  const existingConversation = await Conversation.findOne({
    participants: {
      $size: 2,
      $all: [senderId, receiverId],
    },
  });

  if (existingConversation) {
    return { conversation: existingConversation, created: false };
  }

  const conversation = new Conversation({
    participants: [senderId, receiverId],
  });

  await conversation.save();
  return { conversation, created: true };
}

async function markConversationRead(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    const error = new Error("Conversation not found");
    error.status = 404;
    throw error;
  }

  conversation.unreadCount.set(userId.toString(), 0);
  await conversation.save();
  return conversation;
}

async function toggleConversationArchive(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    const error = new Error("Conversation not found");
    error.status = 404;
    throw error;
  }

  const index = conversation.archivedBy.findIndex(
    (id) => id.toString() === userId.toString(),
  );

  if (index === -1) {
    conversation.archivedBy.push(userId);
  } else {
    conversation.archivedBy.splice(index, 1);
  }

  await conversation.save();
  return conversation;
}

module.exports = {
  getConversationsForUser,
  createOrReturnConversation,
  markConversationRead,
  toggleConversationArchive,
};
