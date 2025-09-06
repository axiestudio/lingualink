// 🚀 ENTERPRISE TRANSLATION SERVICE - LinguaLink AI
// Advanced real-time translation with caching, rate limiting, and performance monitoring

export interface TranslationResult {
  translatedText: string;
  originalText: string;
  sourceLanguage: string;
  targetLanguage: string;
  translator: 'translator1' | 'translator2' | 'translator3';
  cached?: boolean;
  processingTime?: number;
  confidence?: number;
}

export interface TranslationCache {
  translatedText: string;
  timestamp: number;
  translator: 'translator1' | 'translator2' | 'translator3';
  confidence: number;
}

export interface PerformanceMetrics {
  totalRequests: number;
  successfulTranslations: number;
  failedTranslations: number;
  averageResponseTime: number;
  cacheHitRate: number;
  apiUsage: {
    translator1: number;
    translator2: number;
    translator3: number;
  };
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

// 🌍 COMPREHENSIVE LANGUAGE SUPPORT - 100+ LANGUAGES
// Organized by regions for better maintainability and user experience
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  // === MAJOR WORLD LANGUAGES ===
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文 (简体)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '中文 (繁體)' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'fa', name: 'Persian (Farsi)', nativeName: 'فارسی' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },

  // === EUROPEAN LANGUAGES ===
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskera' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego' },

  // === ASIAN LANGUAGES ===
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino' },
  { code: 'my', name: 'Myanmar (Burmese)', nativeName: 'မြန်မာ' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ' },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргыз' },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbek' },
  { code: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ' },
  { code: 'tk', name: 'Turkmen', nativeName: 'Türkmen' },

  // === AFRICAN LANGUAGES ===
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda' },
  { code: 'mg', name: 'Malagasy', nativeName: 'Malagasy' },

  // === MIDDLE EASTERN LANGUAGES ===
  { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî' },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي' },
  { code: 'ckb', name: 'Sorani Kurdish', nativeName: 'کوردیی ناوەندی' },

  // === AMERICAN LANGUAGES ===
  { code: 'qu', name: 'Quechua', nativeName: 'Runa Simi' },
  { code: 'gn', name: 'Guarani', nativeName: 'Avañe\'ẽ' },
  { code: 'ay', name: 'Aymara', nativeName: 'Aymar Aru' },

  // === PACIFIC LANGUAGES ===
  { code: 'mi', name: 'Maori', nativeName: 'Te Reo Māori' },
  { code: 'sm', name: 'Samoan', nativeName: 'Gagana Samoa' },
  { code: 'to', name: 'Tongan', nativeName: 'Lea Fakatonga' },
  { code: 'fj', name: 'Fijian', nativeName: 'Na Vosa Vakaviti' },

  // === ADDITIONAL EUROPEAN LANGUAGES ===
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip' },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски' },
  { code: 'me', name: 'Montenegrin', nativeName: 'Crnogorski' },

  // === CONSTRUCTED & SPECIAL LANGUAGES ===
  { code: 'eo', name: 'Esperanto', nativeName: 'Esperanto' },
  { code: 'la', name: 'Latin', nativeName: 'Latina' },
  { code: 'jw', name: 'Javanese', nativeName: 'Basa Jawa' },
  { code: 'su', name: 'Sundanese', nativeName: 'Basa Sunda' },
  { code: 'ceb', name: 'Cebuano', nativeName: 'Binisaya' },
  { code: 'haw', name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi' },
  { code: 'hmn', name: 'Hmong', nativeName: 'Hmoob' },
  { code: 'lb', name: 'Luxembourgish', nativeName: 'Lëtzebuergesch' },
  { code: 'co', name: 'Corsican', nativeName: 'Corsu' },
  { code: 'fy', name: 'Frisian', nativeName: 'Frysk' },
  { code: 'sn', name: 'Shona', nativeName: 'chiShona' },
  { code: 'st', name: 'Sesotho', nativeName: 'Sesotho' },
  { code: 'ny', name: 'Chichewa', nativeName: 'Chichewa' },
  { code: 'yi', name: 'Yiddish', nativeName: 'ייִדיש' },
];

class Translator1 {
  private apiKeys: string[];
  private baseUrl = 'https://api.featherless.ai/v1/chat/completions';
  private keyUsageCount: Map<string, number> = new Map();
  private keyLastUsed: Map<string, number> = new Map();

  constructor(apiKeys: string | string[]) {
    this.apiKeys = Array.isArray(apiKeys) ? apiKeys : [apiKeys];
    console.log(`🔑 Featherless API initialized with ${this.apiKeys.length} key(s)`);

    // Initialize usage tracking
    this.apiKeys.forEach(key => {
      this.keyUsageCount.set(key, 0);
      this.keyLastUsed.set(key, 0);
    });
  }

  /**
   * Get the next available API key using round-robin with rate limiting awareness
   * Feather Basic: 2 concurrent connections
   * This helps distribute load across multiple keys
   */
  private getNextApiKey(): string {
    const now = Date.now();

    // Find the key that was used least recently
    let bestKey = this.apiKeys[0];
    let oldestUsage = this.keyLastUsed.get(bestKey) || 0;

    for (const key of this.apiKeys) {
      const lastUsed = this.keyLastUsed.get(key) || 0;
      if (lastUsed < oldestUsage) {
        bestKey = key;
        oldestUsage = lastUsed;
      }
    }

    // Update usage tracking
    this.keyLastUsed.set(bestKey, now);
    const currentCount = this.keyUsageCount.get(bestKey) || 0;
    this.keyUsageCount.set(bestKey, currentCount + 1);

    console.log(`🔄 Using Featherless key ${this.apiKeys.indexOf(bestKey) + 1}/${this.apiKeys.length} (used ${currentCount + 1} times)`);

    return bestKey;
  }

  async translate(text: string, targetLanguage: string, sourceLanguage?: string): Promise<string> {
    const targetLang = SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage);
    if (!targetLang) {
      throw new Error(`Unsupported target language: ${targetLanguage}`);
    }

    const prompt = sourceLanguage
      ? `Translate the following text from ${sourceLanguage} to ${targetLang.name}. Return only the translation, no explanations:\n\n${text}`
      : `Translate the following text to ${targetLang.name}. Return only the translation, no explanations:\n\n${text}`;

    // Get the best available API key
    const apiKey = this.getNextApiKey();

    // Add timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'meta-llama/Meta-Llama-3.1-8B-Instruct', // 8B model = 1 concurrency cost
          messages: [
            {
              role: 'system',
              content: `You are LinguaLink AI, the world's most advanced real-time translation system for instant messaging. Your mission is to break down language barriers and enable seamless global communication.

CORE PRINCIPLES:
• ACCURACY: Provide precise translations that preserve original meaning, tone, and context
• SPEED: Optimize for real-time messaging - be concise and immediate
• CULTURAL SENSITIVITY: Respect cultural nuances, idioms, and regional expressions
• NATURAL FLOW: Ensure translations sound natural in the target language
• CONTEXT AWARENESS: Consider conversational context and messaging patterns

TRANSLATION GUIDELINES:
• Preserve emotional tone (formal, casual, excited, concerned, etc.)
• Handle slang, abbreviations, and internet language appropriately
• Maintain proper names, brands, and technical terms
• Adapt cultural references when necessary for clarity
• Keep formatting (emojis, punctuation, capitalization style)
• For ambiguous text, choose the most likely interpretation in messaging context

MESSAGING-SPECIFIC RULES:
• Keep translations concise for chat environments
• Preserve urgency indicators (!!!, ???, CAPS)
• Handle common chat abbreviations (lol, omg, brb, etc.)
• Maintain conversational flow and rhythm
• Adapt politeness levels to target language norms

QUALITY STANDARDS:
• Return ONLY the translation - no explanations or meta-text
• If text is already in target language, return it unchanged
• For untranslatable content, provide closest cultural equivalent
• Ensure grammatical correctness in target language
• Maintain message intent and emotional impact

You are powering a platform that connects millions of users worldwide. Every translation matters for human connection.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.1,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle rate limiting specifically
        if (response.status === 429) {
          throw new Error(`Featherless rate limit exceeded (429) - consider adding more API keys for higher concurrency`);
        }
        throw new Error(`Translator 1 API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() || text;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Translator 1 timeout after 5 seconds');
      }
      throw error;
    }
  }
}

class Translator2 {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translate(text: string, targetLanguage: string, sourceLanguage?: string): Promise<string> {
    const targetLang = SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage);
    if (!targetLang) {
      throw new Error(`Unsupported target language: ${targetLanguage}`);
    }

    const prompt = sourceLanguage 
      ? `Translate the following text from ${sourceLanguage} to ${targetLang.name}. Return only the translation, no explanations:\n\n${text}`
      : `Translate the following text to ${targetLang.name}. Return only the translation, no explanations:\n\n${text}`;

    // Add timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are LinguaLink AI, the world's most advanced real-time translation system for instant messaging. Your mission is to break down language barriers and enable seamless global communication.

CORE PRINCIPLES:
• ACCURACY: Provide precise translations that preserve original meaning, tone, and context
• SPEED: Optimize for real-time messaging - be concise and immediate
• CULTURAL SENSITIVITY: Respect cultural nuances, idioms, and regional expressions
• NATURAL FLOW: Ensure translations sound natural in the target language
• CONTEXT AWARENESS: Consider conversational context and messaging patterns

TRANSLATION GUIDELINES:
• Preserve emotional tone (formal, casual, excited, concerned, etc.)
• Handle slang, abbreviations, and internet language appropriately
• Maintain proper names, brands, and technical terms
• Adapt cultural references when necessary for clarity
• Keep formatting (emojis, punctuation, capitalization style)
• For ambiguous text, choose the most likely interpretation in messaging context

MESSAGING-SPECIFIC RULES:
• Keep translations concise for chat environments
• Preserve urgency indicators (!!!, ???, CAPS)
• Handle common chat abbreviations (lol, omg, brb, etc.)
• Maintain conversational flow and rhythm
• Adapt politeness levels to target language norms

QUALITY STANDARDS:
• Return ONLY the translation - no explanations or meta-text
• If text is already in target language, return it unchanged
• For untranslatable content, provide closest cultural equivalent
• Ensure grammatical correctness in target language
• Maintain message intent and emotional impact

You are powering a platform that connects millions of users worldwide. Every translation matters for human connection.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.1,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Translator 2 API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() || text;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Translator 2 timeout after 8 seconds');
      }
      throw error;
    }
  }
}

class Translator3 {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.apiKey = apiKey;
    console.log(`🏠 Local LLM translator initialized: ${this.baseUrl}`);
  }

  async translate(text: string, targetLanguage: string, sourceLanguage?: string): Promise<string> {
    const targetLang = SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage);
    if (!targetLang) {
      throw new Error(`Unsupported target language: ${targetLanguage}`);
    }

    // Add timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authorization if API key is provided
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(`${this.baseUrl}/translate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          target_language: targetLanguage,
          source_language: sourceLanguage
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Local backend service unavailable');
        }
        throw new Error(`Local backend API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Handle the response format from our local backend
      if (data.success && data.translation && data.translation.translatedText) {
        return data.translation.translatedText;
      } else {
        throw new Error('Invalid response format from local backend');
      }

    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Local backend timeout after 10 seconds');
      }
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        return data.status === 'healthy' && data.model_loaded;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export class TranslationService {
  private translator1: Translator1 | null = null;
  private translator2: Translator2 | null = null;
  private translator3: Translator3 | null = null; // Local LLM backend

  // 🚀 ENTERPRISE FEATURES
  private translationCache: Map<string, TranslationCache> = new Map();
  private performanceMetrics: PerformanceMetrics = {
    totalRequests: 0,
    successfulTranslations: 0,
    failedTranslations: 0,
    averageResponseTime: 0,
    cacheHitRate: 0,
    apiUsage: {
      translator1: 0,
      translator2: 0,
      translator3: 0
    }
  };
  private responseTimes: number[] = [];
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_SIZE = 10000; // Maximum cached translations
  private readonly CACHE_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

  constructor() {
    // Initialize local backend translator (highest priority)
    const localBackendUrl = process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL;
    const localBackendKey = process.env.LOCAL_BACKEND_API_KEY;

    console.log('🔧 Environment check:', {
      localBackendUrl,
      hasLocalBackendKey: !!localBackendKey,
      allEnvVars: Object.keys(process.env).filter(key => key.includes('LOCAL'))
    });

    if (localBackendUrl) {
      this.translator3 = new Translator3(localBackendUrl, localBackendKey);
      console.log('🏠 Local LLM backend translator initialized (Primary)');
      console.log('🎯 Local backend URL:', localBackendUrl);
    } else {
      console.warn('⚠️ Local backend URL not found in environment variables');
      console.warn('🔍 Expected: NEXT_PUBLIC_LOCAL_BACKEND_URL');
    }

    // Support multiple Featherless API keys for better concurrency
    const featherlessKeys = this.getFeatherlessApiKeys();
    const translator2Key = process.env.OPENAI_API_KEY;

    if (featherlessKeys.length > 0) {
      this.translator1 = new Translator1(featherlessKeys);
      console.log(`🚀 Featherless translator initialized with ${featherlessKeys.length} API key(s) for enhanced concurrency`);
    }

    if (translator2Key) {
      this.translator2 = new Translator2(translator2Key);
      console.log('🔄 OpenAI translator initialized as backup');
    }

    if (!this.translator3 && !this.translator1 && !this.translator2) {
      throw new Error('No translation services configured (local backend, Featherless, or OpenAI)');
    }

    // Initialize cache cleanup
    this.initializeCacheCleanup();
    console.log('🗄️ Translation cache initialized with enterprise features');
  }

  /**
   * Initialize cache cleanup process
   */
  private initializeCacheCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredCache();
    }, this.CACHE_CLEANUP_INTERVAL);
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, cache] of this.translationCache.entries()) {
      if (now - cache.timestamp > this.CACHE_TTL) {
        this.translationCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cache cleanup: Removed ${cleanedCount} expired entries. Cache size: ${this.translationCache.size}`);
    }

    // Enforce max cache size
    if (this.translationCache.size > this.MAX_CACHE_SIZE) {
      const entriesToRemove = this.translationCache.size - this.MAX_CACHE_SIZE;
      const sortedEntries = Array.from(this.translationCache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);

      for (let i = 0; i < entriesToRemove; i++) {
        this.translationCache.delete(sortedEntries[i][0]);
      }

      console.log(`📦 Cache size limit enforced: Removed ${entriesToRemove} oldest entries`);
    }
  }

  /**
   * Generate cache key for translation
   */
  private getCacheKey(text: string, sourceLanguage: string, targetLanguage: string): string {
    return `${sourceLanguage}:${targetLanguage}:${text.toLowerCase().trim()}`;
  }

  /**
   * Get translation from cache
   */
  private getCachedTranslation(text: string, sourceLanguage: string, targetLanguage: string): TranslationCache | null {
    const cacheKey = this.getCacheKey(text, sourceLanguage, targetLanguage);
    const cached = this.translationCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached;
    }

    if (cached) {
      // Remove expired entry
      this.translationCache.delete(cacheKey);
    }

    return null;
  }

  /**
   * Store translation in cache
   */
  private setCachedTranslation(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    translatedText: string,
    translator: 'translator1' | 'translator2' | 'translator3',
    confidence: number = 0.95
  ): void {
    const cacheKey = this.getCacheKey(text, sourceLanguage, targetLanguage);
    this.translationCache.set(cacheKey, {
      translatedText,
      timestamp: Date.now(),
      translator,
      confidence
    });
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(responseTime: number, success: boolean, translator?: 'translator1' | 'translator2' | 'translator3'): void {
    this.performanceMetrics.totalRequests++;

    if (success) {
      this.performanceMetrics.successfulTranslations++;
      if (translator) {
        this.performanceMetrics.apiUsage[translator]++;
      }
    } else {
      this.performanceMetrics.failedTranslations++;
    }

    this.responseTimes.push(responseTime);

    // Keep only last 1000 response times for rolling average
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }

    this.performanceMetrics.averageResponseTime =
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;

    const cacheHits = this.performanceMetrics.totalRequests -
      (this.performanceMetrics.apiUsage.translator1 + this.performanceMetrics.apiUsage.translator2);
    this.performanceMetrics.cacheHitRate = cacheHits / this.performanceMetrics.totalRequests;
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Check health of all translation services
   */
  async checkServicesHealth(): Promise<{
    local: boolean;
    featherless: boolean;
    openai: boolean;
    primary: string;
  }> {
    const health = {
      local: false,
      featherless: false,
      openai: false,
      primary: 'none'
    };

    // Check local backend
    if (this.translator3) {
      try {
        health.local = await this.translator3.healthCheck();
        if (health.local) {
          health.primary = 'local';
        }
      } catch (error) {
        console.warn('Local backend health check failed:', error);
      }
    }

    // Check Featherless (simplified check)
    if (this.translator1) {
      health.featherless = true; // Assume available if configured
      if (!health.local && health.primary === 'none') {
        health.primary = 'featherless';
      }
    }

    // Check OpenAI (simplified check)
    if (this.translator2) {
      health.openai = true; // Assume available if configured
      if (!health.local && !health.featherless && health.primary === 'none') {
        health.primary = 'openai';
      }
    }

    return health;
  }

  /**
   * Get current translation service status
   */
  getServiceStatus(): {
    hasLocal: boolean;
    hasFeatherless: boolean;
    hasOpenAI: boolean;
    totalServices: number;
  } {
    return {
      hasLocal: this.translator3 !== null,
      hasFeatherless: this.translator1 !== null,
      hasOpenAI: this.translator2 !== null,
      totalServices: [this.translator3, this.translator1, this.translator2].filter(Boolean).length
    };
  }

  /**
   * Extract all Featherless API keys from environment variables
   * Supports FEATHERLESS_API_KEY, FEATHERLESS_API_KEY_1, FEATHERLESS_API_KEY_2, etc.
   */
  private getFeatherlessApiKeys(): string[] {
    const keys: string[] = [];

    // Check for primary key
    const primaryKey = process.env.FEATHERLESS_API_KEY;
    if (primaryKey) {
      keys.push(primaryKey);
    }

    // Check for numbered keys (FEATHERLESS_API_KEY_1, FEATHERLESS_API_KEY_2, etc.)
    let keyIndex = 1;
    while (keyIndex <= 10) { // Support up to 10 keys
      const keyName = `FEATHERLESS_API_KEY_${keyIndex}`;
      const key = process.env[keyName];
      if (key) {
        keys.push(key);
        console.log(`✅ Found additional Featherless API key: ${keyName}`);
      }
      keyIndex++;
    }

    // Remove duplicates
    return [...new Set(keys)];
  }

  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    try {
      console.log(`🔄 [${requestId}] Translation Request: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}" | ${sourceLanguage || 'auto'} → ${targetLanguage}`);

      // Input validation
      if (!text || text.trim().length === 0) {
        console.log(`⚠️ [${requestId}] Empty text provided, returning original`);
        const duration = Date.now() - startTime;
        this.updateMetrics(duration, true);
        return {
          translatedText: text,
          originalText: text,
          sourceLanguage: sourceLanguage || 'unknown',
          targetLanguage,
          translator: 'translator1',
          processingTime: duration
        };
      }

      if (!targetLanguage || !SUPPORTED_LANGUAGES.some(lang => lang.code === targetLanguage)) {
        throw new Error(`Unsupported target language: ${targetLanguage}`);
      }

      // Auto-detect source language if not provided
      if (!sourceLanguage) {
        sourceLanguage = this.detectLanguage(text);
        console.log(`🔍 [${requestId}] Detected source language: ${sourceLanguage}`);
      }

      // Skip translation if target language is the same as source
      if (sourceLanguage && sourceLanguage === targetLanguage) {
        const duration = Date.now() - startTime;
        console.log(`⏭️ [${requestId}] Skipping translation: same language (${sourceLanguage}) | ${duration}ms`);
        this.updateMetrics(duration, true);
        return {
          translatedText: text,
          originalText: text,
          sourceLanguage,
          targetLanguage,
          translator: 'translator1',
          processingTime: duration
        };
      }

      // 🚀 CHECK CACHE FIRST - Enterprise Performance Optimization
      const cachedResult = this.getCachedTranslation(text, sourceLanguage, targetLanguage);
      if (cachedResult) {
        const duration = Date.now() - startTime;
        console.log(`⚡ [${requestId}] Cache HIT: "${cachedResult.translatedText.substring(0, 50)}${cachedResult.translatedText.length > 50 ? '...' : ''}" | ${duration}ms`);
        this.updateMetrics(duration, true);
        return {
          translatedText: cachedResult.translatedText,
          originalText: text,
          sourceLanguage,
          targetLanguage,
          translator: cachedResult.translator,
          cached: true,
          processingTime: duration,
          confidence: cachedResult.confidence
        };
      }

      let translatedText: string = '';
      let translator: 'translator1' | 'translator2' | 'translator3' = 'translator3';

      try {
        // Debug: Show available translators
        console.log(`🔍 [${requestId}] Available translators:`, {
          translator3: !!this.translator3,
          translator1: !!this.translator1,
          translator2: !!this.translator2
        });

        // Try Local Backend (Translator3) first - PRIMARY (Local LLM)
        if (this.translator3) {
          console.log(`🏠 [${requestId}] Attempting translation via Local LLM Backend (Primary)`);
          translatedText = await this.translator3.translate(text, targetLanguage, sourceLanguage);
          translator = 'translator3';
        } else if (this.translator1) {
          console.log(`🚀 [${requestId}] Attempting translation via Featherless.ai (Fallback 1)`);
          console.log(`⚠️ [${requestId}] Local LLM not available, using fallback`);
          translatedText = await this.translator1.translate(text, targetLanguage, sourceLanguage);
          translator = 'translator1';
        } else if (this.translator2) {
          console.log(`🚀 [${requestId}] Attempting translation via OpenAI (Fallback 2)`);
          console.log(`⚠️ [${requestId}] Local LLM and Featherless not available, using OpenAI`);
          translatedText = await this.translator2.translate(text, targetLanguage, sourceLanguage);
          translator = 'translator2';
        } else {
          throw new Error('No translation service available');
        }
      } catch (error) {
        console.warn(`⚠️ [${requestId}] Primary translator failed, trying backup:`, error);

        // Fallback chain: Local -> Featherless -> OpenAI
        if (this.translator1 && translator !== 'translator1') {
          try {
            console.log(`🚀 [${requestId}] Attempting translation via Featherless.ai (Backup 1)`);
            translatedText = await this.translator1.translate(text, targetLanguage, sourceLanguage);
            translator = 'translator1';
          } catch (backupError) {
            console.warn(`⚠️ [${requestId}] Featherless backup failed, trying OpenAI:`, backupError);

            // Final fallback to OpenAI
            if (this.translator2 && translator !== 'translator2') {
              try {
                console.log(`🔄 [${requestId}] Attempting translation via OpenAI (Final Backup)`);
                translatedText = await this.translator2.translate(text, targetLanguage, sourceLanguage);
                translator = 'translator2';
              } catch (finalError) {
                console.error(`❌ [${requestId}] All translation services failed:`, finalError);
                throw new Error('All translation services failed');
              }
            } else {
              throw backupError;
            }
          }
        } else if (this.translator2 && translator !== 'translator2') {
          try {
            console.log(`🔄 [${requestId}] Attempting translation via OpenAI (Backup)`);
            translatedText = await this.translator2.translate(text, targetLanguage, sourceLanguage);
            translator = 'translator2';
          } catch (backupError) {
            console.error(`❌ [${requestId}] All translation services failed:`, backupError);
            throw new Error('All translation services failed');
          }
        } else {
          throw error;
        }
      }

      if (!translatedText || translatedText.trim().length === 0) {
        throw new Error('Translation service returned empty result');
      }

      const duration = Date.now() - startTime;
      const apiUsed = translator === 'translator3' ? 'Local LLM Backend' :
                     translator === 'translator1' ? 'Featherless.ai' : 'OpenAI';
      console.log(`✅ [${requestId}] Translation successful via ${apiUsed}: "${translatedText.substring(0, 50)}${translatedText.length > 50 ? '...' : ''}" | ${duration}ms`);

      // 🚀 CACHE THE SUCCESSFUL TRANSLATION - Enterprise Performance
      const confidence = translator === 'translator3' ? 0.97 : // Local LLM high quality
                         translator === 'translator2' ? 0.98 : 0.95; // OpenAI typically highest quality
      this.setCachedTranslation(text, sourceLanguage, targetLanguage, translatedText.trim(), translator, confidence);

      // Performance monitoring
      if (duration > 5000) {
        console.warn(`🐌 [${requestId}] Slow translation detected: ${duration}ms`);
      }

      // Update metrics
      this.updateMetrics(duration, true, translator);

      return {
        translatedText: translatedText.trim(),
        originalText: text,
        sourceLanguage: sourceLanguage || 'auto',
        targetLanguage,
        translator,
        cached: false,
        processingTime: duration,
        confidence
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [${requestId}] Translation failed after ${duration}ms:`, error);

      // Update failure metrics
      this.updateMetrics(duration, false);

      // Return original text as fallback to maintain user experience
      console.log(`🔄 [${requestId}] Returning original text as fallback`);
      return {
        translatedText: text,
        originalText: text,
        sourceLanguage: sourceLanguage || 'unknown',
        targetLanguage,
        translator: 'translator1',
        processingTime: duration
      };
    }
  }

  detectLanguage(text: string): string {
    // 🔍 ADVANCED LANGUAGE DETECTION - Supporting 100+ Languages
    // Enhanced pattern matching for comprehensive language identification

    // === SCRIPT-BASED DETECTION ===
    // Chinese Scripts
    if (/[\u4e00-\u9fff]/.test(text)) {
      // Check for Traditional Chinese indicators
      if (/[\u9f98-\u9fff\uf900-\ufaff]/.test(text)) return 'zh-TW';
      return 'zh'; // Simplified Chinese
    }

    // Japanese Scripts
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';

    // Korean Script
    if (/[\uac00-\ud7af]/.test(text)) return 'ko';

    // Arabic Script Family
    if (/[\u0600-\u06ff]/.test(text)) {
      if (/[\u067e\u0686\u0698\u06af]/.test(text)) return 'fa'; // Persian indicators
      if (/[\u0679\u067e\u0686\u0688]/.test(text)) return 'ur'; // Urdu indicators
      return 'ar'; // Standard Arabic
    }

    // Hebrew Script
    if (/[\u0590-\u05ff]/.test(text)) return 'he';

    // Cyrillic Script Family
    if (/[\u0400-\u04ff]/.test(text)) {
      if (/[іїєґ]/.test(text)) return 'uk'; // Ukrainian
      if (/[ўё]/.test(text)) return 'be'; // Belarusian
      if (/[ѓќѕџљњћџ]/.test(text)) return 'mk'; // Macedonian
      if (/[ђћџљњ]/.test(text)) return 'sr'; // Serbian
      if (/[ғқңһүұө]/.test(text)) return 'kk'; // Kazakh
      return 'ru'; // Default to Russian
    }

    // Devanagari Script Family
    if (/[\u0900-\u097f]/.test(text)) {
      if (/[ॐ]/.test(text)) return 'hi'; // Hindi
      if (/[ॠॡ]/.test(text)) return 'mr'; // Marathi
      if (/[ॲॳ]/.test(text)) return 'ne'; // Nepali
      return 'hi'; // Default to Hindi
    }

    // Tamil Script
    if (/[\u0b80-\u0bff]/.test(text)) return 'ta';

    // Telugu Script
    if (/[\u0c00-\u0c7f]/.test(text)) return 'te';

    // Kannada Script
    if (/[\u0c80-\u0cff]/.test(text)) return 'kn';

    // Malayalam Script
    if (/[\u0d00-\u0d7f]/.test(text)) return 'ml';

    // Gujarati Script
    if (/[\u0a80-\u0aff]/.test(text)) return 'gu';

    // Punjabi Script
    if (/[\u0a00-\u0a7f]/.test(text)) return 'pa';

    // Bengali Script
    if (/[\u0980-\u09ff]/.test(text)) return 'bn';

    // Odia Script
    if (/[\u0b00-\u0b7f]/.test(text)) return 'or';

    // Assamese Script
    if (/[\u0980-\u09ff]/.test(text)) return 'as';

    // Thai Script
    if (/[\u0e00-\u0e7f]/.test(text)) return 'th';

    // Myanmar Script
    if (/[\u1000-\u109f]/.test(text)) return 'my';

    // Khmer Script
    if (/[\u1780-\u17ff]/.test(text)) return 'km';

    // Lao Script
    if (/[\u0e80-\u0eff]/.test(text)) return 'lo';

    // Sinhala Script
    if (/[\u0d80-\u0dff]/.test(text)) return 'si';

    // Georgian Script
    if (/[\u10a0-\u10ff]/.test(text)) return 'ka';

    // Armenian Script
    if (/[\u0530-\u058f]/.test(text)) return 'hy';

    // Ethiopian Script
    if (/[\u1200-\u137f]/.test(text)) return 'am';

    // Greek Script
    if (/[\u0370-\u03ff]/.test(text)) return 'el';

    // === LATIN SCRIPT LANGUAGE DETECTION ===
    // Use common words and patterns for Latin-script languages
    const lowerText = text.toLowerCase();

    // Germanic Languages
    if (/\b(der|die|das|und|ist|nicht|mit|für|auf|eine?|zu|sich|auch|nach|über|wenn|nur|noch|mehr|sehr|schon|gegen|beim|unter|während|wegen|trotz)\b/.test(lowerText)) return 'de';
    if (/\b(het|de|een|van|in|is|op|met|voor|aan|als|zijn|hebben|worden|kunnen|zullen|moeten|mogen|willen|gaan|komen|zien|weten|zeggen|maken|krijgen|geven)\b/.test(lowerText)) return 'nl';
    if (/\b(och|att|är|en|det|som|för|på|med|av|till|från|eller|när|över|under|mellan|genom|utan|inom|utanför|efter|före|sedan|redan|alltid|aldrig|ofta|ibland|kanske)\b/.test(lowerText)) return 'sv';
    if (/\b(og|at|er|en|det|som|for|på|med|af|til|fra|eller|når|over|under|mellem|gennem|uden|inden|udenfor|efter|før|siden|allerede|altid|aldrig|ofte|nogle|måske)\b/.test(lowerText)) return 'da';
    if (/\b(og|at|er|en|det|som|for|på|med|av|til|fra|eller|når|over|under|mellom|gjennom|uten|innen|utenfor|etter|før|siden|allerede|alltid|aldri|ofte|noen|kanskje)\b/.test(lowerText)) return 'no';

    // Romance Languages
    if (/\b(el|la|de|que|y|a|en|un|ser|se|no|te|lo|le|da|su|por|son|con|para|una|sur|más|me|si|sin|sobre|este|ya|tanto|también|sólo|hay|donde|muy|cuando|todo|esta|ser|poder|decir|todo|uno|ir|saber|llegar|pasar|tiempo|bien|año|día|vez|hombre|mundo|vida|mano|país|según|menos|problema|mismo|social|agua|nuevo|caso|nada|hacer|estos|hombre|tanto|dinero|otros|tiempo|muy|sobre|decir|ahora|cada|estado|contra|sino|forma|aquí|sólo|después|desde|política|toda|otras|entre|tres|durante|siempre|lugar|siguientes|ejemplo)\b/.test(lowerText)) return 'es';
    if (/\b(le|de|et|à|un|il|être|et|en|avoir|que|pour|dans|ce|son|une|sur|avec|ne|se|pas|tout|plus|pouvoir|par|je|me|comme|mais|faire|leur|bien|où|sans|peut|sous|même|encore|aussi|notre|autre|après|venir|temps|très|savoir|falloir|voir|en|quelque|dire|année|prendre|aller|jour|cette|donner|rien|vouloir|parler|depuis|contre|entre|trois|pendant|toujours|lieu|suivant|exemple)\b/.test(lowerText)) return 'fr';
    if (/\b(o|de|e|que|do|da|em|um|para|com|não|uma|os|no|se|na|por|mais|as|dos|como|mas|foi|ao|ele|das|tem|à|seu|sua|ou|ser|quando|muito|há|nos|já|está|eu|também|só|pelo|pela|até|isso|ela|entre|era|depois|sem|mesmo|aos|ter|seus|suas|numa|pelos|pelas|esse|eles|essa|num|eram|estão|você|tinha|foram|esteve|tenho|desde|contra|durante|sempre|lugar|exemplo)\b/.test(lowerText)) return 'pt';
    if (/\b(il|di|e|che|la|per|un|in|con|del|da|su|al|le|si|come|più|anche|me|se|ci|lo|tutto|ma|a|molto|bene|dove|senza|può|sotto|stesso|ancora|anche|nostro|altro|dopo|venire|tempo|molto|sapere|bisognare|vedere|qualche|dire|anno|prendere|andare|giorno|questa|dare|niente|volere|parlare|da|contro|tra|tre|durante|sempre|luogo|seguente|esempio)\b/.test(lowerText)) return 'it';

    // Slavic Languages (Latin script)
    if (/\b(i|w|na|z|do|się|że|nie|jest|być|mieć|który|dla|przez|od|po|przy|przed|nad|pod|między|bez|podczas|zawsze|miejsce|przykład)\b/.test(lowerText)) return 'pl';
    if (/\b(a|v|na|z|do|se|že|ne|je|být|mít|který|pro|přes|od|po|při|před|nad|pod|mezi|bez|během|vždy|místo|příklad)\b/.test(lowerText)) return 'cs';
    if (/\b(a|v|na|z|do|sa|že|nie|je|byť|mať|ktorý|pre|cez|od|po|pri|pred|nad|pod|medzi|bez|počas|vždy|miesto|príklad)\b/.test(lowerText)) return 'sk';
    if (/\b(in|na|z|do|se|da|ne|je|biti|imeti|kateri|za|čez|od|po|pri|pred|nad|pod|med|brez|med|vedno|mesto|primer)\b/.test(lowerText)) return 'sl';
    if (/\b(i|u|na|s|do|se|da|ne|je|biti|imati|koji|za|preko|od|po|kod|pred|nad|pod|između|bez|tokom|uvek|mesto|primer)\b/.test(lowerText)) return 'hr';

    // Finno-Ugric Languages
    if (/\b(ja|on|ei|se|että|kun|niin|kuin|vain|vielä|jo|nyt|sitten|ennen|jälkeen|kanssa|ilman|aikana|aina|paikka|esimerkki)\b/.test(lowerText)) return 'fi';
    if (/\b(és|van|nem|az|hogy|amikor|úgy|mint|csak|még|már|most|aztán|előtt|után|vel|nélkül|alatt|mindig|hely|példa)\b/.test(lowerText)) return 'hu';
    if (/\b(ja|on|ei|see|et|kui|nii|nagu|ainult|veel|juba|nüüd|siis|enne|pärast|koos|ilma|ajal|alati|koht|näide)\b/.test(lowerText)) return 'et';
    if (/\b(un|ir|nav|tas|ka|kad|tā|kā|tikai|vēl|jau|tagad|tad|pirms|pēc|ar|bez|laikā|vienmēr|vieta|piemērs)\b/.test(lowerText)) return 'lv';
    if (/\b(ir|yra|nėra|tas|kad|kai|taip|kaip|tik|dar|jau|dabar|tada|prieš|po|su|be|metu|visada|vieta|pavyzdys)\b/.test(lowerText)) return 'lt';

    // Turkish
    if (/\b(ve|bir|bu|için|ile|da|de|var|yok|olan|olarak|daha|çok|en|her|kendi|sonra|önce|arasında|karşı|boyunca|hep|yer|örnek)\b/.test(lowerText)) return 'tr';

    // Vietnamese (Latin script with diacritics)
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/.test(text)) return 'vi';

    // Indonesian/Malay
    if (/\b(dan|yang|di|ke|dari|untuk|dengan|pada|adalah|akan|atau|tidak|ada|ini|itu|juga|sudah|belum|bisa|harus|dapat|sangat|lebih|paling|setiap|sendiri|kemudian|sebelum|antara|melawan|selama|selalu|tempat|contoh)\b/.test(lowerText)) return 'id';

    // Filipino/Tagalog
    if (/\b(ang|ng|sa|na|ay|mga|at|para|kung|hindi|may|wala|ito|iyan|din|rin|naman|lang|lamang|siya|ako|ikaw|kami|kayo|sila|noon|ngayon|bukas|kahapon|lagi|lugar|halimbawa)\b/.test(lowerText)) return 'tl';

    // Swahili
    if (/\b(na|ya|wa|za|la|pa|ku|mu|ki|vi|li|ya|kwa|katika|kutoka|kwa|pamoja|bila|wakati|daima|mahali|mfano)\b/.test(lowerText)) return 'sw';

    // Default fallback to English for unidentified Latin script
    return 'en';
  }
}

// Singleton instance
let translationService: TranslationService | null = null;

export function getTranslationService(): TranslationService {
  if (!translationService) {
    translationService = new TranslationService();
  }
  return translationService;
}
