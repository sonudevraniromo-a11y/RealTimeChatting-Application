import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BellRing,
  FileText,
  ImagePlus,
  Link2,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react";
import { getCurrentUserId } from "../utils/auth";

function ChatDetailsPanel({
  selectedConversation,
  isOnline,
  onClose,
  onToggleArchive,
  showDetails,
}) {
  const [actionMessage, setActionMessage] = useState("");
  const receiver = selectedConversation?.participants?.find(
    (p) => p._id !== getCurrentUserId(),
  );

  async function copyConversationId() {
    if (!selectedConversation) return;

    try {
      await navigator.clipboard.writeText(selectedConversation._id);
      setActionMessage("Conversation ID copied to clipboard.");
      setTimeout(() => setActionMessage(""), 2500);
    } catch (error) {
      setActionMessage("Unable to copy conversation ID.");
      setTimeout(() => setActionMessage(""), 2500);
    }
  }

  const sharedItems = useMemo(
    () => [
      { type: "photo", label: "Summer trip", icon: ImagePlus },
      { type: "file", label: "Project brief.pdf", icon: FileText },
      { type: "link", label: "Design review", icon: Link2 },
      { type: "star", label: "Saved message", icon: Star },
    ],
    [],
  );

  function handleQuickAction(label) {
    setActionMessage(`${label} preview is not available yet.`);
    setTimeout(() => setActionMessage(""), 2500);
  }

  return (
    <aside className={`chat-details-panel ${showDetails ? "active" : ""}`}>
      <div className="details-topbar">
        <div>
          <div className="details-label">Conversation details</div>
          <div className="details-status">
            <span
              className={isOnline ? "status-dot online" : "status-dot offline"}
            />
            {receiver
              ? isOnline
                ? "Online"
                : "Last seen recently"
              : "No active chat"}
          </div>
        </div>

        <button className="details-close-btn" type="button" onClick={onClose}>
          <ArrowLeft size={18} />
        </button>
      </div>

      <div className="profile-card">
        <div className="profile-avatar-wrap">
          <img
            className="profile-avatar"
            src={
              receiver?.avatar ||
              `https://ui-avatars.com/api/?background=25D366&color=fff&name=${receiver?.name || "User"}`
            }
            alt={receiver?.name || "User avatar"}
          />
          <span
            className={isOnline ? "status-dot online" : "status-dot offline"}
          />
        </div>

        <div className="profile-info">
          <h4>{receiver?.name || "Select a chat"}</h4>
          <p>
            {receiver
              ? "Premium conversation details and quick actions"
              : "Tap a chat to view shared media and contacts."}
          </p>
        </div>
      </div>

      <div className="details-section">
        <div className="details-section-header">
          <div>
            <span className="section-title">Shared media</span>
            <p className="section-subtitle">Photos, videos and files</p>
          </div>
          <BellRing size={18} />
        </div>

        <div className="media-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="media-thumb" />
          ))}
        </div>
      </div>

      <div className="details-section">
        <div className="details-section-header">
          <div>
            <span className="section-title">Quick actions</span>
            <p className="section-subtitle">
              Manage privacy, media and starred content
            </p>
          </div>
        </div>

        <div className="quick-actions">
          {sharedItems.map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              className="quick-action-btn"
              onClick={() => handleQuickAction(label)}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="details-section compact">
        <div className="details-section-header">
          <div>
            <span className="section-title">Security & support</span>
            <p className="section-subtitle">
              Encrypted, fast, and always private
            </p>
          </div>
        </div>

        <div className="status-list">
          <div className="status-item">
            <ShieldCheck size={16} />
            <div>
              <span>End-to-end encryption</span>
              <small>Message content is encrypted</small>
            </div>
          </div>

          <div className="status-item">
            <BellRing size={16} />
            <div>
              <span>Notifications</span>
              <small>Custom alerts for this chat</small>
            </div>
          </div>
        </div>
      </div>

      <div className="details-footer">
        <button
          className="details-action-btn danger"
          type="button"
          onClick={onToggleArchive}
        >
          <Trash2 size={16} />
          {selectedConversation?.archivedBy?.some(
            (user) =>
              user?.toString() === getCurrentUserId() ||
              user?._id === getCurrentUserId(),
          )
            ? "Unarchive"
            : "Archive"}
        </button>
        <button
          className="details-action-btn outline"
          type="button"
          onClick={copyConversationId}
        >
          <Star size={16} />
          Copy chat ID
        </button>
      </div>
      {actionMessage && (
        <div className="details-action-feedback">{actionMessage}</div>
      )}
    </aside>
  );
}

export default ChatDetailsPanel;
