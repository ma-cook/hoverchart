import { Router } from 'express';
import pool from '../db.js';

export const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  const { spaceId } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM spatial_cells WHERE space_id = $1`,
      [spaceId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List cells error:', err);
    res.status(500).json({ error: 'Failed to list cells' });
  }
});

router.delete('/:id', async (req, res) => {
  const { spaceId, id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM connections WHERE space_id = $1 AND cell_id = $2`, [spaceId, id]);
    await client.query(`DELETE FROM objects WHERE space_id = $1 AND cell_id = $2`, [spaceId, id]);
    await client.query(`DELETE FROM spatial_cells WHERE space_id = $1 AND id = $2`, [spaceId, id]);
    await client.query('COMMIT');
    res.json({ deleted: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete cell error:', err);
    res.status(500).json({ error: 'Failed to delete cell' });
  } finally {
    client.release();
  }
});

router.post('/', async (req, res) => {
  const { spaceId } = req.params;
  const { id, x, y, z, bounds } = req.body;
  if (!id || x === undefined || y === undefined || z === undefined) {
    return res.status(400).json({ error: 'id, x, y, and z are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO spatial_cells (id, space_id, x, y, z, bounds)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (space_id, id) DO NOTHING
       RETURNING *`,
      [id, spaceId, x, y, z, bounds || null]
    );
    if (result.rows.length === 0) {
      const existing = await pool.query(
        `SELECT * FROM spatial_cells WHERE space_id = $1 AND id = $2`,
        [spaceId, id]
      );
      return res.json(existing.rows[0]);
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create cell error:', err);
    res.status(500).json({ error: 'Failed to create cell' });
  }
});
