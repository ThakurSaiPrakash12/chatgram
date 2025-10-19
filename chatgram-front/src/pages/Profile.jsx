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
  const [profilePicKey, setProfilePicKey] = useState(0);
  
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
          
          // Force re-render by updating key
          setProfilePicKey(prev => prev + 1);
          setUploading(false);
        } else {
          alert("Failed to update profile picture");
          setUploading(false);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("Failed to upload image");
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
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6 lg:p-8 transition-colors duration-300"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-indigo-200 dark:bg-indigo-800 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-40 animate-blob"></div>
        <div className="absolute top-40 right-10 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-emerald-200 dark:bg-emerald-800 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-amber-200 dark:bg-amber-800 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-40 animate-blob animation-delay-4000"></div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -20px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(20px, 20px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header with Back and Theme Toggle */}
        <div className="flex justify-between items-center mb-4 sm:mb-6 md:mb-8">
          <button
            onClick={() => navigate("/")}
            className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 text-sm md:text-base rounded-xl sm:rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1 sm:gap-2 md:gap-3 font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
          >
            <span className="text-lg sm:text-xl md:text-2xl group-hover:-translate-x-1 transition-transform">←</span>
            <span>Back</span>
          </button>
          
          <button
            onClick={toggleTheme}
            className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2 sm:p-2.5 md:p-3 rounded-xl sm:rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              <span className="text-xl sm:text-2xl md:text-3xl group-hover:rotate-180 transition-transform duration-500 inline-block">☀️</span>
            ) : (
              <span className="text-xl sm:text-2xl md:text-3xl group-hover:-rotate-12 transition-transform duration-500 inline-block">🌙</span>
            )}
          </button>
        </div>
        
        {/* Main Profile Card */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl md:rounded-[2rem] shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-3xl">
          {/* Profile Header with Gradient Banner */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-500 to-emerald-500 h-24 sm:h-32 md:h-40 lg:h-48 relative overflow-hidden">
            <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMyIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>

          {/* Profile Content */}
          <div className="px-4 sm:px-6 md:px-8 lg:px-10 pb-6 sm:pb-8 md:pb-10">
            {/* Profile Picture and Name - Overlapping Banner */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 -mt-10 sm:-mt-12 md:-mt-14 mb-6 sm:mb-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-cyan-400 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300 animate-pulse"></div>
                <img
                  key={profilePicKey}
                  src={getUserAvatar(userData?.user)}
                  alt={userData?.user?.name}
                  className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full object-cover border-4 sm:border-4 border-white dark:border-gray-800 shadow-2xl transition-all duration-300 group-hover:scale-105"
                />
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-green-500 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full border-2 sm:border-3 border-white dark:border-gray-800 shadow-lg flex items-center justify-center animate-pulse">
                  <span className="text-white text-xs sm:text-xs md:text-sm font-semibold">✓</span>
                </div>
                
                {/* Change Photo Button Overlay */}
                <input
                  type="file"
                  id="profilePicInput"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="profilePicInput"
                  className={`absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer ${uploading ? 'opacity-100' : ''}`}
                >
                  {uploading ? (
                    <span className="text-2xl sm:text-3xl md:text-4xl animate-spin">⏳</span>
                  ) : (
                    <div className="text-center">
                      <span className="text-2xl sm:text-3xl md:text-4xl block">📷</span>
                      <span className="text-white text-xs sm:text-xs font-semibold mt-1 block">Change</span>
                    </div>
                  )}
                </label>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-1 sm:mb-2 flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                  <span>{userData?.user?.name}</span>
                  <span className="text-cyan-500 dark:text-cyan-400 text-lg sm:text-xl md:text-2xl">✓</span>
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium flex items-center justify-center sm:justify-start gap-2">
                  <span>📧</span>
                  <span className="break-all">{userData?.user?.email}</span>
                </p>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 text-sm md:text-base rounded-xl sm:rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <span className="text-base sm:text-lg md:text-xl">🚪</span>
                <span>Logout</span>
              </button>
            </div>

            {/* About Section */}
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl mb-6 sm:mb-8 md:mb-10 border-2 border-indigo-200 dark:border-gray-600 transition-all duration-300 hover:shadow-lg hover:border-purple-300">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl md:text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                  <span className="text-xl sm:text-2xl md:text-3xl">💬</span>
                  <span>About</span>
                </h3>
                {!isEditingAbout && (
                  <button
                    onClick={() => {
                      setAbout(userData?.user?.about || "");
                      setIsEditingAbout(true);
                      setAboutError("");
                      setAboutSuccess("");
                    }}
                    className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm shadow-md hover:shadow-lg"
                  >
                    <span>✏️</span>
                    <span>Edit</span>
                  </button>
                )}
              </div>
              
              {!isEditingAbout ? (
                <p className="text-base sm:text-lg md:text-xl text-gray-800 dark:text-gray-100 italic font-medium">
                  "{userData?.user?.about || "Hey there! I am using ChatGram"}"
                </p>
              ) : (
                <form onSubmit={handleAboutUpdate} className="space-y-3 sm:space-y-4">
                  {aboutError && (
                    <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4 animate-shake">
                      <p className="text-red-700 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                        <span>⚠️</span>
                        {aboutError}
                      </p>
                    </div>
                  )}
                  {aboutSuccess && (
                    <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4">
                      <p className="text-green-700 dark:text-green-400 text-sm font-medium flex items-center gap-2">
                        <span>✅</span>
                        {aboutSuccess}
                      </p>
                    </div>
                  )}
                  
                  <textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base"
                    rows="3"
                    maxLength="150"
                    placeholder="Tell us about yourself..."
                    required
                  />
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {about.length}/150 characters
                  </p>
                  
                  <div className="flex justify-end gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingAbout(false);
                        setAboutError("");
                        setAboutSuccess("");
                      }}
                      className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg sm:rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-lg sm:rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 text-sm sm:text-base"
                    >
                      <span>💾</span>
                      Save
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Password Security Section */}
            <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6 sm:pt-8 md:pt-10">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
                  <span className="text-2xl sm:text-3xl md:text-4xl">🔒</span>
                  <span>Password Security</span>
                </h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-xl sm:rounded-2xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 text-sm sm:text-base justify-center sm:justify-start"
                  >
                    <span>✏️</span>
                    Change Password
                  </button>
                )}
              </div>

              {isEditing && (
                <form onSubmit={handlePasswordChange} className="space-y-4 sm:space-y-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-700/50 dark:to-gray-750/50 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border-2 border-purple-200 dark:border-gray-600">
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4 animate-shake">
                      <p className="text-red-700 dark:text-red-400 font-medium flex items-center gap-2 text-sm sm:text-base">
                        <span>⚠️</span>
                        {error}
                      </p>
                    </div>
                  )}
                  {success && (
                    <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4">
                      <p className="text-green-700 dark:text-green-400 font-medium flex items-center gap-2 text-sm sm:text-base">
                        <span>✅</span>
                        {success}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                      <span>🔑</span>
                      <span>Current Password</span>
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-purple-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base"
                      required
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                      <span>🆕</span>
                      <span>New Password</span>
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-purple-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base"
                      required
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                      <span>✅</span>
                      <span>Confirm New Password</span>
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-purple-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base"
                      required
                      placeholder="Confirm new password"
                    />
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6">
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
                      className="px-4 py-2.5 sm:px-6 sm:py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg sm:rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-lg sm:rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 text-sm sm:text-base"
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
    </div>
  );
}

export default Profile;
