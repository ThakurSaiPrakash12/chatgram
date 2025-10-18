// src/components/GroupInfo.jsx
import { useState } from "react";
import { getUserAvatar, getGroupAvatar } from "../utils/avatarHelper";
import { API_BASE_URL } from "../config/api";

function GroupInfo({ chat, user, onClose, onUpdate }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const userData = JSON.parse(localStorage.getItem("chatgramUser"));
  const currentUserId = userData?.user?._id;
  // Any member can add/remove others
  const isMember = chat?.users?.some(u => u._id === currentUserId);

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
      // Filter out users already in the group
      const filteredUsers = data.filter(
        u => !chat.users.find(member => member._id === u._id)
      );
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const addMember = async (userId) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/chats/group/add`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`,
        },
        body: JSON.stringify({
          chatId: chat._id,
          userId: userId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Failed to add member');
        return;
      }

      onUpdate(data);
      setSearchTerm("");
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/chats/group/remove`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`,
        },
        body: JSON.stringify({
          chatId: chat._id,
          userId: userId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Failed to remove member');
        return;
      }

      onUpdate(data);
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const leaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;

    try {
      setLoading(true);
      // Use the remove route to remove yourself
      const res = await fetch(`${API_BASE_URL}/api/chats/group/remove`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`,
        },
        body: JSON.stringify({
          chatId: chat._id,
          userId: currentUserId, // Remove yourself
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Failed to leave group');
        return;
      }

      onClose();
      // Optionally redirect to chat list
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Failed to leave group');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        
        // Update group image
        const res = await fetch(`${API_BASE_URL}/api/chats/group/image`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userData.token}`,
          },
          body: JSON.stringify({
            chatId: chat._id,
            groupImage: base64String,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || 'Failed to update group image');
          return;
        }

        onUpdate(data);
        alert('Group image updated successfully!');
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading group image:', error);
      alert('Failed to upload group image');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Group Info</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Group Info */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl mb-6">
          <div className="flex items-center gap-4 mb-3">
            <div className="relative">
              <img
                src={getGroupAvatar(chat)}
                alt={chat?.chatName}
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
              />
              {isMember && (
                <label 
                  htmlFor="group-image-upload" 
                  className="absolute bottom-0 right-0 bg-blue-500 text-white w-7 h-7 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-all shadow-md"
                  title="Change group image"
                >
                  {uploadingImage ? "⏳" : "📷"}
                </label>
              )}
              <input
                id="group-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={!isMember || uploadingImage}
              />
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-800">{chat?.chatName}</h4>
              <p className="text-sm text-gray-600">{chat?.users?.length} members</p>
              {isMember && (
                <p className="text-xs text-gray-500 mt-1">Click camera icon to change image</p>
              )}
            </div>
          </div>
        </div>

        {/* Add Members (Any Member Can Add) */}
        {isMember && (
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Add Members</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search users to add..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchUsers(e.target.value);
                }}
              />
            </div>
            {searchResults.length > 0 && (
              <ul className="mt-2 max-h-40 overflow-y-auto space-y-2">
                {searchResults.map((user) => (
                  <li
                    key={user._id}
                    className="p-3 hover:bg-blue-50 cursor-pointer rounded-lg border border-gray-100 hover:border-blue-300 transition-all flex items-center justify-between"
                    onClick={() => addMember(user._id)}
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
                    <button className="text-blue-500 font-semibold">+ Add</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Members List */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-700 mb-3">Members ({chat?.users?.length})</h4>
          <ul className="max-h-64 overflow-y-auto space-y-2">
            {chat?.users?.map((member) => {
              const isCurrentUser = member._id === currentUserId;
              
              return (
                <li
                  key={member._id}
                  className="p-3 bg-gray-50 rounded-lg flex items-center justify-between hover:bg-gray-100 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getUserAvatar(member)}
                      alt={member.name}
                      className="w-12 h-12 rounded-full border-2 border-gray-200 object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {member.name}
                        {isCurrentUser && <span className="text-xs text-blue-600 ml-2">(You)</span>}
                      </p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  {isMember && !isCurrentUser && (
                    <button
                      onClick={() => removeMember(member._id)}
                      disabled={loading}
                      className="text-red-500 hover:text-red-700 font-semibold text-sm disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Leave Group Button */}
        {isMember && (
          <button
            onClick={leaveGroup}
            disabled={loading}
            className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Leaving...' : 'Leave Group'}
          </button>
        )}
      </div>
    </div>
  );
}

export default GroupInfo;
