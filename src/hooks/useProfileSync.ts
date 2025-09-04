'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSocket } from './useSocket';

/**
 * 🚀 REAL-TIME PROFILE SYNCHRONIZATION HOOK
 * 
 * Automatically detects when a user's Clerk profile changes and broadcasts
 * the updates to all connected users in real-time.
 * 
 * Features:
 * - Monitors Clerk profile changes (name, avatar, email, username)
 * - Syncs changes to database via API
 * - Broadcasts updates to all connected users via Socket.IO
 * - Handles profile picture updates instantly
 * - Prevents infinite loops with change detection
 */
export function useProfileSync() {
  const { user, isLoaded } = useUser();
  const { broadcastProfileUpdate, isAuthenticated } = useSocket();
  const previousProfileRef = useRef<any>(null);
  const syncInProgressRef = useRef(false);

  // Sync profile to database and broadcast changes
  const syncProfile = useCallback(async (profileData: any) => {
    if (syncInProgressRef.current) {
      console.log('🔄 Profile sync already in progress, skipping...');
      return;
    }

    syncInProgressRef.current = true;
    
    try {
      console.log('🔄 Syncing profile to database...', profileData);
      
      const response = await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Profile synced to database:', result);

        // Broadcast the profile update to all connected users
        if (isAuthenticated && result.profileUpdate) {
          console.log('📡 Broadcasting profile update to all users...');
          
          broadcastProfileUpdate(result.profileUpdate.updates, (success) => {
            if (success) {
              console.log('✅ Profile update broadcasted successfully');
            } else {
              console.warn('⚠️ Failed to broadcast profile update');
            }
          });
        }
      } else {
        console.error('❌ Failed to sync profile:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Error syncing profile:', error);
    } finally {
      syncInProgressRef.current = false;
    }
  }, [broadcastProfileUpdate, isAuthenticated]);

  // Monitor Clerk profile changes
  useEffect(() => {
    if (!isLoaded || !user) return;

    const currentProfile = {
      clerkId: user.id,
      username: user.username || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'user',
      email: user.emailAddresses[0]?.emailAddress || '',
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User',
      avatarUrl: user.imageUrl || ''
    };

    // Check if profile has changed
    const previousProfile = previousProfileRef.current;
    
    if (previousProfile) {
      const hasChanged = (
        previousProfile.name !== currentProfile.name ||
        previousProfile.avatarUrl !== currentProfile.avatarUrl ||
        previousProfile.username !== currentProfile.username ||
        previousProfile.email !== currentProfile.email
      );

      if (hasChanged) {
        console.log('👤 Profile change detected:', {
          previous: previousProfile,
          current: currentProfile
        });

        // Sync the updated profile
        syncProfile(currentProfile);
      }
    } else {
      // First time - sync initial profile
      console.log('👤 Initial profile sync:', currentProfile);
      syncProfile(currentProfile);
    }

    // Update the reference
    previousProfileRef.current = currentProfile;

  }, [user, isLoaded, syncProfile]);

  // Manual sync function for external use
  const manualSync = useCallback(() => {
    if (!user) return;

    const currentProfile = {
      clerkId: user.id,
      username: user.username || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'user',
      email: user.emailAddresses[0]?.emailAddress || '',
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User',
      avatarUrl: user.imageUrl || ''
    };

    console.log('🔄 Manual profile sync triggered:', currentProfile);
    syncProfile(currentProfile);
  }, [user, syncProfile]);

  return {
    manualSync,
    isSyncing: syncInProgressRef.current
  };
}
