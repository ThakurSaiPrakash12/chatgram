import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserAvatar } from "../utils/avatarHelper";

function Profile({ user, setUser }) {
  const navigate = useNavigate();
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
      const res = await fetch("http://localhost:5000/api/auth/change-password", {
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
      const res = await fetch("http://localhost:5000/api/auth/update-profile", {
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
        const res = await fetch("http://localhost:5000/api/auth/update-profile", {
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
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 p-6">
      <div className="absolute inset-0 bg-black opacity-10"></div>
      <div className="max-w-3xl mx-auto relative">
        <button
          onClick={() => navigate("/")}
          className="mb-6 bg-white text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 flex items-center gap-2 font-bold shadow-xl hover:shadow-2xl transition-all"
        >
          <span className="text-xl">←</span>
          Back to Chats
        </button>
        
        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <div className="flex justify-between items-center mb-10 pb-6 border-b-2 border-gray-200">
            <h2 className="text-4xl font-bold text-purple-600 flex items-center gap-3">
              <span className="text-4xl">👤</span>
              My Profile
            </h2>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <span>🚪</span>
              Logout
            </button>
          </div>

        <div className="mb-10 bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-100">
          <h3 className="text-2xl font-bold mb-8 text-gray-800 flex items-center gap-2">
            <span className="text-3xl text-blue-500">ℹ️</span>
            User Information
          </h3>
          <div className="flex items-center gap-8 mb-8">
            <div className="relative">
              <img
                src={getUserAvatar(userData?.user)}
                alt={userData?.user?.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-2xl"
              />
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-10 h-10 rounded-full border-4 border-white shadow-lg"></div>
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
                className={`bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <span>📷</span>
                    Change Photo
                  </>
                )}
              </label>
              <p className="text-sm text-gray-600 mt-3 font-medium">
                Click to upload (Max 5MB)
              </p>
            </div>
          </div>
          
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
              <p className="text-sm font-semibold text-gray-500 mb-2">Full Name</p>
              <p className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-purple-600">👤</span>
                {userData?.user?.name}
              </p>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
              <p className="text-sm font-semibold text-gray-500 mb-2">Email Address</p>
              <p className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-blue-500">📧</span>
                {userData?.user?.email}
              </p>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold text-gray-500">About</p>
                {!isEditingAbout && (
                  <button
                    onClick={() => {
                      setAbout(userData?.user?.about || "");
                      setIsEditingAbout(true);
                      setAboutError("");
                      setAboutSuccess("");
                    }}
                    className="text-purple-600 hover:text-purple-800 text-sm font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>✏️</span>
                    Edit
                  </button>
                )}
              </div>
              
              {!isEditingAbout ? (
                <p className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span>💬</span>
                  {userData?.user?.about || "Hey there! I am using ChatGram"}
                </p>
              ) : (
                <form onSubmit={handleAboutUpdate} className="space-y-4 mt-4">
                  {aboutError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                        <span>⚠️</span>
                        {aboutError}
                      </p>
                    </div>
                  )}
                  {aboutSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-700 text-sm font-medium flex items-center gap-2">
                        <span>✅</span>
                        {aboutSuccess}
                      </p>
                    </div>
                  )}
                  
                  <textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                    rows="3"
                    maxLength="150"
                    placeholder="Tell us about yourself..."
                    required
                  />
                  <p className="text-sm text-gray-500 font-medium">
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
                      className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
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

        <div className="border-t-2 border-gray-200 pt-10 mt-10">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-3xl">🔒</span>
              Password Security
            </h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <span>✏️</span>
                Change Password
              </button>
            )}
          </div>

          {isEditing && (
            <form onSubmit={handlePasswordChange} className="space-y-6 bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-100">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 font-medium flex items-center gap-2">
                    <span>⚠️</span>
                    {error}
                  </p>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-700 font-medium flex items-center gap-2">
                    <span>✅</span>
                    {success}
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  🔑 Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  🆕 New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  ✅ Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
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