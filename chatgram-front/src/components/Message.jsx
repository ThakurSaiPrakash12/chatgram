// src/components/Message.jsx
import React from "react";
import { getUserAvatar } from "../utils/avatarHelper";

function Message({ message, isOwn, onImageClick }) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const senderAvatar = getUserAvatar(message.sender);

  return (
    <div className={`flex mb-2 sm:mb-3 md:mb-4 ${isOwn ? "justify-end" : "justify-start"} animate-fade-in px-2 sm:px-0`}>
      {!isOwn && (
        <img
          src={senderAvatar}
          alt={message.sender?.name}
          className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full object-cover mr-1.5 sm:mr-2 md:mr-3 shadow-md border-2 border-white dark:border-gray-700 cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
          onClick={() => onImageClick && onImageClick({ 
            url: senderAvatar, 
            name: message.sender?.name || "User" 
          })}
          title="Click to view profile picture"
        />
      )}
      <div
        className={`max-w-[80%] sm:max-w-[75%] md:max-w-md px-2.5 sm:px-3 md:px-5 py-1.5 sm:py-2 md:py-3 rounded-2xl break-words shadow-md transition-all hover:shadow-lg ${
          isOwn
            ? "bg-gradient-to-br from-green-400 to-green-500 dark:from-green-600 dark:to-green-700 text-white rounded-br-none"
            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-gray-700"
        }`}
      >
        {!isOwn && message.sender?.name && (
          <div className="text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 mb-0.5 sm:mb-1 flex items-center gap-1">
            <span className="text-xs">👤</span>
            {message.sender.name}
          </div>
        )}
        
        {/* Display image message */}
        {message.messageType === "image" && message.imageUrl ? (
          <div className="mb-1.5 sm:mb-2">
            <img
              src={message.imageUrl}
              alt="Shared"
              className="max-w-full max-h-40 sm:max-h-48 md:max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onImageClick && onImageClick({
                url: message.imageUrl,
                name: message.sender?.name || (isOwn ? "You" : "User")
              })}
              title="Click to view full image"
            />
          </div>
        ) : (
          <div className="text-[13px] sm:text-sm md:text-base leading-relaxed">{message.content}</div>
        )}
        
        <div className={`text-[10px] sm:text-xs mt-1 sm:mt-1.5 md:mt-2 text-right flex items-center justify-end gap-0.5 sm:gap-1 ${isOwn ? 'text-green-100 dark:text-green-200' : 'text-gray-500 dark:text-gray-400'}`}>
          <span className="text-[10px]">🕐</span>
          {formatTime(message.createdAt || Date.now())}
          {isOwn && <span className="ml-0.5 sm:ml-1 text-[10px]">✓✓</span>}
        </div>
      </div>
      {isOwn && (
        <img
          src={senderAvatar}
          alt="You"
          className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full object-cover ml-1.5 sm:ml-2 md:ml-3 shadow-md border-2 border-white dark:border-gray-700 cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
          onClick={() => onImageClick && onImageClick({ 
            url: senderAvatar, 
            name: message.sender?.name || "You" 
          })}
          title="Click to view profile picture"
        />
      )}
    </div>
  );
}

export default Message;
