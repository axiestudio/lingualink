// Translation service with primary and backup translators
export interface TranslationResult {
  translatedText: string;
  originalText: string;
  sourceLanguage: string;
  targetLanguage: string;
  translator: 'translator1' | 'translator2';
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
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
              content: 'You are a professional translator. Translate text accurately while preserving the original meaning and tone. Return only the translation without any additional text or explanations.'
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
              content: 'You are a professional translator. Translate text accurately while preserving the original meaning and tone. Return only the translation without any additional text or explanations.'
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

export class TranslationService {
  private translator1: Translator1 | null = null;
  private translator2: Translator2 | null = null;

  constructor() {
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

    if (!this.translator1 && !this.translator2) {
      throw new Error('No translation API keys configured');
    }
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
    // Skip translation if target language is the same as source
    if (sourceLanguage && sourceLanguage === targetLanguage) {
      return {
        translatedText: text,
        originalText: text,
        sourceLanguage,
        targetLanguage,
        translator: 'translator1'
      };
    }

    let translatedText: string;
    let translator: 'translator1' | 'translator2' = 'translator1';

    try {
      // Try Translator 1 (Featherless.ai) first - PRIMARY
      if (this.translator1) {
        translatedText = await this.translator1.translate(text, targetLanguage, sourceLanguage);
        translator = 'translator1';
      } else if (this.translator2) {
        translatedText = await this.translator2.translate(text, targetLanguage, sourceLanguage);
        translator = 'translator2';
      } else {
        throw new Error('No translation service available');
      }
    } catch (error) {
      console.warn('Translator 1 failed, trying Translator 2 as backup:', error);

      // Fallback to Translator 2 (OpenAI) as backup
      if (this.translator2 && translator !== 'translator2') {
        try {
          translatedText = await this.translator2.translate(text, targetLanguage, sourceLanguage);
          translator = 'translator2';
        } catch (backupError) {
          console.error('Translator 2 backup also failed:', backupError);
          throw new Error('All translation services failed');
        }
      } else {
        throw error;
      }
    }

    return {
      translatedText,
      originalText: text,
      sourceLanguage: sourceLanguage || 'auto',
      targetLanguage,
      translator
    };
  }

  detectLanguage(text: string): string {
    // Simple language detection based on character patterns
    // This is a basic implementation - in production, you might want to use a proper language detection service
    
    // Check for common patterns
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh'; // Chinese
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'; // Japanese
    if (/[\uac00-\ud7af]/.test(text)) return 'ko'; // Korean
    if (/[\u0600-\u06ff]/.test(text)) return 'ar'; // Arabic
    if (/[\u0590-\u05ff]/.test(text)) return 'he'; // Hebrew
    if (/[\u0400-\u04ff]/.test(text)) return 'ru'; // Russian
    if (/[\u0900-\u097f]/.test(text)) return 'hi'; // Hindi
    
    // Default to English for Latin script
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
