import { Server as SocketIOServer } from 'socket.io';
import { neon } from '@neondatabase/serverless';
import { secureLogger, SecurityEventType } from './secure-logger';

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
          secureLogger.logInfoSecurity(
            SecurityEventType.AUTHENTICATION_SUCCESS,
            'User authentication attempt',
            {
              userId: userId.substring(0, 8) + '***',
              socketId: socket.id.substring(0, 8) + '***'
            }
          );

          // Validate Clerk session token
          if (!sessionToken) {
            secureLogger.logWarningSecurity(
              SecurityEventType.AUTHENTICATION_FAILURE,
              'Authentication failed: No session token provided'
            );
            socket.emit('authentication_error', { error: 'Session token required' });
            return;
          }

          // Verify session with Clerk
          const isValidSession = await this.validateClerkSession(userId, sessionToken);
          if (!isValidSession) {
            secureLogger.logWarningSecurity(
              SecurityEventType.AUTHENTICATION_FAILURE,
              'Authentication failed: Invalid Clerk session',
              { userId: userId.substring(0, 8) + '***' }
            );
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

        } catch (authError) {
          console.error('❌ Authentication error:', authError);
          socket.emit('authentication_error', { error: 'Authentication failed' });
        }
      });

      // 🔒 ENHANCED ROOM JOINING WITH MULTI-LAYER SECURITY
      socket.on('join_room', async (data: { roomId: string }) => {
        const { roomId } = data;
        const userId = this.socketUsers.get(socket.id);

        if (!userId) {
          secureLogger.logWarningSecurity(
            SecurityEventType.AUTHORIZATION_FAILURE,
            'Room join attempt without authentication',
            { roomId: roomId?.substring(0, 12) + '***' }
          );
          socket.emit('room_join_error', { error: 'Not authenticated' });
          return;
        }

        // 🔒 SECURITY LAYER 1: Verify user has access to this room
        try {
          const hasAccess = await this.verifyRoomAccess(userId, roomId);
          if (!hasAccess) {
            secureLogger.logCriticalSecurity(
              SecurityEventType.AUTHORIZATION_FAILURE,
              'Unauthorized room join attempt blocked',
              {
                userId: userId.substring(0, 8) + '***',
                roomId: roomId.substring(0, 12) + '***',
                action: 'BLOCKED'
              }
            );
            socket.emit('room_join_error', { error: 'Access denied' });
            return;
          }

          // 🔒 SECURITY LAYER 2: Verify room exists and is active
          const roomExists = await this.verifyRoomExists(roomId);
          if (!roomExists) {
            secureLogger.logWarningSecurity(
              SecurityEventType.AUTHORIZATION_FAILURE,
              'Attempt to join non-existent room',
              {
                userId: userId.substring(0, 8) + '***',
                roomId: roomId.substring(0, 12) + '***'
              }
            );
            socket.emit('room_join_error', { error: 'Room not found' });
            return;
          }

          // 🔒 SECURITY LAYER 3: Join room with verification
          socket.join(`room_${roomId}`);

          secureLogger.logInfoSecurity(
            SecurityEventType.DATA_ACCESS,
            'User joined room successfully',
            {
              userId: userId.substring(0, 8) + '***',
              roomId: roomId.substring(0, 12) + '***',
              action: 'ROOM_JOIN'
            }
          );

          socket.emit('room_joined', { roomId, success: true });
        } catch {
          secureLogger.logCriticalSecurity(
            SecurityEventType.SYSTEM_ERROR,
            'Room access verification failed',
            {
              userId: userId.substring(0, 8) + '***',
              roomId: roomId?.substring(0, 12) + '***',
              error: 'VERIFICATION_ERROR'
            }
          );
          socket.emit('room_join_error', { error: 'Access verification failed' });
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

      // Handle user logout event
      socket.on('user_logout', async (data: { userId: string }) => {
        try {
          const { userId } = data;
          console.log(`🚪 User logout event received: ${userId}`);

          // Verify this socket belongs to the user
          const socketUserId = this.socketUsers.get(socket.id);
          if (socketUserId !== userId) {
            console.warn(`⚠️ Logout attempt from wrong user: ${socketUserId} vs ${userId}`);
            return;
          }

          // Update user offline status in database
          await this.updateUserOnlineStatus(userId, false);

          // Broadcast user offline status
          this.broadcastUserStatus(userId, false);

          // Remove mappings
          this.userSockets.delete(userId);
          this.socketUsers.delete(socket.id);

          // Acknowledge logout
          socket.emit('logout_acknowledged', { success: true, userId });

          console.log(`✅ User ${userId} logged out successfully`);
          console.log(`📊 Total connected users: ${this.userSockets.size}`);

        } catch (logoutError) {
          console.error('❌ Error handling user logout:', logoutError);
          socket.emit('logout_error', { error: 'Logout failed' });
        }
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
            
          } catch (disconnectError) {
            console.error('❌ Error handling disconnection:', disconnectError);
          }
        }
      });
    });

    // Start session cleanup interval
    this.startSessionCleanup();

    console.log('✅ Socket.IO server initialized with enhanced features');
    return this.io;
  }

  // 🔒 BULLETPROOF MESSAGE BROADCASTING WITH MULTI-LAYER SECURITY
  async broadcastMessage(roomId: string, messageData: any, senderUserId: string) {
    if (!this.io) return;

    try {
      // 🔒 SECURITY LAYER 1: Verify sender has access to room
      const senderHasAccess = await this.verifyRoomAccess(senderUserId, roomId);
      if (!senderHasAccess) {
        secureLogger.logCriticalSecurity(
          SecurityEventType.AUTHORIZATION_FAILURE,
          'Message broadcast blocked: Sender lacks room access',
          {
            senderId: senderUserId.substring(0, 8) + '***',
            roomId: roomId.substring(0, 12) + '***',
            action: 'BLOCKED'
          }
        );
        return;
      }

      // 🔒 SECURITY LAYER 2: Get verified room participants
      const participants = await this.getRoomParticipants(roomId);

      // 🔒 SECURITY LAYER 3: Only broadcast to verified participants (excluding sender)
      const connectedParticipants = participants.filter(participantId => {
        if (participantId === senderUserId) return false; // Exclude sender
        const socketInfo = this.userSockets.get(participantId);
        return socketInfo && this.io?.sockets.sockets.has(socketInfo.socketId);
      });

      // 🔒 SECURITY LAYER 4: Sanitize message data before broadcasting
      const sanitizedMessageData = this.sanitizeMessageData(messageData);

      // Broadcast only to verified, connected participants
      connectedParticipants.forEach(participantId => {
        const socketInfo = this.userSockets.get(participantId);
        if (socketInfo) {
          this.io?.to(socketInfo.socketId).emit('new_message', {
            type: 'new_message',
            payload: sanitizedMessageData,
            timestamp: new Date().toISOString()
          });
        }
      });

      secureLogger.logInfoSecurity(
        SecurityEventType.DATA_ACCESS,
        'Message broadcast completed successfully',
        {
          senderId: senderUserId.substring(0, 8) + '***',
          roomId: roomId.substring(0, 12) + '***',
          recipientCount: connectedParticipants.length,
          action: 'MESSAGE_BROADCAST'
        }
      );

    } catch (broadcastError) {
      secureLogger.logCriticalSecurity(
        SecurityEventType.SYSTEM_ERROR,
        'Error during message broadcasting',
        {
          senderId: senderUserId?.substring(0, 8) + '***',
          roomId: roomId?.substring(0, 12) + '***',
          error: 'BROADCAST_ERROR'
        }
      );
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
    } catch (statusError) {
      console.error('❌ Error updating user online status:', statusError);
    }
  }

  // 🔒 SECURITY: Verify user has access to a specific room
  private async verifyRoomAccess(userId: string, roomId: string): Promise<boolean> {
    try {
      const result = await sql`
        SELECT 1 FROM room_participants
        WHERE room_id = ${roomId} AND user_clerk_id = ${userId}
        LIMIT 1
      `;
      return result.length > 0;
    } catch (dbError) {
      secureLogger.logCriticalSecurity(
        SecurityEventType.SYSTEM_ERROR,
        'Database error during room access verification',
        { error: 'DB_ERROR' }
      );
      return false;
    }
  }

  // 🔒 SECURITY: Verify room exists and is active
  private async verifyRoomExists(roomId: string): Promise<boolean> {
    try {
      const result = await sql`
        SELECT 1 FROM rooms
        WHERE id = ${roomId}
        LIMIT 1
      `;
      return result.length > 0;
    } catch (existsError) {
      secureLogger.logCriticalSecurity(
        SecurityEventType.SYSTEM_ERROR,
        'Database error during room existence verification',
        { error: 'DB_ERROR' }
      );
      return false;
    }
  }

  // 🔒 SECURITY: Get verified room participants
  private async getRoomParticipants(roomId: string): Promise<string[]> {
    try {
      const result = await sql`
        SELECT user_clerk_id FROM room_participants
        WHERE room_id = ${roomId}
      `;
      return result.map((row: any) => row.user_clerk_id);
    } catch (participantsError) {
      secureLogger.logCriticalSecurity(
        SecurityEventType.SYSTEM_ERROR,
        'Database error during room participants retrieval',
        { error: 'DB_ERROR' }
      );
      return [];
    }
  }

  // 🔒 SECURITY: Sanitize message data to prevent injection attacks
  private sanitizeMessageData(messageData: any): any {
    if (!messageData) return {};

    // Create a sanitized copy
    const sanitized = { ...messageData };

    // Remove potentially dangerous properties
    delete sanitized.script;
    delete sanitized.onclick;
    delete sanitized.onload;
    delete sanitized.onerror;
    delete sanitized.eval;
    delete sanitized.innerHTML;
    delete sanitized.outerHTML;

    // Sanitize string properties
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        // Remove script tags and event handlers
        sanitized[key] = sanitized[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
          .replace(/javascript:/gi, '');
      }
    });

    return sanitized;
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

    } catch (validationError) {
      console.error('❌ Error validating Clerk session:', validationError);
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
      } catch (sessionError) {
        console.error(`❌ Error validating session for user ${userId}:`, sessionError);
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
      } catch (offlineError) {
        console.error(`❌ Error forcing user ${userId} offline:`, offlineError);
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



    } catch (profileError) {
      console.error('❌ Error broadcasting profile update:', profileError);
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
