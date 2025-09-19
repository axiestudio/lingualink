import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useTranslationStore = create((set, get) => ({
  // State
  supportedLanguages: {},
  isLoading: false,
  error: null,
  translationHistory: [],
  userPreferredLanguage: localStorage.getItem("preferredLanguage") || "en",
  autoTranslateEnabled: localStorage.getItem("autoTranslateEnabled") === "true",
  translationProvider: localStorage.getItem("translationProvider") || "openai",

  // Actions
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

  setUserPreferredLanguage: (language) => {
    set({ userPreferredLanguage: language });
    localStorage.setItem("preferredLanguage", language);
  },

  setAutoTranslateEnabled: (enabled) => {
    set({ autoTranslateEnabled: enabled });
    localStorage.setItem("autoTranslateEnabled", enabled.toString());
  },

  setTranslationProvider: (provider) => {
    set({ translationProvider: provider });
    localStorage.setItem("translationProvider", provider);
    toast.success(`Translation provider set to ${provider.toUpperCase()}`);
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
