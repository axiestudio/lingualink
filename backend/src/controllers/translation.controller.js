import { translateText, SUPPORTED_LANGUAGES, detectLanguage } from "../services/translation.service.js";
import UserSettings from "../models/UserSettings.js";

/**
 * Get all supported languages
 */
export const getSupportedLanguages = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      languages: SUPPORTED_LANGUAGES,
      count: Object.keys(SUPPORTED_LANGUAGES).length
    });
  } catch (error) {
    console.error("Error in getSupportedLanguages:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

/**
 * Translate text endpoint
 */
export const translateMessage = async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage = 'auto' } = req.body;
    const userId = req.user._id;

    // Validation
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: "Text is required for translation"
      });
    }

    if (!targetLanguage) {
      return res.status(400).json({
        success: false,
        error: "Target language is required"
      });
    }

    if (!SUPPORTED_LANGUAGES[targetLanguage]) {
      return res.status(400).json({
        success: false,
        error: `Unsupported target language: ${targetLanguage}. Use /api/translation/languages to get supported languages.`
      });
    }

    // Get user's custom OpenAI API key if they have one
    const userApiKey = await UserSettings.getUserApiKey(userId);

    // Perform translation with user's API key (if available)
    const result = await translateText(text, targetLanguage, sourceLanguage, userApiKey);

    if (result.success) {
      res.status(200).json({
        success: true,
        originalText: text,
        translatedText: result.translatedText,
        sourceLanguage: result.sourceLanguage,
        targetLanguage: result.targetLanguage,
        provider: result.provider,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || "Translation failed",
        provider: result.provider
      });
    }
  } catch (error) {
    console.error("Error in translateMessage:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

/**
 * Detect language of text
 */
export const detectTextLanguage = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: "Text is required for language detection"
      });
    }

    const detectedLanguage = detectLanguage(text);
    const languageName = SUPPORTED_LANGUAGES[detectedLanguage] || 'Unknown';

    res.status(200).json({
      success: true,
      text: text,
      detectedLanguage: detectedLanguage,
      languageName: languageName,
      confidence: 'basic', // Since we're using a basic detection method
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in detectTextLanguage:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

/**
 * Batch translate multiple texts
 */
export const batchTranslate = async (req, res) => {
  try {
    const { texts, targetLanguage, sourceLanguage = 'auto', provider = 'openai' } = req.body;

    // Validation
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Texts array is required for batch translation"
      });
    }

    if (texts.length > 10) {
      return res.status(400).json({
        success: false,
        error: "Maximum 10 texts allowed per batch request"
      });
    }

    if (!targetLanguage) {
      return res.status(400).json({
        success: false,
        error: "Target language is required"
      });
    }

    if (!SUPPORTED_LANGUAGES[targetLanguage]) {
      return res.status(400).json({
        success: false,
        error: `Unsupported target language: ${targetLanguage}`
      });
    }

    // Translate all texts
    const results = await Promise.all(
      texts.map(async (text, index) => {
        if (!text || !text.trim()) {
          return {
            index,
            success: false,
            error: "Empty text provided",
            originalText: text
          };
        }

        const result = await translateText(text, targetLanguage, sourceLanguage, provider);
        return {
          index,
          success: result.success,
          originalText: text,
          translatedText: result.success ? result.translatedText : null,
          error: result.success ? null : result.error,
          provider: result.provider
        };
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    res.status(200).json({
      success: true,
      results: results,
      summary: {
        total: texts.length,
        successful: successCount,
        failed: failureCount
      },
      targetLanguage: targetLanguage,
      sourceLanguage: sourceLanguage,
      provider: provider,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in batchTranslate:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

/**
 * Get translation service status
 */
export const getTranslationStatus = async (req, res) => {
  try {
    // Test both APIs with a simple phrase
    const testText = "Hello, world!";
    const testTargetLang = "es";

    const openaiTest = await translateText(testText, testTargetLang, 'en', 'openai');
    const featherlessTest = await translateText(testText, testTargetLang, 'en', 'featherless');

    res.status(200).json({
      success: true,
      status: {
        openai: {
          available: openaiTest.success,
          error: openaiTest.success ? null : openaiTest.error
        },
        featherless: {
          available: featherlessTest.success,
          error: featherlessTest.success ? null : featherlessTest.error
        }
      },
      supportedLanguages: Object.keys(SUPPORTED_LANGUAGES).length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in getTranslationStatus:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};
