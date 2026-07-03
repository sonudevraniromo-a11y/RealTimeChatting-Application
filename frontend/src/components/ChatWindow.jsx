import { useEffect, useState , useRef} from "react";
import api from "../Services/api";
import Message from "./Message";
import MessageInput from "./MessageInput";
import { useSocket } from "../context/SocketContext";
import ImageModal from "./ImageModal";

function ChatWindow({ selectedConversation }) {
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const { socket , onlineUsers } = useSocket();
  const [replyMessage, setReplyMessage] = useState(null);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [search, setSearch] = useState("");
  const [matchedMessages, setMatchedMessages] = useState([]);
  const [currentMatch, setCurrentMatch] = useState(0);

  const bottomRef = useRef(null);
  const messageRefs = useRef({});


  const currentUserId = JSON.parse(
    atob(localStorage.getItem("token").split(".")[1]),
  ).userId;
  

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

  //scrollIntoview
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);
  
  //loadConversation
  useEffect(() => {
    async function loadConversation() {
      if (!selectedConversation) return;
      
      try {
        const response = await api.get(
          `/api/message/${selectedConversation._id}`,
        );
        
        setMessages(response.data.messages);
        setPinnedMessage(response.data.conversation.pinnedMessage || null );
        
        await api.patch(`/api/message/seen/${selectedConversation._id}`);
      } catch (error) {
        console.log(error);
      }
    }
    
    loadConversation();
  }, [selectedConversation]);
  
  // handleRecieveMessage
  useEffect(() => {
    const handleReceiveMessage = async (message) => {
        console.log("SOCKET:", message);
      if (
        selectedConversation &&
        message.conversation.toString() === selectedConversation._id.toString()
      ) {
        
       setMessages((prev) => {
         if (prev.some((m) => m._id === message._id)) {
           return prev;
         }

         return [...prev, message];
       });
        
        try {
          await api.patch(
            `/api/message/seen/${selectedConversation._id}`
          );
          
          await api.patch(
            `/api/conversation/${selectedConversation._id}/read`
          );
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

  // handleReaction
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

  // handlestar
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


  // handleMessageDeleted
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

  //handleSeen
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
}, [currentUserId , selectedConversation, socket]);

// handleEdited
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

// handleTyping 
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

//handlePinned 
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

if (!selectedConversation) {
  return (
    <div className="flex-grow-1 d-flex justify-content-center align-items-center">
        Select a conversation
      </div>
    );
  }
  
  const receiver = selectedConversation.participants.find(
    (p) => p._id !== currentUserId,
  );

  const isOnline = onlineUsers.includes(receiver._id);

  return (
    <div className="flex-grow-1 d-flex flex-column">
      <div
        className="d-flex align-items-center px-3"
        style={{
          height: "70px",
          background: "#F0F2F5",
          borderBottom: "1px solid #ddd",
        }}
      >
        <img
          src={
            receiver.avatar ||
            `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${receiver.name}`
          }
          alt=""
          style={{
            width: 45,
            height: 45,
            borderRadius: "50%",
            marginRight: 12,
          }}
        />

        <div>
          <div style={{ fontWeight: 600 }}>{receiver.name}</div>

          <small style={{ color: "#666" }}>
            {typing ? "Typing..." : isOnline ? "Online" : "Offline"}
          </small>
        </div>
        <div className="ms-auto" style={{ width: "250px" }}>
          <input
            className="form-control form-control-sm"
            placeholder="Search..."
            value={search}
            onChange={handleSearch}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
      </div>

      {pinnedMessage && (
        <div
          className="px-3 py-2"
          style={{
            background: "#FFF8D6",
            borderBottom: "1px solid #ddd",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: 12 }}>📌 Pinned Message</div>

          <div
            onClick={() => {
              messageRefs.current[pinnedMessage._id]?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }}
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {pinnedMessage.image ? "📷 Photo" : pinnedMessage.text}
          </div>
        </div>
      )}

      <div
        className="flex-grow-1 px-4 py-3"
        style={{ overflowY: "auto", background: "#E5DDD5" }}
      >
        {messages.map((message) => (
          <Message
            key={message._id}
            message={message}
            currentUserId={currentUserId}
            openImage={setPreviewImage}
            setMessages={setMessages}
            setReplyMessage={setReplyMessage}
            messageRefs={messageRefs}
          />
        ))}
        <div ref={bottomRef}></div>
      </div>

      <MessageInput
        conversationId={selectedConversation._id}
        receiverId={receiver._id}
        setMessages={setMessages}
        replyMessage={replyMessage}
        setReplyMessage={setReplyMessage}
      />
      <ImageModal image={previewImage} onClose={() => setPreviewImage("")} />
    </div>
  );
}

export default ChatWindow;
