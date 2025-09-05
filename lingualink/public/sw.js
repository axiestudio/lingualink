// Service Worker for Push Notifications & PWA Features
const CACHE_NAME = 'lingua-link-v1.0.0';
const STATIC_CACHE = 'lingua-link-static-v1.0.0';
const DYNAMIC_CACHE = 'lingua-link-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/dashboard',
  '/favicon.svg',
  '/logo.svg',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ Static files cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Caching failed:', error);
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
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

// Fetch event - Handle network requests with advanced caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external requests
  if (request.method !== 'GET' || url.origin !== location.origin) {
    return;
  }

  // API requests - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Return cached version if available
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Store failed requests for background sync
              console.log('📴 API request failed - storing for sync');
              return new Response(
                JSON.stringify({ error: 'Offline - will retry' }),
                { status: 503, headers: { 'Content-Type': 'application/json' } }
              );
            });
        })
    );
    return;
  }

  // Static files - cache first, network fallback
  if (STATIC_FILES.some(file => url.pathname === file || url.pathname.startsWith('/_next/'))) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then((response) => {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE)
                .then((cache) => cache.put(request, responseClone));
              return response;
            });
        })
    );
    return;
  }

  // All other requests - network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE)
          .then((cache) => cache.put(request, responseClone));
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then((response) => {
            if (response) {
              return response;
            }
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

console.log('🚀 Service Worker loaded and ready for push notifications!');
