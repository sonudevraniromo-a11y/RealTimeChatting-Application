const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },

  resetPasswordToken: {
    type: String,
  },

  resetPasswordExpires: {
    type: Date,
  },

  isVerified: {
    type: Boolean,
    default: false,
  },

  verificationToken: {
    type: String,
  },

  refreshTokens: [
    {
      type: String,
    },
  ],

  avatar: {
    type: String,
    default: "",
  },

  isOnline: {
    type: Boolean,
    default: false,
  },

  lastSeen: {
    type: Date,
    default: Date.now,
  },

  blockedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },

  preferences: {
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "light",
    },
    sound: {
      type: String,
      default: "default",
    },
    desktopAlerts: {
      type: Boolean,
      default: true,
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
  },

  privacy: {
    lastSeen: {
      type: Boolean,
      default: true,
    },
    readReceipts: {
      type: Boolean,
      default: true,
    },
    profilePhoto: {
      type: Boolean,
      default: true,
    },
  },
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
