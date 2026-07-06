import EmojiPicker from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  FileInput,
  Gift,
  ImagePlus,
  Mic,
  Send,
  Smile,
  Sticker,
} from "lucide-react";
import api from "../Services/api";
import { useSocket } from "../context/SocketContext";
import "../styles/chat.css";

function MessageInput({
  conversationId,
  receiverId,
  setMessages,
  replyMessage,
  setReplyMessage,
}) {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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
    textareaRef.current?.focus();
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  }

  async function handleSend() {
    if (!text.trim() && !image) return;

    try {
      const formData = new FormData();
      formData.append("conversationId", conversationId);
      formData.append("text", text);
      if (replyMessage) formData.append("replyTo", replyMessage._id);
      if (image) formData.append("image", image);

      await api.post("/api/message", formData);
      setText("");
      setImage(null);
      setPreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      socket.emit("stop_typing", { receiverId });
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
    <div className="chat-app message-input-shell">
      {preview && (
        <div className="input-preview-bar">
          <img className="input-preview-img" src={preview} alt="Preview" />
          <button
            className="btn-remove-image"
            type="button"
            onClick={() => {
              setImage(null);
              setPreview("");
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          >
            Remove
          </button>
        </div>
      )}

      <div
        className={`message-input-bar ${isDragging ? "drag-active" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="input-icon-group" ref={emojiRef}>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            aria-label="Open emoji picker"
          >
            <Smile size={18} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setShowEmojiPicker(false)}
            aria-label="Insert GIF"
          >
            <Gift size={18} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => fileInputRef.current.click()}
            aria-label="Attach media"
          >
            <ImagePlus size={18} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => fileInputRef.current.click()}
            aria-label="Attach file"
          >
            <FileInput size={18} />
          </button>

          {showEmojiPicker && (
            <div className="emoji-picker-popup">
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

        <div className="textarea-column">
          {replyMessage && (
            <div className="reply-bar">
              <div className="reply-bar-name">{replyMessage.sender.name}</div>
              <div className="reply-bar-text">
                {replyMessage.text || "📷 Photo"}
              </div>
              <button
                type="button"
                className="reply-bar-close"
                onClick={() => setReplyMessage(null)}
                aria-label="Cancel reply"
              >
                ✕
              </button>
            </div>
          )}

          <textarea
            ref={textareaRef}
            className="message-textarea"
            rows={1}
            placeholder="Type a message"
            value={text}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
          />

          <div className="input-footer-row">
            <span className="character-counter">{text.length}/1200</span>
            <div className="input-meta-actions">
              <button
                type="button"
                className="icon-btn small"
                aria-label="Camera"
              >
                <Camera size={16} />
              </button>
              <button
                type="button"
                className="icon-btn small"
                aria-label="Record voice"
              >
                <Mic size={16} />
              </button>
              <button
                type="button"
                className="icon-btn small"
                aria-label="Stickers"
              >
                <Sticker size={16} />
              </button>
            </div>
          </div>
        </div>

        <button
          className="send-btn"
          type="button"
          onClick={handleSend}
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}

export default MessageInput;
