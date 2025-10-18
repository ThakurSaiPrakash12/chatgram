import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, profilePic } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const userData = { name, email, password };
    if (profilePic) userData.profilePic = profilePic;

    const user = await User.create(userData);

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    const responseUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
      about: user.about
    };

    res.status(201).json({ user: responseUser, token });
  } catch (err) {
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        message: "Missing required fields", 
        details: { email: !email, password: !password } 
      });
    }

    console.log('Login attempt for email:', email);
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(password);
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Send user data without sensitive information
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
      about: user.about
    };

    res.status(200).json({ user: userData, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      message: "Login failed", 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Search users (for finding people to chat with)
router.get("/search", async (req, res) => {
  try {
    const keyword = req.query.q;
    if (!keyword) {
      return res.json([]);
    }

    const users = await User.find({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
      ],
    }).select("-password").limit(10);
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Change password
router.post("/change-password", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Password change failed", error: err.message });
  }
});

// Update profile
router.post("/update-profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { profilePic, about } = req.body;
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (profilePic !== undefined) user.profilePic = profilePic;
    if (about !== undefined) user.about = about;
    
    await user.save();

    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
      about: user.about
    };

    res.json({ message: "Profile updated successfully", user: userData });
  } catch (err) {
    res.status(500).json({ message: "Profile update failed", error: err.message });
  }
});

export default router;
