import express from "express";
import Message from "../models/message.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireChatMember } from "../middleware/chatMiddleware.js";
import { isValidObjectId, validateBase64Image } from "../utils/validation.js";

const router = express.Router();

// ---------------------------------------------------------------------------
// GET /api/messages/:chatId
// Protected & Authorized — fetch messages for a specific chat room
// Supports cursor-based pagination: ?before=<messageId>&limit=<limit>
// ---------------------------------------------------------------------------
router.get("/:chatId", protect, requireChatMember, async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { before } = req.query;
    
    let limit = parseInt(req.query.limit) || 50;
    if (limit <= 0) limit = 50;
    if (limit > 100) limit = 100; // Enforce max limit of 100

    const query = { chatId };

    if (before) {
      if (!isValidObjectId(before)) {
        return res.status(400).json({ message: "Invalid cursor (before)" });
      }
      // Fetch messages older than the cursor message ID
      query._id = { $lt: before };
    }

    // Fetch messages (newest first, to paginate backwards in history)
    const messages = await Message.find(query)
      .populate("sender", "name email profilePic about")
      .select("sender chatId content messageType imageUrl createdAt")
      .sort({ _id: -1 })
      .limit(limit)
      .lean();

    // Reverse in-memory so they are returned in chronological order (oldest to newest)
    messages.reverse();

    // Determine pagination metadata
    let nextCursor = null;
    let hasMore = false;

    if (messages.length > 0) {
      const oldestMessageId = messages[0]._id;
      // Check if there are any messages older than our oldest message in the batch
      const hasMoreCheck = await Message.findOne({
        chatId,
        _id: { $lt: oldestMessageId }
      }).select("_id").lean();
      
      hasMore = !!hasMoreCheck;
      nextCursor = oldestMessageId.toString();
    }

    res.json({
      messages,
      nextCursor,
      hasMore
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/messages
// Protected & Authorized — Send a message to a chat room
// Sender is strictly derived from verified JWT.
// ---------------------------------------------------------------------------
router.post("/", protect, requireChatMember, async (req, res, next) => {
  try {
    const { chatId, content, messageType, imageUrl } = req.body;
    const sender = req.user.id; // Strictly derived from JWT

    // 1. Validate required fields
    if (!chatId) {
      return res.status(400).json({ message: "chatId is required" });
    }

    // 2. Validate message content (must have text content OR image content)
    const isImage = messageType === "image";
    const hasImage = !!imageUrl;
    const hasText = !!(content && content.trim());

    if (!hasText && !hasImage) {
      return res.status(400).json({ message: "Message content cannot be empty" });
    }

    const messageData = {
      chatId,
      sender,
      content: hasText ? content.trim() : "",
      messageType: isImage ? "image" : "text"
    };

    // 3. Image validation & formatting
    if (isImage) {
      if (!imageUrl) {
        return res.status(400).json({ message: "imageUrl is required for image messages" });
      }
      const imgCheck = validateBase64Image(imageUrl);
      if (!imgCheck.valid) {
        return res.status(400).json({ message: imgCheck.message });
      }
      messageData.imageUrl = imageUrl;
      // Default placeholder text if none provided
      if (!messageData.content) {
        messageData.content = "Sent an image";
      }
    }

    const message = await Message.create(messageData);

    // Update the chat's latestMessage field
    const Chat = (await import("../models/chat.js")).default;
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "-password");

    res.status(201).json(populatedMessage);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/messages/:messageId
// Protected — Delete own message for everyone within 1 hour
// Sender is strictly derived from verified JWT.
// ---------------------------------------------------------------------------
router.delete("/:messageId", protect, async (req, res, next) => {
  const { messageId } = req.params;
  const currentUserId = req.user.id; // Strictly derived from JWT

  if (!isValidObjectId(messageId)) {
    return res.status(400).json({ message: "Invalid messageId" });
  }

  try {
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Authorization: Only sender can delete for everyone
    if (message.sender.toString() !== currentUserId) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    // Time window check: strictly 1 hour
    const oneHour = 60 * 60 * 1000;
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    if (messageAge > oneHour) {
      return res.status(403).json({ message: "Messages older than 1 hour cannot be deleted" });
    }

    await Message.findByIdAndDelete(messageId);

    // If this was the latest message in the chat, update the chat pointer
    const Chat = (await import("../models/chat.js")).default;
    const chat = await Chat.findById(message.chatId);
    if (chat && chat.latestMessage && chat.latestMessage.toString() === messageId) {
      const prevMessage = await Message.findOne({ chatId: message.chatId })
        .sort({ _id: -1 })
        .select("_id")
        .lean();
      await Chat.findByIdAndUpdate(message.chatId, {
        latestMessage: prevMessage ? prevMessage._id : null
      });
    }

    res.json({ 
      success: true, 
      message: "Message deleted for everyone",
      messageId,
      chatId: message.chatId
    });
  } catch (err) {
    next(err);
  }
});

export default router;
