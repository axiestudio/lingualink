import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import { useTranslationStore } from "./useTranslationStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: true, // Will be loaded from database via translation store
  soundSettingsLoaded: false, // Track if sound settings have been synced

  // Database-driven sound toggle
  toggleSound: async () => {
    try {
      const { useTranslationStore } = await import("./useTranslationStore");
      const { setSoundEnabled } = useTranslationStore.getState();
      const newSoundState = !get().isSoundEnabled;

      // Optimistically update UI
      set({ isSoundEnabled: newSoundState });

      // Update in database
      await setSoundEnabled(newSoundState);
    } catch (error) {
      console.error("❌ Error toggling sound:", error);
      // Revert optimistic update on error
      set({ isSoundEnabled: !get().isSoundEnabled });
    }
  },

  // Sync sound settings from translation store
  syncSoundSettings: () => {
    try {
      const { soundEnabled } = useTranslationStore.getState();
      set({
        isSoundEnabled: soundEnabled,
        soundSettingsLoaded: true
      });
      console.log("🔊 Sound settings synced from translation store:", soundEnabled);
    } catch (error) {
      console.error("❌ Error syncing sound settings:", error);
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();
    const { autoTranslateEnabled, translateText, detectLanguage } = useTranslationStore.getState();

    console.log("Frontend sendMessage called with:", {
      hasText: !!messageData.text,
      hasImage: !!messageData.image,
      imageLength: messageData.image ? messageData.image.length : 0,
      selectedUserId: selectedUser._id,
      autoTranslateEnabled
    });

    // Auto-translate message if enabled and there's text
    let finalMessageData = { ...messageData };
    if (autoTranslateEnabled && messageData.text && messageData.text.trim()) {
      try {
        console.log("🔄 Auto-translate enabled, checking recipient's language preference...");

        // Get recipient's language preference from backend
        const recipientSettings = await axiosInstance.get(`/settings/user/${selectedUser._id}`);
        const recipientLanguage = recipientSettings.data?.settings?.preferredLanguage || 'en';

        console.log(`🎯 Recipient (${selectedUser.fullName}) preferred language: ${recipientLanguage}`);

        // Detect sender's language
        const detectedLang = await detectLanguage(messageData.text);
        console.log(`🔍 Detected sender language: ${detectedLang}`);

        // Only translate if languages are different
        if (detectedLang !== recipientLanguage) {
          console.log(`🌍 Translating from ${detectedLang} to ${recipientLanguage}...`);
          const translationResult = await translateText(messageData.text, recipientLanguage, detectedLang);

          if (translationResult && translationResult.translatedText) {
            finalMessageData.text = translationResult.translatedText;
            finalMessageData.originalText = messageData.text;
            finalMessageData.translatedFrom = detectedLang;
            finalMessageData.translatedTo = recipientLanguage;
            console.log(`✅ Message auto-translated: "${messageData.text}" → "${translationResult.translatedText}"`);
          }
        } else {
          console.log("✅ Languages match, no translation needed");
        }
      } catch (error) {
        console.error("❌ Auto-translation failed:", error);
        // Continue with original message if translation fails
      }
    }

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: finalMessageData.text,
      image: finalMessageData.image,
      originalText: finalMessageData.originalText,
      translatedFrom: finalMessageData.translatedFrom,
      translatedTo: finalMessageData.translatedTo,
      createdAt: new Date().toISOString(),
      isOptimistic: true, // flag to identify optimistic messages (optional)
    };
    // immidetaly update the ui by adding the message
    set({ messages: [...messages, optimisticMessage] });

    try {
      console.log("Sending message to backend...");
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, finalMessageData);
      console.log("Backend response:", res.data);

      // Replace the optimistic message with the real one from the server
      const updatedMessages = messages.filter(msg => msg._id !== tempId);
      set({ messages: [...updatedMessages, res.data] });
    } catch (error) {
      console.error("Error sending message:", error.response?.data || error.message);
      // remove optimistic message on failure
      const filteredMessages = messages.filter(msg => msg._id !== tempId);
      set({ messages: filteredMessages });
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, isSoundEnabled } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    const { authUser } = useAuthStore.getState();

    console.log("Subscribing to messages for user:", selectedUser.fullName);
    console.log("Socket connected:", socket?.connected);

    // Remove any existing listeners to prevent duplicates
    socket.off("newMessage");

    socket.on("newMessage", (newMessage) => {
      console.log("Received new message:", newMessage);

      // Check if this message is part of the current conversation
      const isMessageForCurrentConversation =
        (newMessage.senderId === selectedUser._id && newMessage.receiverId === authUser._id) ||
        (newMessage.senderId === authUser._id && newMessage.receiverId === selectedUser._id);

      console.log("Is message for current conversation:", isMessageForCurrentConversation);

      if (!isMessageForCurrentConversation) return;

      const currentMessages = get().messages;

      // Check if message already exists (to prevent duplicates)
      const messageExists = currentMessages.some(msg => msg._id === newMessage._id);
      if (messageExists) {
        console.log("Message already exists, skipping");
        return;
      }

      console.log("Adding new message to chat");
      set({ messages: [...currentMessages, newMessage] });

      // Play notification sound only for received messages (not sent by current user)
      if (newMessage.senderId !== authUser._id && isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.currentTime = 0;
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    console.log("Unsubscribing from messages");
    socket.off("newMessage");
  },
}));
