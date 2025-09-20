import express from "express";
import {
  getAllContacts,
  getChatPartners,
  getMessagesByUserId,
  sendMessage,
  getMessageImage,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { messageRateLimit, uploadRateLimit } from "../middleware/security.middleware.js";
import {
  validateMessage,
  validateGetMessages,
  validateGetImage
} from "../middleware/validation.middleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protectRoute);

router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);
router.get("/image/:messageId", validateGetImage, getMessageImage);
router.get("/:id", validateGetMessages, getMessagesByUserId);

// Apply specific rate limiting for message sending
router.post("/send/:id", messageRateLimit, uploadRateLimit, validateMessage, sendMessage);

export default router;
