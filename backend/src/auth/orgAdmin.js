// Organization-level admin authorization.
//
// Distinct from application admin (see auth/admin.js). An org admin may only
// act on a single organization they administer; this grants nothing on other
// orgs and nothing on the platform-wide admin surface.
//
// Two things make someone an admin of one organization:
//   1. They are the organization's `owner_id`.
//   2. They are a member whose `org_members.role` is 'admin'.
//
// Any `role` value other than 'admin' ('member', NULL, anything else) is a
// non-admin, so a corrupted or unexpected role string fails closed.

import pool from '../db.js';

const ORG_ADMIN_EXISTS = `
  SELECT 1
  FROM organizations o
  LEFT JOIN org_members m ON m.org_id = o.id AND m.user_id = $2
  WHERE o.id = $1 AND (o.owner_id = $2 OR m.role = 'admin')
  LIMIT 1`;

export async function isOrgAdmin(orgId, userId) {
  if (!orgId || !userId) return false;
  const { rows } = await pool.query(ORG_ADMIN_EXISTS, [orgId, userId]);
  return rows.length > 0;
}

// Owner or any member. Used to gate read access to an organization's own
// record and member list.
export async function isOrgMember(orgId, userId) {
  if (!orgId || !userId) return false;
  const { rows } = await pool.query(
    `SELECT 1
     FROM organizations o
     LEFT JOIN org_members m ON m.org_id = o.id AND m.user_id = $2
     WHERE o.id = $1 AND (o.owner_id = $2 OR m.user_id = $2)
     LIMIT 1`,
    [orgId, userId]
  );
  return rows.length > 0;
}

// Every organization the user administers, newest first.
export async function listOrgAdminOrgIds(userId) {
  if (!userId) return [];
  const { rows } = await pool.query(
    `SELECT o.id
     FROM organizations o
     LEFT JOIN org_members m ON m.org_id = o.id AND m.user_id = $1
     WHERE o.owner_id = $1 OR m.role = 'admin'
     ORDER BY o.created_at DESC`,
    [userId]
  );
  return rows.map((row) => row.id);
}

// Guard for routes that need a real (non-guest) account.
//
// `authenticate` populates `req.user` for real accounts and `req.guest` for
// guest tokens, so a guest request reaches route handlers with `req.user`
// undefined. Without this, any handler that reads `req.user.sub` throws a 500
// instead of a clean 403. Guest tokens carry no identity to authorize against,
// so they are rejected outright.
export function requireUser(req, res, next) {
  if (req.guest || !req.user) {
    return res.status(403).json({ error: 'An account is required' });
  }
  next();
}

// Guard for organization-scoped mutating routes. Mount after `authenticate`.
// Reads the org id from `req.params.id`, so it must be mounted on a router/path
// where the organization id is the `id` parameter.
//
// Returns 403 (not 404) for a non-member: this endpoint's job is to answer an
// authorization question, and a distinct "forbidden" is more useful to the
// client than a misleading "not found".
export async function requireOrgAdmin(req, res, next) {
  const orgId = req.params.id;
  if (!orgId) return res.status(400).json({ error: 'Organization id is required' });
  if (req.guest || !req.user) {
    return res.status(403).json({ error: 'Organization admin access required' });
  }
  try {
    if (!(await isOrgAdmin(orgId, req.user.sub))) {
      return res.status(403).json({ error: 'Organization admin access required' });
    }
    next();
  } catch (err) {
    console.error('Org admin check error:', err);
    res.status(500).json({ error: 'Failed to verify organization access' });
  }
}

// Guard for organization-scoped reads. Members (including admins and the
// owner) may read; non-members may not.
export async function requireOrgMember(req, res, next) {
  const orgId = req.params.id;
  if (!orgId) return res.status(400).json({ error: 'Organization id is required' });
  if (req.guest || !req.user) {
    return res.status(403).json({ error: 'Organization access required' });
  }
  try {
    if (!(await isOrgMember(orgId, req.user.sub))) {
      return res.status(403).json({ error: 'Organization access required' });
    }
    next();
  } catch (err) {
    console.error('Org member check error:', err);
    res.status(500).json({ error: 'Failed to verify organization access' });
  }
}

// True when the user administers at least one organization.
export async function isAnyOrgAdmin(userId) {
  const ids = await listOrgAdminOrgIds(userId);
  return ids.length > 0;
}