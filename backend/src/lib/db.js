import pkg from 'pg';
const { Pool } = pkg;
import { ENV } from "./env.js";
import UserSettings from "../models/UserSettings.js";
import TranslationHistory from "../models/TranslationHistory.js";

// Create PostgreSQL connection pool
export const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const connectDB = async () => {
  try {
    const { DATABASE_URL } = ENV;
    if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");

    const client = await pool.connect();
    console.log(`PostgreSQL connected to Neon database`);

    // Create tables if they don't exist
    await createTables();

    client.release();
  } catch (error) {
    console.error("PostgreSQL connection error:", error);
    process.exit(1); // 1 status code means fail, 0 means success
  }
};

// Create database tables
const createTables = async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        profile_pic TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Messages table with translation support
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        text TEXT,
        original_text TEXT,
        translated_from VARCHAR(10),
        translated_to VARCHAR(10),
        is_auto_translated BOOLEAN DEFAULT false,
        image BYTEA,
        image_name VARCHAR(255),
        image_type VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver
      ON messages(sender_id, receiver_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_created_at
      ON messages(created_at)
    `);

    // Create user settings table
    await UserSettings.createTable();

    // Create translation history table
    await TranslationHistory.createTable();

    console.log("Database tables created successfully");

    // Run migrations for existing tables
    await runMigrations();
  } catch (error) {
    console.log("Error creating tables:", error);
  }
};

// Migration function to add translation columns to existing messages table
const runMigrations = async () => {
  try {
    console.log("🔄 Running database migrations...");

    // Check if translation columns exist in messages table
    const checkMessageColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'messages'
      AND column_name IN ('original_text', 'translated_from', 'translated_to', 'is_auto_translated')
    `);

    if (checkMessageColumns.rows.length === 0) {
      console.log("📝 Adding translation columns to messages table...");

      // Add translation columns
      await pool.query(`
        ALTER TABLE messages
        ADD COLUMN IF NOT EXISTS original_text TEXT,
        ADD COLUMN IF NOT EXISTS translated_from VARCHAR(10),
        ADD COLUMN IF NOT EXISTS translated_to VARCHAR(10),
        ADD COLUMN IF NOT EXISTS is_auto_translated BOOLEAN DEFAULT false
      `);

      console.log("✅ Translation columns added successfully");
    } else {
      console.log("✅ Translation columns already exist");
    }

    // Check if sound_enabled column exists in user_settings table
    const checkSettingsColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'user_settings'
      AND column_name = 'sound_enabled'
    `);

    if (checkSettingsColumns.rows.length === 0) {
      console.log("📝 Adding sound_enabled column to user_settings table...");

      // Add sound_enabled column
      await pool.query(`
        ALTER TABLE user_settings
        ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT true
      `);

      console.log("✅ Sound settings column added successfully");
    } else {
      console.log("✅ Sound settings column already exists");
    }
  } catch (error) {
    console.error("❌ Error running migrations:", error);
    // Don't throw error for migrations, just log it
  }
};
