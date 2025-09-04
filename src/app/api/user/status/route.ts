import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// 🚀 SENIOR DEVELOPER: Proper online status management with Clerk authentication
export async function POST(request: NextRequest) {
  try {
    // Verify Clerk authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid Clerk session' },
        { status: 401 }
      );
    }

    const { status } = await request.json();
    
    if (typeof status !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid status - must be boolean' },
        { status: 400 }
      );
    }

    // Update user online status in database
    await sql`
      UPDATE users
      SET
        is_online = ${status}::boolean,
        last_seen = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE clerk_id = ${userId}::text
    `;

    // Broadcast status change via PostgreSQL NOTIFY
    await sql`
      SELECT pg_notify('user_status'::text, json_build_object(
        'user_id', ${userId}::text,
        'is_online', ${status}::boolean,
        'timestamp', extract(epoch from now())
      )::text)
    `;

    // Also broadcast via Socket.IO if available
    try {
      const { getSocketManager } = await import('../../../../lib/socket-server');
      const socketManager = getSocketManager();
      socketManager.broadcastUserStatus(userId, status);
    } catch (error) {
      console.warn('⚠️ Socket.IO not available for status broadcast:', error);
    }

    console.log(`✅ User ${userId} status updated to: ${status ? 'online' : 'offline'}`);

    return NextResponse.json({
      success: true,
      status: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error updating user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get current user's online status
export async function GET(request: NextRequest) {
  try {
    // Verify Clerk authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid Clerk session' },
        { status: 401 }
      );
    }

    // Get user's current status from database
    const user = await sql`
      SELECT is_online, last_seen, updated_at
      FROM users
      WHERE clerk_id = ${userId}::text
    `;

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = user[0];

    return NextResponse.json({
      success: true,
      is_online: userData.is_online,
      last_seen: userData.last_seen,
      updated_at: userData.updated_at
    });

  } catch (error) {
    console.error('❌ Error getting user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Batch get online status for multiple users
export async function PUT(request: NextRequest) {
  try {
    // Verify Clerk authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid Clerk session' },
        { status: 401 }
      );
    }

    const { userIds } = await request.json();
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid userIds - must be non-empty array' },
        { status: 400 }
      );
    }

    // Get online status for multiple users
    const users = await sql`
      SELECT clerk_id, is_online, last_seen, name, avatar_url
      FROM users
      WHERE clerk_id = ANY(${userIds}::text[])
    `;

    const statusMap = users.reduce((acc: any, user: any) => {
      acc[user.clerk_id] = {
        is_online: user.is_online,
        last_seen: user.last_seen,
        name: user.name,
        avatar_url: user.avatar_url
      };
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      users: statusMap
    });

  } catch (error) {
    console.error('❌ Error getting batch user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
