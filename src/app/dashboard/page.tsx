'use client'

import { SignedIn, SignedOut, RedirectToSignIn, useUser, UserButton } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Search,
  Send,
  Globe,
  Zap,
  Circle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
// import { useRealtimeMessages } from '../../hooks/useRealtime'; // Disabled - using Socket.IO instead
import { useSocket } from '../../hooks/useSocket';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import FileUpload from '../../components/FileUpload';
import FileMessage from '../../components/FileMessage';
import MessageReply from '../../components/MessageReply';
import ThreadedMessage from '../../components/ThreadedMessage';

// Real-time messaging with Neon PostgreSQL integration

// Language names mapping
const languageNames: { [key: string]: string } = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'tr': 'Turkish',
  'pl': 'Polish',
  'nl': 'Dutch',
  'sv': 'Swedish',
  'da': 'Danish',
  'no': 'Norwegian',
  'fi': 'Finnish',
  'he': 'Hebrew'
};

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const {
    conversations,
    loading,
    error,
    searchUsers,
    createConversation,
    sendMessage: dbSendMessage,
    getRoomMessages,
    loadConversations
  } = useDatabase();

  // 🚀 VAPID Push Notifications for Guaranteed Instant Delivery
  const pushNotifications = usePushNotifications();

  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentUserLanguage, setCurrentUserLanguage] = useState('en');
  const [translationInfo, setTranslationInfo] = useState({
    willTranslate: false,
    targetLanguage: '',
    targetLanguageName: '',
    isGroup: false
  });
  const [isSending, setIsSending] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<any>(null);

  // Local conversations state to avoid reloading
  const [localConversations, setLocalConversations] = useState<any[]>([]);

  // 📜 Auto-scroll to latest message ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync local conversations with database conversations
  useEffect(() => {
    setLocalConversations(conversations);
  }, [conversations]);

  // Load current user's language preference
  useEffect(() => {
    if (user?.id) {
      fetch('/api/user/language')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setCurrentUserLanguage(data.language);
          }
        })
        .catch(err => console.error('Error loading user language:', err));
    }
  }, [user?.id]);

  // Auto-select first conversation when conversations load
  useEffect(() => {
    if (localConversations.length > 0 && !selectedConversation) {
      console.log('🔄 Auto-selecting first conversation');
      handleConversationSelect(localConversations[0]);
    }
  }, [localConversations, selectedConversation]);

  // 🚀 Auto-scroll to latest message when messages change
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Current user ID from Clerk
  const currentUserId = user?.id;

  // Get translation info for current conversation
  const getTranslationInfo = useCallback(async () => {
    if (!selectedConversation || !currentUserLanguage) {
      return { willTranslate: false, targetLanguage: '', targetLanguageName: '', isGroup: false };
    }

    // Check if this is a group room (3+ participants)
    let isGroupRoom = false;
    try {
      const response = await fetch(`/api/rooms/${selectedConversation.room_id}/participants`);
      if (response.ok) {
        const data = await response.json();
        isGroupRoom = data.participants?.length > 2;
      }
    } catch (error) {
      console.warn('Could not check room participants:', error);
    }



    if (isGroupRoom) {
      // Group room: always translate to English
      const willTranslate = currentUserLanguage !== 'en';
      return {
        willTranslate,
        targetLanguage: 'en',
        targetLanguageName: 'English',
        isGroup: true
      };
    } else {
      // 1-on-1: translate based on recipient's language
      const recipientLanguage = selectedConversation.language_preference || 'en';
      const willTranslate = currentUserLanguage !== recipientLanguage;

      return {
        willTranslate,
        targetLanguage: recipientLanguage,
        targetLanguageName: languageNames[recipientLanguage] || 'English',
        isGroup: false
      };
    }
  }, [selectedConversation, currentUserLanguage]);

  // Update translation info when conversation or language changes
  useEffect(() => {
    if (selectedConversation && currentUserLanguage) {
      getTranslationInfo().then(setTranslationInfo);
    }
  }, [selectedConversation, currentUserLanguage, getTranslationInfo]);

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return localConversations;

    return localConversations.filter(conversation =>
      conversation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conversation.last_message && conversation.last_message.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (conversation.last_message_translated && conversation.last_message_translated.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [localConversations, searchQuery]);

  // Search for users and update search results
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const users = await searchUsers(searchQuery);

        // 🔧 FIX: Don't filter out existing conversations!
        // Users should be able to search for and find people they've already chatted with
        // Add a flag to indicate if they already have a conversation
        const existingUserIds = new Set(localConversations.map(conv => conv.user_id));
        const enhancedUsers = users.map(user => ({
          ...user,
          hasExistingConversation: existingUserIds.has(user.clerk_id)
        }));

        setSearchResults(enhancedUsers);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchUsers, conversations]);

  // Handle starting a conversation with a user (new or existing)
  const startNewConversation = async (targetUser: any) => {
    try {
      // 🔧 FIX: Check if conversation already exists first
      if (targetUser.hasExistingConversation) {
        console.log('🔍 User has existing conversation, finding it...');

        // Find the existing conversation
        const existingConversation = localConversations.find(conv => conv.user_id === targetUser.clerk_id);
        if (existingConversation) {
          console.log('✅ Found existing conversation:', existingConversation.room_id);
          setSelectedConversation(existingConversation);
          setSearchQuery('');
          return;
        }
      }

      // Create new conversation if none exists
      console.log('🆕 Creating new conversation with user:', targetUser.clerk_id);
      const room = await createConversation(targetUser.clerk_id);

      // Find the conversation in the updated list (could be new or existing)
      const conversation = localConversations.find(conv => conv.room_id === room.room_id);
      if (conversation) {
        setSelectedConversation(conversation);
      }

      setSearchQuery('');

      console.log('🏠 Room Ready:', {
        roomId: room.room_id,
        isNew: !targetUser.hasExistingConversation,
        participants: room.participants
      });
    } catch (error) {
      console.error('Error handling conversation:', error);
    }
  };

  // Handle conversation selection
  const handleConversationSelect = async (conversation: any) => {
    console.log('🔄 Selecting conversation:', conversation.room_id);
    setSelectedConversation(conversation);
    setLoadingMessages(true);
    setMessages([]); // Clear previous messages immediately

    try {
      const roomMessages = await getRoomMessages(conversation.room_id);
      setMessages(roomMessages);

      console.log('✅ Room Selected Successfully:', {
        roomId: conversation.room_id,
        messageCount: roomMessages.length,
        messages: roomMessages.map(m => ({ id: m.id, message: m.message, translated: m.translated_message }))
      });
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Handle sending a message with optimistic updates and background translation
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    const messageToSend = newMessage.trim();
    const tempId = `temp_${Date.now()}`;

    console.log('🚀 Sending message:', {
      roomId: selectedConversation.room_id,
      message: messageToSend,
      receiverId: selectedConversation.user_id,
      replyToMessageId: replyToMessage?.id
    });

    setIsSending(true);

    // Get receiver's language preference for pre-translation
    const receiverLanguage = selectedConversation.language_preference || 'en';
    const senderLanguage = user?.publicMetadata?.language_preference as string || 'en';

    // Pre-translate if languages differ
    let preTranslatedMessage = null;
    let targetLanguage = null;

    if (receiverLanguage !== senderLanguage) {
      try {
        console.log('🔄 Pre-translating message in background...');
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: messageToSend,
            targetLanguage: receiverLanguage,
            sourceLanguage: senderLanguage
          })
        });

        if (response.ok) {
          const result = await response.json();
          preTranslatedMessage = result.translation.translatedText;
          targetLanguage = receiverLanguage;
          console.log('✅ Pre-translation completed');
        }
      } catch (error) {
        console.warn('⚠️ Pre-translation failed, will translate server-side:', error);
      }
    }

    // 🚀 INSTANT UX: Add message immediately to UI
    const optimisticMessage = {
      id: tempId,
      room_id: selectedConversation.room_id,
      sender_clerk_id: user?.id,
      message: messageToSend,
      translated_message: preTranslatedMessage, // Pre-translated or null
      target_language: targetLanguage,
      created_at: new Date().toISOString(),
      username: user?.username || 'You',
      sender_name: user?.fullName || user?.firstName || 'You',
      sender_avatar: user?.imageUrl || '',
      sending: false, // 🚀 UX: Show as delivered immediately
      translating: !preTranslatedMessage && receiverLanguage !== senderLanguage, // Show translation loading
      optimistic: true, // Flag to identify optimistic messages
      status: 'delivered' // Show delivered status immediately
    };

    // Clear input immediately and add optimistic message
    setNewMessage('');
    setReplyToMessage(null);
    setMessages(prev => [...prev, optimisticMessage]);

    // 🚀 Immediately scroll to show the new message
    setTimeout(scrollToBottom, 100);

    // 🚀 INSTANT SOCKET.IO BROADCAST - Send immediately via Socket.IO for instant delivery
    if (socketConnected && socketAuth && broadcastMessage) {
      broadcastMessage(
        selectedConversation.room_id,
        {
          ...optimisticMessage,
          instant: true, // Mark as instant delivery
          sender_clerk_id: user?.id,
          sender_name: user?.fullName || user?.firstName || 'You',
          sender_avatar: user?.imageUrl || ''
        },
        user?.id || '',
        (success) => {
          console.log(`🚀 Instant Socket.IO delivery: ${success ? 'SUCCESS' : 'FAILED'}`);
        }
      );
    }

    try {
      // Send the message in background with pre-translated content
      const sentMessage = await dbSendMessage(
        selectedConversation.room_id,
        messageToSend,
        selectedConversation.user_id,
        replyToMessage?.id,
        preTranslatedMessage,
        targetLanguage
      );

      if (sentMessage) {
        console.log('✅ Message sent successfully');

        // Replace optimistic message with real message
        setMessages(prev => prev.map(msg =>
          msg.id === tempId ? { ...sentMessage, sending: false } : msg
        ));

        // Update conversations list WITHOUT reloading - just update the last message
        setLocalConversations(prev => prev.map(conv =>
          conv.room_id === selectedConversation.room_id
            ? {
                ...conv,
                last_message: sentMessage.message,
                last_message_time: sentMessage.created_at,
                last_message_translated: sentMessage.translated_message
              }
            : conv
        ));
      } else {
        throw new Error('No response from server');
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);

      // Remove failed optimistic message and restore input
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setNewMessage(messageToSend);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Real-time messaging setup with auto-triggered message handling
  const handleNewMessage = useCallback((messageData: any) => {
    console.log('📨 Auto-triggered real-time message received:', {
      room_id: messageData.room_id,
      message_id: messageData.message_id,
      sender_id: messageData.sender_id,
      hasTranslation: !!messageData.translated_message,
      currentRoom: selectedConversation?.room_id,
      currentUserId: user?.id,
      autoTriggered: messageData.auto_triggered || false
    });

    // Handle messages for the currently selected room
    if (selectedConversation && messageData.room_id === selectedConversation.room_id) {

      setMessages(prevMessages => {
        // If it's from current user, update optimistic message smoothly
        if (messageData.sender_id === user?.id) {
          console.log('🔄 Updating optimistic message with server response');
          return prevMessages.map(msg => {
            // Find optimistic message by content and user
            if (msg.optimistic && msg.message === messageData.message && msg.sender_clerk_id === user?.id) {
              // 🚀 SMOOTH UPDATE: Update optimistic message with real data
              return {
                ...msg, // Keep existing properties for smooth transition
                id: messageData.message_id, // Update with real ID
                translated_message: messageData.translated_message, // Add translation if available
                target_language: messageData.target_language,
                created_at: messageData.created_at,
                sending: false,
                translating: false, // Stop translation loading
                optimistic: false // Mark as real message
              };
            }
            return msg;
          });
        } else {
          // Message from another user - add if not duplicate
          const messageExists = prevMessages.some(msg =>
            msg.id === messageData.message_id ||
            (messageData.instant && msg.message === messageData.message && msg.sender_clerk_id === messageData.sender_clerk_id)
          );
          if (messageExists) {
            console.log('📨 Message already exists, skipping duplicate');
            return prevMessages;
          }

          console.log('📨 Adding message from another user (instant delivery)');
          const newMessage = {
            id: messageData.message_id || messageData.id,
            room_id: messageData.room_id,
            sender_clerk_id: messageData.sender_clerk_id || messageData.sender_id,
            message: messageData.message,
            translated_message: messageData.translated_message,
            target_language: messageData.target_language,
            created_at: messageData.created_at || new Date().toISOString(),
            username: messageData.sender_name || 'Other User',
            sender_name: messageData.sender_name || 'Other User',
            sender_avatar: messageData.sender_avatar || '',
            sending: false, // Real message, not optimistic
            autoTriggered: messageData.auto_triggered || false, // Flag for auto-triggered
            instant_delivery: messageData.instant || false, // Flag for instant Socket.IO delivery
            received_at: new Date().toISOString()
          };

          // Add with smooth animation for auto-triggered messages
          if (messageData.auto_triggered) {
            console.log('✨ Auto-triggered message - smooth appearance');
          }

          return [...prevMessages, newMessage];
        }
      });

      // 🚀 Auto-scroll to show the new real-time message
      setTimeout(scrollToBottom, 100);
    } else {
      console.log('ℹ️ Real-time message for different room, updating conversations list');
      // Update conversations list WITHOUT reloading - just update the last message for other rooms
      setLocalConversations(prev => prev.map(conv =>
        conv.room_id === messageData.room_id
          ? {
              ...conv,
              last_message: messageData.message,
              last_message_time: messageData.created_at,
              last_message_translated: messageData.translated_message
            }
          : conv
      ));
    }

    // NO MORE loadConversations() calls - pure real-time updates!
  }, [selectedConversation, user]);

  const handleUserStatusChange = useCallback((statusData: any) => {
    console.log('👤 User status changed:', statusData);
    // Refresh conversations to update online status
    if (loadConversations) {
      loadConversations();
    }
  }, [loadConversations]);

  // Initialize Socket.IO connection (primary) and SSE (fallback)
  const { isConnected: socketConnected, isAuthenticated: socketAuth, joinRoom, leaveRoom, broadcastMessage } = useSocket({
    onNewMessage: handleNewMessage,
    onUserStatusChange: handleUserStatusChange,
    onConnected: () => console.log('🔌 Socket.IO connected successfully'),
    onDisconnected: () => console.log('🔌 Socket.IO disconnected'),
    onError: (error) => console.error('❌ Socket.IO error:', error)
  });

  // Fallback to SSE if Socket.IO fails (disabled during development since Socket.IO is working)
  // useRealtimeMessages(handleNewMessage, handleUserStatusChange);

  // Join room when conversation is selected and socket is ready
  useEffect(() => {
    if (selectedConversation && socketAuth) {
      console.log(`🏠 Joining Socket.IO room: ${selectedConversation.room_id}`);
      joinRoom(selectedConversation.room_id);

      // Leave room when conversation changes
      return () => {
        if (selectedConversation) {
          console.log(`🚪 Leaving Socket.IO room: ${selectedConversation.room_id}`);
          leaveRoom(selectedConversation.room_id);
        }
      };
    }
  }, [selectedConversation, socketAuth, joinRoom, leaveRoom]);

  // Handle reply to message
  const handleReplyToMessage = useCallback((message: any) => {
    setReplyToMessage({
      id: message.id,
      message: message.message,
      sender_name: message.sender_name,
      created_at: message.created_at,
      file_metadata: message.file_metadata
    });
  }, []);

  // Handle reply send
  const handleSendReply = useCallback(async (replyText: string, replyToId: number) => {
    if (!selectedConversation) return;

    // Use the existing handleSendMessage logic but with reply context
    setNewMessage(replyText);
    await handleSendMessage();
  }, [selectedConversation, handleSendMessage]);

  // Cancel reply
  const handleCancelReply = useCallback(() => {
    setReplyToMessage(null);
  }, []);

  // Show loading state while user data is loading (with minimal flicker)
  if (!user) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading user...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Connecting to Lingua Link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Connection Error</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>

      <SignedIn>
        <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col overflow-hidden">

          {/* Unified Header - Clean Single Header */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">LL</span>
                  </div>
                  <h1 className="text-xl font-bold text-slate-900">Lingua Link</h1>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-slate-600">Online</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* 🚀 VAPID Push Notification Status */}
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                  pushNotifications.isSubscribed
                    ? 'bg-green-50 text-green-600'
                    : 'bg-orange-50 text-orange-600'
                }`}>
                  <Zap className={`w-4 h-4 ${
                    pushNotifications.isSubscribed ? 'text-green-600' : 'text-orange-600'
                  }`} />
                  <span className="text-sm font-medium">
                    {pushNotifications.isSubscribed ? 'Instant Push ✅' : 'Push Disabled ⚠️'}
                  </span>
                </div>

                {/* Settings Button */}
                <button
                  onClick={() => router.push('/settings')}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors duration-200"
                  title="Settings"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Settings</span>
                </button>

                <UserButton />
              </div>
            </div>
          </div>

          {/* Main Messaging Interface */}
          <div className="flex-1 flex overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-80 bg-white/80 backdrop-blur-sm border-r border-slate-200/50 flex flex-col">
          {/* Enhanced Search Bar */}
          <div className="p-4 border-b border-slate-200/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations or find users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}

                className="w-full pl-10 pr-4 py-3 bg-slate-100/50 border border-slate-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search Results for New Users */}
            {searchQuery && searchResults.length > 0 && (
              <div className="mt-3 bg-white rounded-xl border border-slate-200/50 shadow-lg">
                <div className="p-3 border-b border-slate-200/50">
                  <h4 className="text-sm font-medium text-slate-700">Search Results</h4>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {searchResults.map((user: any) => (
                    <motion.div
                      key={user.clerk_id}
                      className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                      onClick={() => startNewConversation(user)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          {user.is_online && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-slate-900">{user.name}</h3>
                            <span className="text-xs text-slate-500">@{user.username}</span>
                            {user.hasExistingConversation && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                💬 Chat exists
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-slate-500">{user.language}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-400">
                              {user.is_online ? 'Online' : 'Offline'}
                            </span>
                            {user.hasExistingConversation && (
                              <span className="text-xs text-blue-600">• Click to continue chat</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {filteredConversations.length === 0 && searchQuery ? (
                <div className="p-6 text-center text-slate-500">
                  <Search className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm">No conversations found</p>
                  <p className="text-xs text-slate-400 mt-1">Try searching for a username to start a new conversation</p>
                </div>
              ) : (
                filteredConversations.map((conversation: any) => (
                  <motion.div
                    key={conversation.room_id}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 mb-2 ${
                      selectedConversation?.room_id === conversation.room_id
                        ? 'bg-blue-50 border border-blue-200/50'
                        : 'hover:bg-slate-50'
                    }`}
                    onClick={() => handleConversationSelect(conversation)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {conversation.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      {conversation.is_online && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-slate-900 truncate">{conversation.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-500">{conversation.time}</span>
                          {conversation.unread > 0 && (
                            <div className="w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                              {conversation.unread}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-slate-600 truncate">{conversation.lastMessage}</p>
                        <div className="flex items-center space-x-2">
                          <Globe className="w-3 h-3 text-slate-400" />
                          <p className="text-xs text-slate-400 truncate">{conversation.lastMessageTranslated}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-slate-400">{conversation.language}</span>
                          <Zap className="w-3 h-3 text-blue-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
              )}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white/50 backdrop-blur-sm">
          {selectedConversation ? (
            <>
          {/* Chat Header - Conversation Details Only */}
          <div className="p-4 border-b border-slate-200/50 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {selectedConversation.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  {selectedConversation.is_online && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">{selectedConversation.name}</h2>
                  <div className="flex items-center space-x-2">
                    <Circle className={`w-2 h-2 ${selectedConversation.is_online ? 'text-emerald-500 fill-current' : 'text-slate-400'}`} />
                    <span className="text-sm text-slate-500">
                      {selectedConversation.is_online ? 'Active now' : 'Last seen 2h ago'}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-400">@{selectedConversation.username}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-400">Room: {selectedConversation.room_id.slice(-8)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-600 font-medium">Auto-Translate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 messages-container">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-slate-500 text-sm">Loading messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Start the conversation</h3>
                  <p className="text-slate-500 text-sm">Send a message to begin chatting with {selectedConversation?.name}</p>
                </div>
              </div>
            ) : (
              messages.map((message: any) => {
                const isOwn = message.sender_clerk_id === currentUserId;
                const isAutoTriggered = message.autoTriggered;

                // Find reply-to message if this is a reply
                const replyToMsg = message.reply_to_message_id
                  ? messages.find((m: any) => m.id === message.reply_to_message_id)
                  : null;

                return (
                  <div
                    key={message.id}
                    className={`group mb-4 ${isOwn ? 'text-right' : 'text-left'} ${
                      isAutoTriggered ? 'animate-pulse' : ''
                    }`}
                  >
                    <ThreadedMessage
                      message={message}
                      replyToMessage={replyToMsg}
                      isOwn={isOwn}
                      onReply={handleReplyToMessage}
                      showReplyButton={!message.sending}
                    />
                  </div>
                );
              })
            )}
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Component */}
          {replyToMessage && (
            <MessageReply
              replyToMessage={replyToMessage}
              onReply={handleSendReply}
              onCancelReply={handleCancelReply}
              disabled={isSending}
            />
          )}

          {/* Message Input */}
          <div className="p-4 border-t border-slate-200/50 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              {/* File Upload Button */}
              {selectedConversation && (
                <FileUpload
                  roomId={selectedConversation.room_id}
                  onFileUploaded={(file, message) => {
                    console.log('📁 File uploaded:', file, message);
                    // File message will be received via Socket.IO/SSE
                  }}
                  onError={(error) => {
                    console.error('❌ File upload error:', error);
                    alert(`File upload failed: ${error}`);
                  }}
                  disabled={isSending}
                />
              )}

              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-100/50 border border-slate-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newMessage.trim()) {
                      handleSendMessage();
                    }
                  }}
                />
              </div>

              <button
                className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newMessage.trim() || isSending}
                onClick={handleSendMessage}
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Translation Preview */}
            {newMessage.trim() && (
              translationInfo.willTranslate ? (
                <motion.div
                  className="mt-3 p-3 bg-blue-50 border border-blue-200/50 rounded-xl"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700">
                      {translationInfo.isGroup
                        ? `Message will be translated from ${languageNames[currentUserLanguage] || 'English'} to English for all participants`
                        : `Message will be translated from ${languageNames[currentUserLanguage] || 'English'} to ${selectedConversation?.name}'s language (${translationInfo.targetLanguageName})`
                      }
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 italic">
                    {translationInfo.isGroup
                      ? "Group conversations use English as the common language"
                      : "Translation will be generated automatically when you send this message"
                    }
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  className="mt-3 p-3 bg-green-50 border border-green-200/50 rounded-xl"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Globe className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-700">
                      {translationInfo.isGroup
                        ? "Group conversation - English only"
                        : `No translation needed - you both use ${translationInfo.targetLanguageName}`
                      }
                    </span>
                  </div>
                  <p className="text-sm text-green-600 italic">
                    {translationInfo.isGroup
                      ? "All participants communicate in English"
                      : `Both you and ${selectedConversation?.name} have ${translationInfo.targetLanguageName} as your language preference`
                    }
                  </p>
                </motion.div>
              )
            )}
          </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No conversation selected</h3>
                <p className="text-slate-500 text-sm">Choose a conversation from the sidebar or search for a user to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>


    </div>
      </SignedIn>
    </>
  );
}
