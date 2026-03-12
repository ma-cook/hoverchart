import { useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import { useSpaceManagerStore } from '../stores';

// Module-level selector — only subscribe to the fields we return
const selectSpaceManagerState = (state) => ({
  currentSpaceId: state.currentSpaceId,
  setCurrentSpaceId: state.setCurrentSpaceId,
});

/**
 * Custom hook to manage space ID and ownership
 * Migrated to use Zustand store for state management
 */
export function useSpaceManager({ user, intentionalSpaceChangeRef }) {
  const {
    currentSpaceId,
    setCurrentSpaceId,
  } = useSpaceManagerStore(selectSpaceManagerState, shallow);

  // Handle space management and permissions
  useEffect(() => {
    if (!user) return;

    // Use getState() for action-only functions — avoids extra subscriptions
    const { fetchCurrentSpace, setIntentionalSpaceChange } = useSpaceManagerStore.getState();

    // Update the store with intentional space change flag
    if (intentionalSpaceChangeRef.current) {
      setIntentionalSpaceChange(true);
      intentionalSpaceChangeRef.current = false;
    }

    fetchCurrentSpace(user);
  }, [user, currentSpaceId, intentionalSpaceChangeRef]);

  return { currentSpaceId, setCurrentSpaceId };
}
