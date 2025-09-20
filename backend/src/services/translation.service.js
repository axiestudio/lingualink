import { ENV } from "../lib/env.js";

/**
 * Translation Service for Lingua Link
 * Supports both OpenAI and Featherless AI APIs for real-time translation
 */

// Supported languages with their codes
export const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'es': 'Spanish', 
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese (Simplified)',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'tr': 'Turkish',
  'pl': 'Polish',
  'nl': 'Dutch',
  'sv': 'Swedish',
  'da': 'Danish',
  'no': 'Norwegian',
  'fi': 'Finnish',
  'cs': 'Czech',
  'hu': 'Hungarian',
  'ro': 'Romanian',
  'bg': 'Bulgarian',
  'hr': 'Croatian',
  'sk': 'Slovak',
  'sl': 'Slovenian',
  'et': 'Estonian',
  'lv': 'Latvian',
  'lt': 'Lithuanian',
  'mt': 'Maltese',
  'th': 'Thai',
  'vi': 'Vietnamese',
  'id': 'Indonesian',
  'ms': 'Malay',
  'tl': 'Filipino',
  'sw': 'Swahili',
  'am': 'Amharic',
  'he': 'Hebrew',
  'fa': 'Persian',
  'ur': 'Urdu',
  'bn': 'Bengali',
  'ta': 'Tamil',
  'te': 'Telugu',
  'ml': 'Malayalam',
  'kn': 'Kannada',
  'gu': 'Gujarati',
  'pa': 'Punjabi',
  'mr': 'Marathi',
  'ne': 'Nepali',
  'si': 'Sinhala',
  'my': 'Myanmar',
  'km': 'Khmer',
  'lo': 'Lao',
  'ka': 'Georgian',
  'hy': 'Armenian',
  'az': 'Azerbaijani',
  'kk': 'Kazakh',
  'ky': 'Kyrgyz',
  'tg': 'Tajik',
  'tk': 'Turkmen',
  'uz': 'Uzbek',
  'mn': 'Mongolian',
  'bo': 'Tibetan',
  'dz': 'Dzongkha',
  'is': 'Icelandic',
  'ga': 'Irish',
  'cy': 'Welsh',
  'gd': 'Scottish Gaelic',
  'br': 'Breton',
  'eu': 'Basque',
  'ca': 'Catalan',
  'gl': 'Galician',
  'oc': 'Occitan',
  'co': 'Corsican',
  'sc': 'Sardinian',
  'rm': 'Romansh',
  'lb': 'Luxembourgish',
  'fo': 'Faroese',
  'kl': 'Greenlandic',
  'se': 'Northern Sami',
  'yi': 'Yiddish',
  'la': 'Latin',
  'eo': 'Esperanto',
  'ia': 'Interlingua',
  'ie': 'Interlingue',
  'vo': 'Volapük',
  'jbo': 'Lojban',
  'tlh': 'Klingon'
};

/**
 * Translate text using OpenAI API with 3-retry mechanism (supports user's own API key)
 */
async function translateWithOpenAI(text, targetLanguage, sourceLanguage = 'auto', userApiKey = null, retryCount = 0) {
  const maxRetries = 3;

  try {
    console.log(`🤖 [OpenAI Attempt ${retryCount + 1}/${maxRetries}] Translating: "${text.substring(0, 50)}..."`);

    const targetLangName = SUPPORTED_LANGUAGES[targetLanguage] || targetLanguage;
    const sourceLangName = sourceLanguage === 'auto' ? 'automatically detected language' : (SUPPORTED_LANGUAGES[sourceLanguage] || sourceLanguage);

    const prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}. Only return the translated text, nothing else:\n\n${text}`;

    // Use user's API key if provided, otherwise use our key
    const apiKey = userApiKey || ENV.OPENAI_API_KEY;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. Translate the given text accurately while preserving the original meaning, tone, and context. Only return the translated text without any additional commentary.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const translatedText = data.choices[0].message.content.trim();

    console.log(`✅ OpenAI Success (attempt ${retryCount + 1}): "${translatedText.substring(0, 50)}..."`);

    return {
      success: true,
      translatedText,
      provider: userApiKey ? 'openai-user' : 'openai',
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      usingUserKey: !!userApiKey,
      attempt: retryCount + 1
    };
  } catch (error) {
    console.error(`❌ OpenAI attempt ${retryCount + 1} failed:`, error.message);

    // Retry if we haven't reached max retries
    if (retryCount < maxRetries - 1) {
      console.log(`🔄 Retrying OpenAI (${retryCount + 2}/${maxRetries}) in 1 second...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return translateWithOpenAI(text, targetLanguage, sourceLanguage, userApiKey, retryCount + 1);
    }

    console.log(`💥 OpenAI failed after ${maxRetries} attempts`);
    return {
      success: false,
      error: error.message,
      provider: 'openai',
      attempts: maxRetries
    };
  }
}

/**
 * Translate text using Featherless AI API with 3-retry mechanism
 */
async function translateWithFeatherless(text, targetLanguage, sourceLanguage = 'auto', retryCount = 0) {
  const maxRetries = 3;

  try {
    console.log(`🪶 [Featherless Attempt ${retryCount + 1}/${maxRetries}] Translating: "${text.substring(0, 50)}..."`);

    const targetLangName = SUPPORTED_LANGUAGES[targetLanguage] || targetLanguage;
    const sourceLangName = sourceLanguage === 'auto' ? 'automatically detected language' : (SUPPORTED_LANGUAGES[sourceLanguage] || sourceLanguage);

    const prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}. Only return the translated text, nothing else:\n\n${text}`;

    const response = await fetch('https://api.featherless.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ENV.FEATHERLESS_API_KEY}`
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. Translate the given text accurately while preserving the original meaning, tone, and context. Only return the translated text without any additional commentary.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`Featherless API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const translatedText = data.choices[0].message.content.trim();

    console.log(`✅ Featherless Success (attempt ${retryCount + 1}): "${translatedText.substring(0, 50)}..."`);

    return {
      success: true,
      translatedText,
      provider: 'featherless',
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      attempt: retryCount + 1
    };
  } catch (error) {
    console.error(`❌ Featherless attempt ${retryCount + 1} failed:`, error.message);

    // Retry if we haven't reached max retries
    if (retryCount < maxRetries - 1) {
      console.log(`🔄 Retrying Featherless (${retryCount + 2}/${maxRetries}) in 1 second...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return translateWithFeatherless(text, targetLanguage, sourceLanguage, retryCount + 1);
    }

    console.log(`💥 Featherless failed after ${maxRetries} attempts`);
    return {
      success: false,
      error: error.message,
      provider: 'featherless',
      attempts: maxRetries
    };
  }
}

/**
 * Main translation function with Featherless PRIMARY and OpenAI FALLBACK
 */
export async function translateText(text, targetLanguage, sourceLanguage = 'auto', userApiKey = null) {
  if (!text || !text.trim()) {
    return {
      success: false,
      error: 'No text provided for translation'
    };
  }

  if (!SUPPORTED_LANGUAGES[targetLanguage]) {
    return {
      success: false,
      error: `Unsupported target language: ${targetLanguage}`
    };
  }

  let result;

  // If user has their own OpenAI API key, use that FIRST
  if (userApiKey) {
    console.log('🔑 Using user\'s OpenAI API key...');
    result = await translateWithOpenAI(text, targetLanguage, sourceLanguage, userApiKey);

    if (result.success) {
      result.provider = 'openai-user';
      return result;
    }
    console.log('❌ User OpenAI key failed, falling back to Featherless...');
  }

  // PRIMARY: Try Featherless first (our main provider)
  console.log('🪶 Using Featherless AI (PRIMARY)...');
  result = await translateWithFeatherless(text, targetLanguage, sourceLanguage);

  // FALLBACK: If Featherless fails, try our OpenAI
  if (!result.success) {
    console.log('❌ Featherless failed, trying OpenAI (FALLBACK)...');
    result = await translateWithOpenAI(text, targetLanguage, sourceLanguage);

    if (result.success) {
      result.provider = 'openai-fallback';
    } else {
      // If both providers fail, return a user-friendly error
      console.log('❌ All translation providers failed');
      return {
        success: false,
        error: 'Failed to translate, try again later',
        translatedText: null,
        provider: 'none',
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage
      };
    }
  }

  return result;
}

/**
 * Detect language of text (basic implementation)
 */
export function detectLanguage(text) {
  // Simple language detection based on character patterns
  // This is a basic implementation - in production you might want to use a proper language detection library
  
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh'; // Chinese
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'; // Japanese
  if (/[\uac00-\ud7af]/.test(text)) return 'ko'; // Korean
  if (/[\u0600-\u06ff]/.test(text)) return 'ar'; // Arabic
  if (/[\u0590-\u05ff]/.test(text)) return 'he'; // Hebrew
  if (/[\u0400-\u04ff]/.test(text)) return 'ru'; // Russian
  if (/[\u0370-\u03ff]/.test(text)) return 'el'; // Greek
  if (/[\u0e00-\u0e7f]/.test(text)) return 'th'; // Thai
  if (/[\u0900-\u097f]/.test(text)) return 'hi'; // Hindi
  
  // Default to English for Latin script
  return 'en';
}
