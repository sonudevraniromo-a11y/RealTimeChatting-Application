import { useState, useEffect, useRef } from "react";
import "./Message.css";
import api from "../Services/api";

function Message({
  message,
  currentUserId,
  openImage,
  setMessages,
  setReplyMessage,
  messageRefs ,
}) {
  const emojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
  const isMe = message.sender._id === currentUserId;
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
      <div
        className={`d-flex mb-2 ${
          isMe ? "justify-content-end" : "justify-content-start"
        }`}
      >
        <div
          style={{
            maxWidth: "65%",
            background: isMe ? "#DCF8C6" : "#FFFFFF",
            borderRadius: "16px",
            padding: "10px 14px",
            fontStyle: "italic",
            color: "#777",
          }}
        >
          🚫 This message was deleted
          <div
            className="d-flex justify-content-end mt-1"
            style={{
              fontSize: "11px",
            }}
          >
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


  return (
    <div
      ref={(el) => (messageRefs.current[message._id] = el)}
      className={`d-flex mb-2 ${
        isMe ? "justify-content-end" : "justify-content-start"
      }`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        if (!menuOpen && !showReactionPicker) setHover(false);
      }}
    >
      <div
        ref={menuRef}
        className="message-wrapper"
        style={{
          position: "relative",
          maxWidth: "65%",
        }}
      >
        {(hover || showReactionPicker) && (
          <button
            className="btn btn-light btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowReactionPicker((prev) => !prev);
            }}
            style={{
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
              ...(isMe
                ? { right: "calc(100% + 42px)" }
                : { left: "calc(100% + 42px)" }),
              width: "30px",
              height: "30px",
              padding: 0,
              borderRadius: "50%",
              zIndex: 20,
            }}
          >
            ❤️
          </button>
        )}
        {(hover || menuOpen) && (
          <button
            className="btn btn-light btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            style={{
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
              ...(isMe
                ? { right: "calc(100% + 6px)" }
                : { left: "calc(100% + 6px)" }),
              width: "30px",
              height: "30px",
              padding: 0,
              borderRadius: "50%",
              zIndex: 20,
            }}
          >
            <i className="bi bi-three-dots-vertical"></i>
          </button>
        )}

        {menuOpen && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
              ...(isMe
                ? { right: "calc(100% + 10px)" }
                : { left: "calc(100% + 10px)" }),
              width: "180px",
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 8px 24px rgba(0,0,0,.18)",
              overflow: "hidden",
              zIndex: 30,
            }}
          >
            <button
              className="dropdown-item py-2"
              style={{
                padding: "10px 15px",
                fontSize: "14px",
              }}
              onClick={handleStar}
            >
              {isStarred ? "Unstar" : "Star"}
            </button>

            <button
              className="dropdown-item py-2"
              style={{
                padding: "10px 15px",
                fontSize: "14px",
              }}
              onClick={() => {
                setReplyMessage(message);
                setMenuOpen(false);
              }}
            >
              Reply
            </button>

            {isMe && !message.deletedForEveryone && (
              <button
                className="dropdown-item py-2"
                style={{
                  padding: "10px 15px",
                  fontSize: "14px",
                }}
                onClick={() => {
                  setEditing(true);
                  setMenuOpen(false);
                }}
              >
                Edit
              </button>
            )}

            <button
              className="dropdown-item py-2"
              style={{
                padding: "10px 15px",
                fontSize: "14px",
              }}
              onClick={handlePin}
            >
              📌 Pin
            </button>

            <button
              className="dropdown-item py-2"
              style={{
                padding: "10px 15px",
                fontSize: "14px",
              }}
              onClick={handleDeleteForMe}
            >
              Delete for me
            </button>

            {isMe && (
              <button
                className="dropdown-item text-danger py-2"
                style={{
                  padding: "10px 15px",
                  fontSize: "14px",
                }}
                onClick={handleDeleteForEveryone}
              >
                Delete for everyone
              </button>
            )}
          </div>
        )}

        {showReactionPicker && (
          <div
            style={{
              position: "absolute",
              top: "-45px",
              background: "#fff",
              borderRadius: "30px",
              display: "flex",
              padding: "6px",
              gap: "4px",
              boxShadow: "0 4px 12px rgba(0,0,0,.2)",
              zIndex: 100,
              ...(isMe ? { right: 0 } : { left: 0 }),
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => {
              setShowReactionPicker(false);
              setHover(false);
            }}
          >
            {emojis.map((emoji) => (
              <button
                key={emoji}
                className="btn btn-light btn-sm"
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

        <div
          style={{
            background: isMe ? "#DCF8C6" : "#FFFFFF",
            borderRadius: "16px",
            padding: "8px 12px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
            wordBreak: "break-word",
          }}
        >
          {!isMe && (
            <div
              style={{
                fontWeight: 600,
                fontSize: "13px",
                color: "#0D6EFD",
                marginBottom: "4px",
              }}
            >
              {message.sender.name}
            </div>
          )}

          {message.replyTo && (
            <div
              onClick={jumpToReply}
              style={{
                cursor: "pointer",
                background: "rgba(0,0,0,0.06)",
                borderLeft: "4px solid #25D366",
                borderRadius: "8px",
                padding: "6px 10px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  fontWeight: "600",
                  fontSize: "13px",
                  color: "#25D366",
                }}
              >
                {message.replyTo.sender?.name || "Unknown"}
              </div>

              <div
                style={{
                  fontSize: "13px",
                  color: "#555",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {message.replyTo.image
                  ? "📷 Photo"
                  : message.replyTo.text || "Deleted message"}
              </div>
            </div>
          )}

          {message.image && (
            <img
              src={`${import.meta.env.VITE_API_URL}${message.image}`}
              alt=""
              onClick={(e) => {
                e.stopPropagation();
                openImage(`${import.meta.env.VITE_API_URL}${message.image}`);
              }}
              style={{
                width: "100%",
                maxWidth: "260px",
                borderRadius: "10px",
                cursor: "pointer",
                marginBottom: message.text ? "8px" : 0,
              }}
            />
          )}

          {editing ? (
            <div>
              <textarea
                className="form-control"
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
              />

              <div className="mt-2 d-flex gap-2">
                <button className="btn btn-success btn-sm" onClick={handleEdit}>
                  Save
                </button>

                <button
                  className="btn btn-secondary btn-sm"
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
            message.text && (
              <div
                style={{
                  fontSize: "15px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {message.text}
              </div>
            )
          )}

          {message.reactions?.length > 0 &&
            (() => {
              const grouped = {};

              message.reactions.forEach((reaction) => {
                grouped[reaction.emoji] = (grouped[reaction.emoji] || 0) + 1;
              });

              return (
                <div
                  style={{
                    marginTop: "6px",
                    display: "flex",
                    gap: "6px",
                    flexWrap: "wrap",
                  }}
                >
                  {Object.entries(grouped).map(([emoji, count]) => (
                    <div
                      key={emoji}
                      style={{
                        background: "#fff",
                        borderRadius: "20px",
                        padding: "2px 8px",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                      }}
                    >
                      <span>{emoji}</span>
                      {count > 1 && <span>{count}</span>}
                    </div>
                  ))}
                </div>
              );
            })()}

          <div
            className="d-flex justify-content-end align-items-center mt-1"
            style={{
              fontSize: "11px",
              color: "#666",
              gap: "4px",
            }}
          >
            <span>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}

              {message.edited && (
                <span
                  style={{
                    marginLeft: "4px",
                    fontStyle: "italic",
                  }}
                >
                  (edited)
                </span>
              )}
            </span>

            {isStarred && (
              <span
                style={{
                  color: "#f4b400",
                  marginRight: "4px",
                }}
              >
                ⭐
              </span>
            )}

            {isMe && (
              <span
                style={{
                  color: message.seen ? "#34B7F1" : "#777",
                  fontSize: "13px",
                }}
              >
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
