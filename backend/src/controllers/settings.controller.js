import UserSettings from "../models/UserSettings.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { SUPPORTED_LANGUAGES } from "../services/translation.service.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

/**
 * Get user profile and settings
 */
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user basic info
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    // Get user settings
    const settings = await UserSettings.getByUserId(userId);

    res.status(200).json({
      success: true,
      profile: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      settings: {
        preferredLanguage: settings.preferredLanguage,
        autoTranslateEnabled: settings.autoTranslateEnabled,
        hasCustomApiKey: !!settings.openaiApiKey,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt
      }
    });
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error" 
    });
  }
};

/**
 * Update user profile (name, profile picture)
 */
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fullName, profilePic } = req.body;

    // Validation
    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Full name must be at least 2 characters long"
      });
    }

    // Update user
    const updateData = {
      full_name: fullName.trim()
    };
    if (profilePic) {
      updateData.profile_pic = profilePic;
    }

    const updatedUser = await User.updateProfile(userId, updateData);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Emit real-time update to user's other devices/sessions
    const userSocketId = getReceiverSocketId(userId);
    if (userSocketId) {
      io.to(userSocketId).emit("profileUpdated", {
        fullName: updatedUser.fullName,
        profilePic: updatedUser.profilePic,
        updatedAt: updatedUser.updatedAt
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile: {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        profilePic: updatedUser.profilePic,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error" 
    });
  }
};

/**
 * Update user password
 */
export const updatePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 6 characters long"
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: "Current password is incorrect"
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await User.updatePassword(userId, hashedNewPassword);

    res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    console.error("Error in updatePassword:", error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error" 
    });
  }
};

/**
 * Get user translation settings
 */
export const getTranslationSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const settings = await UserSettings.getByUserId(userId);

    res.status(200).json({
      success: true,
      settings: {
        preferredLanguage: settings.preferredLanguage,
        autoTranslateEnabled: settings.autoTranslateEnabled,
        hasCustomApiKey: !!settings.openaiApiKey
      },
      supportedLanguages: SUPPORTED_LANGUAGES
    });
  } catch (error) {
    console.error("Error in getTranslationSettings:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

/**
 * Get another user's public settings (for translation purposes)
 */
export const getUserPublicSettings = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Get user's translation settings (only public info)
    const settings = await UserSettings.getByUserId(userId);

    res.status(200).json({
      success: true,
      settings: {
        preferredLanguage: settings.preferredLanguage,
        // Don't expose private settings like API keys or auto-translate preferences
      }
    });
  } catch (error) {
    console.error("Error in getUserPublicSettings:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

/**
 * Update translation settings
 */
export const updateTranslationSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { preferredLanguage, autoTranslateEnabled, soundEnabled, openaiApiKey } = req.body;

    // Validation
    if (preferredLanguage && !SUPPORTED_LANGUAGES[preferredLanguage]) {
      return res.status(400).json({
        success: false,
        error: `Unsupported language: ${preferredLanguage}`
      });
    }

    // Prepare settings object
    const settingsUpdate = {};
    if (preferredLanguage !== undefined) settingsUpdate.preferredLanguage = preferredLanguage;
    if (autoTranslateEnabled !== undefined) settingsUpdate.autoTranslateEnabled = autoTranslateEnabled;
    if (soundEnabled !== undefined) settingsUpdate.soundEnabled = soundEnabled;
    if (openaiApiKey !== undefined) settingsUpdate.openaiApiKey = openaiApiKey || null;

    // Update settings
    const updatedSettings = await UserSettings.upsert(userId, settingsUpdate);

    // Emit real-time update to user's other devices/sessions
    const userSocketId = getReceiverSocketId(userId);
    if (userSocketId) {
      io.to(userSocketId).emit("settingsUpdated", {
        preferredLanguage: updatedSettings.preferredLanguage,
        autoTranslateEnabled: updatedSettings.autoTranslateEnabled,
        soundEnabled: updatedSettings.soundEnabled,
        hasCustomApiKey: !!updatedSettings.openaiApiKey,
        updatedAt: updatedSettings.updatedAt
      });
    }

    res.status(200).json({
      success: true,
      message: "Translation settings updated successfully",
      settings: {
        preferredLanguage: updatedSettings.preferredLanguage,
        autoTranslateEnabled: updatedSettings.autoTranslateEnabled,
        soundEnabled: updatedSettings.soundEnabled,
        hasCustomApiKey: !!updatedSettings.openaiApiKey,
        updatedAt: updatedSettings.updatedAt
      }
    });
  } catch (error) {
    console.error("Error in updateTranslationSettings:", error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error" 
    });
  }
};

/**
 * Test user's OpenAI API key
 */
export const testApiKey = async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: "API key is required"
      });
    }

    // Test the API key with a simple translation
    const testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: 'Translate "Hello" to Spanish. Only return the translation.' }
        ],
        max_tokens: 10
      })
    });

    if (testResponse.ok) {
      res.status(200).json({
        success: true,
        message: "API key is valid and working"
      });
    } else {
      const errorData = await testResponse.json();
      res.status(400).json({
        success: false,
        error: `Invalid API key: ${errorData.error?.message || 'Unknown error'}`
      });
    }
  } catch (error) {
    console.error("Error in testApiKey:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to test API key" 
    });
  }
};
