import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,

  // SECURITY: Initialize profile update listener
  initProfileUpdateListener: () => {
    window.addEventListener('profileUpdated', (event) => {
      const profileData = event.detail;
      console.log("Chat store received profile update:", profileData);

      // Update contacts list
      const { allContacts, chats, selectedUser } = get();

      const updatedContacts = allContacts.map(contact =>
        contact._id === profileData.userId
          ? { ...contact, profilePic: profileData.profilePic, updatedAt: profileData.updatedAt }
          : contact
      );

      const updatedChats = chats.map(chat =>
        chat._id === profileData.userId
          ? { ...chat, profilePic: profileData.profilePic, updatedAt: profileData.updatedAt }
          : chat
      );

      // Update selected user if it's the one that got updated
      const updatedSelectedUser = selectedUser && selectedUser._id === profileData.userId
        ? { ...selectedUser, profilePic: profileData.profilePic, updatedAt: profileData.updatedAt }
        : selectedUser;

      set({
        allContacts: updatedContacts,
        chats: updatedChats,
        selectedUser: updatedSelectedUser
      });

      console.log("Updated contacts and chats with new profile data");
    });
  },

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
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

    console.log("Frontend sendMessage called with:", {
      hasText: !!messageData.text,
      hasImage: !!messageData.image,
      imageLength: messageData.image ? messageData.image.length : 0,
      selectedUserId: selectedUser._id
    });

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      isOptimistic: true, // flag to identify optimistic messages (optional)
    };
    // immidetaly update the ui by adding the message
    set({ messages: [...messages, optimisticMessage] });

    try {
      console.log("Sending message to backend...");
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
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
