import { create } from 'zustand';
import { api } from '../api-client';
import { findSpaceOwner } from '../services/sharedSpacesService';

import { setUserPresence } from '../services/presenceService';

const useSpaceManagerStore = create((set, get) => ({
  currentSpaceId: null,
  spaceType: 'diagram',
  isLoadingSpace: false,
  spaceError: null,
  intentionalSpaceChange: false,

  setCurrentSpaceId: (spaceId) => {
    set({ currentSpaceId: spaceId });
  },

  setSpaceType: (spaceType) => {
    set({ spaceType });
  },

  setIsLoadingSpace: (loading) => {
    set({ isLoadingSpace: loading });
  },

  setSpaceError: (error) => {
    set({ spaceError: error });
  },

  setIntentionalSpaceChange: (intentional) => {
    set({ intentionalSpaceChange: intentional });
  },

  fetchCurrentSpace: async (user) => {
    if (!user) return;

    const { registerUserPresence } = await import('../services/webRservice');
    const state = get();
    if (state.isLoadingSpace) return;

    set({ isLoadingSpace: true, spaceError: null });

    try {
      const params = new URLSearchParams(window.location.search);
      const urlSpaceId = params.get('spaceId') || params.get('space');
      const urlOwnerUid = params.get('ownerUid') || params.get('owner');

      const isPublicSpace = !!(
        window.publicAccessSpace && window.currentSpaceOwner
      );

      if (isPublicSpace) {
        console.log('Public space detected, maintaining public space state');
        set({ currentSpaceId: window.publicAccessSpace });

        if (window.publicAccessSpace) {
          setUserPresence(user.uid, window.publicAccessSpace, {
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            isGuest: user.isAnonymous || false,
          });
          registerUserPresence(user.uid, window.publicAccessSpace);
        }

        set({ isLoadingSpace: false });
        return;
      }

      if (
        urlSpaceId &&
        urlSpaceId === state.currentSpaceId &&
        !state.intentionalSpaceChange
      ) {
        if (urlOwnerUid) {
          window.currentSpaceOwner =
            urlOwnerUid === user.uid ? user.uid : urlOwnerUid;
        }

        setUserPresence(user.uid, urlSpaceId, {
          displayName: user.displayName || null,
          photoURL: user.photoURL || null,
          isGuest: user.isAnonymous || false,
        });
        registerUserPresence(user.uid, urlSpaceId);

        set({ isLoadingSpace: false });
        return;
      }

      if (state.intentionalSpaceChange || urlSpaceId !== state.currentSpaceId) {
        set({ intentionalSpaceChange: false });
      }

      if (urlSpaceId) {
        try {
          set({ currentSpaceId: urlSpaceId });
          sessionStorage.setItem('currentSpaceId', urlSpaceId);

          setUserPresence(user.uid, urlSpaceId, {
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            isGuest: user.isAnonymous || false,
          });
          registerUserPresence(user.uid, urlSpaceId);

          if (urlOwnerUid) {
            if (urlOwnerUid === user.uid) {
              set({ isLoadingSpace: false });
              return;
            }

            try {
              const ownerSpace = await api.get(`/api/users/${urlOwnerUid}/spaces/${urlSpaceId}`);
              const spaceData = ownerSpace.data || ownerSpace;

              if (spaceData) {
                const isSharedWithMe = spaceData.sharedWith?.some(
                  (share) => share.userId === user.uid
                );

                if (isSharedWithMe) {
                  sessionStorage.setItem(`isSharedSpace_${urlSpaceId}`, 'true');
                  sessionStorage.setItem(
                    `sharedSpaceOwner_${urlSpaceId}`,
                    urlOwnerUid
                  );
                  window.currentSpaceOwner = urlOwnerUid;
                  set({ spaceType: spaceData.type || 'diagram', isLoadingSpace: false });
                  return;
                }
              }
            } catch {
              // Space not found under owner, fall through
            }
          }

          try {
            const userSpace = await api.get(`/api/users/${user.uid}/spaces/${urlSpaceId}`);
            const userSpaceData = userSpace.data || userSpace;

            if (userSpaceData) {
              window.currentSpaceOwner = user.uid;
              set({ spaceType: userSpaceData.type || 'diagram', isLoadingSpace: false });
              return;
            }
          } catch {
            // Not in user's own collection, fall through
          }

          try {
            const sharedSpace = await api.get(`/api/users/${user.uid}/shared-spaces/${urlSpaceId}`);
            const sharedData = sharedSpace.data || sharedSpace;

            if (sharedData && sharedData.ownerId) {
              try {
                const actualSpace = await api.get(`/api/users/${sharedData.ownerId}/spaces/${urlSpaceId}`);
                const actualSpaceData = actualSpace.data || actualSpace;

                if (actualSpaceData) {
                  sessionStorage.setItem(`isSharedSpace_${urlSpaceId}`, 'true');
                  sessionStorage.setItem(
                    `sharedSpaceOwner_${urlSpaceId}`,
                    sharedData.ownerId
                  );
                  window.currentSpaceOwner = sharedData.ownerId;
                  set({ isLoadingSpace: false });
                  return;
                }
              } catch {
                // Space not found in owner's collection
              }
            }
          } catch {
            // Not in shared spaces, fall through
          }

          try {
            const spaces = await api.get('/api/spaces');
            const spacesList = spaces.data || spaces || [];
            const spaceDoc = spacesList.find((s) => s.id === urlSpaceId || s._id === urlSpaceId);

            if (spaceDoc) {
              if (spaceDoc.ownerId === user.uid) {
                window.currentSpaceOwner = user.uid;
                set({ isLoadingSpace: false });
                return;
              }

              const isSharedWithCurrentUser = spaceDoc.sharedWith?.some(
                (share) => share.userId === user.uid
              );

              if (isSharedWithCurrentUser) {
                sessionStorage.setItem(`isSharedSpace_${urlSpaceId}`, 'true');
                sessionStorage.setItem(
                  `sharedSpaceOwner_${urlSpaceId}`,
                  spaceDoc.ownerId
                );
                window.currentSpaceOwner = spaceDoc.ownerId;
                set({ isLoadingSpace: false });
                return;
              }
            }
          } catch {
            // Not in top-level spaces collection, fall through
          }

          try {
            const ownerId = await findSpaceOwner(urlSpaceId);
            if (ownerId && ownerId !== user.uid) {
              try {
                const ownerSpace = await api.get(`/api/users/${ownerId}/spaces/${urlSpaceId}`);
                const spaceData = ownerSpace.data || ownerSpace;

                if (spaceData) {
                  const hasAccess = spaceData.sharedWith?.some(
                    (share) => share.userId === user.uid
                  );

                  if (hasAccess) {
                    sessionStorage.setItem(`isSharedSpace_${urlSpaceId}`, 'true');
                    sessionStorage.setItem(
                      `sharedSpaceOwner_${urlSpaceId}`,
                      ownerId
                    );
                    window.currentSpaceOwner = ownerId;
                    set({ isLoadingSpace: false });
                    return;
                  }
                }
              } catch {
                // Owner space check failed
              }
            }

            if (ownerId) {
              const isPublicSpace =
                sessionStorage.getItem(`isPublicSpace_${urlSpaceId}`) ===
                'true';

              if (isPublicSpace) {
                console.log(
                  `✅ Public space access granted for space: ${urlSpaceId}, owner: ${ownerId}`
                );
                window.currentSpaceOwner = ownerId;
                set({ currentSpaceId: urlSpaceId, isLoadingSpace: false });
                return;
              }

              try {
                const ownerSpace = await api.get(`/api/users/${ownerId}/spaces/${urlSpaceId}`);
                const spaceData = ownerSpace.data || ownerSpace;

                if (spaceData) {
                  const hasAccess = spaceData.sharedWith?.some(
                    (share) => share.userId === user.uid
                  );

                  if (hasAccess) {
                    sessionStorage.setItem(`isSharedSpace_${urlSpaceId}`, 'true');
                    sessionStorage.setItem(
                      `sharedSpaceOwner_${urlSpaceId}`,
                      ownerId
                    );
                    window.currentSpaceOwner = ownerId;
                    set({ currentSpaceId: urlSpaceId, isLoadingSpace: false });
                    return;
                  }
                }
              } catch {
                // Owner space access check failed
              }
            }

            console.error(
              `Invalid space access: Space ${urlSpaceId} not found or access denied`
            );
            set({
              spaceError: `Space not found or access denied: ${urlSpaceId}`,
              isLoadingSpace: false,
            });
            setTimeout(() => {
              console.log(
                '🔄 [SpaceManager] Redirecting to landing - invalid space or no access'
              );
              window.location.href = '/';
            }, 1000);
            return;
          } catch (error) {
            console.error('Error finding space owner:', error);
            set({
              spaceError: `Failed to access space: ${urlSpaceId}`,
              isLoadingSpace: false,
            });
            setTimeout(() => {
              console.log(
                '🔄 [SpaceManager] Redirecting to landing - space access error'
              );
              window.location.href = '/';
            }, 1000);
            return;
          }
        } catch (error) {
          console.error('Error in fetchCurrentSpace main try block:', error);
          set({
            spaceError: error.message,
            isLoadingSpace: false,
          });
          return;
        }
      }

      const storedSpaceId = sessionStorage.getItem('currentSpaceId');
      if (storedSpaceId) {
        set({ currentSpaceId: storedSpaceId });

        const isShared = sessionStorage.getItem(
          `isSharedSpace_${storedSpaceId}`
        );
        const storedOwner = sessionStorage.getItem(
          `sharedSpaceOwner_${storedSpaceId}`
        );

        if (isShared === 'true' && storedOwner) {
          window.currentSpaceOwner = storedOwner;
        } else {
          window.currentSpaceOwner = user.uid;
        }
        set({ isLoadingSpace: false });
        return;
      }

      set({ currentSpaceId: null });
      console.log('No space ID found, but not redirecting');
    } catch (error) {
      console.error('Error in fetchCurrentSpace:', error);
      set({ spaceError: error.message });
    } finally {
      set({ isLoadingSpace: false });
    }
  },

  resetSpace: () => {
    set({
      currentSpaceId: null,
      spaceType: 'diagram',
      isLoadingSpace: false,
      spaceError: null,
      intentionalSpaceChange: false,
    });
  },
}));

export default useSpaceManagerStore;
