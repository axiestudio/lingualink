import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import translationRoutes from "./routes/translation.route.js";
import settingsRoutes from "./routes/settings.route.js";
import pingRoutes from "./routes/ping.route.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import { app, server } from "./lib/socket.js";
import { generalRateLimit } from "./middleware/security.middleware.js";
import { corsConfig, helmetConfig } from "./config/security.config.js";

const __dirname = path.resolve();

const PORT = ENV.PORT || 3000;

// Trust proxy for Render deployment
if (ENV.NODE_ENV === "production") {
  app.set('trust proxy', true);
}

// Security middleware
app.use(helmet(helmetConfig));

// Rate limiting
app.use(generalRateLimit);

// Body parsing and CORS
app.use(express.json({
  limit: "5mb",
  verify: (req, res, buf) => {
    // Basic JSON bomb protection
    if (buf.length > 5 * 1024 * 1024) {
      throw new Error('Request entity too large');
    }
  }
}));
app.use(cors(corsConfig));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/translation", translationRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/ping", pingRoutes);

// make ready for deployment
if (ENV.NODE_ENV === "production") {
  const frontendDistPath = path.join(__dirname, "../frontend/dist");

  // Check if frontend dist exists before serving
  try {
    app.use(express.static(frontendDistPath));

    app.get("*", (req, res) => {
      // Only serve index.html for non-API routes
      if (!req.path.startsWith('/api')) {
        const indexPath = path.join(frontendDistPath, "index.html");
        res.sendFile(indexPath, (err) => {
          if (err) {
            console.log("Frontend files not found, serving API-only mode");
            res.status(404).json({
              message: "Frontend not available - API-only mode",
              api: "Backend API is running successfully"
            });
          }
        });
      } else {
        res.status(404).json({ error: "API endpoint not found" });
      }
    });
  } catch (error) {
    console.log("Frontend dist directory not found, running in API-only mode");
  }
}

server.listen(PORT, () => {
  console.log("Server running on port: " + PORT);
  connectDB();
});
