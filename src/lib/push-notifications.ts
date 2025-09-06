import webpush from 'web-push';

// Configure VAPID keys (optional for development)
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:dev@lingualink.tech';
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

console.log('🔧 Configuring push notifications...');
console.log('📋 VAPID Subject:', vapidSubject);
console.log('📋 VAPID Public Key:', vapidPublicKey ? `${vapidPublicKey.substring(0, 20)}...` : 'NOT SET');
console.log('📋 VAPID Private Key:', vapidPrivateKey ? `${vapidPrivateKey.substring(0, 10)}...` : 'NOT SET');

// Only set VAPID details if keys are provided
if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    console.log('✅ VAPID keys configured for push notifications');
  } catch (error) {
    console.error('❌ Failed to configure VAPID keys:', error);
    console.error('🔍 Check your VAPID keys in .env file');
  }
} else {
  console.warn('⚠️ VAPID keys not configured - push notifications disabled');
  console.warn('🔧 Add NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to .env file');
}

// Store user subscriptions in memory (in production, use database)
const userSubscriptions = new Map<string, PushSubscription>();

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// Subscribe user to push notifications
export function subscribeUser(userId: string, subscription: PushSubscription) {
  userSubscriptions.set(userId, subscription);
  console.log(`🔔 User ${userId} subscribed to push notifications`);
  console.log(`📊 Total subscriptions: ${userSubscriptions.size}`);
}

// Unsubscribe user from push notifications
export function unsubscribeUser(userId: string) {
  userSubscriptions.delete(userId);
  console.log(`🔕 User ${userId} unsubscribed from push notifications`);
  console.log(`📊 Total subscriptions: ${userSubscriptions.size}`);
}

// Send push notification to specific user
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<boolean> {
  // Check if VAPID keys are configured
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('⚠️ Push notifications disabled - VAPID keys not configured');
    return false;
  }

  const subscription = userSubscriptions.get(userId);
  
  if (!subscription) {
    console.log(`📴 No push subscription found for user: ${userId}`);
    return false;
  }

  try {
    console.log(`🚀 Sending push notification to user: ${userId}`);
    console.log(`📋 Payload:`, payload);

    await webpush.sendNotification(
      subscription as any,
      JSON.stringify(payload),
      {
        urgency: 'high',
        TTL: 60 // 60 seconds
      }
    );

    console.log(`✅ Push notification sent successfully to user: ${userId}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to send push notification to user ${userId}:`, error);
    
    // Remove invalid subscription
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log(`🗑️ Removing invalid subscription for user: ${userId}`);
      userSubscriptions.delete(userId);
    }
    
    return false;
  }
}

// Send push notification to multiple users
export async function sendPushNotificationToUsers(
  userIds: string[], 
  payload: PushNotificationPayload
): Promise<{ success: string[], failed: string[] }> {
  console.log(`📡 Broadcasting push notifications to ${userIds.length} users`);
  
  const results = await Promise.allSettled(
    userIds.map(userId => sendPushNotification(userId, payload))
  );

  const success: string[] = [];
  const failed: string[] = [];

  results.forEach((result, index) => {
    const userId = userIds[index];
    if (result.status === 'fulfilled' && result.value) {
      success.push(userId);
    } else {
      failed.push(userId);
    }
  });

  console.log(`✅ Push notification results: ${success.length} success, ${failed.length} failed`);
  return { success, failed };
}

// Send instant message notification
export async function sendInstantMessageNotification(
  recipientUserId: string,
  senderName: string,
  message: string,
  translatedMessage?: string,
  roomId?: string
): Promise<boolean> {
  const payload: PushNotificationPayload = {
    title: `💬 New message from ${senderName}`,
    body: translatedMessage || message,
    icon: '/icons/message-icon.png',
    badge: '/icons/badge-icon.png',
    data: {
      type: 'new_message',
      roomId,
      senderId: senderName,
      originalMessage: message,
      translatedMessage,
      timestamp: new Date().toISOString(),
      url: `/dashboard?room=${roomId}`
    },
    actions: [
      {
        action: 'reply',
        title: '💬 Reply',
        icon: '/icons/reply-icon.png'
      },
      {
        action: 'view',
        title: '👀 View',
        icon: '/icons/view-icon.png'
      }
    ]
  };

  return await sendPushNotification(recipientUserId, payload);
}

// Get subscription status
export function getSubscriptionStatus(userId: string): boolean {
  return userSubscriptions.has(userId);
}

// Get all subscribed users
export function getSubscribedUsers(): string[] {
  return Array.from(userSubscriptions.keys());
}

// Generate VAPID public key for client
export function getVapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
}

export default {
  subscribeUser,
  unsubscribeUser,
  sendPushNotification,
  sendPushNotificationToUsers,
  sendInstantMessageNotification,
  getSubscriptionStatus,
  getSubscribedUsers,
  getVapidPublicKey
};
