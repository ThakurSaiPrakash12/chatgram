// src/components/Message.jsx
import React, { useState } from "react";
import { getUserAvatar } from "../utils/avatarHelper";

function Message({ message, isOwn, onImageClick, onDelete }) {
  const [showDeleteOption, setShowDeleteOption] = useState(false);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const canDelete = () => {
    if (!isOwn) return false;
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const oneHour = 60 * 60 * 1000;
    return messageAge <= oneHour;
  };

  const handleDelete = () => {
    if (window.confirm('Delete this message for everyone? This cannot be undone.')) {
      onDelete(message._id);
    }
    setShowDeleteOption(false);
  };

  const senderAvatar = getUserAvatar(message.sender);

  return (
    <div className={`flex mb-2 sm:mb-3 md:mb-4 ${isOwn ? "justify-end" : "justify-start"} animate-fade-in px-2 sm:px-0 group`}>
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
      <div className="relative">
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
              className="w-full max-w-[200px] sm:max-w-[250px] md:max-w-[300px] lg:max-w-[350px] h-auto object-cover rounded-lg cursor-pointer hover:opacity-90 hover:shadow-xl transition-all"
              onClick={() => onImageClick && onImageClick({
                url: message.imageUrl,
                name: message.sender?.name || (isOwn ? "You" : "User")
              })}
              title="Click to view & download"
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

        {/* Delete Button - Show on hover for own messages within 1 hour */}
        {isOwn && canDelete() && (
          <button
            onClick={handleDelete}
            className="absolute -right-8 sm:-right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center shadow-lg text-xs sm:text-sm"
            title="Delete for everyone (within 1 hour)"
          >
            🗑️
          </button>
        )}
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
