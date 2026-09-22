import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import pool from '../db.js';
import { triggerScanner } from '../scanner/trigger.js';

export const router = Router();

const ACTIVE_STATUSES = ['queued', 'fetching', 'parsing', 'generating', 'uploading'];
const TIER_LIMITS = { free: 1, pro: 3 };

const REPO_NAME_RE = /^[A-Za-z0-9._-]{1,100}$/;

// GitHub features require a real (non-guest) signed-in account with a stored
// server-side token (used to scan the repo in the scanner service).
function requireConnected(req, res) {
  if (!req.user || req.user.isGuest) {
    res.status(401).json({ error: 'GitHub requires a signed-in account' });
    return false;
  }
  return true;
}

async function activeCount(ownerId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS n
     FROM scan_jobs
     WHERE owner_id = $1 AND status = ANY($2::text[])`,
    [ownerId, ACTIVE_STATUSES]
  );
  return rows[0]?.n || 0;
}

async function tierLimit(ownerId) {
  const { rows } = await pool.query('SELECT tier FROM users WHERE id = $1', [ownerId]);
  return TIER_LIMITS[rows[0]?.tier] ?? TIER_LIMITS.free;
}

const RESCAN_NEEDED = 'No previous scan to increment against — run a full scan first';

const JOB_COLUMNS = `id, space_id, repo_owner, repo_name, branch, is_rescan,
       base_commit_sha, changed_file_count, status, progress, stage,
       error, markdown_storage_url, objects_created, connections_created,
       created_at, updated_at, sha`;

// GET /api/scan-jobs?spaceId=&status= — recent scan jobs for the user
router.get('/', async (req, res) => {
  if (!requireConnected(req, res)) return;
  const userId = req.user.sub;
  try {
    const params = [userId];
    let where = 'owner_id = $1';
    if (req.query.spaceId) {
      params.push(req.query.spaceId);
      where += ` AND space_id = $${params.length}`;
    }
    if (req.query.status) {
      params.push(req.query.status);
      where += ` AND status = $${params.length}`;
    }
    const { rows } = await pool.query(
      `SELECT ${JOB_COLUMNS}
       FROM scan_jobs
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT 50`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('List scan jobs error:', err);
    res.status(500).json({ error: 'Failed to list scan jobs' });
  }
});

// GET /api/scan-jobs/:id — poll endpoint for the background-scan UI
router.get('/:id', async (req, res) => {
  if (!requireConnected(req, res)) return;
  try {
    const { rows } = await pool.query(
      `SELECT ${JOB_COLUMNS}
       FROM scan_jobs
       WHERE id = $1 AND owner_id = $2`,
      [req.params.id, req.user.sub]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Scan job not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Get scan job error:', err);
    res.status(500).json({ error: 'Failed to get scan job' });
  }
});

// POST /api/scan-jobs — enqueue a background repository scan
router.post('/', async (req, res) => {
  if (!requireConnected(req, res)) return;
  const userId = req.user.sub;
  const { spaceId, repoOwner, repoName, branch, rescan = false } = req.body || {};
  if (!spaceId || !repoOwner || !repoName) {
    return res.status(400).json({ error: 'spaceId, repoOwner and repoName are required' });
  }
  if (!REPO_NAME_RE.test(repoOwner) || !REPO_NAME_RE.test(repoName)) {
    return res.status(400).json({ error: 'Invalid repository owner/name' });
  }

  try {
    const space = await pool.query(
      `SELECT id, markdown_storage_url, diagram_commit_sha, diagram_repo
       FROM spaces WHERE id = $1 AND owner_id = $2`,
      [spaceId, userId]
    );
    if (space.rows.length === 0) {
      return res.status(404).json({ error: 'Space not found or not owned by you' });
    }

    const tokens = await pool.query(
      'SELECT 1 FROM github_tokens WHERE owner_id = $1',
      [userId]
    );
    if (tokens.rows.length === 0) {
      return res.status(401).json({ error: 'Connect GitHub to start background scans' });
    }

    const spaceRow = space.rows[0];
    const baseCommitSha = rescan ? spaceRow.diagram_commit_sha : null;
    if (rescan && !baseCommitSha) {
      return res.status(400).json({ error: RESCAN_NEEDED });
    }

    const [active, limit] = await Promise.all([activeCount(userId), tierLimit(userId)]);
    if (active >= limit) {
      return res.status(429).json({
        error: `Scan limit reached (${limit} concurrent on your plan)`,
        active,
        limit,
      });
    }

    const id = randomUUID();
    const { rows } = await pool.query(
      `INSERT INTO scan_jobs (id, owner_id, space_id, repo_owner, repo_name, branch, is_rescan, base_commit_sha)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, userId, spaceId, repoOwner, repoName, branch || null, rescan, baseCommitSha]
    );
    const job = rows[0];

    // Fire the scanner as soon as the row exists; the steward re-triggers stale
    // queued jobs if the first attempt never lands (crash/scale-to-zero).
    triggerScanner(id).catch((err) => console.error('Trigger scan failed:', err.message));

    res.status(202).json(job);
  } catch (err) {
    console.error('Create scan job error:', err);
    res.status(500).json({ error: 'Failed to create scan job' });
  }
});

// POST /api/scan-jobs/:id/cancel — stop a queued/in-flight scan
router.post('/:id/cancel', async (req, res) => {
  if (!requireConnected(req, res)) return;
  try {
    const { rows } = await pool.query(
      `UPDATE scan_jobs
       SET status = 'cancelled', stage = 'Cancelled', progress = LEAST(progress, 100), updated_at = NOW()
       WHERE id = $1 AND owner_id = $2 AND status = ANY($3::text[])
       RETURNING *`,
      [req.params.id, req.user.sub, ACTIVE_STATUSES]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Scan job not found or no longer active' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Cancel scan job error:', err);
    res.status(500).json({ error: 'Failed to cancel scan job' });
  }
});