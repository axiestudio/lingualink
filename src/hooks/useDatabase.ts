"use client";

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

export interface DatabaseUser {
  clerk_id: string;
  username: string;
  name: string;
  avatar_url?: string;
  language: string;
  is_online: boolean;
  last_seen: string;
}

export interface DatabaseConversation {
  room_id: string;
  user_id: string;
  username: string;
  name: string;
  avatar_url?: string;
  language: string;
  is_online: boolean;
  last_seen: string;
  last_message?: string;
  last_message_translated?: string;
  last_message_time?: string;
  unread_count: number;
  room_created_at: string;
  last_activity: string;
}

export interface DatabaseMessage {
  id: number;
  room_id: string;
  sender_clerk_id: string;
  message: string;
  translated_message?: string;
  target_language?: string;
  created_at: string;
  username: string;
  sender_name: string;
  sender_avatar?: string;
}

export function useDatabase() {
  const { user } = useUser();
  const [conversations, setConversations] = useState<DatabaseConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize database and user
  const initializeUser = useCallback(async () => {
    if (!user) return;

    try {
      // Initialize database tables
      const initResponse = await fetch('/api/init-db', { method: 'POST' });
      if (!initResponse.ok) {
        const initError = await initResponse.text();
        console.error('Database initialization failed:', initResponse.status, initError);
        throw new Error(`Database initialization failed: ${initResponse.status} - ${initError}`);
      }

      // Create/update user in database
      const response = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          username: user.username || user.emailAddresses[0]?.emailAddress.split('@')[0] || `user_${Date.now()}`,
          email: user.emailAddresses[0]?.emailAddress || '',
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User',
          avatarUrl: user.imageUrl || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('User sync failed:', response.status, errorData);
        throw new Error(`Failed to sync user: ${response.status} - ${errorData}`);
      }
    } catch (err) {
      console.error('Error initializing user:', err);
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [user]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch('/api/conversations');
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Conversations load failed:', response.status, errorData);
        throw new Error(`Failed to load conversations: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      setConversations(data.conversations || []);
      setError(null);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Search users
  const searchUsers = useCallback(async (query: string): Promise<DatabaseUser[]> => {
    if (!query.trim() || query.length < 2) return [];

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('Failed to search users');
      }

      const data = await response.json();
      return data.users || [];
    } catch (err) {
      console.error('Error searching users:', err);
      return [];
    }
  }, []);

  // Create conversation
  const createConversation = useCallback(async (targetUserId: string) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const data = await response.json();
      
      // Reload conversations to get the updated list
      await loadConversations();
      
      return data.room;
    } catch (err) {
      console.error('Error creating conversation:', err);
      throw err;
    }
  }, [loadConversations]);

  // Send message
  const sendMessage = useCallback(async (
    roomId: string,
    message: string,
    receiverId?: string
  ) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          message,
          receiverId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Reload conversations to update last message
      await loadConversations();
      
      return data.message;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }, [loadConversations]);

  // Get messages for a room
  const getRoomMessages = useCallback(async (roomId: string): Promise<DatabaseMessage[]> => {
    try {
      const response = await fetch(`/api/messages?roomId=${encodeURIComponent(roomId)}`);
      
      if (!response.ok) {
        throw new Error('Failed to get messages');
      }

      const data = await response.json();
      return data.messages || [];
    } catch (err) {
      console.error('Error getting messages:', err);
      return [];
    }
  }, []);

  // Initialize on user load
  useEffect(() => {
    if (user) {
      initializeUser().then(() => {
        loadConversations();
      });
    }
  }, [user, initializeUser, loadConversations]);

  return {
    conversations,
    loading,
    error,
    searchUsers,
    createConversation,
    sendMessage,
    getRoomMessages,
    loadConversations,
    refreshConversations: loadConversations // Alias for clarity
  };
}
