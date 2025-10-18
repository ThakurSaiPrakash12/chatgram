// src/components/ChatBox.jsx
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import InputBox from "./Inputbox";
import Message from "./Message";
import GroupInfo from "./GroupInfo";
import { getUserAvatar, getGroupAvatar } from "../utils/avatarHelper";
import { useTheme } from "../context/ThemeContext";
import { API_BASE_URL, SOCKET_URL } from "../config/api";

const socket = io(SOCKET_URL);

function ChatBox({ chat, user, setCurrentChat }) {
  const { isDarkMode } = useTheme();
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  const messagesEndRef = useRef(null);

  const currentUserId = user?.user?._id;
  const currentUserName = user?.user?.name;

  // Get the chat partner (the other user in one-on-one chat)
  const getChatPartner = () => {
    if (!chat || !chat.users) return null;
    if (chat.isGroupChat) return null;
    return chat.users.find(u => u._id !== currentUserId);
  };

  const chatPartner = getChatPartner();
  const chatName = chat?.isGroupChat ? chat.chatName : chatPartner?.name;
  const chatImage = chat?.isGroupChat 
    ? getGroupAvatar(chat)
    : getUserAvatar(chatPartner);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!chat) return;

    socket.emit("join_chat", chat._id);
    fetchMessages();

    socket.on("receive_message", (data) => {
      if (data.chatId === chat._id) {
        setMessages((prev) => [...prev, data]);
      }
    });

    socket.on("typing", ({ userName, chatId }) => {
      if (chatId === chat._id && userName !== currentUserName) {
        setTypingUser(userName);
      }
    });

    socket.on("stop_typing", ({ chatId }) => {
      if (chatId === chat._id) setTypingUser("");
    });

    socket.on("message_deleted", ({ messageId, chatId }) => {
      if (chatId === chat._id) {
        setMessages(prevMessages => prevMessages.filter(msg => msg._id !== messageId));
      }
    });

    return () => {
      socket.off("receive_message");
      socket.off("typing");
      socket.off("stop_typing");
      socket.off("message_deleted");
    };
  }, [chat, currentUserName]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/${chat._id}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        }
      });
      
      if (!res.ok) {
        console.error('Failed to fetch messages:', res.status);
        return;
      }
      
      const data = await res.json();
      setMessages(data || []);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setMessages([]);
    }
  };

  const handleSendMessage = async (messageData) => {
    try {
      const payload = {
        chatId: chat._id,
        content: messageData.content,
        sender: currentUserId,
        messageType: messageData.messageType || "text",
      };

      // Add imageUrl if it's an image message
      if (messageData.messageType === "image" && messageData.imageUrl) {
        payload.imageUrl = messageData.imageUrl;
      }

      console.log('Sending message:', payload);

      const res = await fetch(`${API_BASE_URL}/api/messages`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to send message:", res.status, errorText);
        return;
      }

      const data = await res.json();
      console.log('Message sent:', data);
      
      socket.emit("send_message", { ...data, chatId: chat._id });
      setMessages((prev) => [...prev, data]);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/${messageId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({ userId: currentUserId })
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.message || "Failed to delete message");
        return;
      }

      const data = await res.json();
      console.log('Message deleted:', data);

      // Remove from local state
      setMessages(prevMessages => prevMessages.filter(msg => msg._id !== messageId));

      // Emit socket event to notify others
      socket.emit("delete_message", { messageId, chatId: chat._id });
    } catch (err) {
      console.error("Failed to delete message:", err);
      alert("Failed to delete message");
    }
  };

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 transition-colors duration-200">
        <div className="text-center">
          <div className="text-8xl mb-6">💬</div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-3">
            ChatGram
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen w-full">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 p-3 md:p-5 flex items-center gap-2 md:gap-4 shadow-2xl">
        {/* Back button for mobile */}
        <button
          onClick={() => setCurrentChat(null)}
          className="md:hidden w-8 h-8 flex items-center justify-center text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
          title="Back to chats"
        >
          <span className="text-2xl">←</span>
        </button>
        
        <img
          src={chatImage}
          alt={chatName}
          className="w-10 h-10 md:w-14 md:h-14 rounded-full object-cover border-2 md:border-3 border-white dark:border-gray-800 shadow-xl cursor-pointer hover:scale-110 transition-transform"
          onClick={() => setViewingImage({ url: chatImage, name: chatName })}
          title="Click to view profile picture"
        />
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-white text-base md:text-xl truncate">{chatName}</h2>
          {chat.isGroupChat && (
            <p className="text-xs md:text-sm text-blue-100 dark:text-blue-200 flex items-center gap-1 font-medium">
              <span>👥</span>
              {chat.users?.length} members
            </p>
          )}
          {!chat.isGroupChat && chatPartner?.about && (
            <p className="text-xs md:text-sm text-blue-100 dark:text-blue-200 italic truncate">{chatPartner.about}</p>
          )}
        </div>
        {/* Action Icons */}
        <div className="flex gap-2">
          {chat.isGroupChat && (
            <button 
              onClick={() => setShowGroupInfo(true)}
              className="w-9 h-9 md:w-11 md:h-11 bg-white bg-opacity-20 hover:bg-opacity-30 dark:bg-gray-800 dark:bg-opacity-40 dark:hover:bg-opacity-60 rounded-full flex items-center justify-center transition-all text-white text-xl md:text-2xl shadow-lg hover:shadow-xl"
              title="Group Info"
            >
              ℹ️
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-1 sm:p-2 md:p-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-200" style={{
        backgroundImage: isDarkMode ? "none" : "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
        backgroundSize: "cover"
      }}>
        {messages.map((msg, index) => {
          const senderId = msg.sender?._id || msg.sender;
          return (
            <Message 
              key={msg._id || index} 
              message={msg} 
              isOwn={senderId === currentUserId}
              onImageClick={setViewingImage}
              onDelete={handleDeleteMessage}
            />
          );
        })}
        {typingUser && (
          <div className="text-sm text-gray-500 dark:text-gray-400 italic ml-4">
            {typingUser} is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <InputBox 
        onSendMessage={handleSendMessage} 
        chatId={chat._id}
        socket={socket}
        userName={currentUserName}
      />

      {/* Group Info Modal */}
      {showGroupInfo && chat.isGroupChat && (
        <GroupInfo
          chat={chat}
          user={user}
          onClose={() => setShowGroupInfo(false)}
          onUpdate={(updatedChat) => {
            setCurrentChat(updatedChat);
            setShowGroupInfo(false);
          }}
        />
      )}

      {/* Image Viewer Modal - Enhanced with Download & Fullscreen */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 flex flex-col items-center justify-center z-50 p-2 sm:p-4"
          onClick={() => setViewingImage(null)}
        >
          {/* Top Action Bar */}
          <div className="w-full max-w-6xl flex justify-between items-center mb-2 sm:mb-4 px-2" onClick={(e) => e.stopPropagation()}>
            {/* User Info */}
            <div className="text-white">
              <p className="text-sm sm:text-lg font-semibold flex items-center gap-1 sm:gap-2">
                <span className="text-base sm:text-xl">👤</span>
                <span className="truncate max-w-[150px] sm:max-w-none">{viewingImage.name}</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3">
              {/* Download Button */}
              <a
                href={viewingImage.url}
                download={`chatgram-image-${Date.now()}.jpg`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-1 sm:gap-2"
                title="Download image"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-sm sm:text-base">⬇️</span>
                <span className="hidden sm:inline">Download</span>
              </a>

              {/* Close Button */}
              <button
                onClick={() => setViewingImage(null)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-1 sm:gap-2"
                title="Close"
              >
                <span className="text-sm sm:text-base">✕</span>
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          {/* Image Container */}
          <div className="relative w-full max-w-6xl h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={viewingImage.url}
              alt={viewingImage.name}
              className="max-w-full max-h-[85vh] sm:max-h-[80vh] rounded-lg sm:rounded-2xl shadow-2xl object-contain"
              title="View image"
            />
          </div>

          {/* Bottom Hint */}
          <div className="mt-2 sm:mt-4 text-white text-xs sm:text-sm opacity-70 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="flex items-center justify-center gap-2">
              <span>💡</span>
              <span className="hidden sm:inline">Click outside to close</span>
              <span className="sm:hidden">Tap outside to close</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatBox;
