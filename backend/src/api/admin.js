// Application admin API.
//
// Every route here is guarded by `requireAdmin` (see auth/admin.js), which is
// mounted in index.js ahead of this router. Application admins are configured
// via the ADMIN_EMAILS env var and can see and manage every user.
//
// This is the platform-wide admin surface only. Organization-scoped member
// management lives in api/organizations.js and is guarded separately by
// `requireOrgAdmin` — an organization admin has no access to anything here.

import { Router } from 'express';
import pool from '../db.js';

export const router = Router();

// Account tiers. Must stay in sync with TIER_LIMITS in scanJobs.js, which reads
// `users.tier` to gate background-scan concurrency.
const VALID_TIERS = new Set(['free', 'pro']);

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

function parsePaging(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.parseInt(query.limit, 10) || DEFAULT_LIMIT)
  );
  return { page, limit, offset: (page - 1) * limit };
}

// GET /api/admin/users?search=&page=&limit=
// Platform-wide user list, newest first. `search` matches email or display name
// case-insensitively. `total` is the count of all matches, not of this page.
router.get('/users', async (req, res) => {
  const { page, limit, offset } = parsePaging(req.query);
  const term = String(req.query.search || '').trim();
  const pattern = term ? `%${term}%` : null;

  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.display_name, u.photo_url, u.tier, u.created_at, u.updated_at,
              COALESCE(s.space_count, 0) AS space_count,
              COUNT(*) OVER () AS total_count
       FROM users u
       LEFT JOIN LATERAL (
         SELECT count(*)::int AS space_count FROM spaces sp WHERE sp.owner_id = u.id
       ) s ON TRUE
       WHERE $1::text IS NULL OR u.email ILIKE $1 OR u.display_name ILIKE $1
       ORDER BY u.created_at DESC
       LIMIT $2 OFFSET $3`,
      [pattern, limit, offset]
    );

    const total = result.rows.length > 0 ? Number(result.rows[0].total_count) : 0;
    // Drop the window-function column from each row; it is only for paging.
    const users = result.rows.map(({ total_count: _total, ...user }) => user);

    res.json({ users, total, page, limit });
  } catch (err) {
    console.error('Admin list users error:', err);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// PATCH /api/admin/users/:id/tier
router.patch('/users/:id/tier', async (req, res) => {
  const { id } = req.params;
  const { tier } = req.body || {};

  if (!VALID_TIERS.has(tier)) {
    return res.status(400).json({
      error: `tier must be one of: ${[...VALID_TIERS].join(', ')}`,
    });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET tier = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, display_name, photo_url, tier, created_at, updated_at`,
      [tier, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Admin update tier error:', err);
    res.status(500).json({ error: 'Failed to update user tier' });
  }
});

// Space-scoped tables to clear before deleting the spaces themselves.
// `objects`, `connections`, `spatial_cells` and `plan_tasks` were created with
// `REFERENCES spaces(id)` and NO ON DELETE CASCADE
// (migrations/001_initial.sql, migrations/002_plan_overlay.sql), so they must be
// removed explicitly or the space delete violates the foreign key. The others
// are cleared for completeness (some have cascades, some hold user ids).
const SPACE_CHILD_TABLES = [
  'user_presence',
  'chat_messages',
  'plan_tasks',
  'plans',
  'objects',
  'connections',
  'spatial_cells',
  'scan_jobs',
];

// Not every environment has every one of these tables (schema drift between the
// base and overlay migrations), and a missing table would otherwise make user
// deletion impossible. Filtering against information_schema keeps the delete
// working against whatever actually exists.
async function existingTables(client, names) {
  const { rows } = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = current_schema() AND table_name = ANY($1::text[])`,
    [names]
  );
  return new Set(rows.map((row) => row.table_name));
}

// DELETE /api/admin/users/:id
//
// Removes the user and everything they own. Runs as one transaction so a
// failure part-way leaves the database untouched.
//
// NOTE: this is not a durable block on the account. Google sign-in upserts on
// `users.id = <oauth sub>` (see auth/handlers.js), so a deleted Google user
// re-registers as a fresh account — tier reset to 'free', no spaces or orgs —
// the next time they sign in.
router.delete('/users/:id', async (req, res) => {
  const userId = req.params.id;

  // Guard against an admin locking themselves out of the only admin surface.
  if (userId === req.user.sub) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Spaces owned by the user. Everything below is keyed off these ids.
    const owned = await client.query('SELECT id FROM spaces WHERE owner_id = $1', [userId]);
    const spaceIds = owned.rows.map((row) => row.id);

    if (spaceIds.length > 0) {
      const tables = await existingTables(client, SPACE_CHILD_TABLES);
      for (const table of SPACE_CHILD_TABLES) {
        if (!tables.has(table)) continue;
        await client.query(`DELETE FROM ${table} WHERE space_id = ANY($1::uuid[])`, [
          spaceIds,
        ]);
      }
    }

    await client.query('DELETE FROM spaces WHERE owner_id = $1', [userId]);

    // Server-side GitHub token (backend/migrations/003).
    if ((await existingTables(client, ['github_tokens'])).has('github_tokens')) {
      await client.query('DELETE FROM github_tokens WHERE owner_id = $1', [userId]);
    }

    // Organizations they own, plus their memberships in other orgs.
    const orgsOwned = await client.query(
      'SELECT id FROM organizations WHERE owner_id = $1',
      [userId]
    );
    const ownedOrgIds = orgsOwned.rows.map((row) => row.id);
    const optionalOrgTables = await existingTables(client, ['org_invites', 'org_members']);
    if (ownedOrgIds.length > 0) {
      if (optionalOrgTables.has('org_invites')) {
        await client.query('DELETE FROM org_invites WHERE org_id = ANY($1::uuid[])', [
          ownedOrgIds,
        ]);
      }
      await client.query('DELETE FROM org_members WHERE org_id = ANY($1::uuid[])', [
        ownedOrgIds,
      ]);
      await client.query('DELETE FROM organizations WHERE id = ANY($1::uuid[])', [
        ownedOrgIds,
      ]);
    }
    await client.query('DELETE FROM org_members WHERE user_id = $1', [userId]);

    // Drop the deleted user from `spaces.shared_with`, which is a JSONB array of
    // user ids and so has no foreign key to clean up for us.
    await client.query(
      `UPDATE spaces SET shared_with = shared_with - $1 WHERE shared_with @> $1::jsonb`,
      [userId]
    );

    const deleted = await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [
      userId,
    ]);
    if (deleted.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    await client.query('COMMIT');
    res.json({ deleted: true, id: userId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Admin delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  } finally {
    client.release();
  }
});