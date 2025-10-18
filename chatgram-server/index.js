import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import messageRoutes from "./routes/message.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  credentials: true
}));
// Increase payload limit for base64 images (10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let onlineUsers = {}; // { userId: socket.id }

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("user_connected", (userId) => {
    onlineUsers[userId] = socket.id;
    io.emit("update_users", onlineUsers);
  });

  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
  });

  socket.on("typing", ({ chatId, userName }) => {
    socket.to(chatId).emit("typing", { chatId, userName });
  });

  socket.on("stop_typing", ({ chatId }) => {
    socket.to(chatId).emit("stop_typing", { chatId });
  });

  socket.on("send_message", (messageData) => {
    socket.to(messageData.chatId).emit("receive_message", messageData);
  });

  socket.on("disconnect", () => {
    for (let userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) delete onlineUsers[userId];
    }
    io.emit("update_users", onlineUsers);
    console.log("🔴 User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

