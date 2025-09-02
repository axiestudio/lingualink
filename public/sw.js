// Service Worker for Push Notifications
const CACHE_NAME = 'lingua-link-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Push event - Handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('📨 Push notification received:', event);

  if (!event.data) {
    console.log('❌ No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    console.log('📋 Push notification data:', data);

    const options = {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/badge-72x72.png',
      image: data.image,
      data: data.data,
      actions: data.actions || [],
      tag: data.data?.type || 'default',
      renotify: true,
      requireInteraction: true,
      silent: false,
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );

  } catch (error) {
    console.error('❌ Error handling push notification:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('New Message', {
        body: 'You have a new message in Lingua Link',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png'
      })
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === 'reply') {
    // Handle reply action
    console.log('💬 Reply action clicked');
    event.waitUntil(
      self.clients.openWindow(data?.url || '/dashboard')
    );
  } else if (action === 'view') {
    // Handle view action
    console.log('👀 View action clicked');
    event.waitUntil(
      self.clients.openWindow(data?.url || '/dashboard')
    );
  } else {
    // Default click - open the app
    console.log('📱 Default notification click');
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        // Check if app is already open
        for (const client of clients) {
          if (client.url.includes('/dashboard') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (self.clients.openWindow) {
          return self.clients.openWindow(data?.url || '/dashboard');
        }
      })
    );
  }
});

// Background sync for offline message sending
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'send-message') {
    event.waitUntil(
      // Handle offline message sending
      console.log('📤 Handling offline message sync')
    );
  }
});

// Message event - Communication with main thread
self.addEventListener('message', (event) => {
  console.log('📬 Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event - Handle network requests
self.addEventListener('fetch', (event) => {
  // Only handle same-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API requests for real-time messaging
  if (event.request.url.includes('/api/messages')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Store failed requests for background sync
        console.log('📴 Message API request failed - storing for sync');
        return new Response(
          JSON.stringify({ error: 'Offline - will retry' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
  }
});

console.log('🚀 Service Worker loaded and ready for push notifications!');
