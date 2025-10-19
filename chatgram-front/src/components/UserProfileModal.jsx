import { getUserAvatar } from "../utils/avatarHelper";
import { useTheme } from "../context/ThemeContext";
import { API_BASE_URL } from "../config/api";
import { useState } from "react";

function UserProfileModal({ user, onClose, onSendMessage }) {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSendMessage = async () => {
    setLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem("chatgramUser"));
      
      // Create or get existing chat
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userData?.token}`
        },
        body: JSON.stringify({ userId: user._id })
      });

      if (res.ok) {
        const chat = await res.json();
        
        // Save to localStorage to persist on reload
        localStorage.setItem("currentChat", JSON.stringify(chat));
        
        // Call the parent callback if provided
        if (onSendMessage) {
          onSendMessage(chat);
        }
        
        // Close the modal
        onClose();
      }
    } catch (err) {
      console.error("Error creating chat:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 md:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div className="relative h-32 sm:h-40 bg-gradient-to-r from-indigo-600 via-purple-500 to-emerald-500 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMyIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
          <button onClick={onClose} className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/20 backdrop-blur-md text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full hover:bg-white/30 flex items-center justify-center font-bold shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-90" title="Close"></button>
        </div>
        <div className="relative px-4 sm:px-6 pb-6">
          <div className="flex flex-col items-center -mt-16 mb-6">
            <div className="relative group mb-4">
              <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-400 rounded-full blur-lg opacity-50 group-hover:opacity-75 animate-pulse"></div>
              <div className="relative">
                <img src={getUserAvatar(user)} alt={user?.name} className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-2xl" />
                <div className="absolute bottom-0 right-0"><div className="relative"><div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div><div className="relative w-6 h-6 bg-green-500 rounded-full border-3 border-white dark:border-gray-800 shadow-lg flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full"></div></div></div></div>
              </div>
            </div>
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">{user?.name}</h2>
                <span className="text-cyan-500 dark:text-cyan-400 text-xl" title="Verified"></span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{user?.email}</p>
              <div className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-xs font-medium"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>Active now</div>
            </div>
            <button 
              onClick={handleSendMessage}
              disabled={loading}
              className={`w-full mb-6 group bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <span className="text-xl group-hover:scale-110 transition-transform">{loading ? '⏳' : '💬'}</span>
              <span>{loading ? 'Opening...' : 'Send Message'}</span>
            </button>
            <div className="w-full bg-white dark:bg-gray-800 p-5 rounded-2xl border-2 border-indigo-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-3"><span className="text-xl"></span><h3 className="text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">About</h3></div>
              <p className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed italic font-medium">"{user?.about || "Hey there! I am using ChatGram "}"</p>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } } .animate-fadeIn { animation: fadeIn 0.3s ease-out; } .animate-slideUp { animation: slideUp 0.4s ease-out; }`}</style>
    </div>
  );
}

export default UserProfileModal;
