import { Router } from 'express';
import pool from '../db.js';

export const router = Router({ mergeParams: true });

// GET /api/users/:uid/spaces/:spaceId
router.get('/:uid/spaces/:spaceId', async (req, res) => {
  const userId = req.user.sub;
  const { uid, spaceId } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM spaces WHERE id = $1 AND (owner_id = $2 OR shared_with @> $3::jsonb)`,
      [spaceId, uid, JSON.stringify([userId])]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Space not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get user space error:', err);
    res.status(500).json({ error: 'Failed to get space' });
  }
});

// GET /api/users/:uid/shared-spaces/:spaceId
router.get('/:uid/shared-spaces/:spaceId', async (req, res) => {
  const userId = req.user.sub;
  const { uid, spaceId } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM spaces WHERE id = $1 AND shared_with @> $2::jsonb`,
      [spaceId, JSON.stringify([userId])]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Shared space not found' });
    const space = result.rows[0];
    res.json({ ...space, ownerId: space.owner_id });
  } catch (err) {
    console.error('Get shared space error:', err);
    res.status(500).json({ error: 'Failed to get shared space' });
  }
});
