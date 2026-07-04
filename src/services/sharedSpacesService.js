import { api } from '../api-client';

// Cache shared space relationships to minimize database reads
const sharedSpacesCache = new Map();
const SHARED_SPACES_CACHE_MAX = 500;

/** Evict oldest entries (FIFO) when cache exceeds limit */
function sharedSpacesCacheSet(key, value) {
  sharedSpacesCache.set(key, value);
  if (sharedSpacesCache.size > SHARED_SPACES_CACHE_MAX) {
    // Map iterates in insertion order — first key is oldest
    const oldest = sharedSpacesCache.keys().next().value;
    sharedSpacesCache.delete(oldest);
  }
}

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
    const data = await api.get(`/api/spaces/${spaceId}`);

    if (data) {
      const ownerId = data.owner_id;

      // If the space is owned by the current user, it's not a shared space
      if (ownerId === currentUserId) {
        const result = { isShared: false, ownerId: currentUserId, permissions: 'write' };
        sharedSpacesCacheSet(cacheKey, result);
        return result;
      }

      // Check if the current user is in the sharedWith array
      let permissions = 'read';
      if (data.sharedWith && Array.isArray(data.sharedWith)) {
        const userShare = data.sharedWith.find(
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

          permissions = hasEditAccess ? 'write' : 'read';
        }
      }

      const result = {
        isShared: true,
        ownerId,
        permissions,
        spaceName: data.name,
      };

      sharedSpacesCacheSet(cacheKey, result);
      console.log(
        `Space is shared with user: ${currentUserId}, owner: ${ownerId}, permissions: ${result.permissions}`
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
      sharedSpacesCacheSet(cacheKey, result);
      return result;
    }

    // If we get here, the space doesn't exist or isn't shared with this user
    sharedSpacesCacheSet(cacheKey, { isShared: false, ownerId: null });
    return { isShared: false, ownerId: null };
  } catch (error) {
    console.error('Error checking if space is shared:', error);

    // Special handling for permission errors - could be a public space
    if (window.currentSpaceOwner) {
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
    const data = await api.get(`/api/spaces/${spaceId}`, { retries: 0 });

    if (data) {
      return {
        exists: true,
        ownerId: data.owner_id,
        location: 'api',
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

    // Check via API
    const data = await api.get(`/api/spaces/${spaceId}`);

    if (data) {
      console.log('Found space via API:', data);

      // Check if current user is already in sharedWith
      let userAlreadyShared = false;
      if (data.sharedWith && Array.isArray(data.sharedWith)) {
        userAlreadyShared = data.sharedWith.some(
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
          ...(data.sharedWith || []),
          {
            userId: currentUserId,
            permissions: ['view', 'edit'],
          },
        ];

        // Update the space document via API
        await api.patch(`/api/spaces/${spaceId}`, {
          sharedWith: updatedSharedWith,
        });

        console.log('Updated shared space via API');

        // Clear the cache for this space
        const cacheKey = `${currentUserId}_${spaceId}`;
        sharedSpacesCache.delete(cacheKey);

        return true;
      } else {
        console.log('Current user already in sharedWith list');
        return true;
      }
    }

    console.log('Creating new entry in sharedSpaces collection as fallback');

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
    const data = await api.get(`/api/spaces/${spaceId}`);
    if (data && data.owner_id) {
      return data.owner_id;
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

  console.log(`🔍 findSpaceOwner: Starting lookup for space: ${spaceId}`);
  console.log(`🔍 window.currentSpaceOwner: ${window.currentSpaceOwner}`);
  console.log(`🔍 window.publicAccessSpace: ${window.publicAccessSpace}`);
  console.log(`🔍 URL search params: ${window.location.search}`);

  try {
    // Method 1: Try API
    console.log(`🔍 Checking space via API: /api/spaces/${spaceId}`);
    const data = await api.get(`/api/spaces/${spaceId}`);

    if (data && data.owner_id) {
      console.log(
        `✅ Found space via API, owner: ${data.owner_id}`
      );
      console.log(`🔍 Space data:`, data);

      // Cache this for future use
      if (data.owner_id) {
        sessionStorage.setItem(
          `sharedSpaceOwner_${spaceId}`,
          data.owner_id
        );
        sessionStorage.setItem(`isPublicSpace_${spaceId}`, 'true');
        // Also set window globals for consistency
        window.currentSpaceOwner = data.owner_id;
        window.publicAccessSpace = spaceId;
      }

      return data.owner_id;
    } else {
      console.log(`❌ Space not found via API`);
    }

    // Method 2: Check sessionStorage cache
    const sessionOwner = sessionStorage.getItem(`sharedSpaceOwner_${spaceId}`);
    console.log(`🔍 Session storage owner: ${sessionOwner}`);
    if (sessionOwner) {
      console.log(`✅ Found session storage owner: ${sessionOwner}`);
      return sessionOwner;
    }

    // Method 3: Check URL parameters for owner hint
    const urlParams = new URLSearchParams(window.location.search);
    const ownerFromUrl = urlParams.get('ownerUid') || urlParams.get('owner');
    console.log(`🔍 URL owner parameter: ${ownerFromUrl}`);

    if (ownerFromUrl) {
      console.log(`✅ Found URL owner parameter: ${ownerFromUrl}`);
      return ownerFromUrl;
    }

    // Method 4: Check window globals (already loaded space data)
    if (window.currentSpaceOwner && window.publicAccessSpace === spaceId) {
      console.log(
        `✅ Found space owner from window globals: ${window.currentSpaceOwner}`
      );
      return window.currentSpaceOwner;
    }

    console.log(`Could not find owner for space: ${spaceId}`);
    return null;
  } catch (error) {
    console.error('Error finding space owner:', error);
    return null;
  }
};
