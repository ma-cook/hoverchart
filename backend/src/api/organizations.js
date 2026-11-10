import { Router } from 'express';
import pool from '../db.js';
import { requireUser, requireOrgAdmin, requireOrgMember, isOrgAdmin } from '../auth/orgAdmin.js';

export const router = Router();

const VALID_ROLES = new Set(['admin', 'member']);
const PLAN_LIMITS = { free: 3, team: 10, business: 50 };
const VALID_PLANS = new Set(Object.keys(PLAN_LIMITS));

function serializeOrg(row) {
  if (!row) return row;
  return {
    ...row,
    memberLimit: row.member_limit,
    memberCount: row.member_count,
    createdAt: row.created_at,
    ownerId: row.owner_id,
    isOwner: row.is_owner,
  };
}

async function memberCount(db, orgId) {
  const { rows } = await db.query(
    `SELECT count(*)::int AS n
     FROM (
       SELECT user_id FROM org_members WHERE org_id = $1
       UNION
       SELECT owner_id FROM organizations WHERE id = $1
     ) AS members`,
    [orgId]
  );
  return rows[0]?.n ?? 0;
}

async function belongsToAnyOrganization(db, userId, exceptOrgId = null) {
  const params = [userId];
  let sql = `SELECT 1
             FROM organizations o
             LEFT JOIN org_members m ON m.org_id = o.id AND m.user_id = $1
             WHERE o.owner_id = $1 OR m.user_id = $1`;
  if (exceptOrgId) {
    params.push(exceptOrgId);
    sql += ' AND o.id <> $2';
  }
  sql += ' LIMIT 1';
  const { rows } = await db.query(sql, params);
  return rows.length > 0;
}

async function emailFor(db, userId) {
  const { rows } = await db.query('SELECT email FROM users WHERE id = $1', [userId]);
  return rows[0]?.email || '';
}

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

router.get('/', requireUser, async (req, res) => {
  const userId = req.user.sub;
  try {
    const result = await pool.query(
      `SELECT o.*,
              (o.owner_id = $1) AS is_owner,
              COALESCE(m.role, CASE WHEN o.owner_id = $1 THEN 'admin' ELSE NULL END) AS "role",
              (SELECT count(*)::int
               FROM (
                 SELECT user_id FROM org_members WHERE org_id = o.id
                 UNION
                 SELECT o.owner_id
               ) AS members) AS member_count
       FROM organizations o
       LEFT JOIN org_members m ON m.org_id = o.id AND m.user_id = $1
       WHERE o.owner_id = $1 OR m.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );
    res.json(result.rows.map(serializeOrg));
  } catch (err) {
    console.error('List orgs error:', err);
    res.status(500).json({ error: 'Failed to list organizations' });
  }
});

router.post('/', requireUser, async (req, res) => {
  const userId = req.user.sub;
  const { name, plan = 'free' } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  if (!VALID_PLANS.has(plan)) {
    return res.status(400).json({ error: `plan must be one of: ${[...VALID_PLANS].join(', ')}` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (await belongsToAnyOrganization(client, userId)) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'You already belong to an organization. Leave it before creating another.',
      });
    }

    const result = await client.query(
      `INSERT INTO organizations (name, owner_id, plan, member_limit)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), userId, plan, PLAN_LIMITS[plan]]
    );
    const org = result.rows[0];
    await client.query(
      `INSERT INTO org_members (org_id, user_id, role) VALUES ($1, $2, 'admin')`,
      [org.id, userId]
    );
    await client.query('COMMIT');
    res.status(201).json(
      serializeOrg({ ...org, is_owner: true, role: 'admin', member_count: 1 })
    );
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create org error:', err);
    res.status(500).json({ error: 'Failed to create organization' });
  } finally {
    client.release();
  }
});

router.get('/pending-invites', requireUser, async (req, res) => {
  const userId = req.user.sub;
  try {
    const email = await emailFor(pool, userId);
    if (!email) return res.json([]);

    const result = await pool.query(
      `SELECT i.*,
              json_build_object(
                'id', o.id,
                'name', o.name,
                'plan', o.plan,
                'member_limit', o.member_limit,
                'owner_id', o.owner_id,
                'created_at', o.created_at,
                'member_count', (SELECT count(*)::int
                                 FROM (
                                   SELECT user_id FROM org_members WHERE org_id = o.id
                                   UNION
                                   SELECT o.owner_id
                                 ) AS members)
              ) AS org
       FROM org_invites i
       JOIN organizations o ON o.id = i.org_id
       WHERE lower(i.email) = lower($1) AND i.status = 'pending'
       ORDER BY i.created_at DESC`,
      [email]
    );

    res.json(
      result.rows.map(({ org, ...invite }) => ({
        org: serializeOrg(org),
        invite,
      }))
    );
  } catch (err) {
    console.error('List pending invites error:', err);
    res.status(500).json({ error: 'Failed to list pending invites' });
  }
});

router.get('/:id', requireOrgMember, async (req, res) => {
  try {
    const result = await pool.query(
      `WITH member_rows AS (
         SELECT o.owner_id AS user_id, 'admin' AS role, o.created_at AS joined_at
         FROM organizations o
         WHERE o.id = $1
         UNION ALL
         SELECT m.user_id, m.role, m.joined_at
         FROM org_members m
         WHERE m.org_id = $1
           AND m.user_id <> (SELECT owner_id FROM organizations WHERE id = $1)
       )
       SELECT o.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'userId', u.id,
                    'email', u.email,
                    'displayName', u.display_name,
                    'photoURL', u.photo_url,
                    'role', mr.role,
                    'joinedAt', mr.joined_at
                  )
                  ORDER BY mr.joined_at ASC NULLS LAST
                ) FILTER (WHERE u.id IS NOT NULL),
                '[]'
              ) AS members
       FROM organizations o
       LEFT JOIN member_rows mr ON TRUE
       LEFT JOIN users u ON u.id = mr.user_id
       WHERE o.id = $1
       GROUP BY o.id`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Organization not found' });
    res.json(serializeOrg(result.rows[0]));
  } catch (err) {
    console.error('Get org error:', err);
    res.status(500).json({ error: 'Failed to get organization' });
  }
});

router.get('/:id/users', requireOrgAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `WITH member_rows AS (
         SELECT o.owner_id AS user_id, 'admin' AS role, o.created_at AS joined_at
         FROM organizations o
         WHERE o.id = $1
         UNION ALL
         SELECT m.user_id, m.role, m.joined_at
         FROM org_members m
         WHERE m.org_id = $1
           AND m.user_id <> (SELECT owner_id FROM organizations WHERE id = $1)
       )
       SELECT o.owner_id,
              COALESCE(json_agg(json_build_object(
                'id', u.id,
                'email', u.email,
                'display_name', u.display_name,
                'photo_url', u.photo_url,
                'tier', u.tier,
                'role', mr.role,
                'is_owner', (o.owner_id = u.id),
                'joined_at', mr.joined_at
              ) ORDER BY mr.joined_at ASC NULLS LAST) FILTER (WHERE u.id IS NOT NULL), '[]') AS members
       FROM organizations o
       LEFT JOIN member_rows mr ON TRUE
       LEFT JOIN users u ON u.id = mr.user_id
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

router.post('/:id/members', requireUser, async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body || {};
  const userId = req.user.sub;

  if (!user_id) return res.status(400).json({ error: 'user_id is required' });
  if (user_id !== userId) {
    return res.status(403).json({ error: 'Cannot add another user via this endpoint' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const email = await emailFor(client, userId);
    const invite = await client.query(
      `SELECT id FROM org_invites
       WHERE org_id = $1 AND lower(email) = lower($2) AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 1`,
      [id, email]
    );
    if (invite.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'No pending invite for this account' });
    }

    const org = await client.query(
      'SELECT owner_id, member_limit FROM organizations WHERE id = $1',
      [id]
    );
    if (org.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Organization not found' });
    }

    const alreadyMember = await client.query(
      'SELECT 1 FROM org_members WHERE org_id = $1 AND user_id = $2',
      [id, userId]
    );
    if (alreadyMember.rows.length === 0) {
      if (await belongsToAnyOrganization(client, userId, id)) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: 'You already belong to an organization. Leave it before joining another.',
        });
      }
      if ((await memberCount(client, id)) >= org.rows[0].member_limit) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'This organization is at capacity.' });
      }
    }

    const result = await client.query(
      `INSERT INTO org_members (org_id, user_id, role) VALUES ($1, $2, 'member')
       ON CONFLICT (org_id, user_id) DO NOTHING
       RETURNING *`,
      [id, userId]
    );

    await client.query(
      `UPDATE org_invites SET status = 'accepted' WHERE id = $1`,
      [invite.rows[0].id]
    );
    await client.query('COMMIT');

    if (result.rows.length === 0) {
      const existing = await pool.query(
        'SELECT * FROM org_members WHERE org_id = $1 AND user_id = $2',
        [id, userId]
      );
      return res.json(existing.rows[0] || { org_id: id, user_id: userId });
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Accept invite error:', err);
    res.status(500).json({ error: 'Failed to join organization' });
  } finally {
    client.release();
  }
});

router.delete('/:id/invites', requireUser, async (req, res) => {
  const userId = req.user.sub;
  try {
    const email = await emailFor(pool, userId);
    const result = await pool.query(
      `UPDATE org_invites
       SET status = 'declined'
       WHERE org_id = $1 AND lower(email) = lower($2) AND status = 'pending'
       RETURNING id`,
      [req.params.id, email]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No pending invite for this account' });
    }
    res.json({ declined: true });
  } catch (err) {
    console.error('Decline invite error:', err);
    res.status(500).json({ error: 'Failed to decline invite' });
  }
});

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

    if (member.rows[0].role === 'admin' && role !== 'admin') {
      const others = await otherAdminCount(id, userId);
      if (others === 0) {
        return res.status(400).json({
          error: 'Cannot demote the last admin - promote another member first',
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

    const member = await pool.query(
      'SELECT role FROM org_members WHERE org_id = $1 AND user_id = $2',
      [id, userId]
    );
    if (member.rows.length > 0 && member.rows[0].role === 'admin') {
      const others = await otherAdminCount(id, userId);
      if (others === 0) {
        return res.status(400).json({
          error: 'Cannot remove the last admin - promote another member first',
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

router.post('/:id/invites', requireOrgAdmin, async (req, res) => {
  const { id } = req.params;
  const { email } = req.body || {};
  const userId = req.user.sub;
  if (!email || !email.trim()) return res.status(400).json({ error: 'Email is required' });
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }

  try {
    const org = await pool.query(
      'SELECT member_limit FROM organizations WHERE id = $1',
      [id]
    );
    if (org.rows.length === 0) return res.status(404).json({ error: 'Organization not found' });
    if ((await memberCount(pool, id)) >= org.rows[0].member_limit) {
      return res.status(409).json({ error: 'This organization is at capacity.' });
    }

    const existingMember = await pool.query(
      `SELECT 1
       FROM org_members m
       JOIN users u ON u.id = m.user_id
       WHERE m.org_id = $1 AND lower(u.email) = lower($2)
       LIMIT 1`,
      [id, normalizedEmail]
    );
    if (existingMember.rows.length > 0) {
      return res.status(409).json({ error: 'This user is already a member.' });
    }

    const existingInvite = await pool.query(
      `SELECT 1 FROM org_invites
       WHERE org_id = $1 AND lower(email) = lower($2) AND status = 'pending'
       LIMIT 1`,
      [id, normalizedEmail]
    );
    if (existingInvite.rows.length > 0) {
      return res.status(409).json({ error: 'An invite is already pending for this email.' });
    }

    const result = await pool.query(
      `INSERT INTO org_invites (org_id, email, invited_by) VALUES ($1, $2, $3) RETURNING *`,
      [id, normalizedEmail, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create invite error:', err);
    res.status(500).json({ error: 'Failed to create invite' });
  }
});

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

router.patch('/:id', requireOrgAdmin, async (req, res) => {
  const { plan } = req.body || {};
  if (!VALID_PLANS.has(plan)) {
    return res.status(400).json({ error: `plan must be one of: ${[...VALID_PLANS].join(', ')}` });
  }

  try {
    const count = await memberCount(pool, req.params.id);
    if (PLAN_LIMITS[plan] < count) {
      return res.status(400).json({
        error: `This plan allows ${PLAN_LIMITS[plan]} members, but the organization has ${count}.`,
      });
    }

    const result = await pool.query(
      `UPDATE organizations SET plan = $1, member_limit = $2 WHERE id = $3 RETURNING *`,
      [plan, PLAN_LIMITS[plan], req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Organization not found' });
    res.json(serializeOrg({ ...result.rows[0], member_count: count }));
  } catch (err) {
    console.error('Update org plan error:', err);
    res.status(500).json({ error: 'Failed to update organization plan' });
  }
});

router.delete('/:id', requireOrgAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const org = await client.query(
      'SELECT id, owner_id FROM organizations WHERE id = $1',
      [req.params.id]
    );
    if (org.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Organization not found' });
    }
    if (org.rows[0].owner_id !== req.user.sub) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Only the organization owner can delete it' });
    }

    await client.query('DELETE FROM org_invites WHERE org_id = $1', [req.params.id]);
    await client.query('DELETE FROM org_members WHERE org_id = $1', [req.params.id]);
    await client.query('DELETE FROM organizations WHERE id = $1', [req.params.id]);
    await client.query(
      `UPDATE spaces
       SET shared_with_orgs = shared_with_orgs - $1
       WHERE shared_with_orgs ? $1`,
      [req.params.id]
    );
    await client.query('COMMIT');
    res.json({ deleted: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete org error:', err);
    res.status(500).json({ error: 'Failed to delete organization' });
  } finally {
    client.release();
  }
});
