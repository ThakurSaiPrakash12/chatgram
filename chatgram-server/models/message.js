import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
  content: { type: String, required: true },
  messageType: { type: String, enum: ["text", "image"], default: "text" },
  imageUrl: { type: String }, // Base64 or URL for images
}, { timestamps: true });

// Add indexes for faster queries
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

export const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);
export default Message;
