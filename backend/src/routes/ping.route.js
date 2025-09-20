import express from "express";

const router = express.Router();

/**
 * Keep-alive ping endpoint for Render free tier
 * This endpoint is designed to be as lightweight as possible
 * to prevent the server from sleeping due to inactivity
 */
router.get("/", (req, res) => {
  // Ultra-lightweight response - just timestamp
  res.status(200).json({
    status: "alive",
    timestamp: Date.now(),
    uptime: process.uptime()
  });
});

/**
 * Health check endpoint with minimal system info
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: Date.now(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    }
  });
});

export default router;
