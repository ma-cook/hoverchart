import { db } from '../firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  getDocs,
  where,
} from 'firebase/firestore';

// Generate a sharing URL for a space
export const generateSharingUrl = async (userId, spaceId) => {
  if (!userId || !spaceId) return null;

  try {
    // Verify the space exists
    const spaceRef = doc(db, 'users', userId, 'spaces', spaceId);
    const spaceDoc = await getDoc(spaceRef);

    if (!spaceDoc.exists()) {
      console.error('Space not found');
      return null;
    }

    // Base URL of the application
    const baseUrl = window.location.origin;

    // Generate the sharing URL with owner information
    const sharingUrl = new URL(baseUrl);

    // Add spaceId and shared flag
    sharingUrl.searchParams.append('spaceId', spaceId);
    sharingUrl.searchParams.append('shared', 'true');

    // Add the owner's user ID - use ownerUid explicitly to distinguish from the viewer's uid
    sharingUrl.searchParams.append('ownerUid', userId);

    return sharingUrl.toString();
  } catch (error) {
    console.error('Error generating sharing URL:', error);
    return null;
  }
};

// Get information about a shared space
export const getSharedSpaceInfo = async (spaceId) => {
  if (!spaceId) return null;

  try {
    const sharedSpacesRef = collection(db, 'sharedSpaces');
    const q = query(sharedSpacesRef, where('spaceId', '==', spaceId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    // Return the first matching sharing record
    return {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data(),
    };
  } catch (error) {
    console.error('Error getting shared space info:', error);
    return null;
  }
};
