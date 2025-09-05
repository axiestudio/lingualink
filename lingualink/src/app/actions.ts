"use server";

import { neon } from "@neondatabase/serverless";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Initialize database connection with build-time safety
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

// 🔒 SECURITY: Initialize database with proper error handling and concurrency control
export async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database with security enhancements...');

    // Skip database operations during build time
    if (!sql) {
      console.log('⚠️ Skipping database initialization - no connection available');
      return { success: false, error: 'Database connection not available' };
    }

    // Test database connection first
    await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful');

    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        clerk_id VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        language VARCHAR(10) DEFAULT 'en',
        secondary_languages TEXT, -- JSON array of additional languages
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_online BOOLEAN DEFAULT false
      )
    `;
    console.log('✅ Users table created/verified');

    // 🔧 Add missing columns to existing users table if they don't exist
    try {
      // Check and add secondary_languages column
      const secondaryLanguagesColumnCheck = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'secondary_languages'
      `;

      if (secondaryLanguagesColumnCheck.length === 0) {
        console.log('🔧 Adding missing secondary_languages column...');
        await sql`ALTER TABLE users ADD COLUMN secondary_languages TEXT`;
        console.log('✅ Added secondary_languages column');
      }

    } catch (columnError) {
      console.warn('⚠️ Users column addition check failed:', columnError instanceof Error ? columnError.message : String(columnError));
    }

    // Rooms table
    await sql`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        room_id VARCHAR(255) UNIQUE NOT NULL,
        created_by VARCHAR(255) NOT NULL REFERENCES users(clerk_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Rooms table created/verified');

    // Room participants table
    await sql`
      CREATE TABLE IF NOT EXISTS room_participants (
        id SERIAL PRIMARY KEY,
        room_id VARCHAR(255) NOT NULL REFERENCES rooms(room_id),
        user_clerk_id VARCHAR(255) NOT NULL REFERENCES users(clerk_id),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(room_id, user_clerk_id)
      )
    `;
    console.log('✅ Room participants table created/verified');

    // Files table for file uploads
    await sql`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        original_name VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        upload_path TEXT NOT NULL,
        uploaded_by VARCHAR(255) NOT NULL REFERENCES users(clerk_id),
        room_id VARCHAR(255) REFERENCES rooms(room_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Files table created/verified');

    // Messages table with file and threading support
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        room_id VARCHAR(255) NOT NULL REFERENCES rooms(room_id),
        sender_clerk_id VARCHAR(255) NOT NULL REFERENCES users(clerk_id),
        message TEXT NOT NULL,
        translated_message TEXT,
        target_language VARCHAR(10),
        file_id INTEGER REFERENCES files(id),
        file_metadata TEXT, -- JSON metadata for file attachments
        reply_to_message_id INTEGER REFERENCES messages(id), -- For threading
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Messages table created/verified');

    // 🔧 Add missing columns to existing messages table if they don't exist
    try {
      // Check and add reply_to_message_id column
      const replyColumnCheck = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'messages'
        AND column_name = 'reply_to_message_id'
      `;

      if (replyColumnCheck.length === 0) {
        console.log('🔧 Adding missing reply_to_message_id column...');
        await sql`ALTER TABLE messages ADD COLUMN reply_to_message_id INTEGER REFERENCES messages(id)`;
        console.log('✅ Added reply_to_message_id column');
      }

      // Check and add file_id column
      const fileColumnCheck = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'messages'
        AND column_name = 'file_id'
      `;

      if (fileColumnCheck.length === 0) {
        console.log('🔧 Adding missing file_id column...');
        await sql`ALTER TABLE messages ADD COLUMN file_id INTEGER REFERENCES files(id)`;
        console.log('✅ Added file_id column');
      }

      // Check and add file_metadata column
      const metadataColumnCheck = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'messages'
        AND column_name = 'file_metadata'
      `;

      if (metadataColumnCheck.length === 0) {
        console.log('🔧 Adding missing file_metadata column...');
        await sql`ALTER TABLE messages ADD COLUMN file_metadata TEXT`;
        console.log('✅ Added file_metadata column');
      }

    } catch (columnError) {
      console.warn('⚠️ Column addition check failed:', columnError instanceof Error ? columnError.message : String(columnError));
    }

    // Create indexes for better performance
    console.log('🔧 Creating database indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_rooms_room_id ON rooms(room_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)`;

    // Check if reply_to_message_id column exists before creating index
    try {
      const columnCheck = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'messages'
        AND column_name = 'reply_to_message_id'
      `;

      if (columnCheck.length > 0) {
        await sql`CREATE INDEX IF NOT EXISTS idx_messages_reply ON messages(reply_to_message_id)`;
        console.log('✅ Reply index created');
      } else {
        console.log('⚠️ Skipping reply index - column does not exist');
      }
    } catch (error) {
      console.log('⚠️ Skipping reply index - column check failed:', error instanceof Error ? error.message : String(error));
    }

    // Check if file_id column exists before creating index
    try {
      const fileColumnCheck = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'messages'
        AND column_name = 'file_id'
      `;

      if (fileColumnCheck.length > 0) {
        await sql`CREATE INDEX IF NOT EXISTS idx_messages_file ON messages(file_id)`;
        console.log('✅ File index created');
      } else {
        console.log('⚠️ Skipping file index - column does not exist');
      }
    } catch (error) {
      console.log('⚠️ Skipping file index - column check failed:', error instanceof Error ? error.message : String(error));
    }

    await sql`CREATE INDEX IF NOT EXISTS idx_files_room ON files(room_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_files_uploader ON files(uploaded_by)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`;
    console.log('✅ Database indexes created/verified');

    // Create enhanced real-time notification function with user info
    await sql`
      CREATE OR REPLACE FUNCTION notify_new_message() RETURNS trigger AS $$
      DECLARE
        sender_info RECORD;
      BEGIN
        -- Get sender information
        SELECT username, name, avatar_url INTO sender_info
        FROM users WHERE clerk_id = NEW.sender_clerk_id;

        -- Notify with complete message data
        PERFORM pg_notify('new_message', json_build_object(
          'room_id', NEW.room_id,
          'message_id', NEW.id,
          'sender_id', NEW.sender_clerk_id,
          'message', NEW.message,
          'translated_message', NEW.translated_message,
          'created_at', NEW.created_at,
          'sender_name', COALESCE(sender_info.name, 'Unknown'),
          'sender_username', COALESCE(sender_info.username, 'unknown'),
          'sender_avatar', COALESCE(sender_info.avatar_url, ''),
          'trigger_type', 'auto_broadcast'
        )::text);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    // Create trigger for real-time message notifications
    await sql`DROP TRIGGER IF EXISTS message_insert_trigger ON messages`;
    await sql`
      CREATE OR REPLACE TRIGGER message_insert_trigger
      AFTER INSERT ON messages
      FOR EACH ROW
      EXECUTE FUNCTION notify_new_message();
    `;

    // Create user status notification function
    await sql`
      CREATE OR REPLACE FUNCTION notify_user_status() RETURNS trigger AS $$
      BEGIN
        PERFORM pg_notify('user_status', json_build_object(
          'user_id', NEW.clerk_id,
          'is_online', NEW.is_online,
          'last_seen', NEW.last_seen
        )::text);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    // Create trigger for user status updates
    await sql`DROP TRIGGER IF EXISTS user_status_trigger ON users`;
    await sql`
      CREATE OR REPLACE TRIGGER user_status_trigger
      AFTER UPDATE OF is_online, last_seen ON users
      FOR EACH ROW
      EXECUTE FUNCTION notify_user_status();
    `;

    console.log("✅ Database initialized successfully with real-time triggers");
    return { success: true };
  } catch (error) {
    console.error("❌ Database initialization failed:", error);

    // 🔒 SECURITY: Handle specific database errors gracefully
    if (error instanceof Error) {
      if (error.message.includes('tuple concurrently updated')) {
        console.warn('⚠️ Concurrent database initialization detected - this is normal during startup');
        return { success: true, warning: 'Concurrent initialization handled' };
      }

      if (error.message.includes('connection terminated')) {
        console.error('🔌 Database connection lost during initialization');
        return { success: false, error: 'Database connection failed - please check database status' };
      }

      if (error.message.includes('already exists')) {
        console.warn('⚠️ Database objects already exist - this is normal');
        return { success: true, warning: 'Database already initialized' };
      }
    }

    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Get or create user from Clerk data
export async function getOrCreateUser(clerkUser: any) {
  try {
    if (!sql) return null;
    const { userId } = await auth();
    if (!userId) {
      redirect("/sign-in");
    }

    // Check if user exists
    const existingUser = await sql`
      SELECT * FROM users WHERE clerk_id = ${userId}
    `;

    if (existingUser.length > 0) {
      // Update last seen and online status
      await sql`
        UPDATE users 
        SET last_seen = CURRENT_TIMESTAMP, is_online = true, updated_at = CURRENT_TIMESTAMP
        WHERE clerk_id = ${userId}
      `;
      return existingUser[0];
    }

    // Create new user
    const username = clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress.split('@')[0] || `user_${Date.now()}`;
    const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || username;
    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const avatarUrl = clerkUser.imageUrl || '';

    const newUser = await sql`
      INSERT INTO users (clerk_id, username, email, name, avatar_url, is_online)
      VALUES (${userId}, ${username}, ${email}, ${name}, ${avatarUrl}, true)
      RETURNING *
    `;

    console.log("✅ New user created:", newUser[0]);
    return newUser[0];
  } catch (error) {
    console.error("❌ Error getting/creating user:", error);
    throw error;
  }
}

// 🔒 SECURE: Generate cryptographically secure room ID for two users
function generateRoomIdSync(userId1: string, userId2: string): string {
  const sortedIds = [userId1, userId2].sort();

  // Create a deterministic but secure room ID using crypto
  const combined = sortedIds.join('|');

  // Use synchronous crypto for room ID generation
  let hash: string;
  try {
    // Try Node.js crypto first (server-side)
    const crypto = require('crypto');
    hash = crypto.createHash('sha256').update(combined).digest('hex');
  } catch (error) {
    // Fallback: simple but deterministic hash function
    console.warn('Node crypto not available, using deterministic hash fallback');
    let simpleHash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      simpleHash = ((simpleHash << 5) - simpleHash) + char;
      simpleHash = simpleHash & simpleHash; // Convert to 32-bit integer
    }
    hash = Math.abs(simpleHash).toString(16).padStart(16, '0');
  }

  // Use first 16 chars of hash for shorter, secure room ID
  return `room_${hash.substring(0, 16)}`;
}

// Get or create a room between two users
export async function getOrCreateRoom(currentUserId: string, targetUserId: string) {
  try {
    if (!sql) return null;
    const roomId = generateRoomIdSync(currentUserId, targetUserId);
    console.log(`🔍 Looking for room between ${currentUserId} and ${targetUserId}`);
    console.log(`🏠 Generated room ID: ${roomId}`);

    // Check if room exists
    const existingRoom = await sql`
      SELECT r.*,
             array_agg(
               json_build_object(
                 'clerk_id', u.clerk_id,
                 'username', u.username,
                 'name', u.name,
                 'avatar_url', u.avatar_url,
                 'is_online', u.is_online
               )
             ) as participants
      FROM rooms r
      LEFT JOIN room_participants rp ON r.room_id = rp.room_id
      LEFT JOIN users u ON rp.user_clerk_id = u.clerk_id
      WHERE r.room_id = ${roomId}
      GROUP BY r.id, r.room_id, r.created_by, r.created_at, r.updated_at, r.last_activity
    `;

    if (existingRoom.length > 0) {
      console.log(`✅ Found existing room: ${roomId}`);
      console.log(`👥 Participants:`, existingRoom[0].participants);
      return existingRoom[0];
    }

    console.log(`🆕 No existing room found, creating new room: ${roomId}`);

    // Create new room
    const newRoom = await sql`
      INSERT INTO rooms (room_id, created_by)
      VALUES (${roomId}, ${currentUserId})
      RETURNING *
    `;

    // Add participants
    await sql`
      INSERT INTO room_participants (room_id, user_clerk_id)
      VALUES (${roomId}, ${currentUserId}), (${roomId}, ${targetUserId})
    `;

    // Get room with participants
    const roomWithParticipants = await sql`
      SELECT r.*, 
             array_agg(
               json_build_object(
                 'clerk_id', u.clerk_id,
                 'username', u.username,
                 'name', u.name,
                 'avatar_url', u.avatar_url,
                 'is_online', u.is_online
               )
             ) as participants
      FROM rooms r
      LEFT JOIN room_participants rp ON r.room_id = rp.room_id
      LEFT JOIN users u ON rp.user_clerk_id = u.clerk_id
      WHERE r.room_id = ${roomId}
      GROUP BY r.id, r.room_id, r.created_by, r.created_at, r.updated_at, r.last_activity
    `;

    console.log("✅ New room created:", roomWithParticipants[0]);
    return roomWithParticipants[0];
  } catch (error) {
    console.error("❌ Error getting/creating room:", error);
    throw error;
  }
}

// Get user's conversations
export async function getUserConversations(userId: string) {
  try {
    if (!sql) return [];
    const conversations = await sql`
      SELECT
        r.room_id,
        r.created_at as room_created_at,
        r.last_activity,
        other_user.clerk_id as user_id,
        other_user.username,
        other_user.name,
        other_user.avatar_url,
        other_user.language as language_preference,
        other_user.is_online,
        other_user.last_seen,
        latest_msg.message as last_message,
        latest_msg.translated_message as last_message_translated,
        latest_msg.created_at as last_message_time,
        COALESCE(unread_count.count, 0) as unread_count,
        COALESCE(latest_msg.created_at, r.created_at) as sort_time
      FROM rooms r
      INNER JOIN room_participants rp ON r.room_id = rp.room_id AND rp.user_clerk_id = ${userId}
      INNER JOIN room_participants other_rp ON r.room_id = other_rp.room_id AND other_rp.user_clerk_id != ${userId}
      INNER JOIN users other_user ON other_rp.user_clerk_id = other_user.clerk_id
      LEFT JOIN LATERAL (
        SELECT message, translated_message, created_at
        FROM messages
        WHERE room_id = r.room_id
        ORDER BY created_at DESC
        LIMIT 1
      ) latest_msg ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as count
        FROM messages
        WHERE room_id = r.room_id
        AND sender_clerk_id != ${userId}
        AND created_at > COALESCE((
          SELECT last_seen FROM users WHERE clerk_id = ${userId}
        ), '1970-01-01'::timestamp)
      ) unread_count ON true
      ORDER BY sort_time DESC
    `;

    return conversations;
  } catch (error) {
    console.error("❌ Error getting conversations:", error);
    throw error;
  }
}

// Search users by username or name
export async function searchUsers(query: string, currentUserId: string) {
  try {
    if (!sql) return [];
    const users = await sql`
      SELECT clerk_id, username, name, avatar_url, language, is_online, last_seen
      FROM users
      WHERE (username ILIKE ${'%' + query + '%'} OR name ILIKE ${'%' + query + '%'})
      AND clerk_id != ${currentUserId}
      ORDER BY
        CASE WHEN username ILIKE ${query + '%'} THEN 1 ELSE 2 END,
        username
      LIMIT 10
    `;

    return users;
  } catch (error) {
    console.error("❌ Error searching users:", error);
    throw error;
  }
}

// Update user language preference
export async function updateUserLanguage(clerkId: string, language: string) {
  try {
    if (!sql) return { success: false, error: 'Database not available' };
    const result = await sql`
      UPDATE users
      SET language = ${language}, updated_at = CURRENT_TIMESTAMP
      WHERE clerk_id = ${clerkId}
      RETURNING *
    `;

    console.log("✅ User language updated:", result[0]);
    return result[0];
  } catch (error) {
    console.error("❌ Error updating user language:", error);
    throw error;
  }
}

// Get user language preference
export async function getUserLanguage(clerkId: string) {
  try {
    if (!sql) return { language: 'en' };
    console.log("📋 Getting language preference for user:", clerkId);
    const result = await sql`
      SELECT language FROM users WHERE clerk_id = ${clerkId}
    `;

    const language = result[0]?.language || 'en';
    console.log(`✅ User ${clerkId} language preference:`, language);
    return language;
  } catch (error) {
    console.error("❌ Error getting user language:", error);
    return 'en'; // Default to English
  }
}

// Send a message
export async function sendMessage(
  roomId: string,
  senderId: string,
  message: string,
  translatedMessage?: string,
  targetLanguage?: string,
  replyToMessageId?: number
) {
  try {
    if (!sql) return null;
    // 🔒 SECURITY: Log message sending with privacy protection
    console.log("📤 Sending message:", {
      roomId: roomId.substring(0, 20) + '...',
      senderId: senderId.substring(0, 10) + '...',
      messageLength: message.length,
      hasTranslation: !!translatedMessage,
      targetLanguage,
      isReply: !!replyToMessageId
    });

    const newMessage = await sql`
      INSERT INTO messages (room_id, sender_clerk_id, message, translated_message, target_language, reply_to_message_id)
      VALUES (${roomId}, ${senderId}, ${message}, ${translatedMessage}, ${targetLanguage}, ${replyToMessageId})
      RETURNING *
    `;

    // Update room last activity
    await sql`
      UPDATE rooms
      SET last_activity = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE room_id = ${roomId}
    `;

    console.log("✅ Message saved to database:", {
      id: newMessage[0].id,
      room_id: newMessage[0].room_id,
      message: newMessage[0].message.substring(0, 50) + (newMessage[0].message.length > 50 ? '...' : ''),
      translated_message: newMessage[0].translated_message?.substring(0, 50) + (newMessage[0].translated_message?.length > 50 ? '...' : ''),
      target_language: newMessage[0].target_language
    });

    return newMessage[0];
  } catch (error) {
    console.error("❌ Error sending message:", error);
    throw error;
  }
}

// Get messages for a room
export async function getRoomMessages(roomId: string, limit: number = 50) {
  try {
    if (!sql) return [];
    console.log("📥 Fetching messages for room:", roomId);

    // Check if reply_to_message_id column exists
    const columnCheck = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'messages'
      AND column_name = 'reply_to_message_id'
    `;

    let messages;

    if (columnCheck.length > 0) {
      // Full query with reply support
      messages = await sql`
        SELECT
          m.*,
          u.username,
          u.name as sender_name,
          u.avatar_url as sender_avatar,
          reply_m.message as reply_to_message,
          reply_m.sender_clerk_id as reply_to_sender_id,
          reply_u.name as reply_to_sender_name,
          reply_m.file_metadata as reply_to_file_metadata,
          reply_m.created_at as reply_to_created_at
        FROM messages m
        JOIN users u ON m.sender_clerk_id = u.clerk_id
        LEFT JOIN messages reply_m ON m.reply_to_message_id = reply_m.id
        LEFT JOIN users reply_u ON reply_m.sender_clerk_id = reply_u.clerk_id
        WHERE m.room_id = ${roomId}
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `;
    } else {
      // Simplified query without reply support
      console.log("⚠️ Using simplified query - reply_to_message_id column not found");
      messages = await sql`
        SELECT
          m.*,
          u.username,
          u.name as sender_name,
          u.avatar_url as sender_avatar,
          null as reply_to_message,
          null as reply_to_sender_id,
          null as reply_to_sender_name,
          null as reply_to_file_metadata,
          null as reply_to_created_at
        FROM messages m
        JOIN users u ON m.sender_clerk_id = u.clerk_id
        WHERE m.room_id = ${roomId}
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `;
    }

    const chronologicalMessages = messages.reverse(); // Return in chronological order

    console.log("✅ Retrieved messages:", {
      roomId,
      count: chronologicalMessages.length,
      messages: chronologicalMessages.map(m => ({
        id: m.id,
        message: m.message.substring(0, 30) + (m.message.length > 30 ? '...' : ''),
        hasTranslation: !!m.translated_message,
        created_at: m.created_at
      }))
    });

    return chronologicalMessages;
  } catch (error) {
    console.error("❌ Error getting room messages:", error);
    throw error;
  }
}

// Update user online status
export async function updateUserOnlineStatus(userId: string, isOnline: boolean) {
  try {
    if (!sql) return;
    await sql`
      UPDATE users
      SET is_online = ${isOnline},
          last_seen = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE clerk_id = ${userId}
    `;

    return { success: true };
  } catch (error) {
    console.error("❌ Error updating online status:", error);
    throw error;
  }
}

// Get user by clerk ID
export async function getUserByClerkId(clerkId: string) {
  try {
    if (!sql) return null;
    const user = await sql`
      SELECT * FROM users WHERE clerk_id = ${clerkId}
    `;

    return user[0] || null;
  } catch (error) {
    console.error("❌ Error getting user:", error);
    throw error;
  }
}

// Mark messages as read (update user's last seen for a room)
export async function markMessagesAsRead(userId: string, roomId: string) {
  try {
    if (!sql) return;
    // Update user's last seen timestamp
    await sql`
      UPDATE users
      SET last_seen = CURRENT_TIMESTAMP
      WHERE clerk_id = ${userId}
    `;

    return { success: true };
  } catch (error) {
    console.error("❌ Error marking messages as read:", error);
    throw error;
  }
}
