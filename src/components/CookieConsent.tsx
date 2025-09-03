'use client';

import { useState, useEffect } from 'react';
import { X, Cookie, Shield, Bell, Database, Settings, Smartphone } from 'lucide-react';
import { getPWAManager } from '@/lib/pwa-permissions';

interface CookieConsentProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

export default function CookieConsent({ onAccept, onDecline }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [deviceRecommendations, setDeviceRecommendations] = useState<string[]>([]);
  const [preferences, setPreferences] = useState({
    essential: true, // Always required
    analytics: false,
    marketing: false,
    notifications: false,
    localStorage: false,
  });

  useEffect(() => {
    // Initialize PWA manager
    const pwaManager = getPWAManager();
    setIsPWA(pwaManager.isPWAMode());
    setDeviceRecommendations(pwaManager.getDeviceRecommendations());

    // Initialize PWA features
    pwaManager.initializePWAFeatures();

    // Check if user has already made a choice
    const consent = localStorage.getItem('lingua-link-cookie-consent');
    if (!consent) {
      setIsVisible(true);
    } else {
      // Apply saved preferences
      const savedPrefs = JSON.parse(consent);
      setPreferences(savedPrefs);
      applyPermissions(savedPrefs);
    }
  }, []);

  const applyPermissions = async (prefs: typeof preferences) => {
    try {
      const pwaManager = getPWAManager();

      // 🔔 Notification Permission (PWA-optimized)
      if (prefs.notifications) {
        await pwaManager.requestNotificationPermission();
      }

      // 💾 Persistent Storage Permission (PWA-optimized)
      if (prefs.localStorage) {
        await pwaManager.requestPersistentStorage();
      }

      // 📍 Location Permission (if needed for future features)
      if (prefs.analytics && 'geolocation' in navigator) {
        // We don't request location by default, but this could be extended
      }

      // 🎥 Camera/Microphone (for future video calls - currently disabled)
      // These are intentionally commented out as per KISS principle
      /*
      if (prefs.notifications) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e) {
          console.log('Microphone permission not granted');
        }
      }
      */

    } catch (error) {
      console.warn('⚠️ Permission request failed:', error);
    }
  };

  const handleAcceptAll = async () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
      notifications: true,
      localStorage: true,
    };
    
    setPreferences(allAccepted);
    localStorage.setItem('lingua-link-cookie-consent', JSON.stringify(allAccepted));
    
    await applyPermissions(allAccepted);
    setIsVisible(false);
    onAccept?.();
  };

  const handleDeclineAll = () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false,
      notifications: false,
      localStorage: false,
    };
    
    setPreferences(essentialOnly);
    localStorage.setItem('lingua-link-cookie-consent', JSON.stringify(essentialOnly));
    
    setIsVisible(false);
    onDecline?.();
  };

  const handleSavePreferences = async () => {
    localStorage.setItem('lingua-link-cookie-consent', JSON.stringify(preferences));
    await applyPermissions(preferences);
    setIsVisible(false);
    onAccept?.();
  };

  const handlePreferenceChange = (key: keyof typeof preferences) => {
    if (key === 'essential') return; // Essential cookies cannot be disabled
    
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Cookie className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Privacy & Permissions
            </h2>
          </div>
          <button
            onClick={handleDeclineAll}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Lingua Link uses cookies and browser permissions to provide the best real-time translation experience.
            Choose your preferences below.
          </p>

          {/* PWA-specific information */}
          {isPWA && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-900 dark:text-green-100">
                  PWA Mode Active
                </h3>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                You're using Lingua Link as a Progressive Web App! This enables enhanced offline capabilities,
                faster loading, and native-like notifications.
              </p>
            </div>
          )}

          {/* Device recommendations */}
          {deviceRecommendations.length > 0 && !isPWA && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                💡 Recommendations
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                {deviceRecommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {!showDetails ? (
            /* Simple View */
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  🚀 Quick Setup for Best Experience
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Accept all permissions to enable real-time notifications, offline messaging, 
                  and seamless PWA experience across all your devices.
                </p>
              </div>

              <button
                onClick={() => setShowDetails(true)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
              >
                <Settings className="w-4 h-4" />
                Customize preferences
              </button>
            </div>
          ) : (
            /* Detailed View */
            <div className="space-y-4">
              {/* Essential Cookies */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">Essential</h4>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Required</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Authentication, security, and core messaging functionality
                  </p>
                </div>
              </div>

              {/* Notifications */}
              <div className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">Push Notifications</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.notifications}
                        onChange={() => handlePreferenceChange('notifications')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Real-time message notifications even when app is closed
                  </p>
                </div>
              </div>

              {/* Local Storage */}
              <div className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <Database className="w-5 h-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">Offline Storage</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.localStorage}
                        onChange={() => handlePreferenceChange('localStorage')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Cache messages and settings for offline access (PWA)
                  </p>
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="w-5 h-5 bg-orange-600 rounded mt-0.5 flex items-center justify-center">
                  <span className="text-white text-xs">📊</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">Analytics</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={() => handlePreferenceChange('analytics')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Help us improve translation quality and app performance
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          {showDetails ? (
            <>
              <button
                onClick={handleSavePreferences}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Save Preferences
              </button>
              <button
                onClick={() => setShowDetails(false)}
                className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              >
                Back
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleAcceptAll}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Accept All & Enable Features
              </button>
              <button
                onClick={handleDeclineAll}
                className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              >
                Essential Only
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
