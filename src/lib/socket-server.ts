import { Server as SocketIOServer } from 'socket.io';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface SocketUser {
  userId: string;
  socketId: string;
  lastSeen: number;
  sessionToken?: string;
  authenticatedAt?: number;
}

class SocketIOManager {
  private static instance: SocketIOManager | null = null;
  private io: SocketIOServer | null = null;
  private userSockets = new Map<string, SocketUser>(); // userId -> SocketUser
  private socketUsers = new Map<string, string>(); // socketId -> userId
  private sessionCleanupInterval: NodeJS.Timeout | null = null;

  // Singleton pattern
  public static getInstance(): SocketIOManager {
    if (!SocketIOManager.instance) {
      SocketIOManager.instance = new SocketIOManager();
    }
    return SocketIOManager.instance;
  }

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

      // Handle user authentication with Clerk session validation
      socket.on('authenticate', async (data: { userId: string, sessionToken?: string }) => {
        try {
          const { userId, sessionToken } = data;
          console.log(`🔐 User authenticating: ${userId} (socket: ${socket.id})`);

          // Validate Clerk session token
          if (!sessionToken) {
            console.error('❌ No session token provided');
            socket.emit('authentication_error', { error: 'Session token required' });
            return;
          }

          // Verify session with Clerk
          const isValidSession = await this.validateClerkSession(userId, sessionToken);
          if (!isValidSession) {
            console.error('❌ Invalid Clerk session');
            socket.emit('authentication_error', { error: 'Invalid session' });
            return;
          }

          // Store the mapping with session info
          this.userSockets.set(userId, {
            userId,
            socketId: socket.id,
            lastSeen: Date.now(),
            sessionToken,
            authenticatedAt: Date.now()
          });
          this.socketUsers.set(socket.id, userId);

          // Join user-specific room
          socket.join(`user_${userId}`);

          // Update user online status in database
          await this.updateUserOnlineStatus(userId, true);

          // Send confirmation
          socket.emit('authenticated', { success: true, userId });

          // Broadcast user online status to their contacts
          this.broadcastUserStatus(userId, true);

          console.log(`✅ User authenticated with valid Clerk session: ${userId}`);
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

    // Start session cleanup interval
    this.startSessionCleanup();

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
  public broadcastUserStatus(userId: string, isOnline: boolean) {
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

  // Validate Clerk session token using Clerk's backend SDK
  private async validateClerkSession(userId: string, sessionToken: string): Promise<boolean> {
    try {
      // Use Clerk's backend SDK to verify the session token
      const { createClerkClient } = await import('@clerk/backend');
      const clerkClient = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY!
      });

      // Get session information
      const session = await clerkClient.sessions.getSession(sessionToken);

      if (!session || session.userId !== userId) {
        console.error('❌ Session validation failed: invalid session or user mismatch');
        return false;
      }

      // Check if session is active
      if (session.status !== 'active') {
        console.error('❌ Session validation failed: session not active');
        return false;
      }

      // Check if session is expired
      const now = new Date();
      if (session.expireAt && new Date(session.expireAt) < now) {
        console.error('❌ Session validation failed: session expired');
        return false;
      }

      console.log(`✅ Clerk session validated for user: ${userId}`);
      return true;

    } catch (error) {
      console.error('❌ Error validating Clerk session:', error);
      // If we can't validate, assume invalid for security
      return false;
    }
  }

  // Start periodic session cleanup
  private startSessionCleanup() {
    // Clean up expired sessions every 5 minutes
    this.sessionCleanupInterval = setInterval(async () => {
      console.log('🧹 Starting session cleanup...');
      await this.cleanupExpiredSessions();
    }, 5 * 60 * 1000); // 5 minutes

    console.log('✅ Session cleanup interval started');
  }

  // Clean up expired or invalid sessions
  private async cleanupExpiredSessions() {
    const now = Date.now();
    const expiredUsers: string[] = [];

    for (const [userId, socketUser] of this.userSockets.entries()) {
      try {
        // Check if session is older than 24 hours (force revalidation)
        const sessionAge = now - (socketUser.authenticatedAt || 0);
        const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours

        if (sessionAge > maxSessionAge && socketUser.sessionToken) {
          // Revalidate session with Clerk
          const isValid = await this.validateClerkSession(userId, socketUser.sessionToken);

          if (!isValid) {
            console.log(`🧹 Marking user ${userId} as offline due to invalid session`);
            expiredUsers.push(userId);
          } else {
            // Update authentication timestamp
            socketUser.authenticatedAt = now;
          }
        }
      } catch (error) {
        console.error(`❌ Error validating session for user ${userId}:`, error);
        expiredUsers.push(userId);
      }
    }

    // Clean up expired users
    for (const userId of expiredUsers) {
      await this.forceUserOffline(userId);
    }

    if (expiredUsers.length > 0) {
      console.log(`🧹 Cleaned up ${expiredUsers.length} expired sessions`);
    }
  }

  // Force user offline and clean up their connection
  private async forceUserOffline(userId: string) {
    const socketUser = this.userSockets.get(userId);

    if (socketUser) {
      try {
        // Update database status
        await this.updateUserOnlineStatus(userId, false);

        // Broadcast offline status
        this.broadcastUserStatus(userId, false);

        // Disconnect the socket
        const socket = this.io?.sockets.sockets.get(socketUser.socketId);
        if (socket) {
          socket.emit('session_expired', { reason: 'Session expired or invalid' });
          socket.disconnect(true);
        }

        // Clean up mappings
        this.userSockets.delete(userId);
        this.socketUsers.delete(socketUser.socketId);

        console.log(`🧹 Forced user ${userId} offline due to session expiry`);
      } catch (error) {
        console.error(`❌ Error forcing user ${userId} offline:`, error);
      }
    }
  }

  // Stop session cleanup
  private stopSessionCleanup() {
    if (this.sessionCleanupInterval) {
      clearInterval(this.sessionCleanupInterval);
      this.sessionCleanupInterval = null;
      console.log('🛑 Session cleanup interval stopped');
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

  // Broadcast user profile update to all connected clients
  broadcastUserProfileUpdate(userId: string, updates: any) {
    if (!this.io) return;

    console.log(`📡 Broadcasting profile update for user ${userId} via Socket.IO`);

    try {
      // Broadcast to all connected clients (they'll filter based on their needs)
      this.io.emit('user_profile_updated', {
        type: 'user_profile_updated',
        payload: {
          user_id: userId,
          updates: updates,
          timestamp: new Date().toISOString()
        }
      });

      console.log(`✅ Profile update broadcasted for user ${userId}`);

    } catch (error) {
      console.error('❌ Error broadcasting profile update:', error);
    }
  }

  // Get Socket.IO instance
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

// Export the singleton instance getter
export function getSocketManager(): SocketIOManager {
  return SocketIOManager.getInstance();
}

export { SocketIOManager };
