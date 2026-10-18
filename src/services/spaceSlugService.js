import { api } from '../api-client';

// The canonical internal space id is a UUID. Slugs are the human-readable,
// URL-facing alias ("john-doe-my-diagram") that must be translated to the UUID
// once at the entry boundary before anything keys off the id.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value) =>
  typeof value === 'string' && UUID_RE.test(value);

/**
 * Resolve a slug to `{ id, slug, ownerId, name, isPublic, type }`, or null if
 * it isn't a known slug. Never throws (callers treat failure as "not a slug").
 */
export const resolveSpaceSlug = async (slug) => {
  if (!slug || isUuid(slug)) return null;
  try {
    const data = await api.get(`/api/spaces/resolve/${encodeURIComponent(slug)}`, {
      retries: 0,
    });
    if (data && data.id) return { ...data, slug };
    return null;
  } catch {
    return null;
  }
};
