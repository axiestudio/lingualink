import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { subscribeUser, getVapidPublicKey } from '@/lib/push-notifications';

// Subscribe user to push notifications
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await request.json();
    
    console.log(`🔔 Subscribing user ${userId} to push notifications`);
    console.log(`📋 Subscription:`, subscription);

    // Store the subscription
    subscribeUser(userId, subscription);

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully subscribed to push notifications',
      vapidPublicKey: getVapidPublicKey()
    });

  } catch (error) {
    console.error('❌ Error subscribing to push notifications:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe to push notifications' }, 
      { status: 500 }
    );
  }
}

// Get VAPID public key
export async function GET() {
  try {
    return NextResponse.json({ 
      vapidPublicKey: getVapidPublicKey()
    });
  } catch (error) {
    console.error('❌ Error getting VAPID public key:', error);
    return NextResponse.json(
      { error: 'Failed to get VAPID public key' }, 
      { status: 500 }
    );
  }
}
