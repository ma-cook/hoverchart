import { db } from '../firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  getDocs,
  where,
  setDoc,
} from 'firebase/firestore';

// Cache shared space relationships to minimize database reads
const sharedSpacesCache = new Map();

// Check if a space is shared with the current user - updated to match landing page structure
export const isSharedSpace = async (currentUserId, spaceId) => {
  // Quick exit for anonymous users or if we already know it's a public space
  if (!currentUserId) {
    const ownerFromUrl = window.currentSpaceOwner;
    if (ownerFromUrl) {
      return {
        isShared: true,
        ownerId: ownerFromUrl,
        permissions: 'read',
        isPublic: true,
      };
    }
    return { isShared: false, ownerId: null, permissions: 'none' };
  }

  // Use cached information if available
  if (
    window.currentSpaceOwner &&
    window.publicAccessSpace === spaceId &&
    window.currentSpaceOwner !== currentUserId
  ) {
    // We're in a known public space
    return {
      isShared: true,
      ownerId: window.currentSpaceOwner,
      permissions: 'read',
      isPublic: true,
    };
  }

  const cacheKey = `${currentUserId}_${spaceId}`;

  // Check cache first
  if (sharedSpacesCache.has(cacheKey)) {
    return sharedSpacesCache.get(cacheKey);
  }

  try {
    // First check if it's the user's own space (this should never fail with permissions)
    try {
      const ownSpaceRef = doc(db, 'users', currentUserId, 'spaces', spaceId);
      const ownSpaceDoc = await getDoc(ownSpaceRef);

      if (ownSpaceDoc.exists()) {
        const result = {
          isShared: false,
          ownerId: currentUserId,
          permissions: 'write',
        };
        sharedSpacesCache.set(cacheKey, result);
        return result;
      }
    } catch (err) {
      // Ignore error and continue to other checks
    }

    // Rest of the checks for shared spaces
    console.log(
      `Looking for shared space: ${spaceId} for user: ${currentUserId}`
    );

    // First, prioritize checking the top-level spaces collection (landing page format)
    const spacesRef = collection(db, 'spaces');
    const spaceDocRef = doc(spacesRef, spaceId);
    const spaceDocSnapshot = await getDoc(spaceDocRef);

    // Check if the space exists in the top-level spaces collection
    if (spaceDocSnapshot.exists()) {
      const spaceData = spaceDocSnapshot.data();
      console.log("Found space in 'spaces' collection directly:", spaceData);

      // If the space is owned by the current user, it's not a shared space
      if (spaceData.ownerId === currentUserId) {
        const result = { isShared: false, ownerId: currentUserId };
        sharedSpacesCache.set(cacheKey, result);
        return result;
      }

      // Check if the current user is in the sharedWith array
      if (spaceData.sharedWith && Array.isArray(spaceData.sharedWith)) {
        const userShare = spaceData.sharedWith.find(
          (share) => share.userId === currentUserId
        );

        if (userShare) {
          // Check if permissions contains write or edit privileges
          let hasEditAccess = false;

          // Check array permissions format
          if (Array.isArray(userShare.permissions)) {
            hasEditAccess =
              userShare.permissions.includes('edit') ||
              userShare.permissions.includes('write');
          }
          // Check string permissions format
          else if (typeof userShare.permissions === 'string') {
            hasEditAccess =
              userShare.permissions === 'edit' ||
              userShare.permissions === 'write';
          }

          const result = {
            isShared: true,
            ownerId: spaceData.ownerId,
            permissions: hasEditAccess ? 'write' : 'read',
            spaceName: spaceData.name,
          };

          sharedSpacesCache.set(cacheKey, result);
          console.log(
            `Space is shared with user: ${currentUserId}, owner: ${spaceData.ownerId}, permissions: ${result.permissions}`
          );
          return result;
        }
      }
    }

    // Only then check if the space exists in the user's own collection
    const ownSpaceRef = doc(db, 'users', currentUserId, 'spaces', spaceId);
    const ownSpaceDoc = await getDoc(ownSpaceRef);

    if (ownSpaceDoc.exists()) {
      // This is user's own space
      sharedSpacesCache.set(cacheKey, {
        isShared: false,
        ownerId: currentUserId,
      });
      console.log(`Space belongs to current user: ${currentUserId}`);
      return {
        isShared: false,
        ownerId: currentUserId,
      };
    }

    // Then check the spaces collection by query (less efficient but backward compatible)
    const spaceQuery = query(spacesRef, where('id', '==', spaceId));
    const spaceSnapshot = await getDocs(spaceQuery);

    if (!spaceSnapshot.empty) {
      const spaceData = spaceSnapshot.docs[0].data();
      console.log("Found space in 'spaces' collection by query:", spaceData);

      // Check if the current user is in the sharedWith array
      if (spaceData.sharedWith && Array.isArray(spaceData.sharedWith)) {
        const userShare = spaceData.sharedWith.find(
          (share) => share.userId === currentUserId
        );

        if (userShare) {
          const result = {
            isShared: true,
            ownerId: spaceData.ownerId,
            permissions: 'write', // Default to write if they're in the shared list
            spaceName: spaceData.name,
          };

          sharedSpacesCache.set(cacheKey, result);
          console.log(
            `Space is shared with user: ${currentUserId}, owner: ${spaceData.ownerId}`
          );
          return result;
        }
      }
    }

    // If not found, check our own sharedSpaces collection as fallback
    const sharedSpacesRef = collection(db, 'sharedSpaces');
    const q = query(
      sharedSpacesRef,
      where('spaceId', '==', spaceId),
      where('sharedWith', '==', currentUserId)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const sharedSpaceData = querySnapshot.docs[0].data();
      const result = {
        isShared: true,
        ownerId: sharedSpaceData.ownerId,
        permissions: sharedSpaceData.permissions || 'read',
      };

      sharedSpacesCache.set(cacheKey, result);
      console.log(
        `Space found in sharedSpaces collection, owner: ${sharedSpaceData.ownerId}`
      );
      return result;
    }

    // If we get here, check for shared param in session storage
    const isSharedInSession =
      sessionStorage.getItem(`isSharedSpace_${spaceId}`) === 'true';
    const ownerIdFromSession = sessionStorage.getItem(
      `sharedSpaceOwner_${spaceId}`
    );

    if (isSharedInSession && ownerIdFromSession) {
      console.log(
        `Using shared space info from session storage: owner=${ownerIdFromSession}`
      );
      const result = {
        isShared: true,
        ownerId: ownerIdFromSession,
        permissions: 'write', // Default to write permission
      };
      sharedSpacesCache.set(cacheKey, result);
      return result;
    }

    console.log(`Space ${spaceId} is not shared with user ${currentUserId}`);
    // If we get here, the space doesn't exist or isn't shared with this user
    sharedSpacesCache.set(cacheKey, { isShared: false, ownerId: null });
    return { isShared: false, ownerId: null };
  } catch (error) {
    console.error('Error checking if space is shared:', error);

    // Special handling for permission errors - could be a public space
    if (error.code === 'permission-denied' && window.currentSpaceOwner) {
      console.log(
        'Permission denied, but we have an owner ID, assuming public read-only access'
      );
      return {
        isShared: true,
        ownerId: window.currentSpaceOwner,
        permissions: 'read',
        isPublic: true,
      };
    }

    return { isShared: false, ownerId: null };
  }
};

// New function to check if a space exists
export const checkSpaceExists = async (spaceId) => {
  if (!spaceId) return { exists: false };

  try {
    // Check in spaces collection first (direct doc fetch)
    const spaceDocRef = doc(collection(db, 'spaces'), spaceId);
    const spaceDocSnapshot = await getDoc(spaceDocRef);

    if (spaceDocSnapshot.exists()) {
      const data = spaceDocSnapshot.data();
      return {
        exists: true,
        ownerId: data.ownerId,
        location: 'spaces',
      };
    }

    // Check in spaces collection by query
    const spacesRef = collection(db, 'spaces');
    const spaceQuery = query(spacesRef, where('id', '==', spaceId));
    const spaceSnapshot = await getDocs(spaceQuery);

    if (!spaceSnapshot.empty) {
      const data = spaceSnapshot.docs[0].data();
      return {
        exists: true,
        ownerId: data.ownerId,
        location: 'spaces-query',
      };
    }

    // Check in sharedSpaces collection
    const sharedSpacesRef = collection(db, 'sharedSpaces');
    const q = query(sharedSpacesRef, where('spaceId', '==', spaceId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data();
      return {
        exists: true,
        ownerId: data.ownerId,
        location: 'sharedSpaces',
      };
    }

    return { exists: false };
  } catch (error) {
    console.error('Error checking if space exists:', error);
    return { exists: false, error };
  }
};

// Update the registerSharedSpaceFromUrl function for more robust handling
export const registerSharedSpaceFromUrl = async (
  currentUserId,
  spaceId,
  ownerId
) => {
  if (!currentUserId || !spaceId || !ownerId) {
    console.error('Missing required parameters for registerSharedSpaceFromUrl');
    return false;
  }

  console.log(
    `Registering shared space: spaceId=${spaceId}, ownerId=${ownerId}, currentUser=${currentUserId}`
  );

  try {
    // First check if this space is already properly shared
    const existingStatus = await isSharedSpace(currentUserId, spaceId);

    if (existingStatus.isShared && existingStatus.ownerId === ownerId) {
      console.log('Space is already registered as shared');
      return true;
    }

    // IMPROVED: Check using direct path first (more efficient)
    const spaceDocRef = doc(collection(db, 'spaces'), spaceId);
    const spaceDocSnapshot = await getDoc(spaceDocRef);

    if (spaceDocSnapshot.exists()) {
      const spaceData = spaceDocSnapshot.data();
      console.log('Found space directly in spaces collection:', spaceData);

      // Check if current user is already in sharedWith
      let userAlreadyShared = false;
      if (spaceData.sharedWith && Array.isArray(spaceData.sharedWith)) {
        userAlreadyShared = spaceData.sharedWith.some(
          (s) => s.userId === currentUserId
        );
      }

      // If not already shared with this user, add them
      if (!userAlreadyShared) {
        console.log(
          'Updating existing space to add current user to sharedWith array'
        );

        // Create updated shared users array
        const updatedSharedWith = [
          ...(spaceData.sharedWith || []),
          {
            userId: currentUserId,
            permissions: ['view', 'edit'],
          },
        ];

        // Update the space document
        await setDoc(
          spaceDocRef,
          {
            ...spaceData,
            sharedWith: updatedSharedWith,
          },
          { merge: true }
        );

        console.log('Updated shared space in spaces collection');

        // Clear the cache for this space
        const cacheKey = `${currentUserId}_${spaceId}`;
        sharedSpacesCache.delete(cacheKey);

        return true;
      } else {
        console.log('Current user already in sharedWith list');
        return true;
      }
    }

    // Fallback: Check spaces collection using query (less efficient)
    const spacesRef = collection(db, 'spaces');
    const spaceQuery = query(spacesRef, where('id', '==', spaceId));
    const spaceSnapshot = await getDocs(spaceQuery);

    // If space is found in spaces collection and we're not registered yet, update it
    if (!spaceSnapshot.empty) {
      // ...existing code for updating space...
    }

    // Fallback: Create a new entry in sharedSpaces collection if nothing else works
    console.log('Creating new entry in sharedSpaces collection as fallback');
    const sharedSpaceId = `share_${ownerId}_${spaceId}_${currentUserId}`;

    // Create the shared space record in Firestore
    const sharedSpaceRef = doc(db, 'sharedSpaces', sharedSpaceId);
    await setDoc(sharedSpaceRef, {
      spaceId: spaceId,
      ownerId: ownerId,
      sharedWith: currentUserId,
      permissions: 'write', // Default to write access
      createdAt: new Date(),
    });

    console.log('Created new entry in sharedSpaces collection');

    // Clear the cache entry for this space
    const cacheKey = `${currentUserId}_${spaceId}`;
    sharedSpacesCache.delete(cacheKey);

    // Also store in session storage as backup
    sessionStorage.setItem(`isSharedSpace_${spaceId}`, 'true');
    sessionStorage.setItem(`sharedSpaceOwner_${spaceId}`, ownerId);

    return true;
  } catch (error) {
    console.error('Error registering shared space:', error);
    return false;
  }
};

// Get the owner ID of a space
export const getSpaceOwner = async (spaceId) => {
  try {
    // First check in spaces collection
    const spacesRef = collection(db, 'spaces');
    const spaceQuery = query(spacesRef, where('id', '==', spaceId));

    const spaceSnapshot = await getDocs(spaceQuery);
    if (!spaceSnapshot.empty) {
      return spaceSnapshot.docs[0].data().ownerId;
    }

    // Fallback to sharedSpaces collection
    const sharedSpacesRef = collection(db, 'sharedSpaces');
    const q = query(sharedSpacesRef, where('spaceId', '==', spaceId));

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data().ownerId;
    }

    return null;
  } catch (error) {
    console.error('Error getting space owner:', error);
    return null;
  }
};

// Add this new function to find a space's owner regardless of the current user's access
export const findSpaceOwner = async (spaceId) => {
  if (!spaceId) return null;

  try {
    console.log(`Looking for owner of space: ${spaceId}`);

    // First try to get the space directly from the spaces collection
    const spaceDocRef = doc(collection(db, 'spaces'), spaceId);
    const spaceDocSnapshot = await getDoc(spaceDocRef);

    if (spaceDocSnapshot.exists()) {
      const spaceData = spaceDocSnapshot.data();
      console.log(
        `Found space in spaces collection, owner: ${spaceData.ownerId}`
      );
      return spaceData.ownerId;
    }

    // If not found directly, try query
    const spacesRef = collection(db, 'spaces');
    const spaceQuery = query(spacesRef, where('id', '==', spaceId));
    const spaceSnapshot = await getDocs(spaceQuery);

    if (!spaceSnapshot.empty) {
      const spaceData = spaceSnapshot.docs[0].data();
      console.log(`Found space by query, owner: ${spaceData.ownerId}`);
      return spaceData.ownerId;
    }

    // Try the sharedSpaces collection as a last resort
    const sharedSpacesRef = collection(db, 'sharedSpaces');
    const q = query(sharedSpacesRef, where('spaceId', '==', spaceId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const sharedSpaceData = querySnapshot.docs[0].data();
      console.log(
        `Found reference in sharedSpaces collection, owner: ${sharedSpaceData.ownerId}`
      );
      return sharedSpaceData.ownerId;
    }

    console.log(`Could not find owner for space: ${spaceId}`);
    return null;
  } catch (error) {
    console.error('Error finding space owner:', error);
    return null;
  }
};
