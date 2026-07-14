import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import messageRoutes from "./routes/message.js";
import Chat from "./models/chat.js";

dotenv.config();
connectDB();

const app = express();

// Secure Express headers with Helmet
app.use(helmet());

// CORS configuration - secure and locked to client URL
const allowedOrigins = [
  "http://localhost:5173", // Local development
  process.env.CLIENT_URL,  // Production frontend URL
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.includes(origin) || 
                        (process.env.NODE_ENV !== "production" && origin.includes("vercel.app"));
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.log("Blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Reduce body size limits now that image size limits are enforced on routes
app.use(express.json({ limit: "6mb" }));
app.use(express.urlencoded({ limit: "6mb", extended: true }));

// Rate limiter for authentication routes
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 minutes
  message: { message: "Too many login/signup attempts, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", authRateLimiter);
app.use("/api/auth/signup", authRateLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

// Global Error Handling Middleware (Phase 13)
app.use((err, req, res, next) => {
  console.error("🔴 Server Error:", err.stack || err);
  
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid resource identifier" });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "Blocked by CORS policy" });
  }

  const status = err.status || 500;
  
  // Hide stack trace and database internals in production
  const message = process.env.NODE_ENV === "production" && status === 500
    ? "Internal Server Error"
    : err.message || "Something went wrong!";

  res.status(status).json({ message });
});

const server = http.createServer(app);

// Socket.IO Server with identical CORS configurations
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.includes(origin) || 
                        (process.env.NODE_ENV !== "production" && origin.includes("vercel.app"));
      callback(null, isAllowed);
    },
    credentials: true,
  },
});

// Socket.IO Authentication Middleware (Phase 7)
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error("Authentication error: Token missing"));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { id: decoded.id };
    next();
  } catch (err) {
    return next(new Error("Authentication error: Invalid or expired token"));
  }
});

// Presence Map: userId (string) => Set of socket.id (strings) (Phase 8)
const onlineUsers = new Map();

io.on("connection", (socket) => {
  const userId = socket.user.id;
  console.log(`🟢 User connected: ${userId} (Socket: ${socket.id})`);

  // Add socket to multi-device presence set
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socket.id);

  const presenceSnapshot = Array.from(onlineUsers.keys());

  // Send the complete current presence snapshot directly to the newly connected socket
  socket.emit("update_users", presenceSnapshot);

  // Broadcast the presence update to all other connected sockets
  socket.broadcast.emit("update_users", presenceSnapshot);

  // Secure room joining (Phase 9)
  socket.on("join_chat", async (chatId) => {
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return socket.emit("error", { message: "Invalid chatId" });
    }
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return socket.emit("error", { message: "Chat not found" });
      }
      
      const isMember = chat.users.some((u) => u.toString() === userId);
      if (!isMember) {
        return socket.emit("error", { message: "Not authorized to join this chat room" });
      }

      socket.join(chatId);
      console.log(`🚪 Socket ${socket.id} joined room: ${chatId}`);
    } catch (err) {
      socket.emit("error", { message: "Error joining chat room" });
    }
  });

  // typing: verify room membership before broadcasting (Phase 9)
  socket.on("typing", ({ chatId, userName }) => {
    if (socket.rooms.has(chatId)) {
      socket.to(chatId).emit("typing", { chatId, userName });
    }
  });

  // stop_typing: verify room membership before broadcasting (Phase 9)
  socket.on("stop_typing", ({ chatId }) => {
    if (socket.rooms.has(chatId)) {
      socket.to(chatId).emit("stop_typing", { chatId });
    }
  });

  // send_message: verify room membership before broadcasting (Phase 9)
  socket.on("send_message", (messageData) => {
    if (socket.rooms.has(messageData.chatId)) {
      socket.to(messageData.chatId).emit("receive_message", messageData);
    }
  });

  // delete_message: verify room membership before broadcasting (Phase 9)
  socket.on("delete_message", ({ messageId, chatId }) => {
    if (socket.rooms.has(chatId)) {
      console.log(`🗑️ Real-time message deletion sync: ${messageId} in room ${chatId}`);
      socket.to(chatId).emit("message_deleted", { messageId, chatId });
    }
  });

  socket.on("disconnect", () => {
    const userSockets = onlineUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsers.delete(userId);
        console.log(`🔴 User offline: ${userId}`);
      }
    }

    const presenceSnapshot = Array.from(onlineUsers.keys());

    // Broadcast updated list of online user IDs to all remaining sockets
    socket.broadcast.emit("update_users", presenceSnapshot);
    console.log(`🔴 Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || "development"}`);
});

// Architecture Comment for README & interview context (Phase 8):
// "The current presence store is process-local. Horizontal scaling across multiple Node.js instances
// would require shared presence state and a Socket.IO adapter such as Redis."
