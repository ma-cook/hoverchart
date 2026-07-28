import { api } from '../api-client';

export async function addSharedSpaceReference(db, userId, spaceId) {
  try {
    await api.patch(`/api/spaces/${spaceId}`, {
      shared_with: [userId],
    });
  } catch (err) {
    console.error('Failed to add shared space reference:', err);
  }
}

export async function removeSharedSpaceReference(db, userId, spaceId) {
  try {
    const space = await api.get(`/api/spaces/${spaceId}`, { retries: 0 }).catch(() => null);
    if (space) {
      const sharedWith = (space.shared_with || []).filter((id) => id !== userId);
      await api.patch(`/api/spaces/${spaceId}`, { shared_with: sharedWith });
    }
  } catch (err) {
    console.error('Failed to remove shared space reference:', err);
  }
}

export async function getSharedSpaces(db, userId) {
  try {
    const spaces = await api.get('/api/spaces');
    return spaces.filter((s) => s.owner_id !== userId);
  } catch { return []; }
}

export async function registerSharedSpaceFromUrl(db, userId, spaceId) {
  try {
    const space = await api.get(`/api/spaces/${spaceId}`, { retries: 0 }).catch(() => null);
    if (space) {
      await api.patch(`/api/spaces/${spaceId}`, {
        shared_with: [...new Set([...(space.shared_with || []), userId])],
      });
    }
  } catch (err) {
    console.error('Failed to register shared space:', err);
  }
}

export async function checkSharedSpaceAccess(db, userId, spaceId) {
  try {
    const space = await api.get(`/api/spaces/${spaceId}`, { retries: 0 }).catch(() => null);
    if (!space) return false;
    return space.owner_id === userId || (space.shared_with || []).includes(userId) || space.is_public;
  } catch { return false; }
}
