import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserAvatar } from "../utils/avatarHelper";
import { useTheme } from "../context/ThemeContext";
import { API_BASE_URL } from "../config/api";

function Profile({ user, setUser }) {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [about, setAbout] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [aboutError, setAboutError] = useState("");
  const [aboutSuccess, setAboutSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  
  // Use props user if available, otherwise fallback to localStorage
  const userData = user || JSON.parse(localStorage.getItem("chatgramUser") || "null");

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userData.token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        return;
      }

      setSuccess("Password changed successfully!");
      setIsEditing(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError("Failed to change password. Please try again.");
    }
  };

  const handleAboutUpdate = async (e) => {
    e.preventDefault();
    setAboutError("");
    setAboutSuccess("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userData.token}`
        },
        body: JSON.stringify({ about }),
      });

      if (res.ok) {
        const updatedData = await res.json();
        
        // Update localStorage and state
        const newUserData = {
          ...userData,
          user: { ...userData.user, about }
        };
        localStorage.setItem("chatgramUser", JSON.stringify(newUserData));
        
        if (setUser) {
          setUser(newUserData);
        }
        
        setAboutSuccess("About updated successfully!");
        setIsEditingAbout(false);
      } else {
        const data = await res.json();
        setAboutError(data.message || "Failed to update about");
      }
    } catch (err) {
      setAboutError("Failed to update about. Please try again.");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    try {
      setUploading(true);
      
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        
        // Update profile picture
        const res = await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${userData.token}`
          },
          body: JSON.stringify({ profilePic: base64String }),
        });

        if (res.ok) {
          const updatedData = await res.json();
          
          // Update localStorage and state
          const newUserData = {
            ...userData,
            user: { ...userData.user, profilePic: base64String }
          };
          localStorage.setItem("chatgramUser", JSON.stringify(newUserData));
          
          if (setUser) {
            setUser(newUserData);
          }
          
          // Reload to show new image
          window.location.reload();
        } else {
          alert("Failed to update profile picture");
        }
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("chatgramUser");
    if (setUser) {
      setUser(null);
    }
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 dark:from-gray-800 dark:via-gray-900 dark:to-black p-3 md:p-6 transition-colors duration-200">
      <div className="absolute inset-0 bg-black opacity-10 dark:opacity-30"></div>
      <div className="max-w-3xl mx-auto relative">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <button
            onClick={() => navigate("/")}
            className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-3 py-2 md:px-6 md:py-3 text-sm md:text-base rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1 md:gap-2 font-bold shadow-xl hover:shadow-2xl transition-all"
          >
            <span className="text-lg md:text-xl">←</span>
            <span className="hidden sm:inline">Back to Chats</span>
            <span className="sm:hidden">Back</span>
          </button>
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2 md:p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 shadow-xl hover:shadow-2xl transition-all group"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              <span className="text-xl md:text-2xl group-hover:scale-110 transition-transform inline-block">☀️</span>
            ) : (
              <span className="text-xl md:text-2xl group-hover:scale-110 transition-transform inline-block">🌙</span>
            )}
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-10 transition-colors duration-200">
          <div className="flex justify-between items-center mb-6 md:mb-10 pb-4 md:pb-6 border-b-2 border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl md:text-4xl font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2 md:gap-3">
              <span className="text-2xl md:text-4xl">👤</span>
              <span className="hidden sm:inline">My Profile</span>
              <span className="sm:hidden">Profile</span>
            </h2>
            <button
              onClick={handleLogout}
              className="bg-red-500 dark:bg-red-600 text-white px-3 py-2 md:px-6 md:py-3 text-sm md:text-base rounded-xl hover:bg-red-600 dark:hover:bg-red-700 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-1 md:gap-2"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        <div className="mb-6 md:mb-10 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-750 p-4 md:p-8 rounded-xl md:rounded-2xl border border-purple-100 dark:border-gray-600 transition-colors duration-200">
          <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-8 text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span className="text-2xl md:text-3xl text-blue-500 dark:text-blue-400">ℹ️</span>
            <span className="hidden sm:inline">User Information</span>
            <span className="sm:hidden">Info</span>
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8 mb-4 md:mb-8">
            <div className="relative">
              <img
                src={getUserAvatar(userData?.user)}
                alt={userData?.user?.name}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white dark:border-gray-600 shadow-2xl"
              />
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 md:w-10 md:h-10 rounded-full border-4 border-white dark:border-gray-700 shadow-lg"></div>
            </div>
            <div>
              <input
                type="file"
                id="profilePicInput"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label
                htmlFor="profilePicInput"
                className={`bg-purple-600 dark:bg-purple-700 text-white px-4 py-2 md:px-6 md:py-3 text-sm md:text-base rounded-xl hover:bg-purple-700 dark:hover:bg-purple-800 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-1 md:gap-2 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span className="hidden sm:inline">Uploading...</span>
                  </>
                ) : (
                  <>
                    <span>📷</span>
                    <span className="hidden sm:inline">Change Photo</span>
                    <span className="sm:hidden">Photo</span>
                  </>
                )}
              </label>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-2 md:mt-3 font-medium text-center sm:text-left">
                <span className="hidden sm:inline">Click to upload (Max 5MB)</span>
                <span className="sm:hidden">Max 5MB</span>
              </p>
            </div>
          </div>
          
          <div className="space-y-3 md:space-y-5">
            <div className="bg-white dark:bg-gray-800 p-3 md:p-5 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors duration-200">
              <p className="text-xs md:text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 md:mb-2">Full Name</p>
              <p className="text-base md:text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 break-words">
                <span className="text-purple-600 dark:text-purple-400">👤</span>
                {userData?.user?.name}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-3 md:p-5 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors duration-200">
              <p className="text-xs md:text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 md:mb-2">Email Address</p>
              <p className="text-base md:text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 break-all">
                <span className="text-blue-500 dark:text-blue-400">📧</span>
                {userData?.user?.email}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-3 md:p-5 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors duration-200">
              <div className="flex justify-between items-center mb-1 md:mb-2">
                <p className="text-xs md:text-sm font-semibold text-gray-500 dark:text-gray-400">About</p>
                {!isEditingAbout && (
                  <button
                    onClick={() => {
                      setAbout(userData?.user?.about || "");
                      setIsEditingAbout(true);
                      setAboutError("");
                      setAboutSuccess("");
                    }}
                    className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-sm font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>✏️</span>
                    Edit
                  </button>
                )}
              </div>
              
              {!isEditingAbout ? (
                <p className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <span>💬</span>
                  {userData?.user?.about || "Hey there! I am using ChatGram"}
                </p>
              ) : (
                <form onSubmit={handleAboutUpdate} className="space-y-4 mt-4">
                  {aboutError && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <p className="text-red-700 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                        <span>⚠️</span>
                        {aboutError}
                      </p>
                    </div>
                  )}
                  {aboutSuccess && (
                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <p className="text-green-700 dark:text-green-400 text-sm font-medium flex items-center gap-2">
                        <span>✅</span>
                        {aboutSuccess}
                      </p>
                    </div>
                  )}
                  
                  <textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    rows="3"
                    maxLength="150"
                    placeholder="Tell us about yourself..."
                    required
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {about.length}/150 characters
                  </p>
                  
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingAbout(false);
                        setAboutError("");
                        setAboutSuccess("");
                      }}
                      className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-800 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                      <span>💾</span>
                      Save
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-10 mt-10">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <span className="text-3xl">🔒</span>
              Password Security
            </h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-purple-600 dark:bg-purple-700 text-white px-6 py-3 rounded-xl hover:bg-purple-700 dark:hover:bg-purple-800 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <span>✏️</span>
                Change Password
              </button>
            )}
          </div>

          {isEditing && (
            <form onSubmit={handlePasswordChange} className="space-y-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-750 p-8 rounded-2xl border border-purple-100 dark:border-gray-600 transition-colors duration-200">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-700 dark:text-red-400 font-medium flex items-center gap-2">
                    <span>⚠️</span>
                    {error}
                  </p>
                </div>
              )}
              {success && (
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
                    <span>✅</span>
                    {success}
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  🔑 Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  required
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  🆕 New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  required
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  ✅ Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  required
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setError("");
                    setSuccess("");
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-800 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <span>💾</span>
                  Save Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

export default Profile;