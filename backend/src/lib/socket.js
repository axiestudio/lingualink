import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [ENV.CLIENT_URL],
    credentials: true,
  },
});

// apply authentication middleware to all socket connections
io.use(socketAuthMiddleware);

// SECURE function to get receiver socket IDs with proper validation
export function getReceiverSocketId(userId) {
  if (!userId || !userSocketMap.has(userId)) {
    return null;
  }

  const socketIds = userSocketMap.get(userId);
  if (!socketIds || socketIds.size === 0) {
    return null;
  }

  // Return the first active socket ID (for primary connection)
  return Array.from(socketIds)[0];
}

// SECURE function to get ALL socket IDs for a user (for multi-device support)
export function getAllUserSocketIds(userId) {
  if (!userId || !userSocketMap.has(userId)) {
    return [];
  }

  const socketIds = userSocketMap.get(userId);
  return socketIds ? Array.from(socketIds) : [];
}

// SECURITY: Function to check if user is online
export function isUserOnline(userId) {
  return userSocketMap.has(userId) && userSocketMap.get(userId).size > 0;
}

// SECURE user socket mapping with proper isolation
const userSocketMap = new Map(); // {userId: Set<socketId>} - Support multiple connections per user

io.on("connection", (socket) => {
  console.log("A user connected", socket.user.fullName);

  const userId = socket.user._id;

  // SECURITY: Ensure proper user isolation
  if (!userSocketMap.has(userId)) {
    userSocketMap.set(userId, new Set());
  }
  userSocketMap.get(userId).add(socket.id);

  // SECURITY: Only send sanitized user IDs (no sensitive data)
  const onlineUserIds = Array.from(userSocketMap.keys()).map(id => parseInt(id));
  io.emit("getOnlineUsers", onlineUserIds);

  console.log(`User ${socket.user.fullName} (${userId}) connected with socket ${socket.id}`);
  console.log(`Total connections for user ${userId}:`, userSocketMap.get(userId).size);

  // SECURITY: Handle disconnect with proper cleanup
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.user.fullName);

    if (userSocketMap.has(userId)) {
      userSocketMap.get(userId).delete(socket.id);

      // Remove user from map if no more connections
      if (userSocketMap.get(userId).size === 0) {
        userSocketMap.delete(userId);
      }
    }

    // Update online users list
    const updatedOnlineUserIds = Array.from(userSocketMap.keys()).map(id => parseInt(id));
    io.emit("getOnlineUsers", updatedOnlineUserIds);

    console.log(`User ${socket.user.fullName} (${userId}) disconnected from socket ${socket.id}`);
  });
});

export { io, app, server };
