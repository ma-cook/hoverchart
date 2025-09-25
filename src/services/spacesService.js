import { db } from '../firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  getDocs,
  orderBy,
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

// Create a new space - DISABLED: Space creation handled by landing page
export const createSpace = async () => {
  console.error(
    '❌ Space creation is disabled in this application. Use the landing page (volscape.com) to create spaces.'
  );
  return null;
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

// Migrate existing user data to default space - DISABLED: Migrations handled by landing page
export const migrateToDefaultSpace = async () => {
  console.error(
    '❌ Data migration is disabled in this application. Use the landing page (volscape.com) for data migrations.'
  );
  return false;
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

// Delete a space - DISABLED: Space management handled by landing page
export const deleteSpace = async () => {
  console.error(
    '❌ Space deletion is disabled in this application. Use the landing page (volscape.com) to manage spaces.'
  );
  return false;
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
    // Step 1: Check sessionStorage cache first
    console.log('📋 Step 1: Checking sessionStorage cache...');
    const cachedOwner = sessionStorage.getItem(`sharedSpaceOwner_${spaceId}`);
    if (cachedOwner) {
      console.log('� Found cached owner:', cachedOwner);
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

    // Step 2: Try publicSpaces collection (main method)
    console.log('📋 Step 2: Trying publicSpaces collection...');
    try {
      const publicSpaceRef = doc(db, 'publicSpaces', spaceId);
      const publicSpaceDoc = await getDoc(publicSpaceRef);
      console.log(
        '📋 publicSpaces check complete. Document exists?',
        publicSpaceDoc.exists()
      );

      if (publicSpaceDoc.exists()) {
        const data = publicSpaceDoc.data();
        console.log('📋 publicSpaces data:', data);

        // publicSpaces collection contains public spaces by definition
        console.log('✅ Found public space in publicSpaces collection!');

        // Cache this for future use
        sessionStorage.setItem(`sharedSpaceOwner_${spaceId}`, data.ownerId);
        sessionStorage.setItem(`isPublicSpace_${spaceId}`, 'true');

        return {
          id: publicSpaceDoc.id,
          ...data,
          isPublic: true,
          sharedWith: ['everyone'],
        };
      }
    } catch (error) {
      console.error('❌ Error checking publicSpaces collection:', error);
    }

    // Step 3: Try sessionStorage cache
    console.log('📋 Step 3: Checking sessionStorage cache...');
    const sessionOwner = sessionStorage.getItem(`sharedSpaceOwner_${spaceId}`);
    if (sessionOwner) {
      console.log('📋 Found cached owner:', sessionOwner);
      try {
        const spaceRef = doc(db, 'users', sessionOwner, 'spaces', spaceId);
        const spaceDoc = await getDoc(spaceRef);

        if (spaceDoc.exists()) {
          const data = spaceDoc.data();
          if (data.isPublic && data.sharedWith?.includes('everyone')) {
            console.log('✅ Found public space using cached owner!');
            return {
              id: spaceDoc.id,
              ...data,
              ownerId: sessionOwner,
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
