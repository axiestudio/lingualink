"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { io, Socket } from 'socket.io-client';

export interface SocketMessage {
  type: 'new_message' | 'user_status_change' | 'user_typing' | 'user_profile_updated';
  payload: any;
  timestamp: string;
}

export interface SocketCallbacks {
  onNewMessage?: (data: any) => void;
  onUserStatusChange?: (data: any) => void;
  onUserTyping?: (data: any) => void;
  onUserProfileUpdated?: (data: any) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: any) => void;
}

export function useSocket(callbacks: SocketCallbacks = {}) {
  const { user } = useUser();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (!user || socketRef.current) return;

    console.log('🔌 Initializing Socket.IO connection...');

    const socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: false, // Don't force new connections
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', async () => {
      console.log('✅ Socket.IO connected:', socket.id);
      setIsConnected(true);
      reconnectAttempts.current = 0;

      try {
        // Get Clerk session token
        let sessionToken = null;
        try {
          // Use Clerk's session token method
          sessionToken = user.id; // Use user ID as token for now
        } catch (tokenError) {
          console.warn('⚠️ Could not get session token:', tokenError);
        }

        // Authenticate user with Clerk user ID
        socket.emit('authenticate', {
          userId: user.id,
          sessionToken: sessionToken
        });
      } catch (error) {
        console.error('❌ Failed to authenticate with socket:', error);
        socket.emit('authenticate', {
          userId: user.id,
          sessionToken: null
        });
      }

      callbacks.onConnected?.();
    });

    // Disconnect handler is now combined with ping cleanup below

    // Authentication events
    socket.on('authenticated', (data) => {
      console.log('🔐 Socket.IO authenticated:', data);
      setIsAuthenticated(true);
    });

    socket.on('authentication_error', (error) => {
      console.error('❌ Socket.IO authentication failed:', error);
      callbacks.onError?.(error);
    });

    // Message events
    socket.on('new_message', (data: SocketMessage) => {
      console.log('📨 New message received via Socket.IO:', data);
      callbacks.onNewMessage?.(data.payload);
    });

    // User status events
    socket.on('user_status_change', (data) => {
      console.log('👤 User status change:', data);
      callbacks.onUserStatusChange?.(data);
    });

    // Typing events
    socket.on('user_typing', (data) => {
      console.log('⌨️ User typing:', data);
      callbacks.onUserTyping?.(data);
    });

    // Profile update events
    socket.on('user_profile_updated', (data) => {
      console.log('👤 User profile updated:', data);
      callbacks.onUserProfileUpdated?.(data.payload);
    });

    // Session expiry handling
    socket.on('session_expired', (data) => {
      console.warn('⚠️ Session expired:', data);
      setIsAuthenticated(false);
      // Redirect to sign-in or show session expired message
      window.location.href = '/sign-in?session_expired=true';
    });

    // Error handling
    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      callbacks.onError?.(error);
      
      // Implement exponential backoff for reconnection
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.pow(2, reconnectAttempts.current) * 1000;
        setTimeout(() => {
          reconnectAttempts.current++;
          socket.connect();
        }, delay);
      }
    });

    // Ping/pong for connection health
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 30000);

    socket.on('pong', () => {
      console.log('🏓 Pong received');
    });

    // Cleanup interval on disconnect
    const originalDisconnectHandler = socket.listeners('disconnect')[0];
    socket.off('disconnect', originalDisconnectHandler);
    socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
      setIsConnected(false);
      setIsAuthenticated(false);
      clearInterval(pingInterval);
      callbacks.onDisconnected?.();
    });

  }, [user]); // Remove callbacks dependency to prevent infinite re-initialization

  // Join room for real-time messaging
  const joinRoom = useCallback((roomId: string) => {
    if (socketRef.current && isAuthenticated) {
      console.log(`🏠 Joining room: ${roomId}`);
      socketRef.current.emit('join_room', { roomId });
    }
  }, [isAuthenticated]);

  // Leave room
  const leaveRoom = useCallback((roomId: string) => {
    if (socketRef.current && isAuthenticated) {
      console.log(`🚪 Leaving room: ${roomId}`);
      socketRef.current.emit('leave_room', { roomId });
    }
  }, [isAuthenticated]);

  // Send typing indicator
  const sendTypingStart = useCallback((roomId: string) => {
    if (socketRef.current && isAuthenticated) {
      socketRef.current.emit('typing_start', { roomId });
    }
  }, [isAuthenticated]);

  const sendTypingStop = useCallback((roomId: string) => {
    if (socketRef.current && isAuthenticated) {
      socketRef.current.emit('typing_stop', { roomId });
    }
  }, [isAuthenticated]);

  // Broadcast message with acknowledgment for instant delivery
  const broadcastMessage = useCallback((roomId: string, messageData: any, senderUserId: string, callback?: (success: boolean) => void) => {
    if (socketRef.current && isAuthenticated) {
      console.log(`📤 Broadcasting message to room: ${roomId}`);

      // Send with acknowledgment for guaranteed delivery
      socketRef.current.emit('broadcast_message',
        { roomId, messageData, senderUserId },
        (response: { success: boolean; delivered: number; error?: string }) => {
          console.log(`✅ Message broadcast result:`, response);
          callback?.(response.success);
        }
      );
    }
  }, [isAuthenticated]);

  // Broadcast profile update with acknowledgment for instant delivery
  const broadcastProfileUpdate = useCallback((updates: any, callback?: (success: boolean) => void) => {
    if (socketRef.current && isAuthenticated && user?.id) {
      console.log(`👤 Broadcasting profile update for user: ${user.id}`, updates);

      // Send with acknowledgment for guaranteed delivery
      socketRef.current.emit('broadcast_profile_update',
        { userId: user.id, updates },
        (response: { success: boolean; delivered: number; error?: string }) => {
          console.log(`✅ Profile update broadcast result:`, response);
          callback?.(response.success);
        }
      );
    } else {
      console.warn('⚠️ Cannot broadcast profile update: socket not connected or not authenticated');
      callback?.(false);
    }
  }, [isAuthenticated, user?.id]);

  // Initialize socket when user is available
  useEffect(() => {
    if (user && !socketRef.current) {
      initializeSocket();
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        console.log('🧹 Cleaning up Socket.IO connection');
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setIsAuthenticated(false);
      }
    };
  }, [user]); // Remove initializeSocket dependency

  return {
    socket: socketRef.current,
    isConnected,
    isAuthenticated,
    joinRoom,
    leaveRoom,
    sendTypingStart,
    sendTypingStop,
    broadcastMessage,
    broadcastProfileUpdate
  };
}

// Simplified hook for just receiving messages
export function useSocketMessages(onNewMessage: (data: any) => void) {
  return useSocket({
    onNewMessage,
    onConnected: () => console.log('🔌 Socket connected for messages'),
    onDisconnected: () => console.log('🔌 Socket disconnected for messages'),
    onError: (error) => console.error('❌ Socket error:', error)
  });
}
