import { Router } from 'express';
import pool from '../db.js';

export const router = Router();

// GET /api/plans?spaceId=X — get active plan + tasks for a space
router.get('/', async (req, res) => {
  const { spaceId } = req.query;
  if (!spaceId) return res.status(400).json({ error: 'spaceId is required' });

  try {
    // Get or create the active plan for this space
    let result = await pool.query(
      `SELECT * FROM plans WHERE space_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [spaceId]
    );

    let plan;
    if (result.rows.length === 0) {
      // Auto-create a plan for the space
      result = await pool.query(
        `INSERT INTO plans (space_id, title) VALUES ($1, 'Plan') RETURNING *`,
        [spaceId]
      );
      plan = result.rows[0];
    } else {
      plan = result.rows[0];
    }

    // Get all tasks for the plan
    const tasksResult = await pool.query(
      `SELECT * FROM plan_tasks WHERE plan_id = $1 ORDER BY sort_order ASC, created_at ASC`,
      [plan.id]
    );

    res.json({ ...plan, tasks: tasksResult.rows });
  } catch (err) {
    console.error('Get plan error:', err);
    res.status(500).json({ error: 'Failed to get plan' });
  }
});

// POST /api/plans — create a new plan (replaces existing for the space)
router.post('/', async (req, res) => {
  const { spaceId, title } = req.body;
  if (!spaceId) return res.status(400).json({ error: 'spaceId is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete existing plan and its tasks for this space
    const existing = await client.query(
      `SELECT id FROM plans WHERE space_id = $1`,
      [spaceId]
    );
    if (existing.rows.length > 0) {
      const oldPlanId = existing.rows[0].id;
      await client.query(`DELETE FROM plan_tasks WHERE plan_id = $1`, [oldPlanId]);
      await client.query(`DELETE FROM plans WHERE id = $1`, [oldPlanId]);
    }

    // Create new plan
    const result = await client.query(
      `INSERT INTO plans (space_id, title) VALUES ($1, $2) RETURNING *`,
      [spaceId, title || 'Plan']
    );

    await client.query('COMMIT');
    const plan = result.rows[0];
    res.status(201).json({ ...plan, tasks: [] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create plan error:', err);
    res.status(500).json({ error: 'Failed to create plan' });
  } finally {
    client.release();
  }
});

// PATCH /api/plans/:planId — update plan title
router.patch('/:planId', async (req, res) => {
  const { title } = req.body;
  try {
    const result = await pool.query(
      `UPDATE plans SET title = COALESCE($1, title), updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [title, req.params.planId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Plan not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update plan error:', err);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// POST /api/plans/:planId/tasks — add a task
router.post('/:planId/tasks', async (req, res) => {
  const { planId } = req.params;
  const { text, userId, userName, userPicture } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });

  try {
    // Get the space_id from the plan
    const planResult = await pool.query(`SELECT space_id FROM plans WHERE id = $1`, [planId]);
    if (planResult.rows.length === 0) return res.status(404).json({ error: 'Plan not found' });
    const spaceId = planResult.rows[0].space_id;

    // Get max sort_order
    const maxOrder = await pool.query(
      `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM plan_tasks WHERE plan_id = $1`,
      [planId]
    );

    const result = await pool.query(
      `INSERT INTO plan_tasks (plan_id, space_id, user_id, user_name, user_picture, text, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [planId, spaceId, userId || 'anonymous', userName || 'Anonymous', userPicture || null, text, maxOrder.rows[0].next_order]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add plan task error:', err);
    res.status(500).json({ error: 'Failed to add task' });
  }
});

// PATCH /api/plans/:planId/tasks/:taskId — update task (status, text)
router.patch('/:planId/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;

  try {
    let result;
    if (status === 'completed') {
      result = await pool.query(
        `UPDATE plan_tasks SET status = 'completed', completed_at = NOW()
         WHERE id = $1 RETURNING *`,
        [taskId]
      );
    } else if (status === 'todo') {
      result = await pool.query(
        `UPDATE plan_tasks SET status = 'todo', completed_at = NULL
         WHERE id = $1 RETURNING *`,
        [taskId]
      );
    } else {
      return res.status(400).json({ error: 'status must be "completed" or "todo"' });
    }

    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update plan task error:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/plans/:planId/tasks/:taskId — remove a task
router.delete('/:planId/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM plan_tasks WHERE id = $1 RETURNING id`,
      [taskId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ deleted: true, taskId });
  } catch (err) {
    console.error('Delete plan task error:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});
