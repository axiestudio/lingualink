import { getReceiverSocketId, getAllUserSocketIds, io } from "../lib/socket.js";
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

    // SECURITY: Validate that the requesting user is authenticated
    if (!myId) {
      return res.status(401).json({ message: "Unauthorized: User not authenticated" });
    }

    // SECURITY: Prevent accessing messages with yourself (edge case)
    if (parseInt(myId) === parseInt(userToChatId)) {
      return res.status(400).json({ message: "Cannot retrieve messages with yourself" });
    }

    // SECURITY: Verify the other user exists
    const otherUserExists = await User.exists(userToChatId);
    if (!otherUserExists) {
      return res.status(404).json({ message: "User not found" });
    }

    // SECURITY: Only retrieve messages between authenticated user and specified user
    // This ensures users can ONLY see their own conversations
    const messages = await Message.findBetweenUsers(myId, userToChatId);

    console.log(`Retrieved ${messages.length} messages between user ${myId} and user ${userToChatId}`);
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

    // SECURITY: Comprehensive input validation
    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }

    // SECURITY: Prevent self-messaging
    if (parseInt(senderId) === parseInt(receiverId)) {
      return res.status(400).json({ message: "Cannot send messages to yourself." });
    }

    // SECURITY: Verify receiver exists and is a valid user
    const receiverExists = await User.exists(receiverId);
    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    // SECURITY: Additional validation - ensure sender is authenticated user
    if (req.user._id !== senderId) {
      return res.status(403).json({ message: "Unauthorized: Cannot send messages as another user." });
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

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: sanitizedText,
      image: imageBuffer,
      imageName,
      imageType,
    });

    // SECURITY: Get socket IDs with proper validation
    const receiverSocketIds = getAllUserSocketIds(receiverId);
    const senderSocketIds = getAllUserSocketIds(senderId);

    console.log("Sending message to receiver:", receiverId, "socketIds:", receiverSocketIds);
    console.log("Sending message to sender:", senderId, "socketIds:", senderSocketIds);

    // SECURITY: Send to ALL receiver devices (multi-device support)
    if (receiverSocketIds.length > 0) {
      receiverSocketIds.forEach(socketId => {
        io.to(socketId).emit("newMessage", newMessage);
      });
      console.log(`Message sent to receiver on ${receiverSocketIds.length} device(s)`);
    } else {
      console.log("Receiver not online");
    }

    // SECURITY: Send to ALL sender devices for real-time update (excluding receiver devices)
    if (senderSocketIds.length > 0) {
      senderSocketIds.forEach(socketId => {
        // Only send to sender devices that are not also receiver devices
        if (!receiverSocketIds.includes(socketId)) {
          io.to(socketId).emit("newMessage", newMessage);
        }
      });
      console.log(`Message sent to sender on ${senderSocketIds.length} device(s)`);
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

// SECURE endpoint to serve images with proper authorization
export const getMessageImage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    // SECURITY: Validate user is authenticated
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: User not authenticated" });
    }

    // SECURITY: First, get the message to verify user has access
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // SECURITY: Verify user is either sender or receiver of this message
    if (parseInt(message.senderId) !== parseInt(userId) && parseInt(message.receiverId) !== parseInt(userId)) {
      return res.status(403).json({ message: "Forbidden: You don't have access to this image" });
    }

    // Get image data only after authorization check
    const imageData = await Message.getImageData(messageId);
    if (!imageData || !imageData.image) {
      return res.status(404).json({ message: "Image not found" });
    }

    // SECURITY: Set proper headers and serve image
    res.set({
      'Content-Type': imageData.image_type || 'image/jpeg',
      'Content-Length': imageData.image.length,
      'Cache-Control': 'private, max-age=3600', // Cache for 1 hour, private only
    });

    res.send(imageData.image);
  } catch (error) {
    console.error("Error in getMessageImage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
