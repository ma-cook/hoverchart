import { db } from '../firebase';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  getDocs,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { isSharedSpace } from './sharedSpacesService';

// Get a space by ID - now handles shared spaces
export const getSpaceById = async (userId, spaceId) => {
  if (!userId || !spaceId) return null;

  try {
    // First, check if this is a shared space
    const sharedStatus = await isSharedSpace(userId, spaceId);

    // If it's shared, use the owner's ID to access the space
    const ownerUserId = sharedStatus.isShared ? sharedStatus.ownerId : userId;

    const spaceRef = doc(db, 'users', ownerUserId, 'spaces', spaceId);
    const spaceDoc = await getDoc(spaceRef);

    if (spaceDoc.exists()) {
      return {
        id: spaceDoc.id,
        ...spaceDoc.data(),
        isShared: sharedStatus.isShared,
        ownerId: ownerUserId,
        // Include permission information if it's a shared space
        permissions: sharedStatus.isShared ? sharedStatus.permissions : 'owner',
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting space:', error);
    return null;
  }
};

// Create a new space
export const createSpace = async (userId, spaceName) => {
  if (!userId || !spaceName) return null;

  try {
    const spaceId = `space_${Date.now()}`;
    const spaceRef = doc(db, 'users', userId, 'spaces', spaceId);

    await setDoc(spaceRef, {
      name: spaceName,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });

    return spaceId;
  } catch (error) {
    console.error('Error creating space:', error);
    return null;
  }
};

// Modify this function to only look up spaces, not create a default one
export const getOrCreateDefaultSpace = async (userId) => {
  if (!userId) return null;

  try {
    // Check if any spaces exist
    const spacesRef = collection(db, 'users', userId, 'spaces');
    const q = query(spacesRef, orderBy('createdAt'));

    try {
      const snapshot = await getDocs(q);

      // If spaces exist, return the first one
      if (!snapshot.empty) {
        const firstSpace = snapshot.docs[0];
        return {
          id: firstSpace.id,
          ...firstSpace.data(),
        };
      }
    } catch (permissionError) {
      console.error('Permission error accessing spaces:', permissionError);
    }

    // No spaces exist and we're not creating a default one anymore
    return null;
  } catch (error) {
    console.error('Error getting spaces:', error);
    return null;
  }
};

// Migrate existing user data to default space using spatial partitioning (one-time operation)
export const migrateToDefaultSpace = async (userId) => {
  if (!userId) return false;

  try {
    // Get default space
    const defaultSpace = await getOrCreateDefaultSpace(userId);
    if (!defaultSpace) return false;

    // Get existing objects
    const objectsRef = collection(db, 'users', userId, 'objects');
    const objectsSnapshot = await getDocs(objectsRef);

    // Get existing connections
    const connectionsRef = collection(db, 'users', userId, 'connections');
    const connectionsSnapshot = await getDocs(connectionsRef);

    // Import spatial partitioning functions
    const { addObjectToCell } = await import('./spatialPartitioning');

    // Migrate objects to spatial cells instead of flat objects collection
    const objectPromises = objectsSnapshot.docs.map(async (docSnapshot) => {
      const data = docSnapshot.data();
      // Add object to appropriate cell based on its position
      if (data.position) {
        return addObjectToCell(userId, defaultSpace.id, {
          ...data,
          id: docSnapshot.id,
        });
      }
      // If object has no position, place it at origin
      return addObjectToCell(userId, defaultSpace.id, {
        ...data,
        id: docSnapshot.id,
        position: [0, 0, 0],
      });
    });

    // Migrate connections to space
    const connectionPromises = connectionsSnapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      const connectionRef = doc(
        db,
        'users',
        userId,
        'spaces',
        defaultSpace.id,
        'connections',
        docSnapshot.id
      );
      return setDoc(connectionRef, data);
    });

    // Execute all promises
    await Promise.all([...objectPromises, ...connectionPromises]);

    return true;
  } catch (error) {
    console.error('Error migrating to default space:', error);
    return false;
  }
};

// Get user's spaces list
export const getUserSpaces = async (userId) => {
  if (!userId) return [];

  try {
    const spacesRef = collection(db, 'users', userId, 'spaces');
    const q = query(spacesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting user spaces:', error);
    return [];
  }
};

// Delete a space
export const deleteSpace = async (userId, spaceId) => {
  if (!userId || !spaceId) return false;

  try {
    // TODO: Implement proper space deletion with cleanup
    // For now, just mark as deleted
    const spaceRef = doc(db, 'users', userId, 'spaces', spaceId);
    await setDoc(spaceRef, { deleted: true }, { merge: true });

    return true;
  } catch (error) {
    console.error('Error deleting space:', error);
    return false;
  }
};

// Check if space exists and user has access
export const hasSpaceAccess = async (userId, spaceId) => {
  if (!userId || !spaceId) return false;

  try {
    const space = await getSpaceById(userId, spaceId);
    return !!space;
  } catch (error) {
    console.error('Error checking space access:', error);
    return false;
  }
};

// Get public space metadata without authentication - comprehensive approach
export const getPublicSpaceMetadata = async (spaceId) => {
  if (!spaceId) {
    console.log('❌ getPublicSpaceMetadata: No spaceId provided');
    return null;
  }

  console.log('🔍 getPublicSpaceMetadata called with spaceId:', spaceId);

  try {
    // Step 1: Try the known owner directly first since we know the space exists
    const knownOwnerIds = [
      'VsKDyU5XjiNYHzKVuwVanCPd90A2', // Known admin/owner ID - this should find your space!
    ];

    console.log('📋 Step 1: Trying fallback with known owner IDs FIRST...');
    for (const ownerId of knownOwnerIds) {
      console.log('🔍 Checking space with fallback owner:', ownerId);
      try {
        const spaceRef = doc(db, 'users', ownerId, 'spaces', spaceId);
        console.log(
          '📋 Attempting to read:',
          `users/${ownerId}/spaces/${spaceId}`
        );

        // Add a timeout to catch hanging requests
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Firestore request timeout')),
            10000
          )
        );

        const spaceDoc = await Promise.race([getDoc(spaceRef), timeoutPromise]);
        console.log(
          '📋 getDoc call completed for known owner. Document exists?',
          spaceDoc.exists()
        );

        if (spaceDoc.exists()) {
          const data = spaceDoc.data();
          console.log('📋 Space data from fallback owner:', data);
          console.log('📋 isPublic:', data.isPublic);
          console.log('📋 sharedWith:', data.sharedWith);

          if (
            data.isPublic &&
            data.sharedWith &&
            data.sharedWith.includes('everyone')
          ) {
            console.log('✅ Found matching public space! Owner:', ownerId);
            // Cache this for future use
            sessionStorage.setItem(`sharedSpaceOwner_${spaceId}`, ownerId);
            sessionStorage.setItem(`isPublicSpace_${spaceId}`, 'true');
            return {
              id: spaceDoc.id,
              ...data,
              ownerId: ownerId,
            };
          } else {
            console.log('❌ Space exists but is not properly marked as public');
            console.log('   - isPublic:', data.isPublic);
            console.log(
              '   - sharedWith includes "everyone":',
              data.sharedWith?.includes('everyone')
            );
          }
        } else {
          console.log('📋 Space document does not exist at this path');
        }
      } catch (error) {
        console.error(
          '❌ Failed to check fallback owner',
          ownerId,
          ':',
          error.message
        );
        console.error('❌ Error details:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error name:', error.name);

        // Check for specific Firestore permission errors
        if (error.code === 'permission-denied') {
          console.error(
            '🚫 PERMISSION DENIED: Anonymous user cannot access this path'
          );
          console.error(
            '🚫 This indicates a Firestore rules issue for anonymous access'
          );
        } else if (error.code === 'unavailable') {
          console.error('📡 NETWORK ERROR: Firestore service unavailable');
        } else if (error.message?.includes('timeout')) {
          console.error('⏰ TIMEOUT: Firestore request took too long');
        }
      }
    }

    // Step 2: Try top-level spaces collection
    console.log('📋 Step 2: Trying top-level /spaces collection...');
    try {
      const topLevelSpaceRef = doc(db, 'spaces', spaceId);
      const topLevelDoc = await getDoc(topLevelSpaceRef);
      console.log(
        '📋 Top-level spaces check complete. Document exists?',
        topLevelDoc.exists()
      );

      if (topLevelDoc.exists()) {
        const data = topLevelDoc.data();
        console.log('📋 Top-level space data:', data);

        if (data.isPublic && data.sharedWith?.includes('everyone')) {
          console.log('✅ Found public space in top-level collection!');
          return {
            id: topLevelDoc.id,
            ...data,
            ownerId: data.ownerId || data.owner,
          };
        }
      }
    } catch (error) {
      console.error('❌ Error checking top-level spaces:', error);
    }

    // Step 3: Try sessionStorage cache
    console.log('📋 Step 3: Checking sessionStorage cache...');
    const cachedOwner = sessionStorage.getItem(`sharedSpaceOwner_${spaceId}`);
    if (cachedOwner) {
      console.log('📋 Found cached owner:', cachedOwner);
      try {
        const spaceRef = doc(db, 'users', cachedOwner, 'spaces', spaceId);
        const spaceDoc = await getDoc(spaceRef);

        if (spaceDoc.exists()) {
          const data = spaceDoc.data();
          if (data.isPublic && data.sharedWith?.includes('everyone')) {
            console.log('✅ Found public space using cached owner!');
            return {
              id: spaceDoc.id,
              ...data,
              ownerId: cachedOwner,
            };
          }
        }
      } catch (error) {
        console.error('❌ Error using cached owner:', error);
      }
    }

    console.log('❌ No matching public space found for:', spaceId);
    console.log(
      '❌ All lookup methods failed - space may not exist, not be public, or have permission issues'
    );
    return null;
  } catch (error) {
    console.error('💥 CRITICAL ERROR in getPublicSpaceMetadata:', error);
    console.error('💥 Error message:', error.message);
    console.error('💥 Error code:', error.code);
    console.error('💥 Error name:', error.name);
    console.error('💥 Stack trace:', error.stack);
    return null;
  }
};
