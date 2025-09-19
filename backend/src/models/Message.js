import { pool } from "../lib/db.js";

class Message {
  // Create a new message
  static async create({ senderId, receiverId, text, image, imageName, imageType }) {
    const query = `
      INSERT INTO messages (sender_id, receiver_id, text, image, image_name, image_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, sender_id, receiver_id, text, image_name, image_type, created_at, updated_at
    `;
    const values = [senderId, receiverId, text, image, imageName, imageType];

    try {
      const result = await pool.query(query, values);
      return this.formatMessage(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Find messages between two users
  static async findBetweenUsers(userId1, userId2) {
    const query = `
      SELECT id, sender_id, receiver_id, text, image_name, image_type, created_at, updated_at
      FROM messages
      WHERE (sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
    `;

    try {
      const result = await pool.query(query, [userId1, userId2]);
      return result.rows.map(message => this.formatMessage(message));
    } catch (error) {
      throw error;
    }
  }

  // Find message by ID (for security validation)
  static async findById(messageId) {
    const query = 'SELECT id, sender_id, receiver_id, text, image_name, image_type, created_at, updated_at FROM messages WHERE id = $1';

    try {
      const result = await pool.query(query, [messageId]);
      return result.rows.length > 0 ? this.formatMessage(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Get image data for a message
  static async getImageData(messageId) {
    const query = 'SELECT image, image_name, image_type FROM messages WHERE id = $1';

    try {
      const result = await pool.query(query, [messageId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Find all users that have chatted with the given user
  static async findChatPartners(userId) {
    const query = `
      SELECT DISTINCT
        CASE
          WHEN sender_id = $1 THEN receiver_id
          ELSE sender_id
        END as partner_id
      FROM messages
      WHERE sender_id = $1 OR receiver_id = $1
    `;

    try {
      const result = await pool.query(query, [userId]);
      return result.rows.map(row => row.partner_id);
    } catch (error) {
      throw error;
    }
  }

  // Format message object to match frontend expectations
  static formatMessage(message) {
    if (!message) return null;

    const formatted = {
      _id: message.id,
      id: message.id,
      senderId: message.sender_id,
      receiverId: message.receiver_id,
      text: message.text,
      createdAt: message.created_at,
      updatedAt: message.updated_at
    };

    // Add image URL if image exists
    if (message.image_name) {
      formatted.image = `/api/messages/image/${message.id}`;
    }

    return formatted;
  }
}

export default Message;
