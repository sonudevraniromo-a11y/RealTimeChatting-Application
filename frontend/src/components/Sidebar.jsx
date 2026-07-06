import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, Filter, LogOut, Search, Settings, Star } from "lucide-react";
import api from "../Services/api";
import { useSocket } from "../context/SocketContext";
import ConversationItem from "./ConversationItem";
import {
  getCurrentUser,
  getCurrentUserId,
  getCurrentUserName,
} from "../utils/auth";
import "../styles/chat.css";

function Sidebar({
  selectedConversation,
  setSelectedConversation,
  unreadChats,
  setUnreadChats,
}) {
  const [conversations, setConversations] = useState([]);
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [filter, setFilter] = useState("All");
  const navigate = useNavigate();
  const { socket, onlineUsers } = useSocket();

  const currentUser = getCurrentUser();
  const currentUserId = getCurrentUserId();
  const currentUserName = getCurrentUserName();

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

  const filteredConversations = conversations.filter((conversation) => {
    if (filter === "Unread") {
      return (
        conversation.unreadCount?.[currentUserId] > 0 ||
        conversation.unreadCount?.get?.(currentUserId) > 0
      );
    }

    if (filter === "Archived") {
      return conversation.archivedBy?.some(
        (user) => user === currentUserId || user?._id === currentUserId,
      );
    }

    return true;
  });

  const pinnedConversations = conversations
    .filter((conversation) => conversation.pinnedMessage)
    .slice(0, 3);
  const recentConversations = filteredConversations.filter(
    (conversation) => !conversation.pinnedMessage,
  );

  return (
    <aside className="chat-app chat-sidebar">
      <div className="sidebar-panel">
        <div className="sidebar-profile-bar">
          <div className="sidebar-avatar-wrap">
            <img
              className="conversation-avatar"
              src={`https://ui-avatars.com/api/?background=25D366&color=fff&name=${currentUserName}`}
              alt="Current user"
            />
            <span className="online-dot" />
          </div>

          <div className="sidebar-profile-text">
            <span className="sidebar-welcome">Welcome back</span>
            <h5>{currentUserName}</h5>
            <span className="sidebar-status">Active now</span>
          </div>

          <button
            type="button"
            className="icon-btn sidebar-settings-btn"
            onClick={() => navigate("/settings")}
            aria-label="Open settings"
          >
            <Settings size={18} />
          </button>
        </div>

        <div className="sidebar-search-bar">
          <Search size={18} />
          <input
            placeholder="Search chats or people"
            value={query}
            onChange={handleSearch}
          />
        </div>

        <div className="sidebar-filter-row">
          {[
            { label: "All", icon: Filter },
            { label: "Unread", icon: Star },
            { label: "Archived", icon: Archive },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              className={`btn-chip ${filter === option.label ? "active" : ""}`}
              onClick={() => setFilter(option.label)}
            >
              <option.icon size={14} />
              {option.label}
            </button>
          ))}
        </div>

        {searchResult.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">Search results</div>
            {searchResult.map((user) => (
              <button
                key={user._id}
                className="search-result-item"
                onClick={() => createConversation(user._id)}
                type="button"
              >
                <div>
                  <h6>{user.name}</h6>
                  <small>{user.email}</small>
                </div>
              </button>
            ))}
          </div>
        )}

        {pinnedConversations.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">Pinned chats</div>
            {pinnedConversations.map((conversation) => {
              const otherUser = conversation.participants.find(
                (user) => user._id !== currentUserId,
              );
              const isOnline = onlineUsers.includes(otherUser._id);
              return (
                <button
                  key={conversation._id}
                  type="button"
                  className="conversation-item compact"
                  onClick={() => openConversation(conversation)}
                >
                  <div className="conversation-avatar-wrap">
                    <img
                      className="conversation-avatar"
                      src={
                        otherUser.avatar ||
                        `https://ui-avatars.com/api/?background=25D366&color=fff&name=${otherUser.name}`
                      }
                      alt={otherUser.name}
                    />
                    {isOnline && <span className="online-dot" />}
                  </div>
                  <div className="conversation-info">
                    <span className="conversation-name">{otherUser.name}</span>
                    <span className="conversation-preview">
                      {conversation.lastMessage?.text || "Last message preview"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="sidebar-section">
          <div className="sidebar-section-title-row">
            <span>Recent chats</span>
            <span className="sidebar-count">{conversations.length}</span>
          </div>

          {recentConversations.map((conversation) => (
            <ConversationItem
              key={conversation._id}
              conversation={conversation}
              currentUserId={currentUserId}
              onlineUsers={onlineUsers}
              isActive={selectedConversation?._id === conversation._id}
              onSelect={openConversation}
            />
          ))}
        </div>
      </div>

      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-action-button"
          onClick={() => navigate("/settings")}
        >
          <Settings size={16} />
          Settings
        </button>
        <button
          type="button"
          className="sidebar-action-button danger"
          onClick={async () => {
            try {
              await api.post("/api/auth/logOut");
            } catch (error) {
              console.error(error);
            }
            localStorage.removeItem("token");
            navigate("/");
          }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
