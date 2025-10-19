import { useState } from "react";
import { getUserAvatar } from "../utils/avatarHelper";
import { useTheme } from "../context/ThemeContext";

function UserProfileModal({ user, onClose }) {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState("about");

  if (!user) return null;

  const tabs = [
    { id: "about", label: "About", icon: "👤" },
    { id: "media", label: "Media", icon: "🖼️" },
    { id: "friends", label: "Friends", icon: "👥" },
    { id: "settings", label: "Settings", icon: "⚙️" }
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 md:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Cover Photo with Gradient Overlay */}
        <div className="relative h-32 sm:h-40 md:h-48 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/20 backdrop-blur-md text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full hover:bg-white/30 flex items-center justify-center font-bold shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-90"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Profile Section - Overlapping Cover */}
        <div className="relative px-4 sm:px-6 md:px-8 pb-6">
          {/* Avatar with Glow Effect */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 sm:-mt-16 mb-6">
            <div className="relative group">
              {/* Animated Glow Ring */}
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-lg opacity-75 group-hover:opacity-100 animate-pulse"></div>
              
              {/* Avatar */}
              <div className="relative">
                <img
                  src={getUserAvatar(user)}
                  alt={user?.name}
                  className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-2xl transition-all duration-300 group-hover:scale-105"
                />
                
                {/* Online Status Indicator */}
                <div className="absolute -bottom-1 -right-1 sm:bottom-0 sm:right-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                    <div className="relative w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-3 border-white dark:border-gray-800 shadow-lg flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left mb-2">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                  {user?.name}
                </h2>
                <span className="text-blue-500 dark:text-blue-400 text-xl" title="Verified">✓</span>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full text-xs font-medium">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Active now
                </span>
              </p>

              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-all">
                {user?.email}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button className="group relative bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2">
                <span className="text-lg group-hover:scale-110 transition-transform">💬</span>
                <span className="hidden sm:inline">Message</span>
              </button>
              
              <button className="group bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 shadow-lg transition-all duration-300 hover:scale-105">
                <span className="text-lg group-hover:scale-110 transition-transform">⋯</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
            <div className="group bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-3 sm:p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">127</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">Chats</div>
            </div>
            
            <div className="group bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-3 sm:p-4 rounded-2xl border border-purple-100 dark:border-purple-800/30 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">2.5k</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">Friends</div>
            </div>
            
            <div className="group bg-gradient-to-br from-teal-50 to-green-50 dark:from-teal-900/20 dark:to-green-900/20 p-3 sm:p-4 rounded-2xl border border-teal-100 dark:border-teal-800/30 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">856</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">Media</div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex gap-1 sm:gap-2 mb-6 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-2xl backdrop-blur-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-600/50'
                }`}
              >
                <span className="text-base sm:text-lg">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[200px] max-h-[300px] overflow-y-auto custom-scrollbar">
            {activeTab === "about" && (
              <div className="space-y-4 animate-fadeIn">
                {/* Bio Section */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 sm:p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl sm:text-2xl">💬</span>
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">Bio</h3>
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed italic">
                    "{user?.about || "Hey there! I am using ChatGram 🚀"}"
                  </p>
                </div>

                {/* Location & Interests */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">📍</span>
                      <h4 className="text-sm font-bold text-gray-800 dark:text-white">Location</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">San Francisco, CA</p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🎯</span>
                      <h4 className="text-sm font-bold text-gray-800 dark:text-white">Joined</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">January 2025</p>
                  </div>
                </div>

                {/* Interests Tags */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">✨</span>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white">Interests</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Technology', 'Design', 'Travel', 'Photography', 'Music'].map((interest) => (
                      <span key={interest} className="px-3 py-1.5 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full border border-indigo-200 dark:border-indigo-700">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "media" && (
              <div className="animate-fadeIn">
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-square bg-gradient-to-br from-indigo-200 to-purple-200 dark:from-indigo-800 dark:to-purple-800 rounded-xl hover:scale-105 transition-transform duration-300 cursor-pointer shadow-md"></div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "friends" && (
              <div className="space-y-3 animate-fadeIn">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full"></div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 dark:text-white text-sm">Friend Name {i}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">@username{i}</p>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-500 text-white px-3 py-1 rounded-lg text-xs font-medium">
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-3 animate-fadeIn">
                {['Notifications', 'Privacy', 'Blocked Users', 'Report'].map((setting) => (
                  <button key={setting} className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 group">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{setting}</span>
                    <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #6366f1, #a855f7);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #4f46e5, #9333ea);
        }
      `}</style>
    </div>
  );
}

export default UserProfileModal;
