import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useTranslationStore = create((set, get) => ({
  // State - All from database, no localStorage
  supportedLanguages: {},
  isLoading: false,
  error: null,
  translationHistory: [],
  userPreferredLanguage: "en", // Will be loaded from database
  autoTranslateEnabled: false, // Will be loaded from database
  soundEnabled: true, // Will be loaded from database
  translationProvider: "openai", // Will be loaded from database
  settingsLoaded: false, // Track if settings have been loaded from database

  // Actions

  // Load user settings from database
  loadUserSettings: async () => {
    try {
      console.log("🔄 Loading user settings from database...");
      const response = await axiosInstance.get("/settings/translation");

      if (response.data.success) {
        const { settings } = response.data;
        set({
          userPreferredLanguage: settings.preferredLanguage || "en",
          autoTranslateEnabled: settings.autoTranslateEnabled || false,
          soundEnabled: settings.soundEnabled !== undefined ? settings.soundEnabled : true,
          settingsLoaded: true
        });
        console.log("✅ User settings loaded:", settings);

        // Sync sound settings with chat store
        try {
          const { useChatStore } = await import("./useChatStore");
          useChatStore.getState().syncSoundSettings();
        } catch (error) {
          console.warn("⚠️ Could not sync sound settings with chat store:", error);
        }

        // Initialize Socket.io listeners for real-time updates
        get().initializeSocketListeners();
      } else {
        throw new Error(response.data.error || "Failed to load settings");
      }
    } catch (error) {
      console.error("❌ Error loading user settings:", error);
      // Set defaults if loading fails
      set({
        userPreferredLanguage: "en",
        autoTranslateEnabled: false,
        soundEnabled: true,
        settingsLoaded: true
      });
    }
  },

  // Initialize Socket.io listeners for real-time settings updates
  initializeSocketListeners: () => {
    try {
      // Dynamically import to avoid circular dependency
      import("./useAuthStore").then(({ useAuthStore }) => {
        const { socket } = useAuthStore.getState();
        if (socket?.connected) {
          console.log("🔌 Initializing Socket.io listeners for settings...");

          // Listen for settings updates from other devices/sessions
          socket.on("settingsUpdated", (data) => {
            console.log("🔄 Settings updated from server:", data);
            const currentState = get();

            if (data.preferredLanguage !== undefined && data.preferredLanguage !== currentState.userPreferredLanguage) {
              set({ userPreferredLanguage: data.preferredLanguage });
              toast.success(`Language preference updated to ${data.preferredLanguage}`);
            }

            if (data.autoTranslateEnabled !== undefined && data.autoTranslateEnabled !== currentState.autoTranslateEnabled) {
              set({ autoTranslateEnabled: data.autoTranslateEnabled });
              toast.success(`Auto-translate ${data.autoTranslateEnabled ? 'enabled' : 'disabled'}`);
            }

            if (data.soundEnabled !== undefined && data.soundEnabled !== currentState.soundEnabled) {
              set({ soundEnabled: data.soundEnabled });
              // Also update chat store
              import("./useChatStore").then(({ useChatStore }) => {
                useChatStore.getState().set({ isSoundEnabled: data.soundEnabled });
              });
              toast.success(`Sound notifications ${data.soundEnabled ? 'enabled' : 'disabled'}`);
            }
          });

          console.log("✅ Socket.io listeners initialized");
        } else {
          console.warn("⚠️ Socket not connected, will retry later");
        }
      });
    } catch (error) {
      console.error("❌ Error initializing Socket.io listeners:", error);
    }
  },

  fetchSupportedLanguages: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await axiosInstance.get("/translation/languages");
      
      if (response.data.success) {
        set({ 
          supportedLanguages: response.data.languages,
          isLoading: false 
        });
      } else {
        throw new Error(response.data.error || "Failed to fetch languages");
      }
    } catch (error) {
      console.error("Error fetching supported languages:", error);
      set({ 
        error: error.response?.data?.error || error.message,
        isLoading: false 
      });
      toast.error("Failed to load supported languages");
    }
  },

  translateText: async (text, targetLanguage, sourceLanguage = "auto") => {
    try {
      set({ isLoading: true, error: null });
      
      const { translationProvider } = get();
      
      const response = await axiosInstance.post("/translation/translate", {
        text,
        targetLanguage,
        sourceLanguage,
        provider: translationProvider
      });

      if (response.data.success) {
        const translationResult = {
          id: Date.now(),
          originalText: response.data.originalText,
          translatedText: response.data.translatedText,
          sourceLanguage: response.data.sourceLanguage,
          targetLanguage: response.data.targetLanguage,
          provider: response.data.provider,
          timestamp: response.data.timestamp
        };

        // Add to history
        set(state => ({
          translationHistory: [translationResult, ...state.translationHistory.slice(0, 49)], // Keep last 50
          isLoading: false
        }));

        return translationResult;
      } else {
        throw new Error(response.data.error || "Translation failed");
      }
    } catch (error) {
      console.error("Error translating text:", error);
      const errorMessage = "Failed to translate, try again later";
      set({
        error: errorMessage,
        isLoading: false
      });
      toast.error(errorMessage);
      return null;
    }
  },

  detectLanguage: async (text) => {
    try {
      const response = await axiosInstance.post("/translation/detect", { text });
      
      if (response.data.success) {
        return {
          language: response.data.detectedLanguage,
          languageName: response.data.languageName,
          confidence: response.data.confidence
        };
      } else {
        throw new Error(response.data.error || "Language detection failed");
      }
    } catch (error) {
      console.error("Error detecting language:", error);
      toast.error("Language detection failed");
      return null;
    }
  },

  batchTranslate: async (texts, targetLanguage, sourceLanguage = "auto") => {
    try {
      set({ isLoading: true, error: null });
      
      const { translationProvider } = get();
      
      const response = await axiosInstance.post("/translation/batch", {
        texts,
        targetLanguage,
        sourceLanguage,
        provider: translationProvider
      });

      if (response.data.success) {
        set({ isLoading: false });
        return response.data.results;
      } else {
        throw new Error(response.data.error || "Batch translation failed");
      }
    } catch (error) {
      console.error("Error in batch translation:", error);
      const errorMessage = error.response?.data?.error || error.message;
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      toast.error(`Batch translation failed: ${errorMessage}`);
      return null;
    }
  },

  checkTranslationStatus: async () => {
    try {
      const response = await axiosInstance.get("/translation/status");
      
      if (response.data.success) {
        return response.data.status;
      } else {
        throw new Error(response.data.error || "Failed to check translation status");
      }
    } catch (error) {
      console.error("Error checking translation status:", error);
      return null;
    }
  },

  // Database-driven setters with real-time sync
  setUserPreferredLanguage: async (language) => {
    try {
      console.log("🔄 Updating preferred language to:", language);

      // Optimistically update UI
      set({ userPreferredLanguage: language });

      // Save to database
      const response = await axiosInstance.put("/settings/translation", {
        preferredLanguage: language
      });

      if (response.data.success) {
        console.log("✅ Preferred language updated in database");

        // Emit Socket.io event for real-time sync across devices
        try {
          const { useAuthStore } = await import("./useAuthStore");
          const { socket } = useAuthStore.getState();
          if (socket?.connected) {
            socket.emit("settingsChanged", {
              type: "preferredLanguage",
              value: language
            });
          }
        } catch (error) {
          console.warn("⚠️ Could not emit Socket.io event:", error);
        }

        toast.success(`Language preference updated to ${language}`);
      } else {
        throw new Error(response.data.error || "Failed to update language preference");
      }
    } catch (error) {
      console.error("❌ Error updating preferred language:", error);
      // Revert optimistic update
      get().loadUserSettings();
      toast.error("Failed to update language preference");
    }
  },

  setAutoTranslateEnabled: async (enabled) => {
    try {
      console.log("🔄 Updating auto-translate to:", enabled);

      // Optimistically update UI
      set({ autoTranslateEnabled: enabled });

      // Save to database
      const response = await axiosInstance.put("/settings/translation", {
        autoTranslateEnabled: enabled
      });

      if (response.data.success) {
        console.log("✅ Auto-translate setting updated in database");

        // Emit Socket.io event for real-time sync across devices
        try {
          const { useAuthStore } = await import("./useAuthStore");
          const { socket } = useAuthStore.getState();
          if (socket?.connected) {
            socket.emit("settingsChanged", {
              type: "autoTranslateEnabled",
              value: enabled
            });
          }
        } catch (error) {
          console.warn("⚠️ Could not emit Socket.io event:", error);
        }

        toast.success(`Auto-translate ${enabled ? 'enabled' : 'disabled'}`);
      } else {
        throw new Error(response.data.error || "Failed to update auto-translate setting");
      }
    } catch (error) {
      console.error("❌ Error updating auto-translate setting:", error);
      // Revert optimistic update
      get().loadUserSettings();
      toast.error("Failed to update auto-translate setting");
    }
  },

  // Database-driven sound settings setter with real-time sync
  setSoundEnabled: async (enabled) => {
    try {
      console.log("🔄 Updating sound setting to:", enabled);

      // Optimistically update UI
      set({ soundEnabled: enabled });

      // Also update chat store immediately
      try {
        const { useChatStore } = await import("./useChatStore");
        useChatStore.getState().set({ isSoundEnabled: enabled });
      } catch (error) {
        console.warn("⚠️ Could not update chat store:", error);
      }

      // Save to database
      const response = await axiosInstance.put("/settings/translation", {
        soundEnabled: enabled
      });

      if (response.data.success) {
        console.log("✅ Sound setting updated in database");

        // Emit Socket.io event for real-time sync across devices
        try {
          const { useAuthStore } = await import("./useAuthStore");
          const { socket } = useAuthStore.getState();
          if (socket?.connected) {
            socket.emit("settingsChanged", {
              type: "soundEnabled",
              value: enabled
            });
          }
        } catch (error) {
          console.warn("⚠️ Could not emit Socket.io event:", error);
        }

        toast.success(`Sound notifications ${enabled ? 'enabled' : 'disabled'}`);
      } else {
        throw new Error(response.data.error || "Failed to update sound setting");
      }
    } catch (error) {
      console.error("❌ Error updating sound setting:", error);
      // Revert optimistic update
      set({ soundEnabled: !enabled });
      try {
        const { useChatStore } = await import("./useChatStore");
        useChatStore.getState().set({ isSoundEnabled: !enabled });
      } catch (importError) {
        console.warn("⚠️ Could not revert chat store:", importError);
      }
      toast.error("Failed to update sound setting");
    }
  },

  setTranslationProvider: (provider) => {
    set({ translationProvider: provider });
    toast.success(`Translation provider set to ${provider.toUpperCase()}`);
  },

  // Fetch translation history from database
  fetchTranslationHistory: async (limit = 50, offset = 0) => {
    try {
      console.log("📚 Fetching translation history from database...");
      const response = await axiosInstance.get(`/translation/history?limit=${limit}&offset=${offset}`);

      if (response.data.success) {
        const { history, pagination } = response.data;
        set(state => ({
          translationHistory: offset === 0 ? history : [...state.translationHistory, ...history]
        }));
        console.log("✅ Translation history loaded:", history.length, "entries");
        return { history, pagination };
      } else {
        throw new Error(response.data.error || "Failed to fetch translation history");
      }
    } catch (error) {
      console.error("❌ Error fetching translation history:", error);
      toast.error("Failed to load translation history");
      return { history: [], pagination: { hasMore: false } };
    }
  },

  // Fetch translation statistics from database
  fetchTranslationStats: async () => {
    try {
      console.log("📊 Fetching translation stats from database...");
      const response = await axiosInstance.get("/translation/stats");

      if (response.data.success) {
        console.log("✅ Translation stats loaded:", response.data.stats);
        return response.data.stats;
      } else {
        throw new Error(response.data.error || "Failed to fetch translation stats");
      }
    } catch (error) {
      console.error("❌ Error fetching translation stats:", error);
      toast.error("Failed to load translation statistics");
      return null;
    }
  },

  // Translate a specific message by ID (manual translation)
  translateMessageById: async (messageId, targetLanguage, sourceLanguage = 'auto') => {
    try {
      console.log(`🌍 Translating message ${messageId} to ${targetLanguage}...`);
      set({ isLoading: true, error: null });

      const response = await axiosInstance.post(`/translation/message/${messageId}`, {
        targetLanguage,
        sourceLanguage
      });

      if (response.data.success) {
        const translationResult = {
          originalText: response.data.originalText,
          translatedText: response.data.translatedText,
          sourceLanguage: response.data.sourceLanguage,
          targetLanguage: response.data.targetLanguage,
          provider: response.data.provider,
          timestamp: new Date().toISOString()
        };

        set({ isLoading: false });
        console.log("✅ Message translation successful:", translationResult);

        // Refresh translation history to include this new entry
        get().fetchTranslationHistory();

        return translationResult;
      } else {
        throw new Error(response.data.error || "Translation failed");
      }
    } catch (error) {
      console.error("❌ Message translation error:", error);
      set({ isLoading: false, error: error.message });
      toast.error(error.response?.data?.error || "Translation failed");
      return null;
    }
  },

  clearTranslationHistory: () => {
    set({ translationHistory: [] });
    toast.success("Translation history cleared");
  },

  clearError: () => {
    set({ error: null });
  },

  // Helper functions
  getLanguageName: (languageCode) => {
    const { supportedLanguages } = get();
    return supportedLanguages[languageCode] || languageCode;
  },

  isLanguageSupported: (languageCode) => {
    const { supportedLanguages } = get();
    return languageCode in supportedLanguages;
  },

  // Auto-translate message if enabled
  autoTranslateMessage: async (message) => {
    const { autoTranslateEnabled, userPreferredLanguage, translateText } = get();
    
    if (!autoTranslateEnabled || !message.text) {
      return message;
    }

    // Don't translate if already in preferred language
    const detectedLang = await get().detectLanguage(message.text);
    if (detectedLang && detectedLang.language === userPreferredLanguage) {
      return message;
    }

    // Translate the message
    const translation = await translateText(message.text, userPreferredLanguage);
    
    if (translation) {
      return {
        ...message,
        translatedText: translation.translatedText,
        originalLanguage: translation.sourceLanguage,
        targetLanguage: translation.targetLanguage,
        isTranslated: true
      };
    }

    return message;
  }
}));
