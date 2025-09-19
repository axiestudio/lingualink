import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { sanitizeMessageText, validateImageData } from "../utils/security.utils.js";

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.findAllExcept(loggedInUserId);

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;

    const messages = await Message.findBetweenUsers(myId, userToChatId);

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    console.log("SendMessage called with:", {
      hasText: !!text,
      hasImage: !!image,
      imageLength: image ? image.length : 0,
      receiverId,
      senderId
    });

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }
    if (senderId == receiverId) {
      return res.status(400).json({ message: "Cannot send messages to yourself." });
    }
    const receiverExists = await User.exists(receiverId);
    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    // Sanitize text input
    const sanitizedText = text ? sanitizeMessageText(text) : null;

    let imageBuffer = null;
    let imageName = null;
    let imageType = null;

    if (image) {
      console.log("Processing image data...");
      // Validate image data
      const imageValidation = validateImageData(image);
      console.log("Image validation result:", imageValidation);
      if (!imageValidation.valid) {
        console.log("Image validation failed:", imageValidation.error);
        return res.status(400).json({ message: imageValidation.error });
      }

      imageType = imageValidation.mimeType;
      imageBuffer = Buffer.from(imageValidation.base64Data, 'base64');
      imageName = `image_${Date.now()}.${imageType.split('/')[1]}`;
      console.log("Image processed successfully:", { imageType, imageName, bufferSize: imageBuffer.length });
    }

    // Extract translation metadata from request
    const { originalText, translatedFrom, translatedTo } = req.body;
    const isAutoTranslated = !!(originalText && translatedFrom && translatedTo);

    console.log("Translation metadata:", {
      hasOriginalText: !!originalText,
      translatedFrom,
      translatedTo,
      isAutoTranslated
    });

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: sanitizedText,
      originalText: originalText || null,
      translatedFrom: translatedFrom || null,
      translatedTo: translatedTo || null,
      isAutoTranslated,
      image: imageBuffer,
      imageName,
      imageType,
    });

    const receiverSocketId = getReceiverSocketId(receiverId);
    const senderSocketId = getReceiverSocketId(senderId);

    console.log("Sending message to receiver:", receiverId, "socketId:", receiverSocketId);
    console.log("Sending message to sender:", senderId, "socketId:", senderSocketId);

    // Send to receiver
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
      console.log("Message sent to receiver");
    } else {
      console.log("Receiver not online");
    }

    // Also send to sender for real-time update (if they're on a different device/tab)
    if (senderSocketId && senderSocketId !== receiverSocketId) {
      io.to(senderSocketId).emit("newMessage", newMessage);
      console.log("Message sent to sender");
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Find all users that have chatted with the logged-in user
    const chatPartnerIds = await Message.findChatPartners(loggedInUserId);

    // Get user details for each chat partner
    const chatPartners = [];
    for (const partnerId of chatPartnerIds) {
      const user = await User.findByIdWithoutPassword(partnerId);
      if (user) {
        chatPartners.push(user);
      }
    }

    res.status(200).json(chatPartners);
  } catch (error) {
    console.error("Error in getChatPartners: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// New endpoint to serve images
export const getMessageImage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const imageData = await Message.getImageData(messageId);
    if (!imageData || !imageData.image) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.set({
      'Content-Type': imageData.image_type || 'image/jpeg',
      'Content-Length': imageData.image.length,
    });

    res.send(imageData.image);
  } catch (error) {
    console.error("Error in getMessageImage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
