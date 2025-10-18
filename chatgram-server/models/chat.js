import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  chatName: { type: String },
  isGroupChat: { type: Boolean, default: false },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  latestMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  groupImage: { type: String, default: "" }, // Base64 or URL for group profile picture
});
export const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);
export default Chat;
