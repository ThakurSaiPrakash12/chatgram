// src/pages/Signup.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup({ setUser }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", profilePic: "" });
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setFormData({ ...formData, profilePic: base64String });
      setPreviewImage(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("chatgramUser", JSON.stringify(data));
        setUser(data); // Update user state
        navigate("/");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Signup failed. Try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-600 via-teal-700 to-cyan-800">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <form onSubmit={handleSubmit} className="relative bg-white p-12 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600 mb-3">
            Join ChatGram
          </h2>
          <p className="text-gray-600 text-lg">Create your account today</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Profile Picture Upload */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <input
              type="file"
              id="signupProfilePic"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <label
              htmlFor="signupProfilePic"
              className="cursor-pointer group"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-green-500 shadow-lg group-hover:border-green-600 transition-all">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center">
                    <span className="text-4xl">📷</span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg group-hover:bg-green-600 transition-all">
                <span className="text-lg">+</span>
              </div>
            </label>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 mb-6">Click to add profile picture (optional)</p>
        
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            required
          />
        </div>
        
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            required
          />
        </div>
        
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
          <input
            type="password"
            name="password"
            placeholder="Create a secure password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 rounded-lg hover:from-green-700 hover:to-teal-700 font-bold text-lg shadow-lg hover:shadow-xl transition-all"
        >
          Sign Up
        </button>
        
        <p className="mt-8 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <span className="text-green-600 font-bold cursor-pointer hover:text-green-700 hover:underline" onClick={() => navigate("/login")}>
            Log In
          </span>
        </p>
      </form>
    </div>
  );
}

export default Signup;
