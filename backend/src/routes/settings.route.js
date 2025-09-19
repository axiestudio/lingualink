import express from "express";
import { 
  getUserProfile,
  updateUserProfile,
  updatePassword,
  getTranslationSettings,
  updateTranslationSettings,
  testApiKey
} from "../controllers/settings.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// All settings routes require authentication
router.use(protectRoute);

// Profile routes
router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);
router.put("/password", updatePassword);

// Translation settings routes
router.get("/translation", getTranslationSettings);
router.put("/translation", updateTranslationSettings);

// API key testing
router.post("/test-api-key", testApiKey);

export default router;
