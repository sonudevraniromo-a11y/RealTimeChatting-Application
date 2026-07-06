import { useState, useEffect, useRef } from "react";
import "../styles/chat.css";
import api from "../Services/api";

function Message({
  message,
  currentUserId,
  openImage,
  setMessages,
  setReplyMessage,
  messageRefs,
}) {
  const emojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
  const isMe = message.sender._id === currentUserId;
  const side = isMe ? "me" : "them";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [hover, setHover] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.text);
  const isStarred = message.starredBy?.includes(currentUserId);

  async function handleDeleteForMe() {
    try {
      await api.patch(`/api/message/${message._id}/delete-for-me`);

      setMessages((prev) => prev.filter((m) => m._id !== message._id));

      setMenuOpen(false);
    } catch (err) {
      console.log(err);
    }
  }

  async function handleStar() {
    await api.patch(`/api/message/${message._id}/star`);
    setMenuOpen(false);
  }

  async function handleReaction(emoji) {
    try {
      await api.patch(`/api/message/${message._id}/reaction`, {
        emoji,
      });

      setMenuOpen(false);
    } catch (err) {
      console.log(err);
    }
  }

  async function handleDeleteForEveryone() {
    try {
      await api.patch(`/api/message/${message._id}/delete-for-everyone`);

      setMessages((prev) =>
        prev.map((m) =>
          m._id === message._id
            ? {
                ...m,
                deletedForEveryone: true,
                text: "",
                image: "",
              }
            : m,
        ),
      );

      setMenuOpen(false);
    } catch (err) {
      console.log(err);
    }
  }

  async function handleEdit() {
    try {
      await api.patch(`/api/message/${message._id}/edit`, {
        text: editedText,
      });

      setEditing(false);
      setMenuOpen(false);
    } catch (err) {
      console.log(err);
    }
  }

  // jumpToReply

  function jumpToReply() {
    if (!message.replyTo) return;

    messageRefs.current[message.replyTo._id]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    messageRefs.current[message.replyTo._id]?.classList.add("highlight");

    setTimeout(() => {
      messageRefs.current[message.replyTo._id]?.classList.remove("highlight");
    }, 2000);
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (message.deletedForEveryone) {
    return (
      <div className={`chat-app message-row ${side}`}>
        <div className={`bubble-deleted ${isMe ? "sent" : "received"}`}>
          🚫 This message was deleted
          <div className="message-meta">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    );
  }

  async function handlePin() {
    try {
      await api.patch(`/api/message/${message._id}/pin`);
      setMenuOpen(false);
    } catch (err) {
      console.log(err);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(message.text);
    setMenuOpen(false);
  }

  return (
    <div
      ref={(el) => (messageRefs.current[message._id] = el)}
      className={`chat-app message-row ${side}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        if (!menuOpen && !showReactionPicker) setHover(false);
      }}
    >
      <div ref={menuRef} className="message-wrapper">
        {(hover || showReactionPicker) && (
          <button
            className={`msg-hover-btn react ${side}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowReactionPicker((prev) => !prev);
            }}
          >
            ❤️
          </button>
        )}
        {(hover || menuOpen) && (
          <button
            className={`msg-hover-btn menu ${side}`}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
          >
            <i className="bi bi-three-dots-vertical"></i>
          </button>
        )}

        {menuOpen && (
          <div className={`msg-menu ${side}`}>
            <button className="msg-menu-item" onClick={handleStar}>
              {isStarred ? "Unstar" : "Star"}
            </button>

            <button className="msg-menu-item" onClick={handleCopy}>
              📋 Copy
            </button>

            <button
              className="msg-menu-item"
              onClick={() => {
                setReplyMessage(message);
                setMenuOpen(false);
              }}
            >
              Reply
            </button>

            {isMe && !message.deletedForEveryone && (
              <button
                className="msg-menu-item"
                onClick={() => {
                  setEditing(true);
                  setMenuOpen(false);
                }}
              >
                Edit
              </button>
            )}

            <button className="msg-menu-item" onClick={handlePin}>
              📌 Pin
            </button>

            <button className="msg-menu-item" onClick={handleDeleteForMe}>
              Delete for me
            </button>

            {isMe && (
              <button
                className="msg-menu-item danger"
                onClick={handleDeleteForEveryone}
              >
                Delete for everyone
              </button>
            )}
          </div>
        )}

        {showReactionPicker && (
          <div
            className={`reaction-picker ${side}`}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => {
              setShowReactionPicker(false);
              setHover(false);
            }}
          >
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  handleReaction(emoji);
                  setShowReactionPicker(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className={`bubble ${isMe ? "sent" : "received"}`}>
          {!isMe && <div className="sender-name">{message.sender.name}</div>}

          {message.replyTo && (
            <div className="reply-preview" onClick={jumpToReply}>
              <div className="reply-preview-name">
                {message.replyTo.sender?.name || "Unknown"}
              </div>

              <div className="reply-preview-text">
                {message.replyTo.image
                  ? "📷 Photo"
                  : message.replyTo.text || "Deleted message"}
              </div>
            </div>
          )}

          {message.image && (
            <img
              className="message-image"
              src={`${import.meta.env.VITE_API_URL}${message.image}`}
              alt=""
              onClick={(e) => {
                e.stopPropagation();
                openImage(`${import.meta.env.VITE_API_URL}${message.image}`);
              }}
              style={{ marginBottom: message.text ? "8px" : 0 }}
            />
          )}

          {editing ? (
            <div>
              <textarea
                className="edit-textarea"
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
              />

              <div className="edit-actions">
                <button className="btn-save" onClick={handleEdit}>
                  Save
                </button>

                <button
                  className="btn-cancel"
                  onClick={() => {
                    setEditing(false);
                    setEditedText(message.text);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            message.text && <div className="message-text">{message.text}</div>
          )}

          {message.reactions?.length > 0 &&
            (() => {
              const grouped = {};

              message.reactions.forEach((reaction) => {
                grouped[reaction.emoji] = (grouped[reaction.emoji] || 0) + 1;
              });

              return (
                <div className="reactions-row">
                  {Object.entries(grouped).map(([emoji, count]) => (
                    <div key={emoji} className="reaction-pill">
                      <span>{emoji}</span>
                      {count > 1 && <span>{count}</span>}
                    </div>
                  ))}
                </div>
              );
            })()}

          <div className="message-meta">
            <span>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}

              {message.edited && <span className="edited-tag">(edited)</span>}
            </span>

            {isStarred && <span className="starred-icon">⭐</span>}

            {isMe && (
              <span className={`seen-tick ${message.seen ? "seen" : "unseen"}`}>
                {message.seen ? "✓✓" : "✓"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Message;
