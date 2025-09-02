import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission;
  error: string | null;
}

export function usePushNotifications() {
  const { user } = useUser();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: false,
    permission: 'default',
    error: null
  });

  // Check if push notifications are supported
  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    setState(prev => ({ 
      ...prev, 
      isSupported,
      permission: isSupported ? Notification.permission : 'denied'
    }));

    if (isSupported) {
      console.log('🔔 Push notifications are supported');
      registerServiceWorker();
    } else {
      console.log('❌ Push notifications are not supported');
    }
  }, []);

  // Register service worker
  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', registration);
      
      // Check if already subscribed
      const subscription = await registration.pushManager.getSubscription();
      setState(prev => ({ ...prev, isSubscribed: !!subscription }));
      
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      setState(prev => ({ ...prev, error: 'Failed to register service worker' }));
    }
  };

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Push notifications not supported' }));
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        return true;
      } else {
        console.log('❌ Notification permission denied');
        setState(prev => ({ ...prev, error: 'Notification permission denied' }));
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      setState(prev => ({ ...prev, error: 'Failed to request permission' }));
      return false;
    }
  }, [state.isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request permission first
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID public key
      const response = await fetch('/api/push/subscribe');
      const { vapidPublicKey } = await response.json();

      // Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
      });

      console.log('🔔 Push subscription created:', subscription);

      // Send subscription to server
      const subscribeResponse = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (subscribeResponse.ok) {
        console.log('✅ Successfully subscribed to push notifications');
        setState(prev => ({ 
          ...prev, 
          isSubscribed: true, 
          isLoading: false 
        }));
        return true;
      } else {
        throw new Error('Failed to subscribe on server');
      }

    } catch (error) {
      console.error('❌ Error subscribing to push notifications:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to subscribe to push notifications' 
      }));
      return false;
    }
  }, [user?.id, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();
        console.log('🔕 Push subscription removed');
      }

      // Notify server
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('✅ Successfully unsubscribed from push notifications');
        setState(prev => ({ 
          ...prev, 
          isSubscribed: false, 
          isLoading: false 
        }));
        return true;
      } else {
        throw new Error('Failed to unsubscribe on server');
      }

    } catch (error) {
      console.error('❌ Error unsubscribing from push notifications:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to unsubscribe from push notifications' 
      }));
      return false;
    }
  }, [user?.id]);

  // Auto-subscribe when user is authenticated
  useEffect(() => {
    if (user?.id && state.isSupported && !state.isSubscribed && state.permission !== 'denied') {
      console.log('🔄 Auto-subscribing to push notifications...');
      subscribe();
    }
  }, [user?.id, state.isSupported, state.isSubscribed, state.permission, subscribe]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    requestPermission
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
