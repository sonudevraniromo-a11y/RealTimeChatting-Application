const express = require("express");
const {
  changePassword,
  deleteUser,
  changeRole,
  getAllUsers,
  searchUsers,
  updateProfile,
  deleteAccount,
  toggleBlockUser,
  getBlockedUsers,
} = require("../controllers/userControllers");
const adminMiddleware = require("../middlewares/adminMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const { changePasswordValidator } = require("../validator/authValidator");
const validateRequest = require("../middlewares/validateRequest");
const route = express.Router();

route.get("/admin", authMiddleware, adminMiddleware, (req, res) => {
  res.json({
    message: "Welcome Admin",
  });
});

route.delete("/:id", authMiddleware, adminMiddleware, deleteUser);
route.patch("/:id/role", authMiddleware, adminMiddleware, changeRole);
route.get("/users", authMiddleware, adminMiddleware, getAllUsers);
route.put(
  "/change-password",
  authMiddleware,
  changePasswordValidator,
  validateRequest,
  changePassword,
);
route.get("/search", authMiddleware, searchUsers);
route.put("/profile", authMiddleware, updateProfile);
route.delete("/me", authMiddleware, deleteAccount);
route.patch("/block/:userId", authMiddleware, toggleBlockUser);
route.get("/blocked", authMiddleware, getBlockedUsers);

module.exports = route;
