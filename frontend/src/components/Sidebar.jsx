import { useEffect, useState } from "react";
import api from "../Services/api";
import { useSocket } from "../context/SocketContext";

function Sidebar({
  selectedConversation,
  setSelectedConversation,
  unreadChats,
  setUnreadChats,
}) {
  const [conversations, setConversations] = useState([]);
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState([]);

  const { socket, onlineUsers } = useSocket();

  const currentUserId = JSON.parse(
    atob(localStorage.getItem("token").split(".")[1]),
  ).userId;

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    socket.on("conversation_updated", fetchConversations);

    return () => {
      socket.off("conversation_updated", fetchConversations);
    };
  }, [socket]);

  async function fetchConversations() {
    try {
      const response = await api.get("/api/conversation");
      setConversations(response.data.conversations);
    } catch (error) {
      console.log(error);
    }
  }

  async function handleSearch(e) {
    const value = e.target.value;

    setQuery(value);

    if (!value.trim()) {
      setSearchResult([]);
      return;
    }

    try {
      const response = await api.get(`/api/user/search?query=${value}`);

      setSearchResult(response.data);
    } catch (error) {
      console.log(error);
    }
  }

  async function createConversation(receiverId) {
    try {
      const response = await api.post("/api/conversation", {
        receiverId,
      });

      setSelectedConversation(response.data.conversation);

      await fetchConversations();

      setQuery("");
      setSearchResult([]);
    } catch (error) {
      console.log(error);
    }
  }

  async function openConversation(conversation) {
    try {
      setSelectedConversation(conversation);

      await api.patch(`/api/conversation/${conversation._id}/read`);

      fetchConversations();
    } catch (error) {
      console.log(error);
    }
  }
  return (
    <div
      style={{
        width: "360px",
        borderRight: "1px solid #ddd",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
      }}
    >
      <div
        className="d-flex align-items-center justify-content-between px-3"
        style={{
          height: "70px",
          background: "#F0F2F5",
          borderBottom: "1px solid #ddd",
        }}
      >
        <h4 className="m-0">Chats</h4>

        <button
          className="btn btn-light"
          style={{
            borderRadius: "50%",
            width: "40px",
            height: "40px",
          }}
        >
          +
        </button>
      </div>

      <div className="p-3">
        <input
          className="form-control"
          placeholder="🔍 Search users..."
          value={query}
          onChange={handleSearch}
          style={{
            borderRadius: "25px",
            background: "#F5F5F5",
            border: "none",
            padding: "12px 18px",
            boxShadow: "none",
          }}
        />
      </div>

      {searchResult.length > 0 && (
        <>
          <div className="px-3">
            <strong>Search Results</strong>
          </div>

          {searchResult.map((user) => (
            <div
              key={user._id}
              className="p-3 border-bottom"
              style={{ cursor: "pointer" }}
              onClick={() => createConversation(user._id)}
            >
              <h6>{user.name}</h6>
              <small>{user.email}</small>
            </div>
          ))}

          <hr />
        </>
      )}

      <div className="px-3">
        <strong>Conversations</strong>
      </div>

      {conversations.map((conversation) => {
        const otherUser = conversation.participants.find(
          (user) => user._id !== currentUserId,
        );

        const unreadCount = conversation.unreadCount?.[currentUserId] || 0;

        const isOnline = onlineUsers.includes(otherUser._id);

        return (
          <div
            key={conversation._id}
            onClick={() => openConversation(conversation)}
            className="d-flex align-items-center px-3"
            style={{
              cursor: "pointer",
              height: "78px",
              borderBottom: "1px solid #f0f0f0",
              background:
                selectedConversation?._id === conversation._id
                  ? "#F0F2F5"
                  : "#fff",
              transition: "0.2s",
            }}
            onMouseEnter={(e) => {
              if (selectedConversation?._id !== conversation._id)
                e.currentTarget.style.background = "#f8f9fa";
            }}
            onMouseLeave={(e) => {
              if (selectedConversation?._id !== conversation._id)
                e.currentTarget.style.background = "#fff";
            }}
          >
            <div style={{ position: "relative" }}>
              <img
                src={
                  otherUser.avatar ||
                  `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${otherUser.name}`
                }
                alt=""
                style={{
                  width: 55,
                  height: 55,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />

              {isOnline && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 2,
                    right: 2,
                    width: 13,
                    height: 13,
                    borderRadius: "50%",
                    background: "#25D366",
                    border: "2px solid white",
                  }}
                />
              )}
            </div>

            <div
              style={{
                marginLeft: 15,
                flex: 1,
                overflow: "hidden",
              }}
            >
              <div className="d-flex justify-content-between">
                <strong>{otherUser.name}</strong>

                <small style={{ color: "#888" }}>
                  {conversation.lastMessage
                    ? new Date(
                        conversation.lastMessage.createdAt,
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </small>
              </div>

              <div
                style={{
                  color: "#666",
                  fontSize: "14px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {conversation.lastMessage?.text || "Start chatting"}
              </div>
            </div>

            {unreadCount > 0 && (
              <div
                style={{
                  minWidth: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "#25D366",
                  color: "#fff",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: 12,
                  fontWeight: "bold",
                  marginLeft: 8,
                }}
              >
                {unreadCount}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Sidebar;
