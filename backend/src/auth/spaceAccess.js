import pool from '../db.js';

const SPACE_ACCESS_SQL = `
  SELECT s.is_public,
         (s.owner_id = $2) AS is_owner,
         (s.shared_with @> $3::jsonb) AS is_shared_with,
         EXISTS (
           SELECT 1
           FROM organizations o
           LEFT JOIN org_members m ON m.org_id = o.id AND m.user_id = $2
           WHERE (o.owner_id = $2 OR m.user_id = $2)
             AND s.shared_with_orgs ? o.id::text
         ) AS is_shared_with_org
  FROM spaces s
  WHERE s.id = $1`;

export async function getSpaceAccess(spaceId, userId) {
  const id = userId || '';
  const { rows } = await pool.query(SPACE_ACCESS_SQL, [spaceId, id, JSON.stringify([id])]);
  return rows[0] || null;
}

export function canReadSpace(space, userId) {
  if (!space) return false;
  if (space.is_public) return true;
  if (!userId) return false;
  return Boolean(space.is_owner || space.is_shared_with || space.is_shared_with_org);
}

export async function requireSpaceReadAccess(req, res, next) {
  const { spaceId } = req.params;
  if (!spaceId) return res.status(400).json({ error: 'Space id is required' });

  const userId = req.user?.sub || null;

  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    if (!userId || req.guest) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    return next();
  }

  try {
    const space = await getSpaceAccess(spaceId, userId);
    if (!space) return res.status(404).json({ error: 'Space not found' });
    if (canReadSpace(space, userId)) return next();
    return res.status(userId ? 403 : 401).json({
      error: userId ? 'Access denied' : 'Authentication required',
    });
  } catch (err) {
    console.error('Space access check error:', err);
    return res.status(500).json({ error: 'Failed to verify space access' });
  }
}
