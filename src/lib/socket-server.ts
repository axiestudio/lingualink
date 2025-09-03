import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface SocketUser {
  userId: string;
  socketId: string;
  lastSeen: number;
}

class SocketIOManager {
  private io: SocketIOServer | null = null;
  private userSockets = new Map<string, SocketUser>(); // userId -> SocketUser
  private socketUsers = new Map<string, string>(); // socketId -> userId

  // Initialize Socket.IO server
  initializeSocketIO(server: any) {
    console.log('🚀 Initializing Socket.IO server...');

    this.io = new SocketIOServer(server, {
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
      allowEIO3: true
    });

    console.log('✅ Socket.IO server initialized with enhanced configuration');

    this.io.on('connection', (socket) => {
      console.log(`🔌 Socket.IO connection established: ${socket.id}`);
      console.log(`📊 Total connections: ${this.io?.engine.clientsCount || 0}`);

      // Handle connection errors
      socket.on('connect_error', (error) => {
        console.error(`❌ Socket connection error for ${socket.id}:`, error);
      });

      socket.on('disconnect_error', (error) => {
        console.error(`❌ Socket disconnect error for ${socket.id}:`, error);
      });

      // Handle user authentication
      socket.on('authenticate', async (data: { userId: string, token?: string }) => {
        try {
          const { userId } = data;
          console.log(`🔐 User authenticating: ${userId} (socket: ${socket.id})`);

          // Store the mapping
          this.userSockets.set(userId, {
            userId,
            socketId: socket.id,
            lastSeen: Date.now()
          });
          this.socketUsers.set(socket.id, userId);
          
          // Join user-specific room
          socket.join(`user_${userId}`);
          
          // Update user online status
          await this.updateUserOnlineStatus(userId, true);
          
          // Send confirmation
          socket.emit('authenticated', { success: true, userId });
          
          // Broadcast user online status to their contacts
          this.broadcastUserStatus(userId, true);
          
          console.log(`✅ User authenticated: ${userId}`);
          console.log(`📊 Total connected users: ${this.userSockets.size}`);
          
        } catch (error) {
          console.error('❌ Authentication error:', error);
          socket.emit('authentication_error', { error: 'Authentication failed' });
        }
      });

      // Handle joining room for real-time messaging
      socket.on('join_room', (data: { roomId: string }) => {
        const { roomId } = data;
        const userId = this.socketUsers.get(socket.id);
        
        if (userId) {
          socket.join(`room_${roomId}`);
          console.log(`🏠 User ${userId} joined room: ${roomId}`);
          socket.emit('room_joined', { roomId, success: true });
        }
      });

      // Handle leaving room
      socket.on('leave_room', (data: { roomId: string }) => {
        const { roomId } = data;
        const userId = this.socketUsers.get(socket.id);
        
        if (userId) {
          socket.leave(`room_${roomId}`);
          console.log(`🚪 User ${userId} left room: ${roomId}`);
          socket.emit('room_left', { roomId, success: true });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (data: { roomId: string }) => {
        const userId = this.socketUsers.get(socket.id);
        if (userId) {
          socket.to(`room_${data.roomId}`).emit('user_typing', { 
            userId, 
            roomId: data.roomId,
            typing: true 
          });
        }
      });

      socket.on('typing_stop', (data: { roomId: string }) => {
        const userId = this.socketUsers.get(socket.id);
        if (userId) {
          socket.to(`room_${data.roomId}`).emit('user_typing', { 
            userId, 
            roomId: data.roomId,
            typing: false 
          });
        }
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        const userId = this.socketUsers.get(socket.id);
        if (userId) {
          const userSocket = this.userSockets.get(userId);
          if (userSocket) {
            userSocket.lastSeen = Date.now();
          }
        }
        socket.emit('pong');
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        console.log(`🔌 Socket.IO disconnection: ${socket.id}`);
        const userId = this.socketUsers.get(socket.id);
        
        if (userId) {
          try {
            // Update user offline status
            await this.updateUserOnlineStatus(userId, false);
            
            // Broadcast user offline status
            this.broadcastUserStatus(userId, false);
            
            // Clean up mappings
            this.userSockets.delete(userId);
            this.socketUsers.delete(socket.id);
            
            console.log(`👋 User ${userId} disconnected`);
            console.log(`📊 Total connected users: ${this.userSockets.size}`);
            
          } catch (error) {
            console.error('❌ Error handling disconnection:', error);
          }
        }
      });
    });

    console.log('✅ Socket.IO server initialized with enhanced features');
    return this.io;
  }

  // Broadcast new message to room participants
  async broadcastMessage(roomId: string, messageData: any, senderUserId: string) {
    if (!this.io) return;

    console.log(`📡 Broadcasting message to room ${roomId} via Socket.IO`);
    
    try {
      // Broadcast to room (excluding sender)
      this.io.to(`room_${roomId}`).except(`user_${senderUserId}`).emit('new_message', {
        type: 'new_message',
        payload: messageData,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Message broadcasted to room ${roomId}`);
      
    } catch (error) {
      console.error('❌ Error broadcasting message:', error);
    }
  }

  // Broadcast user status change
  private broadcastUserStatus(userId: string, isOnline: boolean) {
    if (!this.io) return;

    // Broadcast to all connected users (they can filter on client side)
    this.io.emit('user_status_change', {
      userId,
      isOnline,
      timestamp: new Date().toISOString()
    });

    console.log(`📡 Broadcasted status change: ${userId} is ${isOnline ? 'online' : 'offline'}`);
  }

  // Update user online status in database
  private async updateUserOnlineStatus(userId: string, isOnline: boolean) {
    try {
      await sql`
        UPDATE users 
        SET is_online = ${isOnline}, last_seen = CURRENT_TIMESTAMP 
        WHERE clerk_id = ${userId}
      `;
    } catch (error) {
      console.error('❌ Error updating user online status:', error);
    }
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  // Get connected users
  getConnectedUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  // Check if user is connected
  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  // Send direct message to specific user
  sendToUser(userId: string, event: string, data: any) {
    if (!this.io) return;

    this.io.to(`user_${userId}`).emit(event, data);
    console.log(`📤 Sent ${event} to user ${userId}`);
  }

  // Get Socket.IO instance
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

// Singleton instance
let socketManager: SocketIOManager | null = null;

export function getSocketManager(): SocketIOManager {
  if (!socketManager) {
    socketManager = new SocketIOManager();
  }
  return socketManager;
}

export { SocketIOManager };
