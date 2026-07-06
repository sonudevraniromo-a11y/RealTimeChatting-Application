export default function ConversationItem({
  conversation,
  currentUserId,
  onlineUsers,
  isActive,
  onSelect,
}) {
  const otherUser = conversation.participants.find(
    (user) => user._id !== currentUserId,
  );
  const unreadCount = conversation.unreadCount?.[currentUserId] || 0;
  const isOnline = onlineUsers.includes(otherUser?._id);

  return (
    <button
      type="button"
      className={`conversation-item ${isActive ? "active" : ""}`}
      onClick={() => onSelect(conversation)}
    >
      <div className="conversation-avatar-wrap">
        <img
          className="conversation-avatar"
          src={
            otherUser?.avatar ||
            `https://ui-avatars.com/api/?background=25D366&color=fff&name=${otherUser?.name || "User"}`
          }
          alt={otherUser?.name || "Contact avatar"}
        />
        {isOnline && <span className="online-dot" />}
      </div>

      <div className="conversation-info">
        <div className="conversation-top-row">
          <span className="conversation-name">
            {otherUser?.name || "Unknown"}
          </span>
          <span className="conversation-time">
            {conversation.lastMessage
              ? new Date(conversation.lastMessage.createdAt).toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )
              : ""}
          </span>
        </div>
        <div className="conversation-preview">
          {conversation.lastMessage?.text || "Start a new chat"}
        </div>
      </div>

      {unreadCount > 0 && <div className="unread-badge">{unreadCount}</div>}
    </button>
  );
}
