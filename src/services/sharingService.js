import { api } from '../api-client';

// Generate a sharing URL for a space
export const generateSharingUrl = async (userId, spaceId) => {
  if (!userId || !spaceId) return null;

  try {
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
    const data = await api.get(`/api/spaces/${spaceId}`, { retries: 0 });

    if (!data) return null;

    return {
      id: data.id || spaceId,
      ...data,
    };
  } catch (error) {
    console.error('Error getting shared space info:', error);
    return null;
  }
};
