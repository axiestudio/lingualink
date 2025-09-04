import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Client } from 'pg';
import { getBroadcaster } from '@/lib/realtime-broadcaster';
import { apiRateLimit, getClientIP, createRateLimitResponse } from '@/lib/rate-limiter';
import { logUnauthorizedAccess, logDataAccess } from '@/lib/security-audit';

// Store active connections with controllers for broadcasting
const connections = new Map<string, {
  client: Client;
  controller: ReadableStreamDefaultController;
  userId: string;
}>();

// Broadcast message to specific users in a room (excluding sender)
export async function broadcastToRoom(roomId: string, messageData: any, senderUserId: string) {
  console.log(`📡 Broadcasting message to room ${roomId} (excluding sender ${senderUserId}):`, messageData);

  try {
    // Get all participants in the room
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);

    const participants = await sql`
      SELECT DISTINCT user_clerk_id
      FROM room_participants
      WHERE room_id = ${roomId}
    `;

    const participantIds = participants.map(p => p.user_clerk_id);
    console.log(`👥 Room participants:`, participantIds);
    console.log(`🔌 Currently connected users:`, Array.from(connections.keys()));
    console.log(`📤 Sender to exclude:`, senderUserId);

    // Send to each participant (except sender) who is connected
    let sentCount = 0;
    participantIds.forEach((participantId) => {
      // Skip the sender
      if (participantId === senderUserId) {
        console.log(`⏭️ Skipping sender: ${participantId}`);
        return;
      }

      const connection = connections.get(participantId);
      if (connection) {
        try {
          const eventData = `data: ${JSON.stringify({
            type: 'new_message',
            payload: messageData
          })}\n\n`;

          connection.controller.enqueue(new TextEncoder().encode(eventData));
          console.log(`📤 Message delivered to user: ${participantId}`);
          sentCount++;
        } catch (error) {
          console.error(`❌ Failed to send message to user ${participantId}:`, error);
          // Remove broken connection
          connections.delete(participantId);
        }
      } else {
        console.log(`📴 User ${participantId} not connected`);
      }
    });

    console.log(`✅ Message broadcast complete: ${sentCount}/${participantIds.length - 1} recipients`);

  } catch (error) {
    console.error('❌ Error broadcasting message:', error);
  }
}

export async function GET(request: NextRequest) {
  // TEMPORARILY DISABLED - SSE endpoint disabled to prevent flooding during Socket.IO transition
  console.log('⚠️ SSE endpoint temporarily disabled - using Socket.IO instead');
  return new Response('SSE endpoint temporarily disabled - using Socket.IO instead', {
    status: 503,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });

  /*
  try {
    // 🔒 SECURITY: Authentication check
    const { userId } = await auth();
    if (!userId) {
      const clientIP = getClientIP(request);
      logUnauthorizedAccess(undefined, clientIP, '/api/realtime', request.headers.get('user-agent') || undefined);
      return new Response('Unauthorized', { status: 401 });
    }

    // 🔒 SECURITY: Rate limiting for realtime connections
    const clientIP = getClientIP(request);
    const rateLimitKey = `realtime:${userId}:${clientIP}`;
    const rateLimit = apiRateLimit.check(rateLimitKey);

    if (!rateLimit.allowed) {
      console.warn(`🚨 Realtime rate limit exceeded for user ${userId} from IP ${clientIP}`);
      return createRateLimitResponse('Too many realtime connection requests. Please try again later.', rateLimit.resetTime);
    }

    // 🔒 SECURITY: Log realtime access
    logDataAccess(userId, clientIP, 'realtime-connection', 'CONNECT', request.headers.get('user-agent') || undefined);

    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      start(controller) {
        // Create PostgreSQL client for this connection
        const client = new Client({
          connectionString: process.env.DATABASE_URL,
        });

        // Connect and set up listeners
        client.connect().then(() => {
          console.log(`🔌 Real-time connection established for user: ${userId}`);

          // Listen to message notifications
          client.query('LISTEN new_message');
          client.query('LISTEN user_status');
          client.query('LISTEN user_profile_updated');

          // Handle notifications
          client.on('notification', (msg) => {
            try {
              const data = {
                type: msg.channel,
                payload: JSON.parse(msg.payload || '{}'),
                timestamp: new Date().toISOString()
              };

              // Send to client via Server-Sent Events
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
              );
            } catch (error) {
              console.error('Error processing notification:', error);
            }
          });

          // 🔒 SECURITY: Handle connection errors safely
          let isControllerClosed = false;

          client.on('error', (error) => {
            console.error('PostgreSQL client error:', error);
            if (!isControllerClosed) {
              try {
                controller.close();
                isControllerClosed = true;
              } catch (closeError) {
                console.warn('Controller already closed:', closeError);
              }
            }
          });

          // Store connection for cleanup and broadcasting
          connections.set(userId, { client, controller, userId });

          // Add to broadcaster for real-time messaging
          const broadcaster = getBroadcaster();
          broadcaster.addConnection(userId, controller);

          // 🔒 SECURITY: Send initial connection confirmation safely
          if (!isControllerClosed) {
            try {
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({
                  type: 'connected',
                  payload: { userId, timestamp: new Date().toISOString() }
                })}\n\n`)
              );
            } catch (enqueueError) {
              console.warn('Failed to send connection confirmation:', enqueueError);
              isControllerClosed = true;
            }
          }
        }).catch((error) => {
          console.error('Failed to connect to PostgreSQL:', error);
          controller.error(error);
        });
      },

      cancel() {
        // 🔒 SECURITY: Clean up connection safely
        const connection = connections.get(userId);
        if (connection) {
          try {
            connection.client.end();
          } catch (clientError) {
            console.warn('Error closing PostgreSQL client in cancel:', clientError);
          }

          connections.delete(userId);

          // Remove from broadcaster safely
          try {
            const broadcaster = getBroadcaster();
            broadcaster.removeConnection(userId);
          } catch (broadcasterError) {
            console.warn('Error removing from broadcaster in cancel:', broadcasterError);
          }

          console.log(`🔌 Real-time connection closed for user: ${userId}`);
          console.log(`📊 Total connections: ${connections.size}`);
        }
      }
    });

    // Return Server-Sent Events response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });

  } catch (error) {
    console.error('Real-time connection error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Handle connection cleanup on route change
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const connection = connections.get(userId);
    if (connection) {
      connection.client.end();
      connections.delete(userId);

      // Remove from broadcaster
      const broadcaster = getBroadcaster();
      broadcaster.removeConnection(userId);

      console.log(`🔌 Real-time connection manually closed for user: ${userId}`);
    }

    return new Response('Connection closed', { status: 200 });
  } catch (error) {
    console.error('Error closing connection:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
  */
}
