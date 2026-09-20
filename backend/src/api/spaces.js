import { Router } from 'express';
import pool from '../db.js';

export const router = Router();

/**
 * API-shape mapping: the frontend reads/writes camelCase for the diagram
 * persistence fields, while the DB (and the scanner worker) use snake_case.
 * Emitting both keeps the row backward-compatible for any snake_case readers.
 */
export function serializeSpace(row) {
  if (!row) return row;
  return {
    ...row,
    markdownStorageUrl: row.markdown_storage_url,
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
  try {
    const result = await pool.query(
      `INSERT INTO spaces (owner_id, name, is_public, metadata)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, name, is_public || false, metadata || {}]
    );
    res.status(201).json(serializeSpace(result.rows[0]));
  } catch (err) {
    console.error('Create space error:', err);
    res.status(500).json({ error: 'Failed to create space' });
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
      `SELECT id FROM spaces WHERE id = $1 AND owner_id = $2`,
      [req.params.id, userId]
    );
    if (auth.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Space not found or not owner' });
    }

    const spaceId = req.params.id;
    await client.query(`DELETE FROM user_presence WHERE space_id = $1`, [spaceId]);
    await client.query(`DELETE FROM chat_messages WHERE space_id = $1`, [spaceId]);
    await client.query(`DELETE FROM objects WHERE space_id = $1`, [spaceId]);
    await client.query(`DELETE FROM connections WHERE space_id = $1`, [spaceId]);
    await client.query(`DELETE FROM spatial_cells WHERE space_id = $1`, [spaceId]);
    await client.query(`DELETE FROM spaces WHERE id = $1`, [spaceId]);

    await client.query('COMMIT');
    res.json({ deleted: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete space error:', err);
    res.status(500).json({ error: 'Failed to delete space' });
  } finally {
    client.release();
  }
});
