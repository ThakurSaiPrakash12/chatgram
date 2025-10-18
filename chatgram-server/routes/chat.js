import express from "express";
import jwt from "jsonwebtoken";
import Chat from "../models/chat.js";
import User from "../models/User.js";

const router = express.Router();

// Helper function to get user from token
const getUserIdFromToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch (error) {
    return null;
  }
};

// Get all chats for a user
router.get("/:userId", async (req, res) => {
  try {
    const chats = await Chat.find({ users: req.params.userId }).populate("users", "-password");
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create or access one-on-one chat
router.post("/", async (req, res) => {
  const { userId } = req.body;
  const currentUserId = getUserIdFromToken(req);

  if (!currentUserId) {
    return res.status(401).json({ message: "Not authorized" });
  }

  if (!userId) {
    return res.status(400).json({ message: "UserId param not sent with request" });
  }

  try {
    // Check if chat exists
    const existingChat = await Chat.findOne({
      isGroupChat: false,
      users: { $all: [currentUserId, userId] },
    }).populate("users", "-password");

    if (existingChat) {
      return res.json(existingChat);
    }

    // Create new chat
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const chatData = {
      chatName: otherUser.name,
      isGroupChat: false,
      users: [currentUserId, userId],
    };

    const chat = await Chat.create(chatData);
    const fullChat = await Chat.findById(chat._id).populate("users", "-password");
    res.status(201).json(fullChat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create group chat
router.post("/group", async (req, res) => {
  const { name, users, groupImage } = req.body;
  const currentUserId = getUserIdFromToken(req);

  if (!currentUserId) {
    return res.status(401).json({ message: "Not authorized" });
  }

  if (!name || !users || users.length < 2) {
    return res.status(400).json({ 
      message: "Please provide group name and at least 2 users" 
    });
  }

  try {
    const groupChat = await Chat.create({
      chatName: name,
      isGroupChat: true,
      users: [...users, currentUserId],
      groupImage: groupImage || "",
    });

    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate("users", "-password");

    res.status(201).json(fullGroupChat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add member to group (any member can add)
router.put("/group/add", async (req, res) => {
  const { chatId, userId } = req.body;
  const currentUserId = getUserIdFromToken(req);

  if (!currentUserId) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const chat = await Chat.findById(chatId);
    
    if (!chat || !chat.isGroupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    // Check if current user is a member of the group
    if (!chat.users.some(user => user.toString() === currentUserId)) {
      return res.status(403).json({ message: "Only group members can add others" });
    }

    // Check if user is already in group
    if (chat.users.some(user => user.toString() === userId)) {
      return res.status(400).json({ message: "User already in group" });
    }

    const updated = await Chat.findByIdAndUpdate(
      chatId,
      { $push: { users: userId } },
      { new: true }
    )
      .populate("users", "-password");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove member from group (any member can remove anyone or themselves)
router.put("/group/remove", async (req, res) => {
  const { chatId, userId } = req.body;
  const currentUserId = getUserIdFromToken(req);

  if (!currentUserId) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const chat = await Chat.findById(chatId);
    
    if (!chat || !chat.isGroupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    // Check if current user is a member of the group
    if (!chat.users.some(user => user.toString() === currentUserId)) {
      return res.status(403).json({ message: "Only group members can remove others" });
    }

    // Check if user to remove is in the group
    if (!chat.users.some(user => user.toString() === userId)) {
      return res.status(400).json({ message: "User is not in the group" });
    }

    const updated = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      { new: true }
    )
      .populate("users", "-password");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update group image (any member can update)
router.put("/group/image", async (req, res) => {
  const { chatId, groupImage } = req.body;
  const currentUserId = getUserIdFromToken(req);

  if (!currentUserId) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const chat = await Chat.findById(chatId);
    
    if (!chat || !chat.isGroupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    // Check if current user is a member of the group
    if (!chat.users.some(user => user.toString() === currentUserId)) {
      return res.status(403).json({ message: "Only group members can update group image" });
    }

    const updated = await Chat.findByIdAndUpdate(
      chatId,
      { groupImage },
      { new: true }
    )
      .populate("users", "-password");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Leave group
router.put("/group/leave", async (req, res) => {
  const { chatId } = req.body;
  const currentUserId = getUserIdFromToken(req);

  if (!currentUserId) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const chat = await Chat.findById(chatId);
    
    if (!chat || !chat.isGroupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    // Admin cannot leave
    if (chat.groupAdmin.toString() === currentUserId) {
      return res.status(400).json({ message: "Admin must transfer ownership before leaving" });
    }

    const updated = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: currentUserId } },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
