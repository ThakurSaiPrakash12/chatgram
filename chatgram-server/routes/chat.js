import express from "express";
import Chat from "../models/chat.js";
import User from "../models/user.js";
import Message from "../models/message.js";
import { protect } from "../middleware/authMiddleware.js";
import { isValidObjectId, validateBase64Image } from "../utils/validation.js";

const router = express.Router();

// ---------------------------------------------------------------------------
// GET /api/chats
// Protected — fetches all chats for the authenticated user
// ---------------------------------------------------------------------------
router.get("/", protect, async (req, res, next) => {
  try {
    const chats = await Chat.find({ users: req.user.id })
      .populate("users", "name email profilePic about")
      .populate("groupAdmin", "name email profilePic")
      .select("chatName isGroupChat users groupImage groupAdmin updatedAt")
      .sort({ updatedAt: -1 })
      .lean()
      .limit(100);
    res.json(chats);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/chats
// Protected — create or access one-on-one chat
// ---------------------------------------------------------------------------
router.post("/", protect, async (req, res, next) => {
  const { userId } = req.body;
  const currentUserId = req.user.id;

  if (!userId) {
    return res.status(400).json({ message: "userId parameter is required" });
  }

  if (!isValidObjectId(userId)) {
    return res.status(400).json({ message: "Invalid target user ID" });
  }

  if (userId === currentUserId) {
    return res.status(400).json({ message: "Cannot start a chat with yourself" });
  }

  try {
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if chat exists
    let existingChat = await Chat.findOne({
      isGroupChat: false,
      users: { $all: [currentUserId, userId] },
    }).populate("users", "-password");

    if (existingChat) {
      return res.json(existingChat);
    }

    // Create new chat
    const chatData = {
      chatName: otherUser.name,
      isGroupChat: false,
      users: [currentUserId, userId],
    };

    const chat = await Chat.create(chatData);
    const fullChat = await Chat.findById(chat._id).populate("users", "-password");
    res.status(201).json(fullChat);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/chats/group
// Protected — Create group chat
// ---------------------------------------------------------------------------
router.post("/group", protect, async (req, res, next) => {
  const { name, users, groupImage } = req.body;
  const currentUserId = req.user.id;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Group name is required" });
  }

  if (!users || !Array.isArray(users) || users.length < 2) {
    return res.status(400).json({ message: "Please provide a group name and at least 2 other users" });
  }

  // Validate all user IDs and ensure they don't contain current user (which is added automatically)
  const uniqueUserIds = [...new Set(users.filter(id => id !== currentUserId))];
  for (const id of uniqueUserIds) {
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: `Invalid user ID: ${id}` });
    }
  }

  if (uniqueUserIds.length < 2) {
    return res.status(400).json({ message: "A group must have at least 2 other distinct members" });
  }

  if (groupImage) {
    const imgCheck = validateBase64Image(groupImage);
    if (!imgCheck.valid) {
      return res.status(400).json({ message: imgCheck.message });
    }
  }

  try {
    // Verify that all users exist
    const userCount = await User.countDocuments({ _id: { $in: uniqueUserIds } });
    if (userCount !== uniqueUserIds.length) {
      return res.status(404).json({ message: "One or more group members do not exist" });
    }

    const groupChat = await Chat.create({
      chatName: name.trim(),
      isGroupChat: true,
      users: [...uniqueUserIds, currentUserId],
      groupImage: groupImage || "",
      groupAdmin: currentUserId, // Set creator as admin
    });

    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(201).json(fullGroupChat);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PUT /api/chats/group/add
// Protected — Add member to group (Group Admin Only)
// ---------------------------------------------------------------------------
router.put("/group/add", protect, async (req, res, next) => {
  const { chatId, userId } = req.body;
  const currentUserId = req.user.id;

  if (!chatId || !userId) {
    return res.status(400).json({ message: "chatId and userId are required" });
  }

  if (!isValidObjectId(chatId) || !isValidObjectId(userId)) {
    return res.status(400).json({ message: "Invalid chatId or userId" });
  }

  try {
    const chat = await Chat.findById(chatId);
    
    if (!chat || !chat.isGroupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    // GROUP ADMIN ONLY check
    if (!chat.groupAdmin || chat.groupAdmin.toString() !== currentUserId) {
      return res.status(403).json({ message: "Only group admins can add members" });
    }

    // Check if user is already in group
    if (chat.users.some(user => user.toString() === userId)) {
      return res.status(400).json({ message: "User already in group" });
    }

    // Verify user exists
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return res.status(404).json({ message: "User to add not found" });
    }

    const updated = await Chat.findByIdAndUpdate(
      chatId,
      { $push: { users: userId } },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PUT /api/chats/group/remove
// Protected — Remove member from group (Group Admin Only)
// Note: If removing yourself, use the /group/leave endpoint.
// ---------------------------------------------------------------------------
router.put("/group/remove", protect, async (req, res, next) => {
  const { chatId, userId } = req.body;
  const currentUserId = req.user.id;

  if (!chatId || !userId) {
    return res.status(400).json({ message: "chatId and userId are required" });
  }

  if (!isValidObjectId(chatId) || !isValidObjectId(userId)) {
    return res.status(400).json({ message: "Invalid chatId or userId" });
  }

  try {
    const chat = await Chat.findById(chatId);
    
    if (!chat || !chat.isGroupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    // If the user tries to remove themselves, redirect them to leave endpoint behavior
    if (userId === currentUserId) {
      return res.status(400).json({ message: "Use the leave endpoint to leave the group" });
    }

    // GROUP ADMIN ONLY check
    if (!chat.groupAdmin || chat.groupAdmin.toString() !== currentUserId) {
      return res.status(403).json({ message: "Only group admins can remove members" });
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
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PUT /api/chats/group/image
// Protected — Update group image (Group Admin Only)
// ---------------------------------------------------------------------------
router.put("/group/image", protect, async (req, res, next) => {
  const { chatId, groupImage } = req.body;
  const currentUserId = req.user.id;

  if (!chatId) {
    return res.status(400).json({ message: "chatId is required" });
  }

  if (!isValidObjectId(chatId)) {
    return res.status(400).json({ message: "Invalid chatId" });
  }

  if (groupImage) {
    const imgCheck = validateBase64Image(groupImage);
    if (!imgCheck.valid) {
      return res.status(400).json({ message: imgCheck.message });
    }
  }

  try {
    const chat = await Chat.findById(chatId);
    
    if (!chat || !chat.isGroupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    // GROUP ADMIN ONLY check
    if (!chat.groupAdmin || chat.groupAdmin.toString() !== currentUserId) {
      return res.status(403).json({ message: "Only group admins can update group image" });
    }

    const updated = await Chat.findByIdAndUpdate(
      chatId,
      { groupImage: groupImage || "" },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PUT /api/chats/group/leave
// Protected — Leave group (Any Group Member)
// If admin leaves: Promote another member as admin (Option B).
// ---------------------------------------------------------------------------
router.put("/group/leave", protect, async (req, res, next) => {
  const { chatId } = req.body;
  const currentUserId = req.user.id;

  if (!chatId) {
    return res.status(400).json({ message: "chatId is required" });
  }

  if (!isValidObjectId(chatId)) {
    return res.status(400).json({ message: "Invalid chatId" });
  }

  try {
    const chat = await Chat.findById(chatId);
    
    if (!chat || !chat.isGroupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    // Check if current user is actually in the group
    if (!chat.users.some(user => user.toString() === currentUserId)) {
      return res.status(400).json({ message: "You are not a member of this group" });
    }

    const remainingUsers = chat.users.filter(u => u.toString() !== currentUserId);
    let newAdmin = chat.groupAdmin;

    // Handle Option B: Admin leaving auto-assigns another member as admin
    if (chat.groupAdmin && chat.groupAdmin.toString() === currentUserId) {
      if (remainingUsers.length > 0) {
        newAdmin = remainingUsers[0];
      } else {
        newAdmin = null;
      }
    }

    // If no users are left, delete the group and its messages
    if (remainingUsers.length === 0) {
      await Message.deleteMany({ chatId });
      await Chat.findByIdAndDelete(chatId);
      return res.json({ message: "Left group. Group was deleted as there were no remaining members." });
    }

    const updated = await Chat.findByIdAndUpdate(
      chatId,
      { 
        $pull: { users: currentUserId },
        groupAdmin: newAdmin
      },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/chats/:chatId
// Protected — Delete or leave chat
// If 1-to-1: deletes entire chat & associated messages.
// If Group: triggers leave group logic.
// ---------------------------------------------------------------------------
router.delete("/:chatId", protect, async (req, res, next) => {
  const { chatId } = req.params;
  const currentUserId = req.user.id;

  if (!isValidObjectId(chatId)) {
    return res.status(400).json({ message: "Invalid chatId" });
  }

  try {
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Check if user is part of this chat
    if (!chat.users.some(user => user.toString() === currentUserId)) {
      return res.status(403).json({ message: "Not authorized to access this chat" });
    }

    // For one-on-one chats, delete the entire chat and its message history (DC-03)
    if (!chat.isGroupChat) {
      await Message.deleteMany({ chatId });
      await Chat.findByIdAndDelete(chatId);
      res.json({ message: "Chat and message history deleted successfully" });
    } else {
      // For group chats, trigger group leave logic
      const remainingUsers = chat.users.filter(u => u.toString() !== currentUserId);
      let newAdmin = chat.groupAdmin;

      if (chat.groupAdmin && chat.groupAdmin.toString() === currentUserId) {
        if (remainingUsers.length > 0) {
          newAdmin = remainingUsers[0];
        } else {
          newAdmin = null;
        }
      }

      if (remainingUsers.length === 0) {
        await Message.deleteMany({ chatId });
        await Chat.findByIdAndDelete(chatId);
        return res.json({ message: "Left group. Group was deleted." });
      }

      const updated = await Chat.findByIdAndUpdate(
        chatId,
        { 
          $pull: { users: currentUserId },
          groupAdmin: newAdmin
        },
        { new: true }
      )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

      res.json({ message: "Left group successfully", chat: updated });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
