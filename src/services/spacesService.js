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

// Migrate existing user data to default space (one-time operation)
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

    // Migrate objects to space
    const objectPromises = objectsSnapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      const objectRef = doc(
        db,
        'users',
        userId,
        'spaces',
        defaultSpace.id,
        'objects',
        docSnapshot.id
      );
      return setDoc(objectRef, data);
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
