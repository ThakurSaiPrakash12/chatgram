// src/components/Sidebar.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { getUserAvatar, getGroupAvatar } from "../utils/avatarHelper";

function Sidebar({ chats, setCurrentChat, user, refreshChats }) {
  const navigate = useNavigate();
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
  const [viewingImage, setViewingImage] = useState(null);
  
  const userData = JSON.parse(localStorage.getItem("chatgramUser"));
  const currentUserId = userData?.user?._id;

  useEffect(() => {
    if (!currentUserId) return;

    // Initialize socket connection
    socketRef.current = io("http://localhost:5000", {
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
      const res = await fetch(`http://localhost:5000/api/auth/search?q=${query}`, {
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
      const res = await fetch('http://localhost:5000/api/chats', {
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
      const res = await fetch('http://localhost:5000/api/chats/group', {
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
    <div className="w-1/4 bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 p-5 border-r h-full flex flex-col shadow-2xl">
      {/* Header with Profile Picture */}
      <div className="flex justify-between items-center mb-6 pb-5 border-b-2 border-purple-200">
        <div className="flex items-center gap-3">
          <div className="relative cursor-pointer group" onClick={() => navigate("/profile")}>
            <img
              src={getUserAvatar(userData?.user)}
              alt="Profile"
              className="w-14 h-14 rounded-full border-3 border-purple-500 group-hover:border-purple-600 transition-all shadow-lg object-cover"
            />
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-3 border-white shadow-md"></div>
          </div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">💬 ChatGram</h2>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-5">
        <button
          onClick={() => setShowNewChat(true)}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          title="Start a new chat"
        >
          <span className="text-xl">💭</span>
          <span>New Chat</span>
        </button>
        <button
          onClick={() => setShowNewGroup(true)}
          className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-3 rounded-xl hover:from-green-700 hover:to-teal-700 font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          title="Create a new group"
        >
          <span className="text-xl">👥</span>
          <span>New Group</span>
        </button>
      </div>

      {/* Profile Button */}
      <div className="mb-5">
        <button
          onClick={() => navigate("/profile")}
          className="w-full bg-white text-gray-700 px-5 py-3 rounded-xl hover:bg-gray-50 font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 border border-purple-200"
        >
          <span className="text-xl">👤</span>
          <span>View Profile</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-5">
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">🔍</span>
          <input
            type="text"
            placeholder="Search chats..."
            className="w-full pl-12 pr-4 py-3.5 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-md font-medium"
          />
        </div>
      </div>

      {/* Messages Header */}
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-sm font-bold text-purple-700 uppercase tracking-wider">Messages</h3>
        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-semibold">{chats?.length || 0}</span>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl transform transition-all">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">💭</span>
                Start New Chat
              </h3>
              <button
                onClick={() => {
                  setShowNewChat(false);
                  setSearchTerm("");
                  setSearchResults([]);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔍</span>
              <input
                type="text"
                placeholder="Search users by name or email..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                  className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center rounded-lg border border-gray-100 hover:border-blue-300 transition-all"
                  onClick={() => createChat(user._id)}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getUserAvatar(user)}
                      alt={user.name}
                      className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  {onlineUsers[user._id] && (
                    <span className="text-green-500 text-lg animate-pulse">●</span>
                  )}
                </li>
              ))}
              {searchTerm && searchResults.length === 0 && (
                <li className="p-4 text-center text-gray-500">
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl transform transition-all">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
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
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
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
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 shadow-lg"
                />
                <label 
                  htmlFor="new-group-image" 
                  className="absolute bottom-0 right-0 bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-600 transition-all shadow-md"
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Group Name</label>
              <input
                type="text"
                placeholder="Enter group name..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Add Members (min 2)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                <input
                  type="text"
                  placeholder="Search users to add..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Selected Users ({selectedUsers.length}):
                </h4>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {selectedUsers.map((user) => (
                    <span
                      key={user._id}
                      className="bg-gradient-to-r from-green-100 to-green-200 px-3 py-1.5 rounded-full text-sm flex items-center gap-2 border border-green-300"
                    >
                      <img
                        src={getUserAvatar(user)}
                        alt={user.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      {user.name}
                      <button
                        onClick={() => setSelectedUsers(users => users.filter(u => u._id !== user._id))}
                        className="ml-1 text-red-500 hover:text-red-700 font-bold"
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
                    className="p-3 hover:bg-green-50 cursor-pointer rounded-lg border border-gray-100 hover:border-green-300 transition-all flex items-center gap-3"
                    onClick={() => {
                      setSelectedUsers(users => [...users, user]);
                      setSearchTerm("");
                      setSearchResults([]);
                    }}
                  >
                    <img
                      src={getUserAvatar(user)}
                      alt={user.name}
                      className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
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
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={createGroup}
                disabled={!groupName.trim() || selectedUsers.length < 2 || loading}
                className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
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
              className="p-3 rounded-xl hover:bg-white cursor-pointer flex items-center gap-3 transition-all duration-200 bg-gray-50 hover:shadow-md border border-gray-200 hover:border-blue-300"
            >
              <div 
                className="relative flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewingImage({ url: chatImage, name: chatName });
                }}
              >
                <img
                  src={chatImage}
                  alt={chatName}
                  className="w-14 h-14 rounded-full object-cover border-3 border-white shadow-md hover:scale-110 transition-transform"
                  title="Click to view profile picture"
                />
                {isOnline && (
                  <span 
                    className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"
                    title="Online"
                  ></span>
                )}
                {chat.isGroupChat && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    👥
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0" onClick={() => setCurrentChat(chat)}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-gray-900 truncate text-base">{chatName}</p>
                  {isOnline && (
                    <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">
                      Online
                    </span>
                  )}
                </div>
                {chat.isGroupChat && (
                  <p className="text-xs text-gray-500 font-medium">{chat.users?.length} members</p>
                )}
                {!chat.isGroupChat && chatPartner?.about && (
                  <p className="text-xs text-gray-500 truncate italic">{chatPartner.about}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

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

export default Sidebar;
