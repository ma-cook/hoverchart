import { ref, set, onDisconnect } from 'firebase/database';
import { database } from '../firebase';

// Function to set user presence
export const setUserPresence = (userId, spaceId = null) => {
  const userStatusDatabaseRef = ref(database, `/status/${userId}`);

  // Set the user's online status
  set(userStatusDatabaseRef, {
    state: 'online',
    last_changed: new Date().toISOString(),
  });

  // Set the user's offline status when they disconnect
  onDisconnect(userStatusDatabaseRef).set({
    state: 'offline',
    last_changed: new Date().toISOString(),
  });

  // If spaceId is provided, also set space-specific presence
  if (spaceId) {
    const spacePresenceRef = ref(database, `/presence/${spaceId}/${userId}`);

    // Set space-specific presence
    set(spacePresenceRef, {
      online: true,
      timestamp: new Date().toISOString(),
    });

    // Clear presence when disconnected    onDisconnect(spacePresenceRef).remove();
  }
};
