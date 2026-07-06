require("dotenv").config();
const {
  login,
  refresh,
  register,
  profile,
} = require("./controllers/authControllers");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const connectDB = require("./config/db");
const cors = require("cors");
const authMiddleware = require("./middlewares/authMiddleware");

const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgon = require("morgan");
const errorMiddleware = require("./middlewares/errorMiddleware");
const path = require("path");

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

connectDB();

app.use(express.json());
app.use(cookieParser());
// app.use(
//   helmet({
//     crossOriginResourcePolicy: false,

//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         imgSrc: ["'self'", "data:", "import.meta.env.VITE_API_URL"],
//       },
//     },
//   }),
// );
app.use(morgon("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/conversation", conversationRoutes);
app.use("/api/message", messageRoutes);
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "no-store");
    },
  }),
);

app.use(errorMiddleware);
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "no-store");
    },
  }),
);

app.get("/", (req, res) => {
  res.send("backend running");
});

app.get("/profile", authMiddleware, profile);

const http = require("http");
const initializeSocket = require("./socket/socket");

const server = http.createServer(app);

const io = initializeSocket(server);

const PORT = process.env.PORT || 5000;

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Please stop the process using it or set a different PORT.`,
    );
    process.exit(1);
  }
  console.error("Server error:", error);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`server is running at port : ${PORT}`);
});
