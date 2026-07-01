import { useState, useEffect, useRef } from "react";
import "./Message.css";
import api from "../Services/api";


function Message({ message, currentUserId, openImage , setMessages , setReplyMessage}) {
  const isMe = message.sender._id === currentUserId;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [hover, setHover] = useState(false);

  async function handleDeleteForMe(){
      try {
        await api.patch(`/api/message/${message._id}/delete-for-me`);

        setMessages((prev) => prev.filter((m) => m._id !== message._id));

        setMenuOpen(false);
      } catch (err) {
        console.log(err);
      }
  }

  async function handleDeleteForEveryone(){
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


  return (
    <div
      className={`d-flex mb-2 ${
        isMe ? "justify-content-end" : "justify-content-start"
      }`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        if (!menuOpen) setHover(false);
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
              onClick={() => {
                setReplyMessage(message);
                setMenuOpen(false);
              }}
            >
              Reply
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
              style={{
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
              src={`http://localhost:5000${message.image}`}
              alt=""
              onClick={(e) => {
                e.stopPropagation();
                openImage(`http://localhost:5000${message.image}`);
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

          {message.text && (
            <div
              style={{
                fontSize: "15px",
                whiteSpace: "pre-wrap",
              }}
            >
              {message.text}
            </div>
          )}

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
            </span>

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
