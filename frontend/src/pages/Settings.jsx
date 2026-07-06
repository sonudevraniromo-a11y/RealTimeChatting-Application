import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Services/api";
import {
  LayoutGrid,
  Moon,
  SunMedium,
  Monitor,
  Bell,
  Volume2,
  ShieldCheck,
  User,
  Trash2,
} from "lucide-react";

function Settings() {
  const navigate = useNavigate();
  const [appearance, setAppearance] = useState("light");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [sound, setSound] = useState("Default");
  const [desktopAlerts, setDesktopAlerts] = useState(true);
  const [privacy, setPrivacy] = useState({
    lastSeen: true,
    readReceipts: true,
    profilePhoto: true,
  });
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem("chat_theme") || "light";
    const notifications =
      localStorage.getItem("chat_notifications") !== "false";
    const desktop = localStorage.getItem("chat_desktopAlerts") !== "false";
    const savedPrivacy = JSON.parse(
      localStorage.getItem("chat_privacy") || JSON.stringify(privacy),
    );

    setAppearance(theme);
    setNotificationsEnabled(notifications);
    setDesktopAlerts(desktop);
    setPrivacy(savedPrivacy);

    document.body.dataset.theme = theme;
  }, []);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await api.get("/profile");
        setProfile({
          name: response.data.user.name,
          email: response.data.user.email,
        });
      } catch (error) {
        console.error("Failed loading profile", error);
      }
    }

    loadProfile();
  }, []);

  function updateTheme(value) {
    const themeValue = value === "system" ? "light" : value;
    setAppearance(themeValue);
    localStorage.setItem("chat_theme", themeValue);
    document.body.dataset.theme = themeValue;
  }

  function updateNotifications(enabled) {
    setNotificationsEnabled(enabled);
    localStorage.setItem("chat_notifications", enabled);
  }

  function updateDesktopAlerts(enabled) {
    setDesktopAlerts(enabled);
    localStorage.setItem("chat_desktopAlerts", enabled);
  }

  function updatePrivacy(setting) {
    const updated = { ...privacy, [setting]: !privacy[setting] };
    setPrivacy(updated);
    localStorage.setItem("chat_privacy", JSON.stringify(updated));
  }

  function handleThemePreview() {
    const nextTheme = appearance === "dark" ? "light" : "dark";
    updateTheme(nextTheme);
    setMessage(`Preview switched to ${nextTheme} mode.`);
  }

  async function saveProfile() {
    setIsSaving(true);
    setMessage("");
    try {
      const response = await api.put("/api/user/profile", profile);
      setProfile(response.data.user);
      setIsEditingProfile(false);
      setMessage("Profile updated successfully.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAccount() {
    try {
      await api.delete("/api/user/me");
      localStorage.removeItem("token");
      navigate("/");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to delete account.");
    }
  }

  function handleEditProfile() {
    setIsEditingProfile(true);
    setMessage("");
  }

  function handleCancelEdit() {
    setIsEditingProfile(false);
    setMessage("");
  }

  return (
    <main className="settings-page container-fluid px-4 py-4">
      <div className="settings-hero">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Personalize your chat experience</h1>
          <p>
            Configure appearance, notifications, privacy, and chat behavior for
            your premium workspace.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary settings-cta"
          onClick={handleThemePreview}
        >
          <Monitor size={18} />
          App theme preview
        </button>
      </div>

      <div className="settings-grid">
        <section className="settings-card">
          <header>
            <div className="settings-icon bg-primary-soft">
              <LayoutGrid size={22} />
            </div>
            <div>
              <h2>Appearance</h2>
              <p>Light, dark, and wallpaper controls for your chat UI.</p>
            </div>
          </header>

          <div className="settings-group">
            <label className="form-label">Theme</label>
            <div className="d-flex gap-2 flex-wrap">
              {[
                { label: "Light", icon: SunMedium, value: "light" },
                { label: "Dark", icon: Moon, value: "dark" },
                { label: "System", icon: Monitor, value: "system" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`btn btn-sm ${appearance === option.value ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => updateTheme(option.value)}
                >
                  <option.icon size={16} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-group">
            <label className="form-label">Chat wallpaper</label>
            <div className="wallpaper-samples">
              <span />
              <span />
              <span />
            </div>
          </div>
        </section>

        <section className="settings-card">
          <header>
            <div className="settings-icon bg-secondary-soft">
              <Bell size={22} />
            </div>
            <div>
              <h2>Notifications</h2>
              <p>
                Keep notified for messages and sounds from your conversations.
              </p>
            </div>
          </header>

          <div className="form-check form-switch settings-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={notificationsEnabled}
              onChange={() => updateNotifications(!notificationsEnabled)}
              id="notifications-toggle"
            />
            <label className="form-check-label" htmlFor="notifications-toggle">
              Message notifications
            </label>
          </div>

          <div className="settings-group small-grid">
            <div>
              <label className="form-label">Sound</label>
              <select
                className="form-select"
                value={sound}
                onChange={(e) => setSound(e.target.value)}
              >
                <option value="Default">Default</option>
                <option value="Melody">Melody</option>
                <option value="Chime">Chime</option>
              </select>
            </div>
            <div>
              <label className="form-label">Desktop alerts</label>
              <select
                className="form-select"
                value={desktopAlerts ? "On" : "Off"}
                onChange={(e) => updateDesktopAlerts(e.target.value === "On")}
              >
                <option value="On">On</option>
                <option value="Off">Off</option>
              </select>
            </div>
          </div>
        </section>

        <section className="settings-card">
          <header>
            <div className="settings-icon bg-success-soft">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2>Privacy</h2>
              <p>
                Control who sees your activity and what information is shared.
              </p>
            </div>
          </header>

          <div className="form-check settings-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={privacy.lastSeen}
              onChange={() => updatePrivacy("lastSeen")}
              id="privacy-lastseen"
            />
            <label className="form-check-label" htmlFor="privacy-lastseen">
              Last seen
            </label>
          </div>
          <div className="form-check settings-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={privacy.profilePhoto}
              onChange={() => updatePrivacy("profilePhoto")}
              id="privacy-photo"
            />
            <label className="form-check-label" htmlFor="privacy-photo">
              Profile photo
            </label>
          </div>
          <div className="form-check settings-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={privacy.readReceipts}
              onChange={() => updatePrivacy("readReceipts")}
              id="privacy-read"
            />
            <label className="form-check-label" htmlFor="privacy-read">
              Read receipts
            </label>
          </div>
        </section>

        <section className="settings-card settings-card--accent">
          <header>
            <div className="settings-icon bg-muted-soft">
              <User size={22} />
            </div>
            <div>
              <h2>Account</h2>
              <p>
                Manage profile, security, connected devices and account actions.
              </p>
            </div>
          </header>

          <div className="settings-row">
            <div>
              <strong>Edit profile</strong>
              <p>Update your display name and email address.</p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={handleEditProfile}
            >
              Edit
            </button>
          </div>

          {isEditingProfile && (
            <div className="settings-profile-edit">
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                />
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={saveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="settings-row">
            <div>
              <strong>Desktop alerts</strong>
              <p>Enable or disable desktop notice banners for chats.</p>
            </div>
            <button
              type="button"
              className={`btn btn-sm ${desktopAlerts ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => updateDesktopAlerts(!desktopAlerts)}
            >
              {desktopAlerts ? "Enabled" : "Disabled"}
            </button>
          </div>

          <div className="settings-row settings-row--danger">
            <div>
              <strong>Delete account</strong>
              <p>Remove your account and personal data permanently.</p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={handleDeleteAccount}
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>

          {message && <div className="alert alert-info mt-3">{message}</div>}
        </section>
      </div>
    </main>
  );
}

export default Settings;
