"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

export interface RealtimeMessage {
  type: 'new_message' | 'user_status' | 'connected';
  payload: any;
  timestamp: string;
}

export interface RealtimeCallbacks {
  onNewMessage?: (data: any) => void;
  onUserStatusChange?: (data: any) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: any) => void;
}

export function useRealtime(callbacks: RealtimeCallbacks = {}) {
  const { user } = useUser();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!user || eventSourceRef.current) return;

    try {
      console.log('🔌 Connecting to real-time messaging...');

      const eventSource = new EventSource('/api/realtime');
      eventSourceRef.current = eventSource;

      // Add connection timeout
      const connectionTimeout = setTimeout(() => {
        if (eventSource.readyState === EventSource.CONNECTING) {
          console.error('❌ Real-time connection timeout');
          eventSource.close();
          eventSourceRef.current = null;
          callbacks.onError?.(new Error('Connection timeout'));
        }
      }, 10000); // 10 second timeout

      eventSource.onopen = () => {
        console.log('✅ Real-time connection established');
        clearTimeout(connectionTimeout);
        reconnectAttempts.current = 0;
        callbacks.onConnected?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const data: RealtimeMessage = JSON.parse(event.data);
          
          console.log('📨 Real-time message received:', data);

          switch (data.type) {
            case 'new_message':
              callbacks.onNewMessage?.(data.payload);
              break;
            case 'user_status':
              callbacks.onUserStatusChange?.(data.payload);
              break;
            case 'connected':
              console.log('🎉 Real-time connection confirmed');
              break;
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing real-time message:', error);
          callbacks.onError?.(error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ Real-time connection error:', error);
        console.error('EventSource readyState:', eventSource.readyState);
        console.error('EventSource URL:', eventSource.url);
        clearTimeout(connectionTimeout);
        callbacks.onError?.(error);

        // Close current connection
        eventSource.close();
        eventSourceRef.current = null;
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // 1s, 2s, 4s, 8s, 16s
          
          console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else {
          console.error('❌ Max reconnection attempts reached');
          callbacks.onDisconnected?.();
        }
      };

    } catch (error) {
      console.error('Failed to establish real-time connection:', error);
      callbacks.onError?.(error);
    }
  }, [user, callbacks]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      console.log('🔌 Disconnecting from real-time messaging...');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      callbacks.onDisconnected?.();
    }
  }, [callbacks]);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttempts.current = 0;
    setTimeout(connect, 1000);
  }, [disconnect, connect]);

  // Auto-connect when user is available
  useEffect(() => {
    if (user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    reconnect,
    isConnected: !!eventSourceRef.current,
  };
}

// Utility hook for message-specific real-time updates
export function useRealtimeMessages(
  onNewMessage: (message: any) => void,
  onUserStatusChange?: (status: any) => void
) {
  return useRealtime({
    onNewMessage,
    onUserStatusChange,
    onConnected: () => {
      console.log('🎉 Real-time messaging connected');
    },
    onDisconnected: () => {
      console.log('📴 Real-time messaging disconnected');
    },
    onError: (error) => {
      console.error('Real-time messaging error:', error);
    }
  });
}
