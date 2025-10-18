// src/components/ChatBox.jsx
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import InputBox from "./Inputbox";
import Message from "./Message";
import GroupInfo from "./GroupInfo";
import { getUserAvatar, getGroupAvatar } from "../utils/avatarHelper";

const socket = io("http://localhost:5000");

function ChatBox({ chat, user, setCurrentChat }) {
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

    return () => {
      socket.off("receive_message");
      socket.off("typing");
      socket.off("stop_typing");
    };
  }, [chat, currentUserName]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/messages/${chat._id}`, {
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

      const res = await fetch("http://localhost:5000/api/messages", {
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

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="text-8xl mb-6">💬</div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-3">
            ChatGram
          </h2>
          <p className="text-gray-600 text-lg">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-5 flex items-center gap-4 shadow-2xl">
        <img
          src={chatImage}
          alt={chatName}
          className="w-14 h-14 rounded-full object-cover border-3 border-white shadow-xl cursor-pointer hover:scale-110 transition-transform"
          onClick={() => setViewingImage({ url: chatImage, name: chatName })}
          title="Click to view profile picture"
        />
        <div className="flex-1">
          <h2 className="font-bold text-white text-xl">{chatName}</h2>
          {chat.isGroupChat && (
            <p className="text-sm text-blue-100 flex items-center gap-1 font-medium">
              <span>👥</span>
              {chat.users?.length} members
            </p>
          )}
          {!chat.isGroupChat && chatPartner?.about && (
            <p className="text-sm text-blue-100 italic">{chatPartner.about}</p>
          )}
        </div>
        {/* Action Icons */}
        <div className="flex gap-2">
          {chat.isGroupChat && (
            <button 
              onClick={() => setShowGroupInfo(true)}
              className="w-11 h-11 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all text-white text-2xl shadow-lg hover:shadow-xl"
              title="Group Info"
            >
              ℹ️
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50" style={{
        backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
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
            />
          );
        })}
        {typingUser && (
          <div className="text-sm text-gray-500 italic ml-4">
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

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-4xl max-h-screen" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setViewingImage(null)}
              className="absolute -top-12 right-0 text-white text-4xl hover:text-gray-300 transition-colors"
              title="Close"
            >
              ×
            </button>
            
            {/* User Info */}
            <div className="absolute -top-12 left-0 text-white mb-4">
              <p className="text-lg font-semibold flex items-center gap-2">
                <span>👤</span>
                {viewingImage.name}
              </p>
            </div>

            {/* Image */}
            <img
              src={viewingImage.url}
              alt={viewingImage.name}
              className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatBox;
