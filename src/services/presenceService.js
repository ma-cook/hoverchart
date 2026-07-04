import { emitSocket, onSocket } from '../api-client';

const getGuestId = () => {
  let guestId = sessionStorage.getItem('guestPresenceId');
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('guestPresenceId', guestId);
  }
  return guestId;
};

export const setUserPresence = (userId, spaceId = null, userMeta = {}) => {
  if (spaceId) {
    emitSocket('signaling:join', { spaceId });
  }
};

export const setGuestPresence = (spaceId) => {
  if (!spaceId) return null;
  const guestId = getGuestId();
  emitSocket('signaling:join', { spaceId, isGuest: true });
  return guestId;
};

export const subscribeToSpacePresence = (spaceId, callback) => {
  if (!spaceId) {
    callback([]);
    return () => {};
  }

  return onSocket('signaling:members', (members) => {
    const onlineUsers = (members || []).filter((u) => u.online !== false);
    callback(onlineUsers);
  });
};
