import { ref, set, onDisconnect, onValue } from 'firebase/database';
import { database } from '../firebase';

// Function to set user presence
// userMeta: { displayName, photoURL, isGuest }
export const setUserPresence = (userId, spaceId = null, userMeta = {}) => {
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

    // Set space-specific presence with user metadata
    set(spacePresenceRef, {
      online: true,
      timestamp: new Date().toISOString(),
      userId,
      displayName: userMeta.displayName || null,
      photoURL: userMeta.photoURL || null,
      isGuest: userMeta.isGuest || false,
    });

    // Clear presence when disconnected
    onDisconnect(spacePresenceRef).remove();
  }
};

// Generate or retrieve a stable guest ID for this browser session
const getGuestId = () => {
  let guestId = sessionStorage.getItem('guestPresenceId');
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('guestPresenceId', guestId);
  }
  return guestId;
};

// Set presence for a non-authenticated guest user
export const setGuestPresence = (spaceId) => {
  if (!spaceId) return null;

  const guestId = getGuestId();
  const spacePresenceRef = ref(database, `/presence/${spaceId}/${guestId}`);

  set(spacePresenceRef, {
    online: true,
    timestamp: new Date().toISOString(),
    userId: guestId,
    displayName: null,
    photoURL: null,
    isGuest: true,
  }).catch(() => {}); // Fail silently — guest writes may be blocked by security rules

  onDisconnect(spacePresenceRef).remove();

  return guestId;
};

// Subscribe to live presence data for a space.
// callback receives an array of online user objects.
// Returns an unsubscribe function.
export const subscribeToSpacePresence = (spaceId, callback) => {
  if (!spaceId) {
    callback([]);
    return () => {};
  }

  const presenceRef = ref(database, `/presence/${spaceId}`);

  const unsubscribe = onValue(
    presenceRef,
    (snapshot) => {
      const data = snapshot.val() || {};
      const onlineUsers = Object.values(data).filter((u) => u.online);
      callback(onlineUsers);
    },
    (error) => {
      console.warn('[presence] Failed to subscribe to space presence:', error.message);
      callback([]);
    }
  );

  return unsubscribe;
};
