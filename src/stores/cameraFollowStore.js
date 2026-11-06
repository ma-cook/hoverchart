import { create } from 'zustand';

/**
 * Camera "follow" mode: when active, the camera rig (camera + orbit target)
 * translates along every connection line incident to `activeObjectId`, out to
 * the far endpoint and back, one connection at a time, until all are traversed.
 *
 * Only the intent (which object) lives here — the traversal plan and per-frame
 * progress live in the CameraFollowController's refs so this store never updates
 * per frame / never triggers React re-renders during the animation.
 */
const useCameraFollowStore = create((set, get) => ({
  // Object whose connection lines are being traversed (null when idle).
  activeObjectId: null,
  isFollowing: false,

  // Every object endpoint on the connection lines currently being followed.
  // CameraFollowController publishes this after building the traversal paths so
  // LODManager can pre-warm those objects without rebuilding the paths.
  followPathObjectIds: [],

  startFollow(objectId) {
    if (objectId == null) return;
    set({
      activeObjectId: String(objectId),
      isFollowing: true,
      followPathObjectIds: [],
    });
  },

  setFollowPathObjectIds(objectIds) {
    set({ followPathObjectIds: Array.isArray(objectIds) ? objectIds : [] });
  },

  stopFollow() {
    if (!get().isFollowing && get().activeObjectId == null) return;
    set({ activeObjectId: null, isFollowing: false, followPathObjectIds: [] });
  },

  toggleFollow(objectId) {
    if (objectId == null) return;
    if (get().isFollowing && get().activeObjectId === String(objectId)) {
      get().stopFollow();
    } else {
      get().startFollow(objectId);
    }
  },
}));

export default useCameraFollowStore;
