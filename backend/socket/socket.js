const { Server } = require("socket.io");
const onlineUsers = require("./onlineUsers");
const { verifyAccessToken } = require("../services/tokenService");
const { setIO } = require("./io");

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  setIO(io);

  io.on("connection", (socket) => {
    console.log("A user connected");
    console.log("Socket ID:", socket.id);

    socket.on("setup", (token) => {
      try {
        const decoded = verifyAccessToken(token);

        onlineUsers.set(decoded.userId, socket.id);

        io.emit("online_users", Array.from(onlineUsers.keys()));

        console.log(onlineUsers);
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

    

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }

      io.emit("online_users", Array.from(onlineUsers.keys()));
    });
  });

  return io;
}

module.exports = initializeSocket;