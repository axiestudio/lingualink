import { useState } from "react";
import { Languages, ChevronDown, ChevronUp, Globe, Sparkles } from "lucide-react";
import { useTranslationStore } from "../store/useTranslationStore";

const MessageTranslation = ({ message, className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [translatedText, setTranslatedText] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const { translateText, userPreferredLanguage, getLanguageName, autoTranslateEnabled } = useTranslationStore();

  const handleTranslate = async () => {
    if (!message.text || isTranslating) return;

    setIsTranslating(true);
    try {
      const result = await translateText(message.text, userPreferredLanguage);
      if (result && result.translatedText) {
        setTranslatedText(result);
        setIsExpanded(true);
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
      setIsExpanded(!isExpanded);
    }
  };

  // Only show translation button when auto-translate is disabled and there's text
  if (!message.text || autoTranslateEnabled) {
    return null;
  }

  return (
    <div className={`${className}`}>
      {/* Collapsing Translation Bar */}
      <div className="mt-2 border border-slate-700/50 rounded-lg overflow-hidden bg-slate-800/30 backdrop-blur-sm">

        {/* Translation Header Bar - Always Visible */}
        <div
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-700/30 transition-all duration-200"
          onClick={toggleTranslation}
        >
          <div className="flex items-center space-x-2">
            {isTranslating ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-slate-400 border-t-cyan-400 rounded-full"></div>
                <span className="text-sm font-medium text-slate-200">
                  Translating...
                </span>
              </>
            ) : translatedText ? (
              <>
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-slate-200">
                  Translation Available
                </span>
                <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded-full">
                  {getLanguageName(translatedText.targetLanguage)}
                </span>
              </>
            ) : (
              <>
                <Languages className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-300">
                  Translate to Understand
                </span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {translatedText && (
              <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            )}
          </div>
        </div>

        {/* Collapsible Content - Translation & Original */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded && translatedText ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">

            {/* Translation Text */}
            <div className="p-4 border-b border-slate-700/30">
              <div className="flex items-center mb-2">
                <Globe className="w-3 h-3 mr-2 text-cyan-400" />
                <span className="text-xs font-medium text-cyan-300">
                  Translated to {translatedText && getLanguageName(translatedText.targetLanguage)}
                  {translatedText && translatedText.sourceLanguage !== 'auto' && (
                    <span> from {getLanguageName(translatedText.sourceLanguage)}</span>
                  )}
                </span>
              </div>
              <div className="text-slate-100 font-medium leading-relaxed bg-slate-800/40 p-3 rounded-md border border-slate-700/30">
                {translatedText && translatedText.translatedText}
              </div>
            </div>

            {/* Original Text */}
            <div className="p-4 bg-slate-800/30">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 mr-2 rounded-full bg-slate-500"></div>
                <span className="text-xs font-medium text-slate-400">
                  Original Message
                </span>
              </div>
              <div className="text-slate-300 italic leading-relaxed bg-slate-700/30 p-3 rounded-md border border-slate-600/30">
                "{message.text}"
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageTranslation;
