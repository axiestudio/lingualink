import { useState } from "react";
import { Languages, Zap, Settings, Loader2, Globe } from "lucide-react";
import { useTranslationStore } from "../store/useTranslationStore";
import LanguageSelector from "./LanguageSelector";

const TranslationButton = ({ text, onTranslatedText, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("");

  const {
    translateText,
    detectLanguage,
    isLoading,
    userPreferredLanguage,
    autoTranslateEnabled,
    setUserPreferredLanguage,
    setAutoTranslateEnabled
  } = useTranslationStore();

  // Debug logging
  console.log("TranslationButton - text:", text, "userPreferredLanguage:", userPreferredLanguage, "isLoading:", isLoading);

  // AUTO-TRANSLATE: Detect language and translate to user's preferred language (or English as default)
  const handleAutoTranslate = async () => {
    console.log("🔥 AUTO-TRANSLATE CLICKED! Text:", text);
    if (!text.trim()) {
      console.log("❌ No text to translate");
      return;
    }

    try {
      // Use preferred language or default to English
      const targetLanguage = userPreferredLanguage || 'en';
      console.log("🎯 Target language:", targetLanguage);

      // Detect source language first
      const detectedLang = await detectLanguage(text);
      console.log("🔍 Detected language:", detectedLang);

      // If already in target language, no need to translate
      if (detectedLang === targetLanguage) {
        console.log("✅ Already in target language, no translation needed");
        return;
      }

      const result = await translateText(text, targetLanguage, detectedLang);
      console.log("📝 Translation result:", result);
      if (result && result.translatedText && onTranslatedText) {
        onTranslatedText(result.translatedText);
        console.log("✅ Translation applied!");
      }
    } catch (error) {
      console.error("Auto-translation error:", error);
      // Error is already handled by the translation store
    }
  };

  // MANUAL TRANSLATE: User selects specific target language
  const handleManualTranslate = async () => {
    if (!text.trim() || !selectedLanguage) return;

    const result = await translateText(text, selectedLanguage);
    if (result && result.translatedText && onTranslatedText) {
      onTranslatedText(result.translatedText);
    }
    setIsOpen(false);
  };

  const handleQuickTranslate = async (targetLang) => {
    if (!text.trim()) return;

    const result = await translateText(text, targetLang);
    if (result && result.translatedText && onTranslatedText) {
      onTranslatedText(result.translatedText);
    }
    setIsOpen(false);
  };

  // Popular languages for quick access
  const popularLanguages = [
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'ru', name: 'Russian' }
  ];

  return (
    <div className={`relative flex gap-1 ${className}`}>
      {/* AUTO-TRANSLATE Button */}
      <button
        type="button"
        onClick={handleAutoTranslate}
        disabled={!text.trim() || isLoading}
        className="p-2 text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title={`Auto-translate to ${userPreferredLanguage ? useTranslationStore.getState().getLanguageName(userPreferredLanguage) : 'English (default)'}`}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Zap className="w-5 h-5" />
        )}
      </button>

      {/* MANUAL TRANSLATE Button */}
      <button
        type="button"
        onClick={() => {
          console.log("🌐 MANUAL TRANSLATE CLICKED! Text:", text, "isOpen:", isOpen);
          setIsOpen(!isOpen);
        }}
        disabled={!text.trim() || isLoading}
        className="p-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Choose language to translate"
      >
        <Languages className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Translate Message
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {/* Quick translate to preferred language */}
          {userPreferredLanguage && (
            <div className="mb-4">
              <button
                onClick={() => handleQuickTranslate(userPreferredLanguage)}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
              >
                <Languages className="w-4 h-4 mr-2" />
                Quick Translate to {useTranslationStore.getState().getLanguageName(userPreferredLanguage)}
              </button>
            </div>
          )}

          {/* Language selector */}
          <div className="mb-4">
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              label="Select target language"
            />
          </div>

          {/* Manual Translate button */}
          <div className="mb-4">
            <button
              onClick={handleManualTranslate}
              disabled={!selectedLanguage || isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {isLoading ? "Translating..." : "Translate to Selected Language"}
            </button>
          </div>

          {/* Popular languages */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Translate:</h4>
            <div className="grid grid-cols-2 gap-2">
              {popularLanguages.map(({ code, name }) => (
                <button
                  key={code}
                  onClick={() => handleQuickTranslate(code)}
                  disabled={isLoading}
                  className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              <Settings className="w-4 h-4 mr-1" />
              Settings
            </h4>
            
            {/* Auto-translate toggle */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Auto-translate incoming messages</span>
              <button
                onClick={() => setAutoTranslateEnabled(!autoTranslateEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoTranslateEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoTranslateEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Provider info */}
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              <p>🪶 Featherless AI (Primary) → 🤖 OpenAI (Fallback)</p>
              <p>Using smart provider selection for best results</p>
            </div>

            {/* Preferred language */}
            <div className="mt-2">
              <LanguageSelector
                selectedLanguage={userPreferredLanguage}
                onLanguageChange={setUserPreferredLanguage}
                label="Preferred language"
                className="text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default TranslationButton;
