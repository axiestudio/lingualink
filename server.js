const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO with stable configuration
  const io = new SocketIOServer(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://lingualink.tech"
      ],
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    allowEIO3: true,
    maxHttpBufferSize: 1e6,
    httpCompression: true,
    perMessageDeflate: true
  });

  // Store user connections
  const userSockets = new Map(); // userId -> socketId
  const socketUsers = new Map(); // socketId -> userId

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log(`🔌 Socket.IO connection: ${socket.id}`);

    // Add connection stability
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error);
    });

    // Handle user authentication
    socket.on('authenticate', async (data) => {
      try {
        const { userId, token } = data;
        console.log(`🔐 User authenticating: ${userId}`);

        // Check if user already has a connection
        const existingSocketId = userSockets.get(userId);
        if (existingSocketId && existingSocketId !== socket.id) {
          // Disconnect the old socket
          const existingSocket = io.sockets.sockets.get(existingSocketId);
          if (existingSocket) {
            console.log(`🔄 Replacing existing connection for user: ${userId}`);
            existingSocket.disconnect(true);
          }
        }

        // Store mappings
        userSockets.set(userId, socket.id);
        socketUsers.set(socket.id, userId);
        
        // Join user room
        socket.join(`user_${userId}`);
        
        // Send confirmation
        socket.emit('authenticated', { success: true, userId });
        
        console.log(`✅ User authenticated: ${userId}`);
        console.log(`📊 Connected users: ${userSockets.size}`);
        
      } catch (error) {
        console.error('❌ Authentication error:', error);
        socket.emit('authentication_error', { error: 'Authentication failed' });
      }
    });

    // Handle joining rooms
    socket.on('join_room', (data) => {
      const { roomId } = data;
      const userId = socketUsers.get(socket.id);
      
      if (userId) {
        socket.join(`room_${roomId}`);
        console.log(`🏠 User ${userId} joined room: ${roomId}`);
        socket.emit('room_joined', { roomId, success: true });
      }
    });

    // Handle leaving rooms
    socket.on('leave_room', (data) => {
      const { roomId } = data;
      const userId = socketUsers.get(socket.id);
      
      if (userId) {
        socket.leave(`room_${roomId}`);
        console.log(`🚪 User ${userId} left room: ${roomId}`);
        socket.emit('room_left', { roomId, success: true });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const userId = socketUsers.get(socket.id);
      if (userId) {
        socket.to(`room_${data.roomId}`).emit('user_typing', {
          userId,
          roomId: data.roomId,
          typing: true
        });
      }
    });

    socket.on('typing_stop', (data) => {
      const userId = socketUsers.get(socket.id);
      if (userId) {
        socket.to(`room_${data.roomId}`).emit('user_typing', {
          userId,
          roomId: data.roomId,
          typing: false
        });
      }
    });

    // Handle profile update broadcasting
    socket.on('broadcast_profile_update', (data, callback) => {
      const { userId, updates } = data;
      const senderUserId = socketUsers.get(socket.id);

      console.log(`👤 Broadcasting profile update for user ${userId}:`, updates);

      // Verify the user is updating their own profile
      if (senderUserId !== userId) {
        console.warn(`⚠️ User ${senderUserId} tried to update profile for ${userId}`);
        if (callback) callback({ success: false, error: 'Unauthorized' });
        return;
      }

      try {
        // Broadcast profile update to all connected users
        const profileUpdatePayload = {
          type: 'user_profile_updated',
          payload: {
            user_id: userId,
            updates: updates
          },
          timestamp: new Date().toISOString()
        };

        // Send to all connected users except the sender
        let deliveredCount = 0;
        for (const [socketId, connectedUserId] of socketUsers.entries()) {
          if (connectedUserId !== senderUserId) {
            const targetSocket = io.sockets.sockets.get(socketId);
            if (targetSocket) {
              targetSocket.emit('user_profile_updated', profileUpdatePayload);
              deliveredCount++;
              console.log(`📨 Profile update delivered to user: ${connectedUserId}`);
            }
          }
        }

        console.log(`✅ Profile update broadcast complete: ${deliveredCount} recipients`);

        // Send acknowledgment back to sender
        if (callback) {
          callback({
            success: true,
            delivered: deliveredCount,
            message: 'Profile update broadcasted successfully'
          });
        }

      } catch (error) {
        console.error('❌ Error broadcasting profile update:', error);
        if (callback) {
          callback({
            success: false,
            error: 'Failed to broadcast profile update'
          });
        }
      }
    });

    // Handle real-time message broadcasting with acknowledgments
    socket.on('broadcast_message', (data, callback) => {
      const { roomId, messageData, senderUserId } = data;
      console.log(`📡 Broadcasting message to room ${roomId} (excluding sender ${senderUserId})`);

      try {
        // Get room participants
        const roomSockets = io.sockets.adapter.rooms.get(`room_${roomId}`);
        const totalParticipants = roomSockets ? roomSockets.size : 0;

        console.log(`👥 Room ${roomId} has ${totalParticipants} participants`);

        // Get currently connected users in this room
        const connectedUsers = [];
        if (roomSockets) {
          for (const socketId of roomSockets) {
            const userId = socketUsers.get(socketId);
            if (userId && userId !== senderUserId) {
              connectedUsers.push(userId);
            }
          }
        }

        console.log(`🔌 Currently connected users: ${JSON.stringify(connectedUsers)}`);

        // Broadcast to room excluding sender with instant delivery
        const messagePayload = {
          type: 'new_message',
          payload: messageData,
          timestamp: new Date().toISOString(),
          roomId: roomId
        };

        // Send to all room participants except sender
        let deliveredCount = 0;
        if (roomSockets) {
          for (const socketId of roomSockets) {
            const userId = socketUsers.get(socketId);
            if (userId && userId !== senderUserId) {
              const targetSocket = io.sockets.sockets.get(socketId);
              if (targetSocket) {
                targetSocket.emit('new_message', messagePayload);
                deliveredCount++;
                console.log(`📨 Message delivered to user: ${userId}`);
              }
            } else if (userId === senderUserId) {
              console.log(`⏭️ Skipping sender: ${senderUserId}`);
            }
          }
        }

        console.log(`✅ Broadcast complete: ${deliveredCount}/${connectedUsers.length} recipients`);

        // Send acknowledgment back to sender
        if (callback) {
          callback({
            success: true,
            delivered: deliveredCount,
            totalParticipants: totalParticipants - 1, // Exclude sender
            connectedUsers: connectedUsers.length
          });
        }

      } catch (error) {
        console.error('❌ Error broadcasting message:', error);
        if (callback) {
          callback({
            success: false,
            delivered: 0,
            error: error.message
          });
        }
      }
    });

    // Handle ping/pong
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      const userId = socketUsers.get(socket.id);
      
      if (userId) {
        userSockets.delete(userId);
        socketUsers.delete(socket.id);
        console.log(`👋 User ${userId} disconnected`);
        console.log(`📊 Connected users: ${userSockets.size}`);
      }
    });
  });

  // Make io available globally for API routes
  global.io = io;
  global.userSockets = userSockets;
  global.socketUsers = socketUsers;

  // Start server
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 Lingua Link server ready on http://${hostname}:${port}`);
    console.log(`✅ Socket.IO server initialized`);
  });
});
