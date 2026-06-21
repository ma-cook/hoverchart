import { create } from 'zustand';
import { doc, getDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { findSpaceOwner } from '../services/sharedSpacesService';

import { setUserPresence } from '../services/presenceService';

const useSpaceManagerStore = create((set, get) => ({
  // State
  currentSpaceId: null,
  spaceType: 'diagram',
  isLoadingSpace: false,
  spaceError: null,
  intentionalSpaceChange: false,

  // Actions
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

  // Complex space management logic
  fetchCurrentSpace: async (user) => {
    if (!user) return;

    const { registerUserPresence } = await import('../services/webRservice');
    const state = get();
    if (state.isLoadingSpace) return; // Prevent multiple concurrent fetches

    set({ isLoadingSpace: true, spaceError: null });

    try {
      // Check URL for space ID first - check both 'spaceId' and 'space' parameters
      const params = new URLSearchParams(window.location.search);
      const urlSpaceId = params.get('spaceId') || params.get('space');
      const urlOwnerUid = params.get('ownerUid') || params.get('owner');

      // If we're in a public space, always preserve those values
      const isPublicSpace = !!(
        window.publicAccessSpace && window.currentSpaceOwner
      );

      if (isPublicSpace) {
        console.log('Public space detected, maintaining public space state');
        set({ currentSpaceId: window.publicAccessSpace });

        // Register presence for public space
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

      // Don't clear objects/connections if we already have the same space ID
      if (
        urlSpaceId &&
        urlSpaceId === state.currentSpaceId &&
        !state.intentionalSpaceChange
      ) {
        // Just update owner info if needed
        if (urlOwnerUid) {
          window.currentSpaceOwner =
            urlOwnerUid === user.uid ? user.uid : urlOwnerUid;
        }

        // Register presence even for the same space (in case it was missed)
        setUserPresence(user.uid, urlSpaceId, {
          displayName: user.displayName || null,
          photoURL: user.photoURL || null,
          isGuest: user.isAnonymous || false,
        });
        registerUserPresence(user.uid, urlSpaceId);

        set({ isLoadingSpace: false });
        return;
      }

      // If we're explicitly changing spaces, clear stored data
      if (state.intentionalSpaceChange || urlSpaceId !== state.currentSpaceId) {
        set({ intentionalSpaceChange: false });
      }

      // If we have a space ID, let's try to use it
      if (urlSpaceId) {
        try {
          // Set space ID early to prevent redirects
          set({ currentSpaceId: urlSpaceId });
          sessionStorage.setItem('currentSpaceId', urlSpaceId);

          // Register user presence in this space
          setUserPresence(user.uid, urlSpaceId, {
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            isGuest: user.isAnonymous || false,
          });
          registerUserPresence(user.uid, urlSpaceId);

          // Case 1: URL explicitly provides owner ID
          if (urlOwnerUid) {
            if (urlOwnerUid === user.uid) {
              set({ isLoadingSpace: false });
              return;
            }

            // Verify shared access with the specified owner
            const ownerSpaceRef = doc(
              db,
              'users',
              urlOwnerUid,
              'spaces',
              urlSpaceId
            );
            const ownerSpaceDoc = await getDoc(ownerSpaceRef);

            if (ownerSpaceDoc.exists()) {
              const spaceData = ownerSpaceDoc.data();
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
          }

          // Case 2: Check if space is in user's own collection
          const userSpaceRef = doc(db, 'users', user.uid, 'spaces', urlSpaceId);
          const userSpaceDoc = await getDoc(userSpaceRef);

          if (userSpaceDoc.exists()) {
            window.currentSpaceOwner = user.uid;
            set({ spaceType: userSpaceDoc.data().type || 'diagram', isLoadingSpace: false });
            return;
          }

          // Case 3: Check in shared spaces collection
          const sharedRef = doc(
            db,
            'users',
            user.uid,
            'sharedSpaces',
            urlSpaceId
          );
          const sharedDoc = await getDoc(sharedRef);

          if (sharedDoc.exists()) {
            const sharedData = sharedDoc.data();

            if (sharedData.ownerId) {
              // Check the actual space in owner's collection
              const actualSpaceRef = doc(
                db,
                'users',
                sharedData.ownerId,
                'spaces',
                urlSpaceId
              );
              const actualSpaceDoc = await getDoc(actualSpaceRef);

              if (actualSpaceDoc.exists()) {
                sessionStorage.setItem(`isSharedSpace_${urlSpaceId}`, 'true');
                sessionStorage.setItem(
                  `sharedSpaceOwner_${urlSpaceId}`,
                  sharedData.ownerId
                );
                window.currentSpaceOwner = sharedData.ownerId;
                set({ isLoadingSpace: false });
                return;
              }
            }
          }

          // Case 4: Look for space in top-level spaces collection
          const spacesRef = collection(db, 'spaces');
          const spaceDocRef = doc(spacesRef, urlSpaceId);
          const spaceDoc = await getDoc(spaceDocRef);

          if (spaceDoc.exists()) {
            const spaceData = spaceDoc.data();

            if (spaceData.ownerId === user.uid) {
              window.currentSpaceOwner = user.uid;
              set({ isLoadingSpace: false });
              return;
            }

            const isSharedWithCurrentUser = spaceData.sharedWith?.some(
              (share) => share.userId === user.uid
            );

            if (isSharedWithCurrentUser) {
              sessionStorage.setItem(`isSharedSpace_${urlSpaceId}`, 'true');
              sessionStorage.setItem(
                `sharedSpaceOwner_${urlSpaceId}`,
                spaceData.ownerId
              );
              window.currentSpaceOwner = spaceData.ownerId;
              set({ isLoadingSpace: false });
              return;
            }
          }

          // Case 5: Last resort - try to find owner
          try {
            const ownerId = await findSpaceOwner(urlSpaceId);
            if (ownerId && ownerId !== user.uid) {
              const ownerSpaceRef = doc(
                db,
                'users',
                ownerId,
                'spaces',
                urlSpaceId
              );
              const ownerSpaceDoc = await getDoc(ownerSpaceRef);

              if (ownerSpaceDoc.exists()) {
                const spaceData = ownerSpaceDoc.data();
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
            }

            // If we found a space owner, check if it's a public space or if user has access
            if (ownerId) {
              // First check if this is a public space (anyone can access)
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

              // For non-public spaces, check explicit access permissions
              const ownerSpaceRef = doc(
                db,
                'users',
                ownerId,
                'spaces',
                urlSpaceId
              );
              const ownerSpaceDoc = await getDoc(ownerSpaceRef);

              if (ownerSpaceDoc.exists()) {
                const spaceData = ownerSpaceDoc.data();
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
            }

            // If we couldn't find the space owner or don't have access, this is an invalid space access
            console.error(
              `Invalid space access: Space ${urlSpaceId} not found or access denied`
            );
            set({
              spaceError: `Space not found or access denied: ${urlSpaceId}`,
              isLoadingSpace: false,
            });
            // Redirect to landing page for invalid space access
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
            // Redirect to landing page for space access errors
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

      // Check session storage if no URL space ID
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

      // If we reach here, do NOT redirect - just set null space ID
      // and let the app handle showing appropriate UI
      set({ currentSpaceId: null });
      console.log('No space ID found, but not redirecting');
    } catch (error) {
      console.error('Error in fetchCurrentSpace:', error);
      set({ spaceError: error.message });
    } finally {
      set({ isLoadingSpace: false });
    }
  },

  // Reset space state
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
