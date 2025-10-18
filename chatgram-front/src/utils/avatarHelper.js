// Utility function to get user avatar with proper initials
export const getUserAvatar = (user) => {
  // If user has a profile picture, use it
  if (user?.profilePic && user.profilePic.trim() !== "") {
    return user.profilePic;
  }
  
  // Otherwise generate from name
  const name = user?.name || "User";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&bold=true&size=128`;
};

// Utility function to get group avatar
export const getGroupAvatar = (chat) => {
  // If group has an image, use it
  if (chat?.groupImage && chat.groupImage.trim() !== "") {
    return chat.groupImage;
  }
  
  // Otherwise generate from group name
  const name = chat?.chatName || "Group";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&bold=true&size=128`;
};

// Utility function to get chat avatar (works for both one-on-one and groups)
export const getChatAvatar = (chat, currentUserId) => {
  if (chat?.isGroupChat) {
    return getGroupAvatar(chat);
  }
  
  // For one-on-one chats, get the other user
  const chatPartner = chat?.users?.find(u => u._id !== currentUserId);
  return getUserAvatar(chatPartner);
};
