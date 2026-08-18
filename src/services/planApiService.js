import { api, onSocket, emitSocket } from '../api-client';

/**
 * Plan API service — CRUD for collaborative task plans + socket.io real-time sync.
 *
 * Backend contract (SQL):
 *   GET    /api/plans?spaceId=X         — get active plan + tasks
 *   POST   /api/plans                   — create plan (replaces existing for space)
 *   PATCH  /api/plans/:planId           — update plan title
 *   POST   /api/plans/:planId/tasks     — add task
 *   PATCH  /api/plans/:planId/tasks/:id — complete/uncomplete task
 *   DELETE /api/plans/:planId/tasks/:id — remove task
 *
 * Socket events (server → client):
 *   plan:task:created  — new task added
 *   plan:task:updated  — task status changed
 *   plan:task:deleted  — task removed
 *   plan:sync          — full plan state on connect
 */

// ── API calls ────────────────────────────────────────────────────────

export async function getPlan(spaceId) {
  const plan = await api.get('/api/plans', { params: { spaceId } });
  return plan;
}

export async function createPlanApi(spaceId, title) {
  const plan = await api.post('/api/plans', { spaceId, title });
  return plan;
}

export async function addTaskApi(planId, { text, userId, userName, userPicture }) {
  const task = await api.post(`/api/plans/${planId}/tasks`, {
    text,
    userId,
    userName,
    userPicture: userPicture || null,
  });
  return task;
}

export async function completeTaskApi(planId, taskId) {
  const task = await api.patch(`/api/plans/${planId}/tasks/${taskId}`, { status: 'completed' });
  return task;
}

export async function uncompleteTaskApi(planId, taskId) {
  const task = await api.patch(`/api/plans/${planId}/tasks/${taskId}`, { status: 'todo' });
  return task;
}

export async function removeTaskApi(planId, taskId) {
  await api.delete(`/api/plans/${planId}/tasks/${taskId}`);
  return taskId;
}

// ── Socket subscription ───────────────────────────────────────────────

export function subscribeToPlan(spaceId, callbacks) {
  const { onTaskCreated, onTaskUpdated, onTaskDeleted, onSync } = callbacks;

  const unsubs = [
    onSocket('plan:task:created', (data) => {
      if (data?.spaceId === spaceId) onTaskCreated?.(data.task);
    }),
    onSocket('plan:task:updated', (data) => {
      if (data?.spaceId === spaceId) onTaskUpdated?.(data.task);
    }),
    onSocket('plan:task:deleted', (data) => {
      if (data?.spaceId === spaceId) onTaskDeleted?.(data.taskId);
    }),
    onSocket('plan:sync', (data) => {
      onSync?.(data);
    }),
  ];

  return () => unsubs.forEach((fn) => fn?.());
}

// ── Emit helpers (client → server) ────────────────────────────────────

export function emitPlanTaskCreated(task, planId, spaceId) {
  emitSocket('plan:task:created', { task, planId, spaceId });
}

export function emitPlanTaskUpdated(task, planId, spaceId) {
  emitSocket('plan:task:updated', { task, planId, spaceId });
}

export function emitPlanTaskDeleted(taskId, planId, spaceId) {
  emitSocket('plan:task:deleted', { taskId, planId, spaceId });
}

export function emitPlanSync(spaceId) {
  emitSocket('plan:sync', { spaceId });
}
