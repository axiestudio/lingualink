import { useState } from "react";
import { Languages, Eye, EyeOff, Globe } from "lucide-react";
import { useTranslationStore } from "../store/useTranslationStore";

const MessageTranslation = ({ message, className = "" }) => {
  const [showTranslation, setShowTranslation] = useState(false);
  const [translatedText, setTranslatedText] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const { translateText, userPreferredLanguage, getLanguageName } = useTranslationStore();

  const handleTranslate = async () => {
    if (!message.text || isTranslating) return;

    setIsTranslating(true);
    try {
      const result = await translateText(message.text, userPreferredLanguage);
      if (result && result.translatedText) {
        setTranslatedText(result);
        setShowTranslation(true);
      } else {
        // Translation failed, but don't show error to user
        console.warn("Translation failed for message");
      }
    } catch (error) {
      console.error("Translation error:", error);
      // Error is already handled by the translation store
    } finally {
      setIsTranslating(false);
    }
  };

  const toggleTranslation = () => {
    if (!translatedText) {
      handleTranslate();
    } else {
      setShowTranslation(!showTranslation);
    }
  };

  // Don't show translation button if no text or if already in preferred language
  if (!message.text || !userPreferredLanguage) {
    return null;
  }

  return (
    <div className={`${className}`}>
      {/* Translation toggle button */}
      <button
        onClick={toggleTranslation}
        disabled={isTranslating}
        className="inline-flex items-center text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors mt-1"
        title={showTranslation ? "Hide translation" : "Translate message"}
      >
        {isTranslating ? (
          <>
            <div className="animate-spin w-3 h-3 border border-gray-300 border-t-blue-600 rounded-full mr-1"></div>
            Translating...
          </>
        ) : showTranslation ? (
          <>
            <EyeOff className="w-3 h-3 mr-1" />
            Hide translation
          </>
        ) : (
          <>
            <Languages className="w-3 h-3 mr-1" />
            Translate
          </>
        )}
      </button>

      {/* Translation display */}
      {showTranslation && translatedText && (
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
              <Globe className="w-3 h-3 mr-1" />
              <span>
                Translated to {getLanguageName(translatedText.targetLanguage)}
                {translatedText.sourceLanguage !== 'auto' && (
                  <span> from {getLanguageName(translatedText.sourceLanguage)}</span>
                )}
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              via {translatedText.provider.toUpperCase()}
            </span>
          </div>
          
          <div className="text-gray-800 dark:text-gray-200">
            {translatedText.translatedText}
          </div>
          
          {/* Original text toggle */}
          <details className="mt-2">
            <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
              Show original
            </summary>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 italic">
              "{message.text}"
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default MessageTranslation;
