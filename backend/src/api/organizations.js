import { Router } from 'express';
import pool from '../db.js';
import { requireUser, requireOrgAdmin, requireOrgMember, isOrgAdmin } from '../auth/orgAdmin.js';

export const router = Router();

const VALID_ROLES = new Set(['admin', 'member']);

// How many admins the organization would still have if `targetUserId` were
// removed or demoted: the owner (if they aren't the target) plus any other
// member with role 'admin'. DISTINCT matters because an owner can also carry a
// role row, which would otherwise count them twice.
async function otherAdminCount(orgId, targetUserId) {
  const { rows } = await pool.query(
    `SELECT count(DISTINCT admin_id)::int AS n
     FROM (
       SELECT o.owner_id AS admin_id
       FROM organizations o
       WHERE o.id = $1 AND o.owner_id <> $2
       UNION
       SELECT m.user_id AS admin_id
       FROM organizations o
       JOIN org_members m ON m.org_id = o.id
       WHERE o.id = $1 AND m.role = 'admin' AND m.user_id <> $2
     ) AS remaining_admins`,
    [orgId, targetUserId]
  );
  return rows[0]?.n ?? 0;
}

// `requireUser` on every handler that reads `req.user.sub`: a guest token
// populates `req.guest` instead of `req.user`, so without it these would throw
// a 500 rather than reject cleanly.
router.get('/', requireUser, async (req, res) => {
  const userId = req.user.sub;
  try {
    // Includes `role` and `is_owner` for the CALLER so the client can tell
    // which organizations it administers without a second request. This is the
    // caller's own membership only, not other members'.
    const result = await pool.query(
      `SELECT o.*,
              (o.owner_id = $1) AS is_owner,
              COALESCE(m.role, CASE WHEN o.owner_id = $1 THEN 'admin' ELSE NULL END) AS "role"
       FROM organizations o
       LEFT JOIN org_members m ON m.org_id = o.id AND m.user_id = $1
       WHERE o.owner_id = $1 OR m.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List orgs error:', err);
    res.status(500).json({ error: 'Failed to list organizations' });
  }
});

router.post('/', requireUser, async (req, res) => {
  const userId = req.user.sub;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const result = await pool.query(
      `INSERT INTO organizations (name, owner_id) VALUES ($1, $2) RETURNING *`,
      [name, userId]
    );
    const org = result.rows[0];
    await pool.query(
      `INSERT INTO org_members (org_id, user_id, role) VALUES ($1, $2, 'admin')`,
      [org.id, userId]
    );
    res.status(201).json(org);
  } catch (err) {
    console.error('Create org error:', err);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

// GET /api/organizations/:id
// Restricted to the organization's own members — it exposes the member list.
router.get('/:id', requireOrgMember, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, COALESCE(json_agg(json_build_object('user_id', m.user_id, 'role', m.role, 'joined_at', m.joined_at)) FILTER (WHERE m.user_id IS NOT NULL), '[]') AS members
       FROM organizations o
       LEFT JOIN org_members m ON m.org_id = o.id
       WHERE o.id = $1
       GROUP BY o.id`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Organization not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get org error:', err);
    res.status(500).json({ error: 'Failed to get organization' });
  }
});

// GET /api/organizations/:id/users
// Organization-scoped user directory. This is the org admin's view: it returns
// only the users belonging to THIS organization, with the data needed to
// identify them. Application admins use /api/admin/users instead, which is not
// reachable from here.
//
// Read-only by design — promoting someone, editing a tier or removing an
// account are all either org-admin mutations below or application-admin only.
router.get('/:id/users', requireOrgAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT o.owner_id,
              COALESCE(json_agg(json_build_object(
                'id', u.id,
                'email', u.email,
                'display_name', u.display_name,
                'photo_url', u.photo_url,
                'tier', u.tier,
                'role', COALESCE(m.role, 'member'),
                'is_owner', (o.owner_id = u.id),
                'joined_at', m.joined_at
              ) ORDER BY m.joined_at ASC) FILTER (WHERE u.id IS NOT NULL), '[]') AS members
       FROM organizations o
       LEFT JOIN org_members m ON m.org_id = o.id
       LEFT JOIN users u ON u.id = m.user_id
       WHERE o.id = $1
       GROUP BY o.id`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Organization not found' });
    res.json({ orgId: id, members: result.rows[0].members });
  } catch (err) {
    console.error('List org users error:', err);
    res.status(500).json({ error: 'Failed to list organization users' });
  }
});

// The caller's own email, used to match a pending invite. The client never
// supplies the email, so an invite addressed to someone else can't be redeemed
// by passing a different address.
async function emailFor(userId) {
  const { rows } = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
  return rows[0]?.email || '';
}

// POST /api/organizations/:id/members
// Redeem a pending invite for YOURSELF.
//
// This is deliberately self-service only. It previously accepted an arbitrary
// `user_id` plus an arbitrary `role`, which let any authenticated user add
// themselves (or anyone) to any organization as an admin. Role assignment now
// lives on PATCH /:id/members/:userId, guarded by `requireOrgAdmin`.
//
// On success the invite is marked accepted rather than deleted, so the
// invitation cannot be redeemed a second time.
router.post('/:id/members', requireUser, async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body || {};
  const userId = req.user.sub;

  if (!user_id) return res.status(400).json({ error: 'user_id is required' });
  if (user_id !== userId) {
    return res.status(403).json({ error: 'Cannot add another user via this endpoint' });
  }

  try {
    const invite = await pool.query(
      `SELECT id FROM org_invites
       WHERE org_id = $1 AND lower(email) = lower($2) AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 1`,
      [id, await emailFor(userId)]
    );
    if (invite.rows.length === 0) {
      return res.status(403).json({ error: 'No pending invite for this account' });
    }

    const result = await pool.query(
      `INSERT INTO org_members (org_id, user_id, role) VALUES ($1, $2, 'member')
       ON CONFLICT (org_id, user_id) DO NOTHING
       RETURNING *`,
      [id, userId]
    );

    await pool.query(
      `UPDATE org_invites SET status = 'accepted' WHERE id = $1`,
      [invite.rows[0].id]
    );

    // Already a member: DO NOTHING returned no row, but the caller is in the
    // org either way, so report success.
    if (result.rows.length === 0) {
      const existing = await pool.query(
        'SELECT * FROM org_members WHERE org_id = $1 AND user_id = $2',
        [id, userId]
      );
      return res.json(existing.rows[0] || { org_id: id, user_id: userId });
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Accept invite error:', err);
    res.status(500).json({ error: 'Failed to join organization' });
  }
});

// PATCH /api/organizations/:id/members/:userId
// Change a member's role. Organization admins only — this is the endpoint that
// role assignment is restricted to.
//
// The owner is always an admin and cannot be demoted through this route.
router.patch('/:id/members/:userId', requireOrgAdmin, async (req, res) => {
  const { id, userId } = req.params;
  const { role } = req.body || {};

  if (!VALID_ROLES.has(role)) {
    return res.status(400).json({
      error: `role must be one of: ${[...VALID_ROLES].join(', ')}`,
    });
  }

  try {
    const target = await pool.query(
      'SELECT owner_id FROM organizations WHERE id = $1',
      [id]
    );
    if (target.rows.length === 0) return res.status(404).json({ error: 'Organization not found' });
    if (target.rows[0].owner_id === userId) {
      return res.status(400).json({ error: "The organization owner's role cannot be changed" });
    }

    const member = await pool.query(
      'SELECT role FROM org_members WHERE org_id = $1 AND user_id = $2',
      [id, userId]
    );
    if (member.rows.length === 0) return res.status(404).json({ error: 'Member not found' });

    // Refuse to leave the organization with no admin other than the owner.
    if (member.rows[0].role === 'admin' && role !== 'admin') {
      const others = await otherAdminCount(id, userId);
      if (others === 0) {
        return res.status(400).json({
          error: 'Cannot demote the last admin — promote another member first',
        });
      }
    }

    const result = await pool.query(
      `UPDATE org_members SET role = $1 WHERE org_id = $2 AND user_id = $3 RETURNING *`,
      [role, id, userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update member role error:', err);
    res.status(500).json({ error: 'Failed to update member role' });
  }
});

// DELETE /api/organizations/:id/members/:userId
// Allowed for organization admins removing someone else, and for any member
// removing themselves (leaving). The owner cannot be removed.
router.delete('/:id/members/:userId', requireUser, async (req, res) => {
  const { id, userId } = req.params;
  const callerId = req.user.sub;
  const isSelf = callerId === userId;

  try {
    const org = await pool.query(
      'SELECT owner_id FROM organizations WHERE id = $1',
      [id]
    );
    if (org.rows.length === 0) return res.status(404).json({ error: 'Organization not found' });

    if (!isSelf && !(await isOrgAdmin(id, callerId))) {
      return res.status(403).json({ error: 'Organization admin access required' });
    }

    if (org.rows[0].owner_id === userId) {
      return res.status(400).json({ error: "The organization owner cannot be removed" });
    }

    // Removing or demoting the final admin would leave the org unmanageable.
    const member = await pool.query(
      'SELECT role FROM org_members WHERE org_id = $1 AND user_id = $2',
      [id, userId]
    );
    if (member.rows.length > 0 && member.rows[0].role === 'admin') {
      const others = await otherAdminCount(id, userId);
      if (others === 0) {
        return res.status(400).json({
          error: 'Cannot remove the last admin — promote another member first',
        });
      }
    }

    await pool.query(
      'DELETE FROM org_members WHERE org_id = $1 AND user_id = $2',
      [id, userId]
    );
    res.json({ deleted: true });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// POST /api/organizations/:id/invites
router.post('/:id/invites', requireOrgAdmin, async (req, res) => {
  const { id } = req.params;
  const { email } = req.body || {};
  const userId = req.user.sub;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  try {
    const result = await pool.query(
      `INSERT INTO org_invites (org_id, email, invited_by) VALUES ($1, $2, $3) RETURNING *`,
      [id, email, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create invite error:', err);
    res.status(500).json({ error: 'Failed to create invite' });
  }
});

// GET /api/organizations/:id/invites
router.get('/:id/invites', requireOrgAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM org_invites WHERE org_id = $1 ORDER BY created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List invites error:', err);
    res.status(500).json({ error: 'Failed to list invites' });
  }
});