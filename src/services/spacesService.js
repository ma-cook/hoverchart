import { api } from '../api-client';

// Get a space by ID - now handles shared spaces
export const getSpaceById = async (userId, spaceId) => {
  if (!userId || !spaceId) return null;

  try {
    const data = await api.get(`/api/spaces/${spaceId}`);

    if (data) {
      const isShared = data.owner_id !== userId;
      return {
        id: data.id || spaceId,
        ...data,
        isShared,
        ownerId: data.owner_id,
        permissions: isShared ? 'read' : 'owner',
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
    '❌ Space creation is disabled in this application. Space creation is handled by the landing page view.'
  );
  return null;
};

// Modify this function to only look up spaces, not create a default one
export const getOrCreateDefaultSpace = async (userId) => {
  if (!userId) return null;

  try {
    const spaces = await api.get('/api/spaces');

    if (spaces && spaces.length > 0) {
      return spaces[0];
    }

    return null;
  } catch (error) {
    console.error('Error getting spaces:', error);
    return null;
  }
};

// Migrate existing user data to default space - DISABLED: Migrations handled by landing page
export const migrateToDefaultSpace = async () => {
  console.error(
    '❌ Data migration is disabled in this application. Data migrations are handled by the landing page view.'
  );
  return false;
};

// Get user's spaces list
export const getUserSpaces = async (userId) => {
  if (!userId) return [];

  try {
    const spaces = await api.get('/api/spaces');
    return spaces || [];
  } catch (error) {
    console.error('Error getting user spaces:', error);
    return [];
  }
};

// Delete a space - DISABLED: Space management handled by landing page
export const deleteSpace = async () => {
  console.error(
    '❌ Space deletion is disabled in this application. Space management is handled by the landing page view.'
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
      console.log(' Found cached owner:', cachedOwner);
      try {
        const data = await api.get(`/api/spaces/${spaceId}`, { retries: 0 });

        if (data && data.isPublic && data.sharedWith?.includes('everyone')) {
          console.log('✅ Found public space using cached owner!');
          return {
            id: data.id || spaceId,
            ...data,
            ownerId: cachedOwner,
          };
        }
      } catch (error) {
        console.error('❌ Error using cached owner:', error);
      }
    }

    // Step 2: Try API directly
    console.log('📋 Step 2: Trying API...');
    try {
      const data = await api.get(`/api/spaces/${spaceId}`, { retries: 0 });

      if (data) {
        console.log('✅ Found public space via API!');

        // Cache this for future use
        sessionStorage.setItem(`sharedSpaceOwner_${spaceId}`, data.owner_id);
        sessionStorage.setItem(`isPublicSpace_${spaceId}`, 'true');

        return {
          id: data.id || spaceId,
          ...data,
          isPublic: true,
          sharedWith: ['everyone'],
          ownerId: data.owner_id,
        };
      }
    } catch (error) {
      console.error('❌ Error checking via API:', error);
    }

    // Step 3: Try sessionStorage cache
    console.log('📋 Step 3: Checking sessionStorage cache...');
    const sessionOwner = sessionStorage.getItem(`sharedSpaceOwner_${spaceId}`);
    if (sessionOwner) {
      console.log('📋 Found cached owner:', sessionOwner);
      try {
        const data = await api.get(`/api/spaces/${spaceId}`, { retries: 0 });

        if (data && data.isPublic && data.sharedWith?.includes('everyone')) {
          console.log('✅ Found public space using cached owner!');
          return {
            id: data.id || spaceId,
            ...data,
            ownerId: sessionOwner,
          };
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
