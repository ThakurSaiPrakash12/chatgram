import express from "express";
import Message from "../models/message.js";
import Chat from "../models/chat.js";

const router = express.Router();

// Get messages for a chat
router.get("/:chatId", async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId })
      .populate("sender", "-password")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: err.message });
  }
});

// Send a message
router.post("/", async (req, res) => {
  try {
    const { chatId, sender, content, messageType, imageUrl } = req.body;
    
    if (!chatId || !sender || !content) {
      return res.status(400).json({ 
        message: "Missing required fields: chatId, sender, content" 
      });
    }

    const messageData = {
      chatId,
      sender,
      content,
      messageType: messageType || "text"
    };

    // Add imageUrl if it's an image message
    if (messageType === "image" && imageUrl) {
      messageData.imageUrl = imageUrl;
    }

    const message = await Message.create(messageData);

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "-password");

    res.json(populatedMessage);
  } catch (err) {
    console.error("Error creating message:", err);
    res.status(500).json({ message: err.message });
  }
});

// Delete message for everyone
router.delete("/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body; // User who is deleting

    // Find the message
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if the user is the sender (only sender can delete for everyone)
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    // Check if message is within 1 hour (optional time limit)
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    
    if (messageAge > oneHour) {
      return res.status(403).json({ message: "Messages older than 1 hour cannot be deleted" });
    }

    // Delete the message
    await Message.findByIdAndDelete(messageId);

    res.json({ 
      success: true, 
      message: "Message deleted for everyone",
      messageId,
      chatId: message.chatId
    });
  } catch (err) {
    console.error("Error deleting message:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
