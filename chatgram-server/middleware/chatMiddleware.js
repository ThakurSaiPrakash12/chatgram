import Chat from "../models/chat.js";
import mongoose from "mongoose";

/**
 * Chat membership authorization middleware.
 *
 * Must be used AFTER the `protect` middleware so req.user.id is available.
 *
 * Loads the chat from the database, checks that the authenticated user
 * is in chat.users, and makes the validated chat available as req.chat
 * so route handlers do not need to re-query it.
 *
 * Returns:
 *   400  — chatId is missing or not a valid ObjectId
 *   404  — chat does not exist
 *   403  — authenticated user is not a member of the chat
 */
export const requireChatMember = async (req, res, next) => {
  // Support chatId from URL params or from request body
  const chatId = req.params.chatId || req.body.chatId;

  if (!chatId) {
    return res.status(400).json({ message: "chatId is required" });
  }

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({ message: "Invalid chatId" });
  }

  try {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const isMember = chat.users.some(
      (uid) => uid.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Attach to request so route handlers don't re-query
    req.chat = chat;
    next();
  } catch (err) {
    next(err);
  }
};
