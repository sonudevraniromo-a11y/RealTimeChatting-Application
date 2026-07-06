const { response } = require("express");
const User = require("../models/userSchema");
const bcrypt = require("bcrypt");

exports.deleteUser = async (req, res) => {
  try {
    if (req.user.userId === req.params.id) {
      return res.status(400).json({
        message: "you cannot delete yourself",
      });
    }
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "userNOTFound",
      });
    }

    res.json({
      message: "user Delete SuccessFully ",
    });
  } catch (error) {
    res.status(500).json({
      message: " server Error ",
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find(
      { _id: { $ne: req.user.userId } },
      "-password",
    );

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Get All Users Server Error",
    });
  }
};

exports.changeRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        message: "user Not found",
      });
    }

    user.role = user.role === "admin" ? "user" : "admin";

    await user.save();

    res.json({
      message: "role Updated",
      user,
    });
  } catch (err) {
    res.status(500).json({
      message: "server Error",
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({
          message: "Email is already in use",
        });
      }
      user.email = email;
    }

    if (name) {
      user.name = name;
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    await User.findByIdAndDelete(userId);
    res.clearCookie("refreshToken");
    res.json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.toggleBlockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findById(req.user.userId);
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        message: "User to block not found",
      });
    }

    const blockedIndex = currentUser.blockedUsers.findIndex(
      (id) => id.toString() === userId,
    );

    if (blockedIndex === -1) {
      currentUser.blockedUsers.push(userId);
    } else {
      currentUser.blockedUsers.splice(blockedIndex, 1);
    }

    await currentUser.save();

    res.json({
      message: blockedIndex === -1 ? "User blocked" : "User unblocked",
      blockedUsers: currentUser.blockedUsers,
    });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId).populate(
      "blockedUsers",
      "name email avatar",
    );

    res.json({
      blockedUsers: currentUser.blockedUsers,
    });
  } catch (error) {
    console.error("Get blocked users error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(401).json({
        message: "user not Exist",
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Old password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    res.json({
      message: "password changed Successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    const users = await User.find({
      _id: { $ne: req.user.userId },
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    }).select("name email avatar");

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Search failed",
    });
  }
};
