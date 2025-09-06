'use client'

import { useUser, useAuth } from '@clerk/nextjs';
import { useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';

/**
 * 🚀 SENIOR DEVELOPER: Enhanced Clerk Authentication Status Hook
 * 
 * This hook provides comprehensive integration between Clerk authentication
 * and real-time online status management. It automatically:
 * 
 * 1. Detects Clerk login/logout events
 * 2. Updates user online status in database
 * 3. Broadcasts status changes via Socket.IO
 * 4. Handles session expiry and cleanup
 * 5. Manages real-time presence indicators
 */
export function useClerkAuthStatus() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded, signOut } = useAuth();
  const { socket, isConnected, isAuthenticated, logoutUser } = useSocket();
  
  // Track previous auth state to detect changes
  const prevAuthStateRef = useRef<{
    isSignedIn: boolean | undefined;
    userId: string | undefined;
  }>({
    isSignedIn: undefined,
    userId: undefined
  });

  // Update online status in database
  const updateOnlineStatus = useCallback(async (isOnline: boolean) => {
    if (!user?.id) return;

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

      console.log(`✅ Online status updated: ${user.id} is ${isOnline ? 'online' : 'offline'}`);
    } catch (error) {
      console.error('❌ Error updating online status:', error);
    }
  }, [user?.id]);

  // Handle user login
  const handleUserLogin = useCallback(async () => {
    if (!user?.id) return;

    console.log(`🔐 User logged in: ${user.id}`);
    
    // Set user online in database
    await updateOnlineStatus(true);
    
    // Authenticate with Socket.IO if connected
    if (socket && isConnected && !isAuthenticated) {
      console.log('🔌 Authenticating with Socket.IO after login...');
      socket.emit('authenticate', {
        userId: user.id,
        sessionToken: user.id // Using user ID as session token
      });
    }
  }, [user?.id, socket, isConnected, isAuthenticated, updateOnlineStatus]);

  // Handle user logout
  const handleUserLogout = useCallback(async (userId?: string) => {
    const userIdToLogout = userId || prevAuthStateRef.current.userId;
    
    if (!userIdToLogout) return;

    console.log(`🚪 User logged out: ${userIdToLogout}`);
    
    // Set user offline in database
    try {
      const response = await fetch('/api/user/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: false })
      });

      if (response.ok) {
        console.log(`✅ User ${userIdToLogout} marked offline`);
      }
    } catch (error) {
      console.error('❌ Error marking user offline:', error);
    }

    // Logout from Socket.IO
    if (socket && isConnected) {
      console.log('🔌 Logging out from Socket.IO...');
      logoutUser();
    }
  }, [socket, isConnected]);

  // Handle session expiry
  const handleSessionExpiry = useCallback(async () => {
    console.warn('⚠️ Clerk session expired');
    
    // Mark user offline
    await handleUserLogout();
    
    // Sign out from Clerk
    await signOut();
    
    // Redirect to sign-in page
    window.location.href = '/sign-in?session_expired=true';
  }, [handleUserLogout, signOut]);

  // Monitor Clerk authentication state changes
  useEffect(() => {
    if (!authLoaded || !userLoaded) return;

    const currentAuthState = {
      isSignedIn,
      userId: user?.id
    };

    const prevAuthState = prevAuthStateRef.current;

    // Detect login event
    if (!prevAuthState.isSignedIn && isSignedIn && user?.id) {
      handleUserLogin();
    }

    // Detect logout event
    if (prevAuthState.isSignedIn && !isSignedIn) {
      handleUserLogout(prevAuthState.userId);
    }

    // Detect user change (different user logged in)
    if (
      prevAuthState.isSignedIn && 
      isSignedIn && 
      prevAuthState.userId && 
      user?.id && 
      prevAuthState.userId !== user.id
    ) {
      // Log out previous user and log in new user
      handleUserLogout(prevAuthState.userId);
      setTimeout(() => handleUserLogin(), 100);
    }

    // Update previous state
    prevAuthStateRef.current = currentAuthState;
  }, [isSignedIn, user?.id, authLoaded, userLoaded, handleUserLogin, handleUserLogout]);

  // Handle page visibility changes for online status
  useEffect(() => {
    if (!isSignedIn || !user?.id) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page hidden - don't immediately mark offline, wait for actual logout
        console.log('📱 Page hidden - maintaining online status');
      } else {
        // Page visible - ensure user is marked online
        console.log('📱 Page visible - refreshing online status');
        updateOnlineStatus(true);
      }
    };

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable offline status update on page close
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({ status: false })], {
          type: 'application/json'
        });
        navigator.sendBeacon('/api/user/status', blob);
        console.log('📤 Sent offline status via beacon');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSignedIn, user?.id, updateOnlineStatus]);

  // Listen for Socket.IO session expiry events
  useEffect(() => {
    if (!socket) return;

    socket.on('session_expired', handleSessionExpiry);

    return () => {
      socket.off('session_expired', handleSessionExpiry);
    };
  }, [socket, handleSessionExpiry]);

  return {
    isSignedIn,
    user,
    isLoaded: authLoaded && userLoaded,
    handleUserLogin,
    handleUserLogout,
    updateOnlineStatus
  };
}
