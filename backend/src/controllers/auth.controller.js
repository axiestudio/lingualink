import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { ENV } from "../lib/env.js";
import { sanitizeInput, sanitizeEmail, validateImageData } from "../utils/security.utils.js";
import { io, getAllUserSocketIds } from "../lib/socket.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // Sanitize inputs
    const sanitizedFullName = sanitizeInput(fullName);
    const sanitizedEmail = sanitizeEmail(email);

    if (!sanitizedFullName || !sanitizedEmail || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findByEmail(sanitizedEmail);
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await User.create({
      fullName: sanitizedFullName,
      email: sanitizedEmail,
      password: hashedPassword,
    });

    if (newUser) {
      // Generate auth token
      generateToken(newUser._id, res);

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });

      try {
        await sendWelcomeEmail(newUser.email, newUser.fullName, ENV.CLIENT_URL);
      } catch (error) {
        console.error("Failed to send welcome email:", error);
      }
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  // Sanitize email input
  const sanitizedEmail = sanitizeEmail(email);

  if (!sanitizedEmail || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findByEmail(sanitizedEmail);
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    // never tell the client which one is incorrect: password or email

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.error("Error in login controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (_, res) => {
  res.cookie("jwt", "", { maxAge: 0 });
  res.status(200).json({ message: "Logged out successfully" });
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    if (!profilePic) return res.status(400).json({ message: "Profile pic is required" });

    const userId = req.user._id;

    // SECURITY: Validate image data
    const imageValidation = validateImageData(profilePic);
    if (!imageValidation.valid) {
      return res.status(400).json({ message: imageValidation.error });
    }

    // Store the validated base64 image
    const updatedUser = await User.updateProfilePic(userId, profilePic);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // REAL-TIME PROFILE UPDATE: Broadcast profile update to all connected users
    const profileUpdateData = {
      userId: updatedUser._id,
      fullName: updatedUser.fullName,
      profilePic: updatedUser.profilePic,
      updatedAt: updatedUser.updatedAt
    };

    // Broadcast to ALL connected users (so they see updated profile pics in contacts/chats)
    io.emit("profileUpdated", profileUpdateData);

    console.log(`Profile updated for user ${updatedUser.fullName} (${userId}) - broadcasted to all users`);

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
