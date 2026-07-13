import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    chatName: { type: String },
    isGroupChat: { type: Boolean, default: false },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    latestMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    groupImage: { type: String, default: "" },
    // groupAdmin tracks which member has administrative privileges.
    // Only set for group chats. On creation this is the user who created the group.
    // If the admin leaves, another member is automatically promoted (see leave-group route).
    groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

// Compound index: membership queries sorted by most-recently-updated
chatSchema.index({ users: 1, updatedAt: -1 });
chatSchema.index({ isGroupChat: 1 });
// Quickly find groups where a specific user is admin
chatSchema.index({ groupAdmin: 1, isGroupChat: 1 });

export const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);
export default Chat;
