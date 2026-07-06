const {
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
} = require("../services/messageService");

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, text = "", replyTo } = req.body;
    const senderId = req.user.userId;
    const image = req.file ? `/uploads/${req.file.filename}` : "";

    const payload = await createMessage({
      conversationId,
      senderId,
      text,
      image,
      replyTo: replyTo || null,
    });

    return res.status(201).json({
      message: "Message created successfully",
      data: payload,
    });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    const { messages, conversation } = await getConversationMessages(
      conversationId,
      userId,
    );

    return res.status(200).json({
      messages,
      conversation,
    });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

exports.markMessagesSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    await markMessagesSeen(conversationId, userId);

    return res.status(200).json({
      message: "Messages marked as seen",
    });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      message: error.message || "Server Error",
    });
  }
};

exports.deleteForMe = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await deleteMessageForMe(id, userId);

    return res.status(200).json({
      message: "Deleted for me",
    });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

exports.deleteForEveryone = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await deleteMessageForEveryone(id, userId);

    return res.status(200).json({
      message: "Deleted for everyone",
      messageId: id,
    });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

exports.reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.userId;

    const reactions = await reactToMessage(messageId, userId, emoji);

    return res.status(200).json({ reactions });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user.userId;

    await editMessage(messageId, userId, text);

    return res.json({
      message: "Edited successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

exports.toggleStar = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const starredBy = await toggleStar(messageId, userId);

    return res.json({ starredBy });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

exports.pinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const pinnedMessage = await togglePin(messageId);

    return res.json({ pinnedMessage });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

exports.getStarredMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const starred = await getStarredMessages(userId);
    return res.json({ starred });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

exports.getPinnedMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const pinned = await getPinnedMessages(userId);
    return res.json({ pinned });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

exports.getSharedMedia = async (req, res) => {
  try {
    const userId = req.user.userId;
    const media = await getSharedMedia(userId);
    return res.json({ media });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

exports.searchMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { q } = req.query;

    const results = await searchMessages(conversationId, q);

    return res.json(results);
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      message: error.message || "Internal Server Error",
    });
  }
};
