import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  socket: null,
  onlineUsers: [],

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in authCheck:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });

      toast.success("Account created successfully!");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });

      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error("Error logging out");
      console.log("Logout error:", error);
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("Error in update profile:", error);
      toast.error(error.response.data.message);
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    console.log("Connecting socket for user:", authUser.fullName);

    const socket = io(BASE_URL, {
      withCredentials: true, // this ensures cookies are sent with the connection
    });

    socket.on("connect", () => {
      console.log("Socket connected successfully:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.connect();

    set({ socket });

    // listen for online users event
    socket.on("getOnlineUsers", (userIds) => {
      console.log("Received online users:", userIds);
      // Convert string IDs to numbers for consistent comparison
      const numericUserIds = userIds.map(id => parseInt(id));
      set({ onlineUsers: numericUserIds });
    });

    // SECURITY: Listen for real-time profile updates
    socket.on("profileUpdated", (profileData) => {
      console.log("Received profile update:", profileData);

      // Update the current user's profile if it's their own update
      const currentUser = get().authUser;
      if (currentUser && currentUser._id === profileData.userId) {
        set({
          authUser: {
            ...currentUser,
            profilePic: profileData.profilePic,
            updatedAt: profileData.updatedAt
          }
        });
        console.log("Updated current user profile");
      }

      // Notify other stores about profile update (for contacts/chats lists)
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: profileData }));
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
