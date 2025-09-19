import pkg from 'pg';
const { Pool } = pkg;
import { ENV } from "./env.js";
import UserSettings from "../models/UserSettings.js";

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

    // Messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        text TEXT,
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

    console.log("Database tables created successfully");
  } catch (error) {
    console.log("Error creating tables:", error);
  }
};
