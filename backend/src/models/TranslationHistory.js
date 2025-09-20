import { pool } from "../lib/db.js";

class TranslationHistory {
  // Create a new translation history entry
  static async create({ 
    userId, 
    messageId, 
    originalText, 
    translatedText, 
    sourceLanguage, 
    targetLanguage, 
    translationType, // 'auto' or 'manual'
    apiProvider = 'openai' 
  }) {
    const query = `
      INSERT INTO translation_history (
        user_id, message_id, original_text, translated_text, 
        source_language, target_language, translation_type, api_provider
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, user_id, message_id, original_text, translated_text, 
                source_language, target_language, translation_type, api_provider, created_at
    `;
    const values = [
      userId, messageId, originalText, translatedText, 
      sourceLanguage, targetLanguage, translationType, apiProvider
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("❌ Error creating translation history:", error);
      throw error;
    }
  }

  // Get translation history for a user
  static async findByUserId(userId, limit = 50, offset = 0) {
    const query = `
      SELECT th.*, m.text as message_text, m.created_at as message_created_at
      FROM translation_history th
      LEFT JOIN messages m ON th.message_id = m.id
      WHERE th.user_id = $1
      ORDER BY th.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    try {
      const result = await pool.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      console.error("❌ Error fetching translation history:", error);
      throw error;
    }
  }

  // Get translation statistics for a user
  static async getTranslationStats(userId) {
    const query = `
      SELECT 
        COUNT(*) as total_translations,
        COUNT(CASE WHEN translation_type = 'auto' THEN 1 END) as auto_translations,
        COUNT(CASE WHEN translation_type = 'manual' THEN 1 END) as manual_translations,
        COUNT(DISTINCT source_language) as source_languages_count,
        COUNT(DISTINCT target_language) as target_languages_count,
        source_language,
        target_language,
        COUNT(*) as language_pair_count
      FROM translation_history 
      WHERE user_id = $1
      GROUP BY source_language, target_language
      ORDER BY language_pair_count DESC
    `;

    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error("❌ Error fetching translation stats:", error);
      throw error;
    }
  }

  // Create translation history table
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS translation_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
        original_text TEXT NOT NULL,
        translated_text TEXT NOT NULL,
        source_language VARCHAR(10) NOT NULL,
        target_language VARCHAR(10) NOT NULL,
        translation_type VARCHAR(10) NOT NULL CHECK (translation_type IN ('auto', 'manual')),
        api_provider VARCHAR(20) DEFAULT 'openai',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
      await pool.query(query);
      
      // Create indexes for better performance
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_translation_history_user_id 
        ON translation_history(user_id)
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_translation_history_message_id 
        ON translation_history(message_id)
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_translation_history_languages 
        ON translation_history(source_language, target_language)
      `);
      
      console.log("✅ Translation history table created successfully");
    } catch (error) {
      console.error("❌ Error creating translation history table:", error);
      throw error;
    }
  }
}

export default TranslationHistory;
