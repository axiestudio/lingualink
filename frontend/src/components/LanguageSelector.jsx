import { useState, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useTranslationStore } from "../store/useTranslationStore";

const LanguageSelector = ({ selectedLanguage, onLanguageChange, label = "Translate to", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { supportedLanguages, fetchSupportedLanguages } = useTranslationStore();

  useEffect(() => {
    fetchSupportedLanguages();
  }, [fetchSupportedLanguages]);

  const filteredLanguages = Object.entries(supportedLanguages).filter(([code, name]) =>
    name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedLanguageName = supportedLanguages[selectedLanguage] || "Select Language";

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        <Globe className="inline w-4 h-4 mr-1" />
        {label}
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
        >
          <span className="block truncate">
            {selectedLanguage ? (
              <span className="flex items-center">
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded mr-2">
                  {selectedLanguage.toUpperCase()}
                </span>
                {selectedLanguageName}
              </span>
            ) : (
              <span className="text-gray-500">Select a language...</span>
            )}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
            {/* Search input */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-600">
              <input
                type="text"
                placeholder="Search languages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Language options */}
            <div className="max-h-48 overflow-y-auto">
              {filteredLanguages.length > 0 ? (
                filteredLanguages.map(([code, name]) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      onLanguageChange(code);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                      selectedLanguage === code ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <span className="flex items-center">
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded mr-2 font-mono">
                        {code.toUpperCase()}
                      </span>
                      {name}
                    </span>
                    {selectedLanguage === code && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No languages found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setSearchTerm("");
          }}
        />
      )}
    </div>
  );
};

export default LanguageSelector;
