import { translateText, SUPPORTED_LANGUAGES, detectLanguage } from "../services/translation.service.js";
import UserSettings from "../models/UserSettings.js";
import TranslationHistory from "../models/TranslationHistory.js";
import Message from "../models/Message.js";
import { pool } from "../lib/db.js";

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

/**
 * Translate a specific message by ID (manual translation)
 */
export const translateMessageById = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { targetLanguage, sourceLanguage } = req.body;
    const userId = req.user.id;

    console.log(`🌍 Manual translation request: messageId=${messageId}, target=${targetLanguage}, source=${sourceLanguage}`);

    // Get the message
    const messageQuery = 'SELECT * FROM messages WHERE id = $1';
    const messageResult = await pool.query(messageQuery, [messageId]);

    if (messageResult.rows.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }

    const message = messageResult.rows[0];

    // Check if user has access to this message
    if (message.sender_id !== userId && message.receiver_id !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Use original text if available, otherwise use current text
    const textToTranslate = message.original_text || message.text;
    const actualSourceLanguage = sourceLanguage || message.translated_from || 'auto';

    // Get user's custom OpenAI API key if they have one
    const userApiKey = await UserSettings.getUserApiKey(userId);

    // Translate the text
    const translationResult = await translateText(textToTranslate, targetLanguage, actualSourceLanguage, userApiKey);

    if (!translationResult.success) {
      return res.status(500).json({ error: translationResult.error || "Translation failed" });
    }

    // Create translation history entry
    try {
      await TranslationHistory.create({
        userId: userId,
        messageId: parseInt(messageId),
        originalText: textToTranslate,
        translatedText: translationResult.translatedText,
        sourceLanguage: translationResult.sourceLanguage || actualSourceLanguage,
        targetLanguage: targetLanguage,
        translationType: 'manual',
        apiProvider: translationResult.provider || 'openai'
      });
    } catch (historyError) {
      console.error("❌ Failed to create translation history:", historyError);
      // Continue even if history creation fails
    }

    res.json({
      success: true,
      originalText: textToTranslate,
      translatedText: translationResult.translatedText,
      sourceLanguage: translationResult.sourceLanguage || actualSourceLanguage,
      targetLanguage: targetLanguage,
      provider: translationResult.provider
    });

  } catch (error) {
    console.error("❌ Error in translateMessageById:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get translation history for the current user
 */
export const getTranslationHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    console.log(`📚 Fetching translation history for user ${userId}`);

    const history = await TranslationHistory.findByUserId(
      userId,
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      success: true,
      history: history,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: history.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error("❌ Error in getTranslationHistory:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get translation statistics for the current user
 */
export const getTranslationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`📊 Fetching translation stats for user ${userId}`);

    const stats = await TranslationHistory.getTranslationStats(userId);

    // Process stats to create summary
    const summary = {
      totalTranslations: 0,
      autoTranslations: 0,
      manualTranslations: 0,
      uniqueLanguagePairs: stats.length,
      topLanguagePairs: stats.slice(0, 5),
      languageBreakdown: {}
    };

    stats.forEach(stat => {
      summary.totalTranslations += parseInt(stat.language_pair_count);

      if (!summary.languageBreakdown[stat.source_language]) {
        summary.languageBreakdown[stat.source_language] = {};
      }
      summary.languageBreakdown[stat.source_language][stat.target_language] = parseInt(stat.language_pair_count);
    });

    // Get overall counts (this is a simplified version, you might want to optimize this query)
    if (stats.length > 0) {
      summary.autoTranslations = parseInt(stats[0].auto_translations) || 0;
      summary.manualTranslations = parseInt(stats[0].manual_translations) || 0;
    }

    res.json({
      success: true,
      stats: summary
    });

  } catch (error) {
    console.error("❌ Error in getTranslationStats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
