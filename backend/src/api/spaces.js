import { Router } from 'express';
import { Storage } from '@google-cloud/storage';
import pool from '../db.js';
import { buildSpaceSlug, uniqueSlug } from '../utils/slug.js';

export const router = Router();

const bucketName = process.env.GCS_BUCKET;
const storage = bucketName ? new Storage() : null;

/**
 * API-shape mapping: the frontend reads/writes camelCase for the diagram
 * persistence fields, while the DB (and the scanner worker) use snake_case.
 * Emitting both keeps the row backward-compatible for any snake_case readers.
 */
export function serializeSpace(row) {
  if (!row) return row;
  return {
    ...row,
    slug: row.slug || null,
    markdownStorageUrl: row.markdown_storage_url,
    repoContentsStorageUrl: row.repo_contents_storage_url,
    diagramCommitSha: row.diagram_commit_sha,
    diagramRepo: row.diagram_repo,
  };
}

// Accept either case from clients; the DB column + scanner worker use snake_case.
function pick(req, camel, snake) {
  return req.body[camel] !== undefined ? req.body[camel] : req.body[snake];
}

router.get('/', async (req, res) => {
  const userId = req.user.sub;
  try {
    const result = await pool.query(
      `SELECT * FROM spaces
       WHERE owner_id = $1 OR shared_with @> $2::jsonb
       ORDER BY updated_at DESC`,
      [userId, JSON.stringify([userId])]
    );
    res.json(result.rows.map(serializeSpace));
  } catch (err) {
    console.error('List spaces error:', err);
    res.status(500).json({ error: 'Failed to list spaces' });
  }
});

router.post('/', async (req, res) => {
  const userId = req.user.sub;
  const { name, is_public, metadata } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Derive the URL slug from the owner's display name + the space name. The
    // uniqueness check + insert share a transaction so two concurrent creates
    // can't observe the same free slug (the unique index is the backstop).
    const ownerResult = await client.query(
      `SELECT display_name, email FROM users WHERE id = $1`,
      [userId]
    );
    const base = buildSpaceSlug(ownerResult.rows[0] || {}, name);
    const slug = await uniqueSlug(base, async (candidate) => {
      const hit = await client.query(
        `SELECT 1 FROM spaces WHERE slug = $1`,
        [candidate]
      );
      return hit.rows.length > 0;
    });

    const result = await client.query(
      `INSERT INTO spaces (owner_id, name, is_public, metadata, slug)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, name, is_public || false, metadata || {}, slug]
    );
    await client.query('COMMIT');
    res.status(201).json(serializeSpace(result.rows[0]));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create space error:', err);
    res.status(500).json({ error: 'Failed to create space' });
  } finally {
    client.release();
  }
});

// Translate a human-readable slug into the canonical space UUID. Declared
// before `/:id` so the literal path wins. Minimal, non-owner-scoped metadata:
// the slug is the shareable capability, and the caller (browser) still needs
// its own credentials for the space's actual data routes.
router.get('/resolve/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, owner_id, name, is_public, metadata
       FROM spaces WHERE slug = $1`,
      [req.params.slug]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Space not found' });
    }
    const row = result.rows[0];
    res.json({
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      isPublic: row.is_public,
      metadata: row.metadata,
      type: row.metadata?.type || 'diagram',
    });
  } catch (err) {
    console.error('Resolve space error:', err);
    res.status(500).json({ error: 'Failed to resolve space' });
  }
});

router.get('/:id', async (req, res) => {
  const userId = req.user.sub;
  try {
    const result = await pool.query(
      `SELECT * FROM spaces WHERE id = $1 AND (owner_id = $2 OR shared_with @> $3::jsonb)`,
      [req.params.id, userId, JSON.stringify([userId])]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Space not found' });
    res.json(serializeSpace(result.rows[0]));
  } catch (err) {
    console.error('Get space error:', err);
    res.status(500).json({ error: 'Failed to get space' });
  }
});

router.patch('/:id', async (req, res) => {
  const userId = req.user.sub;
  const {
    name,
    is_public,
    shared_with,
    metadata,
    markdown_storage_url = pick(req, 'markdownStorageUrl', 'markdown_storage_url'),
    diagram_commit_sha = pick(req, 'diagramCommitSha', 'diagram_commit_sha'),
    diagram_repo = pick(req, 'diagramRepo', 'diagram_repo'),
  } = req.body;
  try {
    const result = await pool.query(
      `UPDATE spaces SET
        name = COALESCE($1, name),
        is_public = COALESCE($2, is_public),
        shared_with = COALESCE($3, shared_with),
        metadata = COALESCE($4, metadata),
        markdown_storage_url = COALESCE($5, markdown_storage_url),
        diagram_commit_sha = COALESCE($6, diagram_commit_sha),
        diagram_repo = COALESCE($7, diagram_repo),
        updated_at = NOW()
       WHERE id = $8 AND owner_id = $9
       RETURNING *`,
      [name, is_public, shared_with, metadata, markdown_storage_url, diagram_commit_sha, diagram_repo, req.params.id, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Space not found or not owner' });
    res.json(serializeSpace(result.rows[0]));
  } catch (err) {
    console.error('Update space error:', err);
    res.status(500).json({ error: 'Failed to update space' });
  }
});

router.delete('/:id', async (req, res) => {
  const userId = req.user.sub;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const auth = await client.query(
      `SELECT id, markdown_storage_url, repo_contents_storage_url
       FROM spaces WHERE id = $1 AND owner_id = $2`,
      [req.params.id, userId]
    );
    if (auth.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Space not found or not owner' });
    }

    const storedFiles = [
      auth.rows[0].markdown_storage_url,
      auth.rows[0].repo_contents_storage_url,
    ].filter((filePath) => filePath?.startsWith('uploads/'));

    const spaceId = req.params.id;
    await client.query(`DELETE FROM user_presence WHERE space_id = $1`, [spaceId]);
    await client.query(`DELETE FROM chat_messages WHERE space_id = $1`, [spaceId]);
    await client.query(`DELETE FROM objects WHERE space_id = $1`, [spaceId]);
    await client.query(`DELETE FROM connections WHERE space_id = $1`, [spaceId]);
    await client.query(`DELETE FROM spatial_cells WHERE space_id = $1`, [spaceId]);
    await client.query(`DELETE FROM spaces WHERE id = $1`, [spaceId]);

    await client.query('COMMIT');

    if (storage && storedFiles.length > 0) {
      await Promise.all(
        storedFiles.map((filePath) =>
          storage.bucket(bucketName).file(filePath).delete().catch((cleanupErr) => {
            if (cleanupErr.code !== 404) {
              console.warn(`[spaces] failed to delete ${filePath}: ${cleanupErr.message}`);
            }
          })
        )
      );
    }

    res.json({ deleted: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete space error:', err);
    res.status(500).json({ error: 'Failed to delete space' });
  } finally {
    client.release();
  }
});
