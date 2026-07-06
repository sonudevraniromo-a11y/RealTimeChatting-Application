import { useEffect, useState, useRef } from "react";
import api from "../Services/api";
import { useSocket } from "../context/SocketContext";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ImageModal from "./ImageModal";
import ChatDetailsPanel from "./ChatDetailsPanel";
import { getCurrentUserId } from "../utils/auth";
import "../styles/chat.css";

function ChatWindow({ selectedConversation, setSelectedConversation }) {
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const { socket, onlineUsers } = useSocket();
  const [replyMessage, setReplyMessage] = useState(null);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [search, setSearch] = useState("");
  const [matchedMessages, setMatchedMessages] = useState([]);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const bottomRef = useRef(null);
  const firstLoad = useRef(true);
  const messageRefs = useRef({});
  const messagesAreaRef = useRef(null);

  const currentUserId = getCurrentUserId();

  function handleSearch(e) {
    const value = e.target.value;

    setSearch(value);

    if (!value.trim()) {
      setMatchedMessages([]);
      setCurrentMatch(0);
      return;
    }

    const matches = messages.filter((m) =>
      m.text?.toLowerCase().includes(value.toLowerCase()),
    );

    setMatchedMessages(matches);
    setCurrentMatch(0);

    if (matches.length) {
      scrollToMessage(matches[0]._id);
    }
  }

  function scrollToMessage(id) {
    const el = messageRefs.current[id];

    if (!el) return;

    el.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    el.classList.add("highlight");

    setTimeout(() => {
      el.classList.remove("highlight");
    }, 2000);
  }

  function handleSearchKeyDown(e) {
    if (e.key !== "Enter") return;
    if (!matchedMessages.length) return;

    const next = (currentMatch + 1) % matchedMessages.length;
    setCurrentMatch(next);
    scrollToMessage(matchedMessages[next]._id);
  }

  function showStatus(message) {
    setStatusMessage(message);
    setTimeout(() => {
      setStatusMessage("");
    }, 3000);
  }

  useEffect(() => {
    if (firstLoad.current) {
      bottomRef.current?.scrollIntoView();
      firstLoad.current = false;
    } else {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    firstLoad.current = true;
    async function loadConversation() {
      if (!selectedConversation) return;

      try {
        const response = await api.get(
          `/api/message/${selectedConversation._id}`,
        );

        setMessages(response.data.messages);
        setPinnedMessage(response.data.conversation.pinnedMessage || null);
        await api.patch(`/api/message/seen/${selectedConversation._id}`);
      } catch (error) {
        console.log(error);
      }
    }

    loadConversation();
  }, [selectedConversation]);

  useEffect(() => {
    const handleReceiveMessage = async (message) => {
      if (
        selectedConversation &&
        message.conversation.toString() === selectedConversation._id.toString()
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });

        try {
          await api.patch(`/api/message/seen/${selectedConversation._id}`);
          await api.patch(`/api/conversation/${selectedConversation._id}/read`);
        } catch (error) {
          console.log(error);
        }
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [selectedConversation, socket]);

  useEffect(() => {
    const handleReaction = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? {
                ...m,
                reactions,
              }
            : m,
        ),
      );
    };

    socket.on("message_reaction", handleReaction);
    return () => {
      socket.off("message_reaction", handleReaction);
    };
  }, [socket]);

  useEffect(() => {
    const handleStar = ({ messageId, starredBy }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? {
                ...m,
                starredBy,
              }
            : m,
        ),
      );
    };

    socket.on("message_starred", handleStar);
    return () => socket.off("message_starred", handleStar);
  }, [socket]);

  useEffect(() => {
    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                deletedForEveryone: true,
                text: "",
                image: "",
              }
            : msg,
        ),
      );
    };

    socket.on("message_deleted", handleMessageDeleted);
    return () => {
      socket.off("message_deleted", handleMessageDeleted);
    };
  }, [socket]);

  useEffect(() => {
    const handleSeen = ({ conversationId }) => {
      if (
        !selectedConversation ||
        selectedConversation._id.toString() !== conversationId.toString()
      ) {
        return;
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.sender._id === currentUserId ? { ...msg, seen: true } : msg,
        ),
      );
    };

    socket.on("messages_seen", handleSeen);
    return () => {
      socket.off("messages_seen", handleSeen);
    };
  }, [currentUserId, selectedConversation, socket]);

  useEffect(() => {
    const handleEdited = ({ messageId, text, edited }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? {
                ...m,
                text,
                edited,
              }
            : m,
        ),
      );
    };

    socket.on("message_edited", handleEdited);
    return () => {
      socket.off("message_edited", handleEdited);
    };
  }, [socket]);

  useEffect(() => {
    const handleTyping = ({ senderId }) => {
      const receiver = selectedConversation?.participants.find(
        (p) => p._id !== currentUserId,
      );

      if (receiver && receiver._id === senderId) {
        setTyping(true);
      }
    };

    const handleStopTyping = () => {
      setTyping(false);
    };

    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
    };
  }, [selectedConversation, socket]);

  useEffect(() => {
    const handlePinned = ({ conversationId, pinnedMessage }) => {
      if (selectedConversation && selectedConversation._id === conversationId) {
        setPinnedMessage(pinnedMessage);
      }
    };

    socket.on("message_pinned", handlePinned);
    return () => {
      socket.off("message_pinned", handlePinned);
    };
  }, [socket, selectedConversation]);

  async function toggleConversationArchive() {
    if (!selectedConversation) return;

    try {
      const response = await api.patch(
        `/api/conversation/${selectedConversation._id}/archive`,
      );

      setSelectedConversation((prev) => ({
        ...prev,
        archivedBy: response.data.conversation.archivedBy,
      }));
    } catch (error) {
      console.error(error);
    }
  }

  if (!selectedConversation) {
    return (
      <div className="chat-app chat-window-empty">
        <div className="empty-state-card">
          <h2>Pick a conversation</h2>
          <p>
            Your polished chat workspace is waiting. Select a chat to start
            messaging.
          </p>
        </div>
      </div>
    );
  }

  const receiver = selectedConversation.participants.find(
    (p) => p._id !== currentUserId,
  );
  const isOnline = onlineUsers.includes(receiver._id);

  return (
    <div className="chat-app chat-window-layout">
      <div className="chat-window">
        <ChatHeader
          receiver={receiver}
          typing={typing}
          isOnline={isOnline}
          onToggleDetails={() => setShowDetails((prev) => !prev)}
          onSearchClick={() => document.getElementById("chat-search")?.focus()}
          onAudioCall={() => showStatus("Voice call coming soon.")}
          onVideoCall={() => showStatus("Video call coming soon.")}
        />

        {statusMessage && (
          <div className="chat-status-notice">{statusMessage}</div>
        )}

        <div className="chat-search-bar">
          <input
            id="chat-search"
            className="form-control"
            placeholder="Search messages in this chat"
            value={search}
            onChange={handleSearch}
            onKeyDown={handleSearchKeyDown}
          />
          <small className="text-muted">
            Press Enter to move through matches ({matchedMessages.length})
          </small>
        </div>

        {pinnedMessage && (
          <div className="pinned-banner">
            <div className="pinned-label">Pinned</div>
            <button
              type="button"
              className="pinned-text"
              onClick={() => {
                messageRefs.current[pinnedMessage._id]?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }}
            >
              {pinnedMessage.image ? "📷 Photo" : pinnedMessage.text}
            </button>
          </div>
        )}

        <div className="messages-area" ref={messagesAreaRef}>
          <MessageList
            messages={messages}
            currentUserId={currentUserId}
            messageRefs={messageRefs}
            setMessages={setMessages}
            setReplyMessage={setReplyMessage}
            openImage={setPreviewImage}
            bottomRef={bottomRef}
          />
        </div>

        <MessageInput
          conversationId={selectedConversation._id}
          receiverId={receiver._id}
          setMessages={setMessages}
          replyMessage={replyMessage}
          setReplyMessage={setReplyMessage}
        />
      </div>

      <ChatDetailsPanel
        selectedConversation={selectedConversation}
        isOnline={isOnline}
        onClose={() => setShowDetails(false)}
        onToggleArchive={toggleConversationArchive}
        showDetails={showDetails}
      />

      <ImageModal image={previewImage} onClose={() => setPreviewImage("")} />
    </div>
  );
}

export default ChatWindow;
