const { Server } = require("socket.io");
const onlineUsers = require("./onlineUsers");
const { verifyAccessToken } = require("../services/tokenService");
const { setIO } = require("./io");
const User = require("../models/userSchema");

function initializeSocket(server) {
  const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
  ];

  const io = new Server(server, {
    cors: {
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    },
  });

  setIO(io);

  io.on("connection", (socket) => {
    socket.on("setup", async (token) => {
      try {
        const decoded = verifyAccessToken(token);

        onlineUsers.set(decoded.userId, socket.id);

        await User.findByIdAndUpdate(decoded.userId, {
          isOnline: true,
        });

        io.emit("online_users", Array.from(onlineUsers.keys()));
      } catch (error) {
        console.log("Invalid Token");
      }
    });

    socket.on("typing", ({ receiverId, senderId }) => {
      const receiverSocket = onlineUsers.get(receiverId);

      if (receiverSocket) {
        io.to(receiverSocket).emit("typing", {
          senderId,
        });
      }
    });

    socket.on("stop_typing", ({ receiverId }) => {
      const receiverSocket = onlineUsers.get(receiverId);

      if (receiverSocket) {
        io.to(receiverSocket).emit("stop_typing");
      }
    });

    socket.on("disconnect", async () => {
      console.log("User disconnected:", socket.id);

      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date(),
          });
          break;
        }
      }

      io.emit("online_users", Array.from(onlineUsers.keys()));
    });
  });

  return io;
}

module.exports = initializeSocket;
