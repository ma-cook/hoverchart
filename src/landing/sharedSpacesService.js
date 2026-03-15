// Shared Spaces Service - Better architecture for shared spaces
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

/**
 * Add a shared space reference for a user
 */
export async function addSharedSpaceReference(
  db,
  userId,
  spaceId,
  ownerId,
  permissions = ['view']
) {
  const sharedSpaceRef = doc(db, 'users', userId, 'sharedSpaces', spaceId);
  await setDoc(sharedSpaceRef, {
    spaceId,
    ownerId,
    permissions,
    sharedAt: new Date().toISOString(),
  });
}

/**
 * Remove a shared space reference for a user
 */
export async function removeSharedSpaceReference(db, userId, spaceId) {
  const sharedSpaceRef = doc(db, 'users', userId, 'sharedSpaces', spaceId);
  await deleteDoc(sharedSpaceRef);
}

/**
 * Get all shared spaces for a user - MUCH more efficient!
 */
export async function getSharedSpacesForUser(db, userId) {
  const sharedSpacesRef = collection(db, 'users', userId, 'sharedSpaces');
  const sharedSpacesSnapshot = await getDocs(sharedSpacesRef);

  const sharedSpaces = [];

  // Get the actual space data for each shared space reference
  for (const sharedSpaceDoc of sharedSpacesSnapshot.docs) {
    const sharedData = sharedSpaceDoc.data();
    const { spaceId, ownerId } = sharedData;

    try {
      // Get the actual space data from the owner's collection
      const spaceRef = doc(db, 'users', ownerId, 'spaces', spaceId);
      const spaceDoc = await getDoc(spaceRef);

      if (spaceDoc.exists()) {
        sharedSpaces.push({
          id: spaceId,
          ownerId,
          ...spaceDoc.data(),
          ...sharedData, // Include permissions, sharedAt, etc.
          isOwner: false,
          isShared: true,
        });
      }
    } catch (error) {
      console.warn(
        `Could not fetch shared space ${spaceId} from owner ${ownerId}:`,
        error
      );
    }
  }

  return sharedSpaces;
}

/**
 * Remove all shared references when a space is deleted
 */
export async function removeAllSharedReferences(db, spaceId, sharedWithArray) {
  const promises = [];

  if (Array.isArray(sharedWithArray)) {
    for (const share of sharedWithArray) {
      if (share.userId) {
        promises.push(removeSharedSpaceReference(db, share.userId, spaceId));
      }
    }
  }

  await Promise.all(promises);
}
