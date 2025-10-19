// src/components/Sidebar.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { getUserAvatar, getGroupAvatar } from "../utils/avatarHelper";
import { useTheme } from "../context/ThemeContext";
import { API_BASE_URL, SOCKET_URL } from "../config/api";

function Sidebar({ chats, setCurrentChat, user, refreshChats }) {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [groupImage, setGroupImage] = useState("");
  const [loading, setLoading] = useState(false);
  
  const userData = JSON.parse(localStorage.getItem("chatgramUser"));
  const currentUserId = userData?.user?._id;

  useEffect(() => {
    if (!currentUserId) return;

    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    // Connect user
    socketRef.current.emit("user_connected", currentUserId);

    // Handle online users updates
    socketRef.current.on("update_users", (users) => {
      setOnlineUsers(users || {});
    });

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.off("update_users");
        socketRef.current.disconnect();
      }
    };
  }, [currentUserId]);

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/search?q=${query}`, {
        headers: {
          'Authorization': `Bearer ${userData.token}`,
        }
      });
      const data = await res.json();
      setSearchResults(data.filter(user => user._id !== currentUserId));
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleGroupImageUpload = (e) => {
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
      setGroupImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const createChat = async (userId) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`,
        },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      setCurrentChat(data);
      setShowNewChat(false);
      setSearchResults([]);
      setSearchTerm("");
      
      // Refresh chats list
      if (refreshChats) {
        await refreshChats();
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedUsers.length < 2) {
      alert('Please enter a group name and select at least 2 members');
      return;
    }
    
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/chats/group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`,
        },
        body: JSON.stringify({
          name: groupName,
          users: selectedUsers.map(user => user._id),
          groupImage: groupImage,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error('Group creation error:', data);
        alert(data.message || 'Failed to create group');
        return;
      }
      
      setCurrentChat(data);
      setShowNewGroup(false);
      setSelectedUsers([]);
      setGroupName("");
      setGroupImage("");
      setSearchTerm("");
      setSearchResults([]);
      
      // Refresh chats list
      if (refreshChats) {
        await refreshChats();
      }
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 p-3 md:p-5 border-r dark:border-gray-700 flex flex-col shadow-2xl transition-colors duration-200">
      {/* Header with Profile Picture and Theme Toggle */}
      <div className="flex justify-between items-center mb-4 md:mb-6 pb-3 md:pb-5 border-b-2 border-purple-200 dark:border-gray-700">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative cursor-pointer group" onClick={() => navigate("/profile")}>
            <img
              src={getUserAvatar(userData?.user)}
              alt="Profile"
              className="w-10 h-10 md:w-14 md:h-14 rounded-full border-3 border-purple-500 dark:border-purple-600 group-hover:border-purple-600 dark:group-hover:border-purple-500 transition-all shadow-lg object-cover"
            />
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 md:w-5 md:h-5 rounded-full border-2 md:border-3 border-white dark:border-gray-800 shadow-md"></div>
          </div>
          <h2 className="text-lg md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">💬 <span className="hidden sm:inline">ChatGram</span></h2>
        </div>
        
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 md:p-3 rounded-xl bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-md hover:shadow-lg transition-all duration-200 group"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? (
            <span className="text-xl md:text-2xl group-hover:scale-110 transition-transform inline-block">☀️</span>
          ) : (
            <span className="text-xl md:text-2xl group-hover:scale-110 transition-transform inline-block">🌙</span>
          )}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 md:gap-3 mb-3 md:mb-5">
        <button
          onClick={() => setShowNewChat(true)}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 text-white px-2 md:px-4 py-2 md:py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:to-purple-600 font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base"
          title="Start a new chat"
        >
          <span className="text-lg md:text-xl">💭</span>
          <span className="hidden sm:inline">New Chat</span>
          <span className="sm:hidden">Chat</span>
        </button>
        <button
          onClick={() => setShowNewGroup(true)}
          className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 dark:from-green-500 dark:to-teal-500 text-white px-2 md:px-4 py-2 md:py-3 rounded-xl hover:from-green-700 hover:to-teal-700 dark:hover:from-green-600 dark:hover:to-teal-600 font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base"
          title="Create a new group"
        >
          <span className="text-lg md:text-xl">👥</span>
          <span className="hidden sm:inline">New Group</span>
          <span className="sm:hidden">Group</span>
        </button>
      </div>

      {/* Profile Button */}
      <div className="mb-3 md:mb-5">
        <button
          onClick={() => navigate("/profile")}
          className="w-full bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 md:px-5 py-2 md:py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 border border-purple-200 dark:border-gray-600 text-sm md:text-base"
        >
          <span className="text-lg md:text-xl">👤</span>
          <span>View Profile</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-3 md:mb-5">
        <div className="relative">
          <span className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-lg md:text-xl">🔍</span>
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3.5 border border-purple-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent shadow-md font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200 text-sm md:text-base"
          />
        </div>
      </div>

      {/* Messages Header */}
      <div className="mb-3 md:mb-4 flex items-center gap-2">
        <h3 className="text-xs md:text-sm font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Messages</h3>
        <span className="bg-blue-500 dark:bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">{chats?.length || 0}</span>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-96 shadow-2xl transform transition-all">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <span className="text-2xl">💭</span>
                Start New Chat
              </h3>
              <button
                onClick={() => {
                  setShowNewChat(false);
                  setSearchTerm("");
                  setSearchResults([]);
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-2xl leading-none transition-colors"
              >
                ×
              </button>
            </div>
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-lg">🔍</span>
              <input
                type="text"
                placeholder="Search users by name or email..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchUsers(e.target.value);
                }}
              />
            </div>
            <ul className="max-h-64 overflow-y-auto space-y-2">
              {searchResults.map((user) => (
                <li
                  key={user._id}
                  className="p-3 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center rounded-lg border border-gray-100 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all"
                  onClick={() => createChat(user._id)}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getUserAvatar(user)}
                      alt={user.name}
                      className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-600 object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  {onlineUsers[user._id] && (
                    <span className="text-green-500 text-lg animate-pulse">●</span>
                  )}
                </li>
              ))}
              {searchTerm && searchResults.length === 0 && (
                <li className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <span className="text-3xl mb-2 block">🔍</span>
                  No users found
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* New Group Modal */}
      {showNewGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-96 shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <span className="text-2xl">👥</span>
                Create New Group
              </h3>
              <button
                onClick={() => {
                  setShowNewGroup(false);
                  setSearchTerm("");
                  setSearchResults([]);
                  setSelectedUsers([]);
                  setGroupName("");
                  setGroupImage("");
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-2xl leading-none transition-colors"
              >
                ×
              </button>
            </div>
            
            {/* Group Image Upload */}
            <div className="mb-4 flex justify-center">
              <div className="relative">
                <img
                  src={groupImage || `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(groupName || "Group")}`}
                  alt="Group"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600 shadow-lg"
                />
                <label 
                  htmlFor="new-group-image" 
                  className="absolute bottom-0 right-0 bg-green-500 dark:bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-600 dark:hover:bg-green-700 transition-all shadow-md"
                  title="Upload group image"
                >
                  📷
                </label>
                <input
                  id="new-group-image"
                  type="file"
                  accept="image/*"
                  onChange={handleGroupImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Group Name</label>
              <input
                type="text"
                placeholder="Enter group name..."
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Add Members (min 2)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-lg">🔍</span>
                <input
                  type="text"
                  placeholder="Search users to add..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    searchUsers(e.target.value);
                  }}
                />
              </div>
            </div>

            {selectedUsers.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Selected Users ({selectedUsers.length}):
                </h4>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {selectedUsers.map((user) => (
                    <span
                      key={user._id}
                      className="bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 px-3 py-1.5 rounded-full text-sm flex items-center gap-2 border border-green-300 dark:border-green-600 text-gray-800 dark:text-gray-200"
                    >
                      <img
                        src={getUserAvatar(user)}
                        alt={user.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      {user.name}
                      <button
                        onClick={() => setSelectedUsers(users => users.filter(u => u._id !== user._id))}
                        className="ml-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <ul className="max-h-48 overflow-y-auto space-y-2 mb-4">
              {searchResults
                .filter(user => !selectedUsers.find(u => u._id === user._id))
                .map((user) => (
                  <li
                    key={user._id}
                    className="p-3 hover:bg-green-50 dark:hover:bg-gray-700 cursor-pointer rounded-lg border border-gray-100 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-500 transition-all flex items-center gap-3"
                    onClick={() => {
                      setSelectedUsers(users => [...users, user]);
                      setSearchTerm("");
                      setSearchResults([]);
                    }}
                  >
                    <img
                      src={getUserAvatar(user)}
                      alt={user.name}
                      className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-600 object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </li>
                ))}
            </ul>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewGroup(false);
                  setSearchTerm("");
                  setSearchResults([]);
                  setSelectedUsers([]);
                  setGroupName("");
                }}
                className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={createGroup}
                disabled={!groupName.trim() || selectedUsers.length < 2 || loading}
                className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white rounded-lg hover:from-green-600 hover:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700 font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                {loading ? "Creating..." : "Create Group"}
                {!loading && <span>✓</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      <ul className="flex-1 overflow-y-auto space-y-2">
        {chats?.map((chat) => {
          // Get the chat partner for one-on-one chats
          const chatPartner = chat?.isGroupChat 
            ? null 
            : chat.users?.find(u => u._id !== currentUserId);
          
          // Determine chat name
          const chatName = chat?.isGroupChat 
            ? chat.chatName 
            : chatPartner?.name || "Unknown User";
          
          // Determine chat image
          const chatImage = chat?.isGroupChat 
            ? getGroupAvatar(chat)
            : getUserAvatar(chatPartner);
          
          // Check if user is online (for one-on-one chats)
          const isOnline = !chat?.isGroupChat && chatPartner && onlineUsers[chatPartner._id];

          return (
            <li
              key={chat._id}
              className="p-2 md:p-3 rounded-xl hover:bg-white dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2 md:gap-3 transition-all duration-200 bg-gray-50 dark:bg-gray-800 hover:shadow-md border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={chatImage}
                  alt={chatName}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 md:border-3 border-white dark:border-gray-700 shadow-md hover:scale-110 transition-transform"
                  title="Click to view profile picture"
                />
                {isOnline && (
                  <span 
                    className="absolute bottom-0 right-0 w-3 h-3 md:w-4 md:h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full animate-pulse"
                    title="Online"
                  ></span>
                )}
                {chat.isGroupChat && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 dark:bg-blue-600 text-white text-xs px-1 md:px-1.5 py-0.5 rounded-full">
                    👥
                  </span>
                )}
                {/* Unread Message Badge - Example with random count */}
                {chat.unreadCount > 0 && (
                  <span className="absolute -top-2 -left-2 bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 md:min-w-[24px] md:h-6 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-800 shadow-lg animate-bounce">
                    {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0" onClick={() => setCurrentChat(chat)}>
                <div className="flex items-center justify-between mb-1">
                  <p className={`font-semibold truncate text-sm md:text-base ${chat.unreadCount > 0 ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-900 dark:text-gray-100'}`}>{chatName}</p>
                  <div className="flex items-center gap-1 md:gap-2">
                    {chat.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded-full">
                        {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                      </span>
                    )}
                    {isOnline && (
                      <span className="hidden sm:inline text-xs text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                        Online
                      </span>
                    )}
                  </div>
                </div>
                {chat.isGroupChat && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{chat.users?.length} members</p>
                )}
                {!chat.isGroupChat && chatPartner?.about && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate italic">{chatPartner.about}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Sidebar;
