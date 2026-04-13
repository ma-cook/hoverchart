import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const TASK_STATUS = {
  QUEUED: 'queued',
  IN_PROGRESS: 'in-progress',
  PR_OPEN: 'pr-open',
  MERGED: 'merged',
  CLOSED: 'closed',
};

const STATUS_COLORS = {
  [TASK_STATUS.QUEUED]: '#9e9e9e',
  [TASK_STATUS.IN_PROGRESS]: '#2196f3',
  [TASK_STATUS.PR_OPEN]: '#ff9800',
  [TASK_STATUS.MERGED]: '#4caf50',
  [TASK_STATUS.CLOSED]: '#f44336',
};

const STATUS_LABELS = {
  [TASK_STATUS.QUEUED]: 'Queued',
  [TASK_STATUS.IN_PROGRESS]: 'In Progress',
  [TASK_STATUS.PR_OPEN]: 'PR Open',
  [TASK_STATUS.MERGED]: 'Merged',
  [TASK_STATUS.CLOSED]: 'Closed',
};

export function getStatusColor(status) {
  return STATUS_COLORS[status] || STATUS_COLORS[TASK_STATUS.QUEUED];
}

export function getStatusLabel(status) {
  return STATUS_LABELS[status] || 'Unknown';
}

export function isTaskObject(obj) {
  return obj?.merfolkData?.planTaskIndex != null;
}

export function getPipelineTasks(objects) {
  if (!objects) return [];
  return objects
    .filter((obj) => isTaskObject(obj))
    .sort((a, b) => a.merfolkData.planTaskIndex - b.merfolkData.planTaskIndex);
}

export function getNextQueuedTask(tasks) {
  return tasks.find(
    (task) => {
      const status = task.merfolkData?.status;
      // Treat tasks with no status as queued (legacy tasks positioned before status was added)
      return !status || status === TASK_STATUS.QUEUED;
    }
  ) || null;
}

export function getPipelineTasksForRepo(objects, repoSlug) {
  return getPipelineTasks(objects).filter(
    (obj) => obj.merfolkData?.repoSlug === repoSlug
  );
}

export function getRepoSlugsFromTasks(objects) {
  const tasks = getPipelineTasks(objects);
  const slugs = new Set();
  for (const task of tasks) {
    if (task.merfolkData?.repoSlug) {
      slugs.add(task.merfolkData.repoSlug);
    }
  }
  return [...slugs];
}

export async function updateTaskStatus(
  spaceOwnerId,
  spaceId,
  objectId,
  cellId,
  newStatus,
  extraFields = {}
) {
  const docRef = doc(
    db,
    'users',
    spaceOwnerId,
    'spaces',
    spaceId,
    'cells',
    cellId,
    'objects',
    objectId
  );

  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) {
    console.warn(`[pipelineTaskService] Object ${objectId} not found`);
    return false;
  }

  const data = snapshot.data();
  const updatedMerfolkData = {
    ...(data.merfolkData || {}),
    status: newStatus,
    ...extraFields,
  };

  await updateDoc(docRef, { merfolkData: updatedMerfolkData });
  return true;
}
