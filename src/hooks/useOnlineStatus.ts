"use client";

import { useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

export function useOnlineStatus() {
  const { user, isLoaded } = useUser();
  const statusUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef<boolean>(false);

  // Update online status
  const updateOnlineStatus = useCallback(async (isOnline: boolean) => {
    if (!user || !isLoaded) return;

    try {
      const response = await fetch('/api/user/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: isOnline })
      });

      if (!response.ok) {
        console.error('❌ Failed to update online status:', response.status);
        return;
      }

      isOnlineRef.current = isOnline;
      console.log(`✅ Online status updated: ${isOnline ? 'online' : 'offline'}`);

    } catch (error) {
      console.error('❌ Error updating online status:', error);
    }
  }, [user, isLoaded]);

  // Set user online
  const setOnline = useCallback(() => {
    updateOnlineStatus(true);
  }, [updateOnlineStatus]);

  // Set user offline
  const setOffline = useCallback(() => {
    updateOnlineStatus(false);
  }, [updateOnlineStatus]);

  // Handle page visibility changes
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // Page is hidden - set offline after a delay
      statusUpdateTimeoutRef.current = setTimeout(() => {
        setOffline();
      }, 30000); // 30 seconds delay before marking offline
    } else {
      // Page is visible - cancel offline timeout and set online
      if (statusUpdateTimeoutRef.current) {
        clearTimeout(statusUpdateTimeoutRef.current);
        statusUpdateTimeoutRef.current = null;
      }
      setOnline();
    }
  }, [setOnline, setOffline]);

  // Handle beforeunload (page close/refresh)
  const handleBeforeUnload = useCallback(() => {
    // Use sendBeacon for reliable offline status update
    if (user && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({ status: false })], {
        type: 'application/json'
      });
      navigator.sendBeacon('/api/user/status', blob);
    }
  }, [user]);

  // Handle focus/blur events
  const handleFocus = useCallback(() => {
    if (statusUpdateTimeoutRef.current) {
      clearTimeout(statusUpdateTimeoutRef.current);
      statusUpdateTimeoutRef.current = null;
    }
    setOnline();
  }, [setOnline]);

  const handleBlur = useCallback(() => {
    // Don't immediately set offline on blur, wait for visibility change
    // This prevents false offline status when switching tabs briefly
  }, []);

  // Initialize online status tracking
  useEffect(() => {
    if (!user || !isLoaded) return;

    // Set initial online status
    setOnline();

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Heartbeat to maintain online status
    const heartbeatInterval = setInterval(() => {
      if (!document.hidden && isOnlineRef.current) {
        setOnline(); // Refresh online status every 5 minutes
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup
    return () => {
      // Set offline when component unmounts
      setOffline();

      // Clear timeout
      if (statusUpdateTimeoutRef.current) {
        clearTimeout(statusUpdateTimeoutRef.current);
      }

      // Clear interval
      clearInterval(heartbeatInterval);

      // Remove event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [user, isLoaded, handleVisibilityChange, handleBeforeUnload, handleFocus, handleBlur, setOnline, setOffline]);

  return {
    setOnline,
    setOffline,
    updateOnlineStatus,
    isOnline: isOnlineRef.current
  };
}

// Hook to get online status of other users
export function useUsersOnlineStatus(userIds: string[]) {
  const { user, isLoaded } = useUser();

  const fetchUsersStatus = useCallback(async () => {
    if (!user || !isLoaded || userIds.length === 0) return {};

    try {
      const response = await fetch('/api/user/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds })
      });

      if (!response.ok) {
        console.error('❌ Failed to fetch users status:', response.status);
        return {};
      }

      const data = await response.json();
      return data.users || {};

    } catch (error) {
      console.error('❌ Error fetching users status:', error);
      return {};
    }
  }, [user, isLoaded, userIds]);

  return {
    fetchUsersStatus
  };
}
