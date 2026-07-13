import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateBase64Image } from "../utils/validation.js";

const router = express.Router();

// ---------------------------------------------------------------------------
// POST /api/auth/signup
// Public — no token required
// ---------------------------------------------------------------------------
router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password, profilePic } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Validate profile picture if provided
    if (profilePic) {
      const imgCheck = validateBase64Image(profilePic);
      if (!imgCheck.valid) {
        return res.status(400).json({ message: imgCheck.message });
      }
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const userData = { name: name.trim(), email: email.trim().toLowerCase(), password };
    if (profilePic) userData.profilePic = profilePic;

    const user = await User.create(userData);

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        about: user.about,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// Public — no token required
// ---------------------------------------------------------------------------
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        about: user.about,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/auth/search?q=<keyword>
// Protected — requires valid JWT
// Returns users matching the keyword (excluding self)
// ---------------------------------------------------------------------------
router.get("/search", protect, async (req, res, next) => {
  try {
    const keyword = req.query.q;

    if (!keyword || !keyword.trim()) {
      return res.json([]);
    }

    // Limit length to prevent ReDoS via catastrophic regex backtracking
    const safeKeyword = keyword.trim().slice(0, 50);

    // Escape special regex characters from user input
    const escaped = safeKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const users = await User.find({
      _id: { $ne: req.user.id }, // Exclude the searching user
      $or: [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
      ],
    })
      .select("-password")
      .limit(10);

    res.json(users);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/change-password
// Protected
// ---------------------------------------------------------------------------
router.post("/change-password", protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    // req.user.id comes from the verified JWT — not from the client
    const user = await User.findById(req.user.id);
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
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/update-profile
// Protected
// ---------------------------------------------------------------------------
router.post("/update-profile", protect, async (req, res, next) => {
  try {
    const { profilePic, about } = req.body;

    // Validate profile picture if a new one is provided
    if (profilePic) {
      const imgCheck = validateBase64Image(profilePic);
      if (!imgCheck.valid) {
        return res.status(400).json({ message: imgCheck.message });
      }
    }

    // Identity is from the verified JWT — never from req.body
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (profilePic !== undefined) user.profilePic = profilePic;
    if (about !== undefined) user.about = about.trim ? about.trim() : about;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        about: user.about,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/auth/delete-account
// Protected — requires password confirmation
// ---------------------------------------------------------------------------
router.delete("/delete-account", protect, async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required to delete account" });
    }

    // Identity from JWT — client cannot supply a different userId
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Password is incorrect" });
    }

    const Chat = (await import("../models/chat.js")).default;
    const Message = (await import("../models/message.js")).default;

    // Remove user from all group chats they belong to
    await Chat.updateMany(
      { users: req.user.id, isGroupChat: true },
      { $pull: { users: req.user.id } }
    );

    // Delete all one-on-one chats they were part of, along with their messages
    const oneOnOneChats = await Chat.find({
      isGroupChat: false,
      users: req.user.id,
    });
    const oneOnOneChatIds = oneOnOneChats.map((c) => c._id);

    if (oneOnOneChatIds.length > 0) {
      await Message.deleteMany({ chatId: { $in: oneOnOneChatIds } });
      await Chat.deleteMany({ _id: { $in: oneOnOneChatIds } });
    }

    // Delete all messages sent by this user in remaining chats
    await Message.deleteMany({ sender: req.user.id });

    // Finally delete the user document
    await User.findByIdAndDelete(req.user.id);

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;
