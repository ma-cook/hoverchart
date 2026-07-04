import { Router } from 'express';
import pool from '../db.js';

export const router = Router();

router.get('/', async (req, res) => {
  const userId = req.user.sub;
  try {
    const result = await pool.query(
      `SELECT o.* FROM organizations o
       LEFT JOIN org_members m ON m.org_id = o.id
       WHERE o.owner_id = $1 OR m.user_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List orgs error:', err);
    res.status(500).json({ error: 'Failed to list organizations' });
  }
});

router.post('/', async (req, res) => {
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

router.get('/:id', async (req, res) => {
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

router.post('/:id/members', async (req, res) => {
  const { id } = req.params;
  const { user_id, role } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });
  try {
    const result = await pool.query(
      `INSERT INTO org_members (org_id, user_id, role) VALUES ($1, $2, $3)
       ON CONFLICT (org_id, user_id) DO UPDATE SET role = $3
       RETURNING *`,
      [id, user_id, role || 'member']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

router.delete('/:id/members/:userId', async (req, res) => {
  const { id, userId } = req.params;
  try {
    await pool.query(
      `DELETE FROM org_members WHERE org_id = $1 AND user_id = $2`,
      [id, userId]
    );
    res.json({ deleted: true });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

router.post('/:id/invites', async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
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

router.get('/:id/invites', async (req, res) => {
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
