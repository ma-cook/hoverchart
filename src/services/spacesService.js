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
    console.error('Error migrating data to default space:', error);
    return false;
  }
};

// Get public space metadata without authentication - simplified approach
export const getPublicSpaceMetadata = async (spaceId) => {
  if (!spaceId) return null;

  try {
    console.log('🔍 getPublicSpaceMetadata called with spaceId:', spaceId);

    // Instead of using collection group queries, try a direct approach
    // We'll check the known owner first (if available from session storage)
    const sessionOwner = sessionStorage.getItem(`sharedSpaceOwner_${spaceId}`);

    if (sessionOwner) {
      console.log('📋 Found cached owner from session:', sessionOwner);
      try {
        const spaceRef = doc(db, 'users', sessionOwner, 'spaces', spaceId);
        const spaceDoc = await getDoc(spaceRef);

        if (spaceDoc.exists()) {
          const data = spaceDoc.data();
          console.log('📋 Space data from cached owner:', data);

          if (
            data.isPublic &&
            data.sharedWith &&
            data.sharedWith.includes('everyone')
          ) {
            console.log('✅ Found matching public space! Owner:', sessionOwner);
            return {
              id: spaceDoc.id,
              ...data,
              ownerId: sessionOwner,
            };
          }
        }
      } catch (error) {
        console.log('❌ Failed to fetch with cached owner:', error.message);
      }
    }

    // For now, try with a hardcoded owner ID from your example
    // This is a temporary workaround - in production you'd want to implement
    // a proper public spaces index
    const knownOwnerIds = [
      'VsKDyU5XjiNYHzKVuwVanCPd90A2', // Your owner ID from the example
    ];

    for (const ownerId of knownOwnerIds) {
      console.log('🔍 Checking space with owner:', ownerId);
      try {
        const spaceRef = doc(db, 'users', ownerId, 'spaces', spaceId);
        const spaceDoc = await getDoc(spaceRef);

        if (spaceDoc.exists()) {
          const data = spaceDoc.data();
          console.log('📋 Space data:', data);

          if (
            data.isPublic &&
            data.sharedWith &&
            data.sharedWith.includes('everyone')
          ) {
            console.log('✅ Found matching public space! Owner:', ownerId);
            return {
              id: spaceDoc.id,
              ...data,
              ownerId: ownerId,
            };
          }
        }
      } catch (error) {
        console.log('❌ Failed to check owner', ownerId, ':', error.message);
      }
    }

    console.log('❌ No matching public space found for:', spaceId);
    return null;
  } catch (error) {
    console.error('💥 Error getting public space metadata:', error);
    return null;
  }
};
