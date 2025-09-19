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

// we will use this function to check if the user is online or not
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// this is for storig online users
const userSocketMap = {}; // {userId:socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.user.fullName);

  const userId = socket.user._id;
  userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Listen for settings changes and broadcast to user's other devices
  socket.on("settingsChanged", (data) => {
    console.log(`🔄 Settings changed for user ${socket.user.fullName}:`, data);

    // Find all sockets for this user (multiple devices/tabs)
    const userSockets = Object.entries(userSocketMap)
      .filter(([id, socketId]) => id === userId)
      .map(([id, socketId]) => socketId);

    // Broadcast to all user's devices except the one that made the change
    userSockets.forEach(socketId => {
      if (socketId !== socket.id) {
        io.to(socketId).emit("settingsUpdated", {
          [data.type]: data.value
        });
        console.log(`📡 Settings update sent to socket ${socketId}`);
      }
    });
  });

  // with socket.on we listen for events from clients
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.user.fullName);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
