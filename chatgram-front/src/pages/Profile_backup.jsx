// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

function Login({ setUser }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: "include",
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
      setError("Login failed. Try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-600 via-teal-700 to-cyan-800 p-3 md:p-0">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <form onSubmit={handleSubmit} className="relative bg-white p-6 md:p-12 rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-6 md:mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600 mb-2 md:mb-3">
            ChatGram
          </h2>
          <p className="text-gray-600 text-base md:text-lg">Welcome back!</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
            <p className="text-red-700 text-xs md:text-sm">{error}</p>
          </div>
        )}
        
        <div className="mb-4 md:mb-6">
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Email Address</label>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-3 md:px-4 md:py-3.5 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            required
          />
        </div>
        
        <div className="mb-6 md:mb-8">
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-3 md:px-4 md:py-3.5 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 md:py-4 rounded-lg hover:from-green-700 hover:to-teal-700 font-bold text-base md:text-lg shadow-lg hover:shadow-xl transition-all"
        >
          Log In
        </button>
        
        <p className="mt-6 md:mt-8 text-center text-xs md:text-sm text-gray-600">
          Don't have an account?{" "}
          <span className="text-green-600 font-bold cursor-pointer hover:text-green-700 hover:underline" onClick={() => navigate("/signup")}>
            Sign Up
          </span>
        </p>
      </form>
    </div>
  );
}

export default Login;
