const {
  getConversationsForUser,
  createOrReturnConversation,
  markConversationRead,
  toggleConversationArchive,
} = require("../services/conversationService");

exports.createConversation = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user.userId;

    const { conversation, created } = await createOrReturnConversation(
      senderId,
      receiverId,
    );

    return res.status(created ? 201 : 200).json({
      message: created
        ? "Conversation created successfully"
        : "Existing conversation",
      conversation,
    });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const conversations = await getConversationsForUser(userId);

    return res.status(200).json({
      conversations,
    });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

exports.markConversationRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    await markConversationRead(conversationId, userId);

    return res.json({ message: "Marked as read" });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      message: error.message || "Server Error",
    });
  }
};

exports.toggleConversationArchive = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    const conversation = await toggleConversationArchive(
      conversationId,
      userId,
    );

    return res.json({
      message: conversation.archivedBy.includes(userId)
        ? "Conversation archived"
        : "Conversation unarchived",
      conversation,
    });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      message: error.message || "Server Error",
    });
  }
};
