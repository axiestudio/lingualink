import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { unsubscribeUser } from '@/lib/push-notifications';

// Unsubscribe user from push notifications
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🔕 Unsubscribing user ${userId} from push notifications`);

    // Remove the subscription
    unsubscribeUser(userId);

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully unsubscribed from push notifications'
    });

  } catch (error) {
    console.error('❌ Error unsubscribing from push notifications:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe from push notifications' }, 
      { status: 500 }
    );
  }
}
