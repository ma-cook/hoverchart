import { Router } from 'express';
import pool from '../db.js';

export const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM updates ORDER BY created_at DESC LIMIT 20'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List updates error:', err);
    res.status(500).json({ error: 'Failed to list updates' });
  }
});

router.post('/', async (req, res) => {
  const { title, content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });
  try {
    const result = await pool.query(
      'INSERT INTO updates (title, content) VALUES ($1, $2) RETURNING *',
      [title || null, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create update error:', err);
    res.status(500).json({ error: 'Failed to create update' });
  }
});
