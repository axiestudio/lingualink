import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { neon } from '@neondatabase/serverless';

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

function validateRoomId(roomId: string): boolean {
  const securePattern = /^room_[a-f0-9]{16}$/;
  const legacyPattern = /^room_user_[a-zA-Z0-9_]+_user_[a-zA-Z0-9_]+$/;
  return securePattern.test(roomId) || legacyPattern.test(roomId);
}

// Get participants in a room
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId } = await params;

    // 🔒 SECURITY: Validate room ID format
    if (!validateRoomId(roomId)) {
      return NextResponse.json({ error: 'Invalid room ID format' }, { status: 400 });
    }

    // 🔒 SECURITY: Verify user has access to this room
    const hasAccess = await verifyRoomAccess(userId, roomId);
    if (!hasAccess) {
      console.warn(`🚨 Unauthorized participants access attempt: User ${userId} tried to access room ${roomId}`);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all participants in the room
    const participants = await sql`
      SELECT
        rp.user_clerk_id,
        u.username,
        u.name,
        u.avatar_url,
        u.language,
        u.is_online,
        u.last_seen
      FROM room_participants rp
      JOIN users u ON rp.user_clerk_id = u.clerk_id
      WHERE rp.room_id = ${roomId}
      ORDER BY u.name
    `;

    console.log(`📋 Room ${roomId} has ${participants.length} participants`);

    return NextResponse.json({
      success: true,
      roomId,
      participantCount: participants.length,
      isGroup: participants.length > 2,
      participants: participants.map(p => ({
        userId: p.user_clerk_id,
        username: p.username,
        name: p.name,
        avatarUrl: p.avatar_url,
        language: p.language,
        isOnline: p.is_online,
        lastSeen: p.last_seen
      }))
    });
  } catch (error) {
    console.error('Error getting room participants:', error);
    return NextResponse.json({
      error: 'Failed to get room participants',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
