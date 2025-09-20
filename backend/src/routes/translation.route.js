import express from "express";
import {
  getSupportedLanguages,
  translateMessage,
  translateMessageById,
  detectTextLanguage,
  batchTranslate,
  getTranslationStatus,
  getTranslationHistory,
  getTranslationStats
} from "../controllers/translation.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// All translation routes require authentication
router.use(protectRoute);

// Get supported languages
router.get("/languages", getSupportedLanguages);

// Translate text
router.post("/translate", translateMessage);

// Translate specific message by ID
router.post("/message/:messageId", translateMessageById);

// Detect language
router.post("/detect", detectTextLanguage);

// Batch translate
router.post("/batch", batchTranslate);

// Get translation service status
router.get("/status", getTranslationStatus);

// Get translation history
router.get("/history", getTranslationHistory);

// Get translation statistics
router.get("/stats", getTranslationStats);

export default router;
