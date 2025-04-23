import { useState, useEffect } from 'react';
import { doc, getDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { findSpaceOwner } from '../services/sharedSpacesService';
import { registerUserPresence } from '../services/webRservice';
import { setUserPresence } from '../services/presenceService';

/**
 * Custom hook to manage space ID and ownership
 */
export function useSpaceManager({ user, intentionalSpaceChangeRef }) {
  const [currentSpaceId, setCurrentSpaceId] = useState(null);

  // Handle space management and permissions
  useEffect(() => {
    if (!user) return;

    const fetchCurrentSpace = async () => {
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
        setCurrentSpaceId(window.publicAccessSpace);

        // Register presence for public space
        if (window.publicAccessSpace) {
          setUserPresence(user.uid, window.publicAccessSpace);
          registerUserPresence(user.uid, window.publicAccessSpace);
        }

        // Don't modify any other state, keep the public space context
        return;
      }

      // Don't clear objects/connections if we already have the same space ID
      if (
        urlSpaceId &&
        urlSpaceId === currentSpaceId &&
        !intentionalSpaceChangeRef.current
      ) {
        // Just update owner info if needed
        if (urlOwnerUid) {
          window.currentSpaceOwner =
            urlOwnerUid === user.uid ? user.uid : urlOwnerUid;
        }

        // Register presence even for the same space (in case it was missed)
        setUserPresence(user.uid, urlSpaceId);
        registerUserPresence(user.uid, urlSpaceId);

        return;
      }

      // If we're explicitly changing spaces, clear stored data
      if (intentionalSpaceChangeRef.current || urlSpaceId !== currentSpaceId) {
        intentionalSpaceChangeRef.current = false;
      }

      // If we have a space ID, let's try to use it
      if (urlSpaceId) {
        try {
          // Set space ID early to prevent redirects
          setCurrentSpaceId(urlSpaceId);
          sessionStorage.setItem('currentSpaceId', urlSpaceId);

          // Register user presence in this space
          setUserPresence(user.uid, urlSpaceId);
          registerUserPresence(user.uid, urlSpaceId);

          // Case 1: URL explicitly provides owner ID
          if (urlOwnerUid) {
            if (urlOwnerUid === user.uid) return;

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
                return;
              }
            }
          }

          // Case 2: Check if space is in user's own collection
          const userSpaceRef = doc(db, 'users', user.uid, 'spaces', urlSpaceId);
          const userSpaceDoc = await getDoc(userSpaceRef);

          if (userSpaceDoc.exists()) {
            window.currentSpaceOwner = user.uid;
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
                  return;
                }
              }
            }
          } catch {
            // Intentionally ignored
          }

          window.currentSpaceOwner = urlOwnerUid || user.uid;
        } catch {
          window.currentSpaceOwner = user.uid; // Fallback
        }
        return;
      }

      // Check session storage if no URL space ID
      const storedSpaceId = sessionStorage.getItem('currentSpaceId');
      if (storedSpaceId) {
        setCurrentSpaceId(storedSpaceId);

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
        return;
      }

      // If we reach here, do NOT redirect - just set null space ID
      // and let the app handle showing appropriate UI
      setCurrentSpaceId(null);
      console.log('No space ID found, but not redirecting');
    };

    fetchCurrentSpace();
  }, [user, currentSpaceId, intentionalSpaceChangeRef]);

  // COMPLETELY REMOVE the second effect that handled redirection
  // No redirection logic at all - this ensures we never redirect users

  return { currentSpaceId, setCurrentSpaceId };
}
