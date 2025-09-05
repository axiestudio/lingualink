import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserConversations, getOrCreateRoom } from '../../actions';

// Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await getUserConversations(userId);

    return NextResponse.json({ 
      success: true, 
      conversations 
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    return NextResponse.json({
      error: 'Failed to get conversations',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
    }

    const room = await getOrCreateRoom(userId, targetUserId);

    return NextResponse.json({ 
      success: true, 
      room 
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({
      error: 'Failed to create conversation',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
