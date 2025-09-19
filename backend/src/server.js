import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import translationRoutes from "./routes/translation.route.js";
import settingsRoutes from "./routes/settings.route.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import { app, server } from "./lib/socket.js";
import { generalRateLimit } from "./middleware/security.middleware.js";
import { corsConfig, helmetConfig } from "./config/security.config.js";

const __dirname = path.resolve();

const PORT = ENV.PORT || 3000;

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

// make ready for deployment
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(PORT, () => {
  console.log("Server running on port: " + PORT);
  connectDB();
});
