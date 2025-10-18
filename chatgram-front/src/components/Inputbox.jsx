// src/components/InputBox.jsx
import { useState, useRef } from "react";

function InputBox({ onSendMessage, chatId, socket, userName }) {
  const [text, setText] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const commonEmojis = ["😊", "😂", "❤️", "👍", "🎉", "🔥", "😍", "🤔", "😎", "👏", "🙏", "💯", "✨", "🎊", "🌟", "💪"];

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!chatId || !socket) return;

    socket.emit("typing", { chatId, userName });

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      socket.emit("stop_typing", { chatId, userName });
    }, 1000);

    setTypingTimeout(timeout);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSendImage = () => {
    if (!selectedImage) return;

    onSendMessage({ 
      content: "Image", 
      messageType: "image",
      imageUrl: selectedImage 
    });
    
    setSelectedImage(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    onSendMessage({ content: text, messageType: "text" });
    if (socket && chatId) {
      socket.emit("stop_typing", { chatId, userName });
    }
    setText("");
    setShowEmojiPicker(false);
  };

  const addEmoji = (emoji) => {
    setText(text + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="border-t dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg transition-colors duration-200">
      {/* Image Preview */}
      {previewImage && (
        <div className="p-2 md:p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2 md:gap-3">
            <div className="relative">
              <img 
                src={previewImage} 
                alt="Preview" 
                className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg"
              />
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setPreviewImage(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-5 h-5 md:w-6 md:h-6 text-xs md:text-sm bg-red-500 dark:bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
              >
                ✕
              </button>
            </div>
            <button
              onClick={handleSendImage}
              className="px-3 py-2 md:px-4 md:py-2 text-sm md:text-base bg-gradient-to-r from-green-500 to-teal-500 dark:from-green-600 dark:to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-600 dark:hover:from-green-700 dark:hover:to-teal-700 transition-all"
            >
              <span className="hidden sm:inline">Send Image 📤</span>
              <span className="sm:hidden">Send 📤</span>
            </button>
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="p-2 md:p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-1 md:gap-2">
            {commonEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => addEmoji(emoji)}
                className="text-xl md:text-2xl hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-1 transition-colors"
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex items-center p-2 md:p-4 gap-1 md:gap-0">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* Attach Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mr-1 md:mr-3 text-xl md:text-2xl hover:scale-110 transition-transform p-2 md:p-0"
          title="Attach image"
        >
          📎
        </button>

        {/* Text Input */}
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={handleTyping}
          className="flex-1 px-3 py-2 md:px-4 md:py-3 text-sm md:text-base rounded-full border-2 border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        />

        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="mx-1 md:mx-3 text-xl md:text-2xl hover:scale-110 transition-transform p-2 md:p-0"
          title="Emoji"
        >
          😊
        </button>

        {/* Send Button */}
        <button
          type="submit"
          className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white px-4 py-2 md:px-6 md:py-3 text-sm md:text-base rounded-full hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-1 md:gap-2"
        >
          <span className="hidden sm:inline">Send</span>
          <span className="text-base md:text-lg">📤</span>
        </button>
      </form>
    </div>
  );
}

export default InputBox;
