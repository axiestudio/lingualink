'use client'

import { SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Search,
  MoreHorizontal,
  Send,
  Globe,
  Zap,
  Circle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { useRealtimeMessages } from '../../hooks/useRealtime';
import { usePushNotifications } from '../../hooks/usePushNotifications';

// Real-time messaging with Neon PostgreSQL integration

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
      'hi': 'Hindi'
    };

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
      const recipientLanguage = selectedConversation.language || 'en';
      const willTranslate = currentUserLanguage !== recipientLanguage;

      return {
        willTranslate,
        targetLanguage: recipientLanguage,
        targetLanguageName: languageNames[recipientLanguage] || 'Unknown',
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
        // Filter out users who already have conversations
        const existingUserIds = new Set(localConversations.map(conv => conv.user_id));
        const filteredUsers = users.filter(user => !existingUserIds.has(user.clerk_id));
        setSearchResults(filteredUsers);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchUsers, conversations]);

  // Handle starting a new conversation with a user
  const startNewConversation = async (targetUser: any) => {
    try {
      const room = await createConversation(targetUser.clerk_id);

      // Find the new conversation in the updated list
      const newConversation = localConversations.find(conv => conv.room_id === room.room_id);
      if (newConversation) {
        setSelectedConversation(newConversation);
      }

      setSearchQuery('');

      console.log('🏠 New Room Created:', {
        roomId: room.room_id,
        participants: room.participants
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
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

  // Handle sending a message with optimistic updates
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    const messageToSend = newMessage.trim();
    const tempId = `temp_${Date.now()}`;

    console.log('🚀 Sending message:', {
      roomId: selectedConversation.room_id,
      message: messageToSend,
      receiverId: selectedConversation.user_id
    });

    setIsSending(true);

    // OPTIMISTIC UPDATE: Add message immediately to UI
    const optimisticMessage = {
      id: tempId,
      room_id: selectedConversation.room_id,
      sender_clerk_id: user?.id,
      message: messageToSend,
      translated_message: null, // Will be filled when translation completes
      target_language: null,
      created_at: new Date().toISOString(),
      username: user?.username || 'You',
      sender_name: user?.fullName || user?.firstName || 'You',
      sender_avatar: user?.imageUrl || '',
      sending: true // Flag to show loading state
    };

    // Clear input immediately and add optimistic message
    setNewMessage('');
    setMessages(prev => [...prev, optimisticMessage]);

    // 🚀 Immediately scroll to show the new message
    setTimeout(scrollToBottom, 100);

    try {
      // Send the message in background
      const sentMessage = await dbSendMessage(
        selectedConversation.room_id,
        messageToSend,
        selectedConversation.user_id
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
        // If it's from current user, replace any optimistic message
        if (messageData.sender_id === user?.id) {
          console.log('📨 Replacing optimistic message with real message');
          return prevMessages.map(msg => {
            if (msg.sending && msg.message === messageData.message) {
              // Replace optimistic message with real one
              return {
                id: messageData.message_id,
                room_id: messageData.room_id,
                sender_clerk_id: messageData.sender_id,
                message: messageData.message,
                translated_message: messageData.translated_message,
                target_language: messageData.target_language,
                created_at: messageData.created_at,
                username: user?.username || 'You',
                sender_name: user?.fullName || user?.firstName || 'You',
                sender_avatar: user?.imageUrl || '',
                sending: false
              };
            }
            return msg;
          });
        } else {
          // Message from another user - add if not duplicate
          const messageExists = prevMessages.some(msg => msg.id === messageData.message_id);
          if (messageExists) {
            console.log('📨 Message already exists, skipping duplicate');
            return prevMessages;
          }

          console.log('📨 Adding auto-triggered message from another user');
          const newMessage = {
            id: messageData.message_id,
            room_id: messageData.room_id,
            sender_clerk_id: messageData.sender_id,
            message: messageData.message,
            translated_message: messageData.translated_message,
            target_language: messageData.target_language,
            created_at: messageData.created_at,
            username: messageData.sender_name || 'Other User',
            sender_name: messageData.sender_name || 'Other User',
            sender_avatar: messageData.sender_avatar || '',
            sending: false, // Real message, not optimistic
            autoTriggered: messageData.auto_triggered || false // Flag for auto-triggered
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

  // Initialize real-time connection
  useRealtimeMessages(handleNewMessage, handleUserStatusChange);

  // Show loading state while user data is loading
  if (!user) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-600">Loading user...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
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
                  <h4 className="text-sm font-medium text-slate-700">Start new conversation</h4>
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
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-slate-500">{user.language}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-400">
                              {user.is_online ? 'Online' : 'Offline'}
                            </span>
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
          {/* Chat Header */}
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

                <button
                  onClick={() => router.push('/settings')}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  title="Settings"
                >
                  <MoreHorizontal className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
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
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20, scale: isAutoTriggered ? 0.95 : 1 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: isAutoTriggered ? 0.5 : 0.3,
                      ease: isAutoTriggered ? "easeOut" : "easeInOut"
                    }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
                      isAutoTriggered ? 'animate-pulse' : ''
                    }`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          isOwn
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-br-md'
                            : 'bg-white border border-slate-200/50 text-slate-900 rounded-bl-md'
                        } shadow-sm ${message.sending ? 'opacity-70' : ''}`}
                      >
                        {/* Show translated message first if available, then original */}
                        {message.translated_message ? (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">{message.translated_message}</p>
                            <div className={`text-xs p-2 rounded-lg border ${
                              isOwn
                                ? 'bg-white/10 border-white/20 text-blue-100'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}>
                              <div className="flex items-center space-x-1 mb-1">
                                <Globe className="w-3 h-3" />
                                <span>Original:</span>
                              </div>
                              <p className="italic">{message.message}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{message.message}</p>
                            {message.sending && (
                              <div className="flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span className="text-xs opacity-75">Translating...</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className={`flex items-center space-x-2 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs text-slate-400">
                          {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {message.sending && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Sending...
                          </span>
                        )}
                        <span className="text-xs text-slate-400">{message.sender_name}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-slate-200/50 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
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
                      Will be translated to {translationInfo.targetLanguageName}:
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 italic">
                    {translationInfo.isGroup
                      ? "Group conversation - will be translated to English for all participants"
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
                        : "Same language - no translation needed"
                      }
                    </span>
                  </div>
                  <p className="text-sm text-green-600 italic">
                    {translationInfo.isGroup
                      ? "All participants use English in group conversations"
                      : `Both you and ${selectedConversation?.name} use ${translationInfo.targetLanguageName}`
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
