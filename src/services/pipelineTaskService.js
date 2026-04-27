import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
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
      // Treat tasks with no status as queued (legacy tasks positioned before status was added)
      return !status || status === TASK_STATUS.QUEUED;
    }
  ) || null;
}

/**
 * Returns the next task that still needs pipeline work. This includes not only
 * freshly QUEUED tasks but also IN_PROGRESS / PR_OPEN tasks that were left
 * in-flight on a prior run (e.g. the app was refreshed while GitHub auto-merged
 * the PR). The pipeline must pick these up again so the merge can be detected
 * and the next queued task can advance.
 */
export function getNextActionableTask(tasks) {
  return tasks.find(
    (task) => {
      const status = task.merfolkData?.status;
      if (!status) return true; // legacy tasks with no status
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

  // Synchronously mirror the new status into the local objects store. Without
  // this, callers that immediately invoke repositionAllTasks() after a status
  // change would re-sort using stale local data (the Firestore snapshot
  // listener hasn't fired yet, and the _repoLocalUpdate shield in App.jsx
  // would even ignore the snapshot once it does arrive). That caused merged
  // tasks to land in active grid slots and active tasks to bump backwards.
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
