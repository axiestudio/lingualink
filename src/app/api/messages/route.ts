import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getTranslationService } from '@/lib/translation';
import { neon } from '@neondatabase/serverless';
import { getBroadcaster } from '@/lib/realtime-broadcaster';
import { sendInstantMessageNotification } from '@/lib/push-notifications';
import { messagingRateLimit, apiRateLimit, getClientIP, createRateLimitResponse } from '@/lib/rate-limiter';
import { logUnauthorizedAccess, logRateLimitExceeded, logDataAccess } from '@/lib/security-audit';
import { secureLogger, SecurityEventType, SecuritySeverity } from '@/lib/secure-logger';


const sql = neon(process.env.DATABASE_URL!);

// 🔒 DATABASE FUNCTIONS (moved from actions.ts for production compatibility)
async function getUserLanguage(userId: string): Promise<string> {
  try {
    const result = await sql`
      SELECT language_preference FROM users
      WHERE clerk_id = ${userId}
      LIMIT 1
    `;
    return result[0]?.language_preference || 'en';
  } catch (error) {
    console.error('Error getting user language:', error);
    return 'en';
  }
}

async function getOrCreateRoom(userId1: string, userId2: string): Promise<string> {
  try {
    // Check if room already exists
    const existingRoom = await sql`
      SELECT r.id FROM rooms r
      JOIN room_participants rp1 ON r.id = rp1.room_id
      JOIN room_participants rp2 ON r.id = rp2.room_id
      WHERE rp1.user_clerk_id = ${userId1}
      AND rp2.user_clerk_id = ${userId2}
      AND r.type = 'direct'
      LIMIT 1
    `;

    if (existingRoom.length > 0) {
      return existingRoom[0].id;
    }

    // Create new room
    const roomId = `room_${Math.random().toString(36).substring(2, 18)}`;

    await sql`
      INSERT INTO rooms (id, name, type, created_by)
      VALUES (${roomId}, 'Direct Message', 'direct', ${userId1})
    `;

    // Add participants
    await sql`
      INSERT INTO room_participants (room_id, user_clerk_id)
      VALUES (${roomId}, ${userId1}), (${roomId}, ${userId2})
    `;

    return roomId;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
}

async function sendMessage(
  roomId: string,
  userId: string,
  content: string,
  translatedContent?: string,
  targetLanguage?: string,
  replyToMessageId?: string
) {
  try {
    const messageId = `msg_${Math.random().toString(36).substring(2, 18)}`;

    const result = await sql`
      INSERT INTO messages (
        id, room_id, user_clerk_id, content, translated_content,
        target_language, reply_to_message_id, created_at
      )
      VALUES (
        ${messageId}, ${roomId}, ${userId}, ${content},
        ${translatedContent || null}, ${targetLanguage || null},
        ${replyToMessageId || null}, NOW()
      )
      RETURNING *
    `;

    return result[0];
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

async function getRoomMessages(roomId: string, limit: number = 50) {
  try {
    const messages = await sql`
      SELECT
        m.*,
        u.first_name,
        u.last_name,
        u.image_url,
        u.username,
        reply_msg.content as reply_to_content,
        reply_user.first_name as reply_to_first_name,
        reply_user.last_name as reply_to_last_name
      FROM messages m
      LEFT JOIN users u ON m.user_clerk_id = u.clerk_id
      LEFT JOIN messages reply_msg ON m.reply_to_message_id = reply_msg.id
      LEFT JOIN users reply_user ON reply_msg.user_clerk_id = reply_user.clerk_id
      WHERE m.room_id = ${roomId}
      ORDER BY m.created_at DESC
      LIMIT ${limit}
    `;

    return messages.reverse();
  } catch (error) {
    console.error('Error getting room messages:', error);
    throw error;
  }
}

// 🔒 SECURITY FUNCTIONS
async function verifyRoomAccess(userId: string, roomId: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT 1 FROM room_participants
      WHERE room_id = ${roomId} AND user_clerk_id = ${userId}
      LIMIT 1
    `;
    return result.length > 0;
  } catch (error) {
    secureLogger.logCriticalSecurity(
      SecurityEventType.SYSTEM_ERROR,
      'Database error during room access verification',
      { error: 'DB_ERROR' }
    );
    return false;
  }
}

function sanitizeMessageInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  // Remove potentially dangerous characters and limit length
  return input.trim().substring(0, 1000).replace(/[<>]/g, '');
}

function validateRoomId(roomId: string): boolean {
  // Room ID should match secure pattern: room_[16-char-hex] or legacy pattern
  const securePattern = /^room_[a-f0-9]{16}$/;
  const legacyPattern = /^room_user_[a-zA-Z0-9_]+_user_[a-zA-Z0-9_]+$/;
  return securePattern.test(roomId) || legacyPattern.test(roomId);
}

// Send a message
export async function POST(request: NextRequest) {
  try {
    console.log('📨 POST /api/messages - Message send request received');

    // 🔒 SECURITY: Authentication check with error handling
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (authError) {
      console.error('❌ Clerk authentication error:', authError);
      const clientIP = getClientIP(request);
      logUnauthorizedAccess(undefined, clientIP, '/api/messages', request.headers.get('user-agent') || undefined);
      secureLogger.logWarningSecurity(
        SecurityEventType.AUTHENTICATION_FAILURE,
        'Clerk authentication failed',
        { error: authError instanceof Error ? authError.message : 'Unknown auth error' }
      );
      return NextResponse.json({
        error: 'Authentication service unavailable',
        details: 'Please try again later'
      }, { status: 503 });
    }

    if (!userId) {
      const clientIP = getClientIP(request);
      logUnauthorizedAccess(undefined, clientIP, '/api/messages', request.headers.get('user-agent') || undefined);
      secureLogger.logWarningSecurity(
        SecurityEventType.AUTHENTICATION_FAILURE,
        'Unauthorized message send attempt - no user ID'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🔒 SECURITY: Rate limiting for messaging
    const clientIP = getClientIP(request);
    const rateLimitKey = `${userId}:${clientIP}`;
    const rateLimit = messagingRateLimit.check(rateLimitKey);

    if (!rateLimit.allowed) {
      logRateLimitExceeded(userId, clientIP, '/api/messages', request.headers.get('user-agent') || undefined);
      secureLogger.logWarningSecurity(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        'Message rate limit exceeded',
        {
          userId: userId.substring(0, 8) + '***',
          clientIP: clientIP?.substring(0, 8) + '***'
        }
      );
      return createRateLimitResponse('Too many messages. Please slow down.', rateLimit.resetTime);
    }

    const { roomId, message, receiverId, replyToMessageId, preTranslatedMessage, targetLanguage: clientTargetLanguage } = await request.json();


    // 🔒 SECURITY: Input validation
    if (!roomId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!validateRoomId(roomId)) {
      return NextResponse.json({ error: 'Invalid room ID format' }, { status: 400 });
    }

    const sanitizedMessage = sanitizeMessageInput(message);
    if (!sanitizedMessage) {
      return NextResponse.json({ error: 'Invalid message content' }, { status: 400 });
    }

    // 🔒 SECURITY: Verify user has access to this room
    const hasAccess = await verifyRoomAccess(userId, roomId);
    if (!hasAccess) {

      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // If receiverId is provided, ensure room exists
    if (receiverId) {
      await getOrCreateRoom(userId, receiverId);
    }

    // Handle translation - use pre-translated if available, otherwise translate server-side
    let translatedMessage = preTranslatedMessage; // Use client-provided translation if available
    let targetLanguage = clientTargetLanguage;

    if (receiverId && !preTranslatedMessage) {
      try {
        console.log('🔄 Getting room participants and language preferences...');

        // Get all participants in the room to determine if it's a group
        const participants = await sql`
          SELECT DISTINCT user_clerk_id FROM room_participants WHERE room_id = ${roomId}
        `;

        const isGroupRoom = participants.length > 2;
        let targetLanguage = 'en'; // Default to English for groups
        let senderLanguage = await getUserLanguage(userId);
        let shouldTranslate = false;

        if (isGroupRoom) {
          console.log(`👥 Group room detected (${participants.length} participants) - translating to English`);
          shouldTranslate = senderLanguage !== 'en'; // Translate to English if sender isn't English
          targetLanguage = 'en';
        } else {
          // 1-on-1 conversation: use receiver's language preference
          const receiverLanguage = await getUserLanguage(receiverId);
          targetLanguage = receiverLanguage;
          shouldTranslate = receiverLanguage !== senderLanguage;

          console.log(`💬 1-on-1 conversation:`, {
            senderId: userId,
            senderLanguage,
            receiverId,
            receiverLanguage,
            willTranslate: shouldTranslate
          });
        }

        // 🚀 SENIOR DEVELOPER: Enhanced translation logic with file message detection
        // Check if this is a file message (should NOT be translated)
        const isFileMessage = sanitizedMessage.startsWith('📎 Shared a file:') ||
                             sanitizedMessage.includes('📁') ||
                             sanitizedMessage.includes('🖼️') ||
                             sanitizedMessage.includes('🎵') ||
                             sanitizedMessage.includes('🎬');

        // Only translate if needed AND it's not a file message
        if (shouldTranslate && !isFileMessage) {
          console.log('🔄 Languages differ, translating message server-side...');
          const translationService = getTranslationService();
          const result = await translationService.translateText(
            sanitizedMessage,
            targetLanguage,
            senderLanguage
          );

          translatedMessage = result.translatedText;

          console.log(`✅ Message translated successfully:`, {
            from: senderLanguage,
            to: targetLanguage,
            isGroup: isGroupRoom,
            translator: result.translator,
            messageLength: sanitizedMessage.length,
            translatedLength: translatedMessage.length
          });
        } else if (isFileMessage) {
          console.log('📎 File message detected - skipping translation');
          translatedMessage = sanitizedMessage; // Keep original file message
        } else {
          console.log('ℹ️ Same language detected, no translation needed');
        }
      } catch (translationError) {
        console.warn('⚠️ Translation failed, sending original message:', translationError);
        // Continue without translation if it fails
      }
    } else if (preTranslatedMessage) {
      console.log('✅ Using client-provided pre-translated message');
    }

    const newMessage = await sendMessage(roomId, userId, sanitizedMessage, translatedMessage, targetLanguage, replyToMessageId);

    // Get sender info for real-time broadcast
    const senderInfo = await sql`
      SELECT username, name, avatar_url
      FROM users
      WHERE clerk_id = ${userId}
    `;

    // Prepare message for real-time broadcast with sender info
    const messageForBroadcast = {
      ...newMessage,
      username: senderInfo[0]?.username || 'Unknown',
      sender_name: senderInfo[0]?.name || 'Unknown',
      sender_avatar: senderInfo[0]?.avatar_url || '',
      sender_clerk_id: userId
    };



    // Auto-broadcast via Socket.IO (primary) and SSE (fallback)
    try {
      // Socket.IO broadcast (if available)
      if (global.io) {

        global.io.to(`room_${roomId}`).except(`user_${userId}`).emit('new_message', {
          type: 'new_message',
          payload: {
            room_id: roomId,
            message_id: newMessage.id,
            sender_id: userId,
            message: newMessage.message,
            translated_message: newMessage.translated_message,
            target_language: newMessage.target_language,
            created_at: newMessage.created_at,
            username: messageForBroadcast.username,
            sender_name: messageForBroadcast.sender_name,
            sender_avatar: messageForBroadcast.sender_avatar,
            auto_triggered: true
          },
          timestamp: new Date().toISOString()
        });

      }
    } catch (socketError) {
      console.error('❌ Socket.IO broadcast failed:', socketError);
    }

    // SSE broadcast (fallback for backward compatibility)
    try {
      const broadcaster = getBroadcaster();
      await broadcaster.broadcastToRoom(roomId, {
        room_id: roomId,
        message_id: newMessage.id,
        sender_id: userId,
        message: newMessage.message,
        translated_message: newMessage.translated_message,
        target_language: newMessage.target_language,
        created_at: newMessage.created_at,
        sender_name: senderInfo[0]?.name || 'Unknown',
        sender_avatar: senderInfo[0]?.avatar_url || '',
        auto_triggered: true
      }, userId);

    } catch (sseError) {
      console.error('❌ SSE broadcast failed:', sseError);
    }

    // 🚀 VAPID PUSH NOTIFICATION - GUARANTEED INSTANT DELIVERY!


    // Get room participants to send push notifications
    const participants = await sql`
      SELECT DISTINCT user_clerk_id
      FROM room_participants
      WHERE room_id = ${roomId} AND user_clerk_id != ${userId}
    `;

    // Send VAPID push notification to each recipient
    const pushPromises = participants.map(async (participant: any) => {
      const recipientId = participant.user_clerk_id;
      console.log(`🔔 Sending push notification to: ${recipientId}`);

      try {
        const success = await sendInstantMessageNotification(
          recipientId,
          senderInfo[0]?.name || 'Someone',
          newMessage.message,
          newMessage.translated_message,
          roomId
        );

        if (success) {
          console.log(`✅ Push notification sent to ${recipientId}`);
        } else {
          console.log(`📴 Push notification failed for ${recipientId} (not subscribed)`);
        }
      } catch (error) {
        console.error(`❌ Push notification error for ${recipientId}:`, error);
      }
    });

    // Execute all push notifications in parallel
    await Promise.allSettled(pushPromises);
    console.log('🎉 All push notifications processed!');

    return NextResponse.json({
      success: true,
      message: messageForBroadcast
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({
      error: 'Failed to send message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get messages for a room
export async function GET(request: NextRequest) {
  try {
    // 🔒 SECURITY: Authentication check with error handling
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (authError) {
      console.error('❌ Clerk authentication error in GET:', authError);
      return NextResponse.json({
        error: 'Authentication service unavailable',
        details: 'Please try again later'
      }, { status: 503 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🔒 SECURITY: Rate limiting for API calls
    const clientIP = getClientIP(request);
    const rateLimitKey = `api:${userId}:${clientIP}`;
    const rateLimit = apiRateLimit.check(rateLimitKey);

    if (!rateLimit.allowed) {
      console.warn(`🚨 API rate limit exceeded for user ${userId} from IP ${clientIP}`);
      return createRateLimitResponse('Too many API requests. Please try again later.', rateLimit.resetTime);
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 messages

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    // 🔒 SECURITY: Verify user has access to this room
    const hasAccess = await verifyRoomAccess(userId, roomId);
    if (!hasAccess) {
      logUnauthorizedAccess(userId, clientIP, `room:${roomId}`, request.headers.get('user-agent') || undefined);
      secureLogger.logCriticalSecurity(
        SecurityEventType.AUTHORIZATION_FAILURE,
        'Unauthorized room access attempt blocked',
        {
          userId: userId.substring(0, 8) + '***',
          roomId: roomId.substring(0, 12) + '***',
          action: 'BLOCKED'
        }
      );
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 🔒 SECURITY: Log data access
    logDataAccess(userId, clientIP, `messages:${roomId}`, 'READ', request.headers.get('user-agent') || undefined);

    const messages = await getRoomMessages(roomId, limit);

    return NextResponse.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    return NextResponse.json({
      error: 'Failed to get messages',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
