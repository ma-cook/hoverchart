import { create } from 'zustand';

/**
 * Camera "follow" mode. Two scopes:
 *
 *  - 'object'      – traverse every connection line incident to `activeObjectId`.
 *  - 'connections' – traverse only the highlighted data path
 *                    (`followConnectionIds`) that contains `activeConnectionId`.
 *
 * Only the intent lives here — the traversal plan and per-frame progress live in
 * the CameraFollowController's refs so this store never updates per frame /
 * never triggers React re-renders during the animation.
 */
const useCameraFollowStore = create((set, get) => ({
  followMode: null, // 'object' | 'connections' | null
  // Object whose connection lines are being traversed (object mode only).
  activeObjectId: null,
  // Selected connection whose highlighted path is being traversed.
  activeConnectionId: null,
  // Highlighted data-path connection ids (connections mode, ordered at start).
  followConnectionIds: [],
  isFollowing: false,

  // Every object endpoint on the connection lines currently being followed.
  // CameraFollowController publishes this after building the traversal paths so
  // LODManager can pre-warm those objects without rebuilding the paths.
  followPathObjectIds: [],

  startFollow(objectId) {
    if (objectId == null) return;
    set({
      followMode: 'object',
      activeObjectId: String(objectId),
      activeConnectionId: null,
      followConnectionIds: [],
      isFollowing: true,
      followPathObjectIds: [],
    });
  },

  startFollowConnections(connectionId, connectionIds) {
    if (connectionId == null) return;
    const ids =
      Array.isArray(connectionIds) && connectionIds.length
        ? Array.from(new Set(connectionIds.map((id) => String(id))))
        : [String(connectionId)];
    set({
      followMode: 'connections',
      activeObjectId: null,
      activeConnectionId: String(connectionId),
      followConnectionIds: ids,
      isFollowing: true,
      followPathObjectIds: [],
    });
  },

  setFollowPathObjectIds(objectIds) {
    set({ followPathObjectIds: Array.isArray(objectIds) ? objectIds : [] });
  },

  stopFollow() {
    const state = get();
    if (
      !state.isFollowing &&
      state.activeObjectId == null &&
      state.activeConnectionId == null
    ) {
      return;
    }
    set({
      followMode: null,
      activeObjectId: null,
      activeConnectionId: null,
      followConnectionIds: [],
      isFollowing: false,
      followPathObjectIds: [],
    });
  },

  toggleFollow(objectId) {
    if (objectId == null) return;
    const state = get();
    if (
      state.isFollowing &&
      state.followMode === 'object' &&
      state.activeObjectId === String(objectId)
    ) {
      get().stopFollow();
    } else {
      get().startFollow(objectId);
    }
  },

  toggleFollowConnections(connectionId, connectionIds) {
    if (connectionId == null) return;
    const state = get();
    if (
      state.isFollowing &&
      state.followMode === 'connections' &&
      state.activeConnectionId === String(connectionId)
    ) {
      get().stopFollow();
    } else {
      get().startFollowConnections(connectionId, connectionIds);
    }
  },
}));

export default useCameraFollowStore;
