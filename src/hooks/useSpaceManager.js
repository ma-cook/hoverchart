import { useEffect } from 'react';
import { useSpaceManagerStore } from '../stores';

/**
 * Custom hook to manage space ID and ownership
 * Migrated to use Zustand store for state management
 */
export function useSpaceManager({ user, intentionalSpaceChangeRef }) {
  const {
    currentSpaceId,
    setCurrentSpaceId,
    fetchCurrentSpace,
    setIntentionalSpaceChange,
  } = useSpaceManagerStore();

  // Handle space management and permissions
  useEffect(() => {
    if (!user) return;

    // Update the store with intentional space change flag
    if (intentionalSpaceChangeRef.current) {
      setIntentionalSpaceChange(true);
      intentionalSpaceChangeRef.current = false;
    }

    fetchCurrentSpace(user);
  }, [
    user,
    currentSpaceId,
    intentionalSpaceChangeRef,
    fetchCurrentSpace,
    setIntentionalSpaceChange,
  ]);

  return { currentSpaceId, setCurrentSpaceId };
}
