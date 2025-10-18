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
    <div className="border-t bg-white shadow-lg">
      {/* Image Preview */}
      {previewImage && (
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-start gap-3">
            <div className="relative">
              <img 
                src={previewImage} 
                alt="Preview" 
                className="w-24 h-24 object-cover rounded-lg"
              />
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setPreviewImage(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              >
                ✕
              </button>
            </div>
            <button
              onClick={handleSendImage}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition-all"
            >
              Send Image 📤
            </button>
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            {commonEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => addEmoji(emoji)}
                className="text-2xl hover:bg-gray-200 rounded p-1 transition-colors"
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex items-center p-4">
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
          className="mr-3 text-2xl hover:scale-110 transition-transform"
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
          className="flex-1 px-4 py-3 rounded-full border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50"
        />

        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="mx-3 text-2xl hover:scale-110 transition-transform"
          title="Emoji"
        >
          😊
        </button>

        {/* Send Button */}
        <button
          type="submit"
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-full hover:from-blue-600 hover:to-blue-700 font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          <span>Send</span>
          <span className="text-lg">📤</span>
        </button>
      </form>
    </div>
  );
}

export default InputBox;
