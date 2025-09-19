import express from "express";
import { 
  getSupportedLanguages, 
  translateMessage, 
  detectTextLanguage, 
  batchTranslate, 
  getTranslationStatus 
} from "../controllers/translation.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// All translation routes require authentication
router.use(protectRoute);

// Get supported languages
router.get("/languages", getSupportedLanguages);

// Translate text
router.post("/translate", translateMessage);

// Detect language
router.post("/detect", detectTextLanguage);

// Batch translate
router.post("/batch", batchTranslate);

// Get translation service status
router.get("/status", getTranslationStatus);

export default router;
