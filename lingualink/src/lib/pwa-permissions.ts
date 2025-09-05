'use client';

/**
 * PWA Permission Manager
 * Handles permissions for both web browsers and PWA environments
 * Optimized for mobile PWA deployment via Bubblewrap
 */

export interface PermissionStatus {
  notifications: 'granted' | 'denied' | 'default' | 'not-supported';
  persistentStorage: 'granted' | 'denied' | 'default' | 'not-supported';
  camera: 'granted' | 'denied' | 'default' | 'not-supported';
  microphone: 'granted' | 'denied' | 'default' | 'not-supported';
  location: 'granted' | 'denied' | 'default' | 'not-supported';
}

export interface PWACapabilities {
  isStandalone: boolean;
  isPWA: boolean;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  supportsNotifications: boolean;
  supportsPersistentStorage: boolean;
  supportsServiceWorker: boolean;
}

class PWAPermissionManager {
  private capabilities: PWACapabilities;

  constructor() {
    this.capabilities = this.detectCapabilities();
    console.log('🔍 PWA Capabilities detected:', this.capabilities);
  }

  /**
   * Detect PWA and device capabilities
   */
  private detectCapabilities(): PWACapabilities {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true ||
                        document.referrer.includes('android-app://');

    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isMobile = isIOS || isAndroid || /mobile/.test(userAgent);

    return {
      isStandalone,
      isPWA: isStandalone,
      isMobile,
      isIOS,
      isAndroid,
      supportsNotifications: 'Notification' in window,
      supportsPersistentStorage: 'storage' in navigator && 'persist' in navigator.storage,
      supportsServiceWorker: 'serviceWorker' in navigator
    };
  }

  /**
   * Get current permission status for all features
   */
  async getPermissionStatus(): Promise<PermissionStatus> {
    const status: PermissionStatus = {
      notifications: 'not-supported',
      persistentStorage: 'not-supported',
      camera: 'not-supported',
      microphone: 'not-supported',
      location: 'not-supported'
    };

    // Check notification permission
    if (this.capabilities.supportsNotifications) {
      status.notifications = Notification.permission as any;
    }

    // Check persistent storage
    if (this.capabilities.supportsPersistentStorage) {
      try {
        const persistent = await navigator.storage.persisted();
        status.persistentStorage = persistent ? 'granted' : 'default';
      } catch (error) {
        console.warn('Could not check persistent storage:', error);
      }
    }

    // Check media permissions (for future features)
    if ('permissions' in navigator) {
      try {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' as any });
        status.camera = cameraPermission.state as any;
      } catch (error) {
        // Camera permission not supported or denied
      }

      try {
        const micPermission = await navigator.permissions.query({ name: 'microphone' as any });
        status.microphone = micPermission.state as any;
      } catch (error) {
        // Microphone permission not supported or denied
      }

      try {
        const locationPermission = await navigator.permissions.query({ name: 'geolocation' as any });
        status.location = locationPermission.state as any;
      } catch (error) {
        // Location permission not supported or denied
      }
    }

    return status;
  }

  /**
   * Request notification permission with PWA-specific handling
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!this.capabilities.supportsNotifications) {
      throw new Error('Notifications not supported on this device');
    }

    // For PWA/standalone mode, we can be more aggressive with permission requests
    if (this.capabilities.isPWA) {
      console.log('📱 PWA mode detected - requesting notification permission');
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        
        // Test notification for PWA
        if (this.capabilities.isPWA) {
          this.showTestNotification();
        }
      }
      
      return permission;
    } catch (error) {
      console.error('❌ Failed to request notification permission:', error);
      throw error;
    }
  }

  /**
   * Request persistent storage permission
   */
  async requestPersistentStorage(): Promise<boolean> {
    if (!this.capabilities.supportsPersistentStorage) {
      console.warn('⚠️ Persistent storage not supported');
      return false;
    }

    try {
      const persistent = await navigator.storage.persist();
      console.log(persistent ? '✅ Persistent storage granted' : '❌ Persistent storage denied');
      return persistent;
    } catch (error) {
      console.error('❌ Failed to request persistent storage:', error);
      return false;
    }
  }

  /**
   * Show a test notification to verify PWA notifications work
   */
  private showTestNotification(): void {
    if (Notification.permission === 'granted') {
      new Notification('Lingua Link Ready! 🚀', {
        body: 'You\'ll now receive real-time message notifications',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'lingua-link-welcome',
        requireInteraction: false,
        silent: false
      });
    }
  }

  /**
   * Get PWA installation prompt (if available)
   */
  async getInstallPrompt(): Promise<any> {
    return new Promise((resolve) => {
      let deferredPrompt: any = null;

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        resolve(deferredPrompt);
      });

      // If no prompt after 1 second, resolve with null
      setTimeout(() => {
        if (!deferredPrompt) {
          resolve(null);
        }
      }, 1000);
    });
  }

  /**
   * Check if app is running in PWA mode
   */
  isPWAMode(): boolean {
    return this.capabilities.isPWA;
  }

  /**
   * Check if device is mobile
   */
  isMobileDevice(): boolean {
    return this.capabilities.isMobile;
  }

  /**
   * Get device-specific recommendations
   */
  getDeviceRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.capabilities.isMobile && !this.capabilities.isPWA) {
      recommendations.push('📱 Add Lingua Link to your home screen for the best mobile experience');
    }

    if (this.capabilities.isIOS && !this.capabilities.isPWA) {
      recommendations.push('🍎 On iOS: Tap Share → Add to Home Screen for full-screen experience');
    }

    if (this.capabilities.isAndroid && !this.capabilities.isPWA) {
      recommendations.push('🤖 On Android: Tap menu → Add to Home Screen or Install App');
    }

    if (this.capabilities.isPWA) {
      recommendations.push('✅ Running in PWA mode - optimal experience enabled');
    }

    return recommendations;
  }

  /**
   * Initialize PWA-specific features
   */
  async initializePWAFeatures(): Promise<void> {
    console.log('🚀 Initializing PWA features...');

    // Register service worker if supported
    if (this.capabilities.supportsServiceWorker) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered:', registration);
      } catch (error) {
        console.warn('⚠️ Service Worker registration failed:', error);
      }
    }

    // Set up PWA-specific event listeners
    this.setupPWAEventListeners();
  }

  /**
   * Set up PWA-specific event listeners
   */
  private setupPWAEventListeners(): void {
    // Handle app install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('📱 PWA install prompt available');
      e.preventDefault(); // Prevent automatic prompt
    });

    // Handle successful app install
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed successfully');
    });

    // Handle display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      console.log('📱 Display mode changed:', e.matches ? 'standalone' : 'browser');
    });
  }
}

// Singleton instance
let pwaManager: PWAPermissionManager | null = null;

export function getPWAManager(): PWAPermissionManager {
  if (!pwaManager) {
    pwaManager = new PWAPermissionManager();
  }
  return pwaManager;
}

export default PWAPermissionManager;
