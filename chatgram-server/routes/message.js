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

export default router;
