import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sendMessage, getRoomMessages, getOrCreateRoom, getUserLanguage } from '../../actions';
import { getTranslationService } from '@/lib/translation';
import { neon } from '@neondatabase/serverless';
import { getBroadcaster } from '@/lib/realtime-broadcaster';
import { sendInstantMessageNotification } from '@/lib/push-notifications';
import { messagingRateLimit, apiRateLimit, getClientIP, createRateLimitResponse } from '@/lib/rate-limiter';
import { logUnauthorizedAccess, logRateLimitExceeded, logDataAccess } from '@/lib/security-audit';

const sql = neon(process.env.DATABASE_URL!);

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
    console.error('Error verifying room access:', error);
    return false;
  }
}

function sanitizeInput(input: string): string {
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

    // 🔒 SECURITY: Authentication check
    const { userId } = await auth();
    if (!userId) {
      const clientIP = getClientIP(request);
      logUnauthorizedAccess(undefined, clientIP, '/api/messages', request.headers.get('user-agent') || undefined);
      console.log('❌ Unauthorized - no userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🔒 SECURITY: Rate limiting for messaging
    const clientIP = getClientIP(request);
    const rateLimitKey = `${userId}:${clientIP}`;
    const rateLimit = messagingRateLimit.check(rateLimitKey);

    if (!rateLimit.allowed) {
      logRateLimitExceeded(userId, clientIP, '/api/messages', request.headers.get('user-agent') || undefined);
      console.warn(`🚨 Rate limit exceeded for user ${userId} from IP ${clientIP}`);
      return createRateLimitResponse('Too many messages. Please slow down.', rateLimit.resetTime);
    }

    const { roomId, message, receiverId, replyToMessageId, preTranslatedMessage, targetLanguage: clientTargetLanguage } = await request.json();
    console.log('📋 Message send request:', {
      userId,
      roomId: roomId?.substring(0, 20) + '...',
      messageLength: message?.length,
      receiverId: receiverId?.substring(0, 10) + '...',
      hasPreTranslation: !!preTranslatedMessage,
      clientTargetLanguage
    });

    // 🔒 SECURITY: Input validation
    if (!roomId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!validateRoomId(roomId)) {
      return NextResponse.json({ error: 'Invalid room ID format' }, { status: 400 });
    }

    const sanitizedMessage = sanitizeInput(message);
    if (!sanitizedMessage) {
      return NextResponse.json({ error: 'Invalid message content' }, { status: 400 });
    }

    // 🔒 SECURITY: Verify user has access to this room
    const hasAccess = await verifyRoomAccess(userId, roomId);
    if (!hasAccess) {
      console.warn(`🚨 Unauthorized message send attempt: User ${userId} tried to send to room ${roomId}`);
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

        // Only translate if needed
        if (shouldTranslate) {
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

    if (!newMessage) {
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

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

    console.log('📡 Auto-broadcasting message to room:', roomId);

    // Auto-broadcast via Socket.IO (primary) and SSE (fallback)
    try {
      // Socket.IO broadcast (if available)
      if (global.io) {
        console.log('📡 Broadcasting via Socket.IO');
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
        console.log('✅ Socket.IO broadcast completed');
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
      console.log('✅ SSE broadcast completed');
    } catch (sseError) {
      console.error('❌ SSE broadcast failed:', sseError);
    }

    // 🚀 VAPID PUSH NOTIFICATION - GUARANTEED INSTANT DELIVERY!
    console.log('🔔 Sending VAPID push notification for guaranteed delivery...');

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
    // 🔒 SECURITY: Authentication check
    const { userId } = await auth();
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
      console.warn(`🚨 Unauthorized room access attempt: User ${userId} tried to access room ${roomId}`);
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
