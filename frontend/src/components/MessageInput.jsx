import EmojiPicker from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";
import api from "../Services/api";
import { useSocket } from "../context/SocketContext";

function MessageInput({
  conversationId,
  receiverId,
  setMessages,
  replyMessage,
  setReplyMessage,
}) {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiRef = useRef(null);
  const { socket } = useSocket();
  const typingTimeout = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    function handleClickOutside(e) {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleEmojiClick(emojiData) {
    setText((prev) => {
      const newText = prev + emojiData.emoji;

      setTimeout(() => {
        textareaRef.current.style.height = "44px";
        textareaRef.current.style.height =
          textareaRef.current.scrollHeight + "px";

        textareaRef.current.focus();
      }, 0);

      return newText;
    });

    setShowEmojiPicker(false);
  }

  function handleTyping(e) {
    const value = e.target.value;
    setText(value);

    // Auto-grow textarea
    textareaRef.current.style.height = "44px";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";

    socket.emit("typing", {
      receiverId,
      senderId: JSON.parse(atob(localStorage.getItem("token").split(".")[1]))
        .userId,
    });

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socket.emit("stop_typing", {
        receiverId,
      });
    }, 800);
  }

  function handleImageChange(e) {
    const file = e.target.files[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }

  async function handleSend() {
    if (!text.trim() && !image) return;

    try {
      const formData = new FormData();

      formData.append("conversationId", conversationId);
      formData.append("text", text);

      if (replyMessage) {
        formData.append("replyTo", replyMessage._id);
      }

      if (image) {
        formData.append("image", image);
      }


      await api.post("/api/message", formData);

      setText("");
      setImage(null);
      setPreview("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      socket.emit("stop_typing", {
        receiverId,
      });

      textareaRef.current.style.height = "44px";
    } catch (error) {
      console.log(error);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {preview && (
        <div
          className="p-2"
          style={{
            background: "#F0F2F5",
            borderTop: "1px solid #ddd",
          }}
        >
          <img
            src={preview}
            alt=""
            style={{
              width: "150px",
              borderRadius: "10px",
            }}
          />

          <button
            className="btn btn-danger btn-sm ms-3"
            onClick={() => {
              setImage(null);
              setPreview("");

              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
          >
            Remove
          </button>
        </div>
      )}
      <div
        className="d-flex align-items-end px-3 py-2"
        style={{
          background: "#F0F2F5",
          borderTop: "1px solid #ddd",
          gap: "10px",
        }}
      >
        {/* Emoji */}
        <div
          style={{
            position: "relative",
          }}
          ref={emojiRef}
        >
          <button
            className="btn btn-light rounded-circle"
            style={{
              width: "42px",
              height: "42px",
            }}
            onClick={() => setShowEmojiPicker((prev) => !prev)}
          >
            <i className="bi bi-emoji-smile"></i>
          </button>

          <button
            className="btn btn-light rounded-circle"
            onClick={() => fileInputRef.current.click()}
            style={{
              width: "42px",
              height: "42px",
            }}
          >
            <i className="bi bi-image"></i>
          </button>

          {showEmojiPicker && (
            <div
              style={{
                position: "absolute",
                bottom: "55px",
                left: 0,
                zIndex: 1000,
              }}
            >
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleImageChange}
        />
        <>
          {replyMessage && (
            <div
              className="mb-2 p-2"
              style={{
                background: "#fff",
                borderLeft: "4px solid #25D366",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {replyMessage.sender.name}
              </div>

              <div
                style={{
                  fontSize: 14,
                  color: "#666",
                }}
              >
                {replyMessage.text || "📷 Photo"}
              </div>

              <button
                className="btn-close btn-sm float-end"
                onClick={() => setReplyMessage(null)}
              />
            </div>
          )}
        </>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          className="form-control"
          rows={1}
          placeholder="Type a message"
          value={text}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          style={{
            resize: "none",
            border: "none",
            borderRadius: "22px",
            padding: "10px 16px",
            fontSize: "15px",
            minHeight: "44px",
            maxHeight: "120px",
            overflowY: "auto",
            boxShadow: "none",
          }}
        />

        {/* Send */}
        <button
          className="btn btn-success rounded-circle d-flex justify-content-center align-items-center"
          onClick={handleSend}
          style={{
            width: "44px",
            height: "44px",
            flexShrink: 0,
          }}
        >
          <i
            className="bi bi-send-fill"
            style={{
              fontSize: "18px",
              color: "white",
            }}
          ></i>
        </button>
      </div>
    </>
  );
}

export default MessageInput;
