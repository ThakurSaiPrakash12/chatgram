import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: { 
    type: String, 
    default: "" // Will be generated from name if empty
  },
  about: { type: String, default: "Hey there! I am using ChatGram" },
}, { timestamps: true });

// Encrypt password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Add indexes for faster queries
userSchema.index({ email: 1 });
userSchema.index({ name: 1 });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
