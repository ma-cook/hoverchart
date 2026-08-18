import pool from '../db.js';

export function registerPlanHandlers(io, socket) {
  // Client emits this after a REST call to broadcast the change to other users
  socket.on('plan:task:created', ({ task, planId, spaceId }) => {
    if (!spaceId || !task) return;
    socket.to(`space:${spaceId}`).emit('plan:task:created', { task, planId, spaceId });
  });

  socket.on('plan:task:updated', ({ task, planId, spaceId }) => {
    if (!spaceId || !task) return;
    socket.to(`space:${spaceId}`).emit('plan:task:updated', { task, planId, spaceId });
  });

  socket.on('plan:task:deleted', ({ taskId, planId, spaceId }) => {
    if (!spaceId || !taskId) return;
    socket.to(`space:${spaceId}`).emit('plan:task:deleted', { taskId, planId, spaceId });
  });

  // Fetch plan history on connect / space join
  socket.on('plan:sync', async ({ spaceId }) => {
    if (!spaceId) return;
    try {
      const planResult = await pool.query(
        `SELECT * FROM plans WHERE space_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [spaceId]
      );
      if (planResult.rows.length === 0) {
        socket.emit('plan:sync', { plan: null, tasks: [] });
        return;
      }
      const plan = planResult.rows[0];
      const tasksResult = await pool.query(
        `SELECT * FROM plan_tasks WHERE plan_id = $1 ORDER BY sort_order ASC, created_at ASC`,
        [plan.id]
      );
      socket.emit('plan:sync', { plan, tasks: tasksResult.rows });
    } catch (err) {
      console.error('Plan sync error:', err);
    }
  });
}
