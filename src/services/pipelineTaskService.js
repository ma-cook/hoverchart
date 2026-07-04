import { api } from '../api-client';
import useObjectsStore from '../stores/objectsStore';

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
  [TASK_STATUS.QUEUED]: 'Not Started',
  [TASK_STATUS.IN_PROGRESS]: 'In Progress',
  [TASK_STATUS.PR_OPEN]: 'Pending Merge',
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
      return !status || status === TASK_STATUS.QUEUED;
    }
  ) || null;
}

export function getNextActionableTask(tasks) {
  return tasks.find(
    (task) => {
      const status = task.merfolkData?.status;
      if (!status) return true;
      return (
        status === TASK_STATUS.QUEUED ||
        status === TASK_STATUS.IN_PROGRESS ||
        status === TASK_STATUS.PR_OPEN
      );
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
  const path = `/api/users/${spaceOwnerId}/spaces/${spaceId}/cells/${cellId}/objects/${objectId}`;

  let data;
  try {
    const response = await api.get(path);
    data = response.data || response;
  } catch {
    console.warn(`[pipelineTaskService] Object ${objectId} not found`);
    return false;
  }

  if (!data) {
    console.warn(`[pipelineTaskService] Object ${objectId} not found`);
    return false;
  }

  const updatedMerfolkData = {
    ...(data.merfolkData || {}),
    status: newStatus,
    ...extraFields,
  };

  await api.patch(path, { merfolkData: updatedMerfolkData });

  const objectsState = useObjectsStore.getState();
  const currentObjects = objectsState.objects || [];
  let didUpdate = false;
  const nextObjects = currentObjects.map((obj) => {
    if (obj.id !== objectId) return obj;
    didUpdate = true;
    return {
      ...obj,
      merfolkData: {
        ...(obj.merfolkData || {}),
        ...updatedMerfolkData,
      },
    };
  });
  if (didUpdate) {
    useObjectsStore.setState({ objects: nextObjects });
  }

  return true;
}
