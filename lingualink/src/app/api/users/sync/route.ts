import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '../../../actions';
import { getBroadcaster } from '@/lib/realtime-broadcaster';

// Sync user with database
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let requestBody;
    try {
      requestBody = await request.json();
    } catch (jsonError) {
      console.error('Error parsing JSON in user sync:', jsonError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { clerkId, username, email, name, avatarUrl } = requestBody;

    // Verify the clerk ID matches the authenticated user
    if (clerkId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = {
      id: clerkId,
      username,
      emailAddresses: [{ emailAddress: email }],
      firstName: name.split(' ')[0] || '',
      lastName: name.split(' ').slice(1).join(' ') || '',
      imageUrl: avatarUrl
    };

    const user = await getOrCreateUser(userData);

    // 🚀 REAL-TIME PROFILE SYNC: Broadcast profile update to all connected users
    try {
      console.log('📡 Broadcasting profile update for user:', clerkId);

      // Prepare profile update data
      const profileUpdate = {
        user_id: clerkId,
        updates: {
          name: name,
          avatarUrl: avatarUrl,
          username: username,
          email: email
        }
      };

      // Note: We'll use Socket.IO for real-time broadcasting instead of the broadcaster
      // The client will handle the Socket.IO broadcast when this sync completes
      console.log('✅ Profile sync completed, client will handle real-time broadcast');

    } catch (broadcastError) {
      console.error('⚠️ Failed to broadcast profile update (non-critical):', broadcastError);
      // Don't fail the sync if broadcast fails
    }

    return NextResponse.json({
      success: true,
      user,
      profileUpdate: {
        user_id: clerkId,
        updates: {
          name: name,
          avatarUrl: avatarUrl,
          username: username,
          email: email
        }
      }
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json({
      error: 'Failed to sync user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
