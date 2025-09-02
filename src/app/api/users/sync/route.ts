import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '../../../actions';

// Sync user with database
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clerkId, username, email, name, avatarUrl } = await request.json();

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

    return NextResponse.json({ 
      success: true, 
      user 
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json({
      error: 'Failed to sync user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
