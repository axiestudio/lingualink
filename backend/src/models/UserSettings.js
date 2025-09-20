import { pool } from "../lib/db.js";

class UserSettings {
  /**
   * Get user settings by user ID
   */
  static async getByUserId(userId) {
    const query = `
      SELECT 
        user_id,
        preferred_language,
        auto_translate_enabled,
        openai_api_key,
        created_at,
        updated_at
      FROM user_settings 
      WHERE user_id = $1
    `;

    try {
      const result = await pool.query(query, [userId]);
      
      if (result.rows.length > 0) {
        return this.formatSettings(result.rows[0]);
      }
      
      // Return default settings if none exist
      return {
        userId: userId,
        preferredLanguage: 'en',
        autoTranslateEnabled: false,
        openaiApiKey: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create or update user settings
   */
  static async upsert(userId, settings) {
    const query = `
      INSERT INTO user_settings (
        user_id,
        preferred_language,
        auto_translate_enabled,
        sound_enabled,
        openai_api_key,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET
        preferred_language = EXCLUDED.preferred_language,
        auto_translate_enabled = EXCLUDED.auto_translate_enabled,
        sound_enabled = EXCLUDED.sound_enabled,
        openai_api_key = EXCLUDED.openai_api_key,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [
        userId,
        settings.preferredLanguage || 'en',
        settings.autoTranslateEnabled || false,
        settings.soundEnabled !== undefined ? settings.soundEnabled : true,
        settings.openaiApiKey || null
      ]);

      return this.formatSettings(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update specific setting
   */
  static async updateSetting(userId, settingName, value) {
    const allowedSettings = ['preferred_language', 'auto_translate_enabled', 'openai_api_key'];
    
    if (!allowedSettings.includes(settingName)) {
      throw new Error(`Invalid setting name: ${settingName}`);
    }

    const query = `
      INSERT INTO user_settings (user_id, ${settingName}, updated_at) 
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        ${settingName} = EXCLUDED.${settingName},
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [userId, value]);
      return this.formatSettings(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete user settings
   */
  static async deleteByUserId(userId) {
    const query = 'DELETE FROM user_settings WHERE user_id = $1';

    try {
      await pool.query(query, [userId]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's OpenAI API key (for translation service)
   */
  static async getUserApiKey(userId) {
    const query = 'SELECT openai_api_key FROM user_settings WHERE user_id = $1';

    try {
      const result = await pool.query(query, [userId]);
      
      if (result.rows.length > 0 && result.rows[0].openai_api_key) {
        return result.rows[0].openai_api_key;
      }
      
      return null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Format settings object
   */
  static formatSettings(row) {
    return {
      userId: row.user_id,
      preferredLanguage: row.preferred_language,
      autoTranslateEnabled: row.auto_translate_enabled,
      soundEnabled: row.sound_enabled,
      openaiApiKey: row.openai_api_key,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Create user settings table
   */
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        preferred_language VARCHAR(10) DEFAULT 'en',
        auto_translate_enabled BOOLEAN DEFAULT false,
        sound_enabled BOOLEAN DEFAULT true,
        openai_api_key TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `;

    try {
      await pool.query(query);
      
      // Create index for faster lookups
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_user_settings_user_id 
        ON user_settings(user_id)
      `);
      
      console.log("✅ User settings table created successfully");
    } catch (error) {
      console.error("❌ Error creating user settings table:", error);
      throw error;
    }
  }
}

export default UserSettings;
