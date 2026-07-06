import { Info, MoreVertical, Phone, Search, Video } from "lucide-react";

export default function ChatHeader({
  receiver,
  typing,
  isOnline,
  onToggleDetails,
  onSearchClick,
  onAudioCall,
  onVideoCall,
}) {
  return (
    <div className="chat-header">
      <div className="chat-header-meta">
        <img
          className="chat-header-avatar"
          src={
            receiver?.avatar ||
            `https://ui-avatars.com/api/?background=25D366&color=fff&name=${receiver?.name || "User"}`
          }
          alt={receiver?.name || "Chat avatar"}
        />
        <div>
          <h3>{receiver?.name || "Select a chat"}</h3>
          <p className="chat-header-status">
            {typing ? "Typing..." : isOnline ? "Online" : "Last seen recently"}
          </p>
        </div>
      </div>

      <div className="chat-header-actions">
        <button
          type="button"
          aria-label="Search messages"
          onClick={onSearchClick}
        >
          <Search size={18} />
        </button>
        <button type="button" aria-label="Voice call" onClick={onAudioCall}>
          <Phone size={18} />
        </button>
        <button type="button" aria-label="Video call" onClick={onVideoCall}>
          <Video size={18} />
        </button>
        <button
          type="button"
          aria-label="Chat details"
          onClick={onToggleDetails}
        >
          <Info size={18} />
        </button>
        <button
          type="button"
          aria-label="More options"
          onClick={onToggleDetails}
        >
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  );
}
