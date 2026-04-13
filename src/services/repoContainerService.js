import useObjectsStore from '../stores/objectsStore';
import { saveObjectToCell, deleteObject } from './spatialObjectsService';
import { getCellCoordinates } from './spatialPartitioning';
import { TASK_STATUS } from './pipelineTaskService';

const CONTAINER_BASE_SCALE = [15, 15, 15];
const TASK_SPACING_Z = 4;
const TASK_OFFSET_Y = -1;
const REPO_OFFSET_X = 200;
const COLLAPSED_TASK_SCALE = [15, 3, 1];
const EXPANDED_TASK_SCALE = [25, 18, 1];
const TASK_FONT_SIZE = 42; // 30% larger than default 32

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

function getCellId(position) {
  const coords = getCellCoordinates(position);
  return `${coords.x},${coords.y},${coords.z}`;
}

/**
 * Find an existing repo container by repoSlug in the objects store.
 */
export function findRepoContainer(repoSlug) {
  const objects = useObjectsStore.getState().objects || [];
  return objects.find(
    (obj) => obj.merfolkData?.isRepoContainer && obj.merfolkData?.repoSlug === repoSlug
  ) || null;
}

/**
 * Count how many repo containers already exist, for positioning offset.
 */
function countRepoContainers() {
  const objects = useObjectsStore.getState().objects || [];
  return objects.filter((obj) => obj.merfolkData?.isRepoContainer).length;
}

/**
 * Create a repo container cube.
 * @param {string} owner - GitHub owner
 * @param {string} repo - GitHub repo name
 * @param {object} user - Firebase user
 * @param {string} currentSpaceId - Current space ID
 * @param {number[]} [positionOverride] - Optional [x,y,z] position; falls back to index-based offset
 * Returns the container object ID.
 */
export async function createRepoContainer(owner, repo, user, currentSpaceId, positionOverride) {
  const slug = `${owner}/${repo}`;

  // Skip if container already exists
  if (findRepoContainer(slug)) {
    console.log(`[repoContainerService] Container for ${slug} already exists`);
    return null;
  }

  const repoIndex = countRepoContainers();
  const position = positionOverride || [repoIndex * REPO_OFFSET_X, 0, 0];
  const cellId = getCellId(position);

  const containerId = generateId();
  const containerObj = {
    id: containerId,
    type: 'cube',
    position,
    scale: [...CONTAINER_BASE_SCALE],
    color: null,
    lineColor: '#4a9eff',
    lineWidth: 2,
    cellId,
    createdAt: Date.now(),
    headerText: slug,
    headerStyle: { fontSize: 1.5, color: '#4a9eff', underline: false },
    faceColors: { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null },
    faceTexts: { 0: '', 1: '', 2: '', 3: '', 4: '', 5: '' },
    faceTextStyles: {
      0: { fontSize: 0.5, color: 'black', underline: false },
      1: { fontSize: 0.5, color: 'black', underline: false },
      2: { fontSize: 0.5, color: 'black', underline: false },
      3: { fontSize: 0.5, color: 'black', underline: false },
      4: { fontSize: 0.5, color: 'black', underline: false },
      5: { fontSize: 0.5, color: 'black', underline: false },
    },
    merfolkData: {
      isRepoContainer: true,
      repoSlug: slug,
    },
  };

  // Add container to store
  const allNew = [containerObj];
  const store = useObjectsStore.getState();
  const currentObjects = store.objects || [];
  const newCreatedIds = new Set(store.createdObjectIds);
  allNew.forEach((obj) => newCreatedIds.add(obj.id));

  useObjectsStore.setState({
    objects: [...currentObjects, ...allNew],
    createdObjectIds: newCreatedIds,
    isInitialLoading: false,
  });

  // Persist all to Firebase
  if (!window.isTrialMode && user) {
    const spaceOwnerId = window.currentSpaceOwner || user.uid;
    for (const obj of allNew) {
      saveObjectToCell(spaceOwnerId, currentSpaceId, obj);
    }
  }

  return containerId;
}

/**
 * Create task TextObjects inside a repo container.
 * New tasks are placed at the front; existing tasks are pushed backward.
 * Returns array of created task object IDs.
 */
export async function createTaskObjects(tasks, repoSlug, user, currentSpaceId) {
  const container = findRepoContainer(repoSlug);
  if (!container) {
    console.error(`[repoContainerService] No container found for ${repoSlug}`);
    return [];
  }

  const store = useObjectsStore.getState();
  const allObjects = store.objects || [];

  // Find existing tasks for this repo
  const existingTasks = allObjects.filter(
    (obj) => obj.merfolkData?.planTaskIndex != null && obj.merfolkData?.repoSlug === repoSlug
  );

  const newTaskCount = tasks.length;
  const spaceOwnerId = !window.isTrialMode && user
    ? (window.currentSpaceOwner || user.uid)
    : null;

  // Push existing tasks backward
  const updatedObjects = allObjects.map((obj) => {
    if (existingTasks.some((t) => t.id === obj.id)) {
      const newPos = [
        obj.position[0],
        obj.position[1],
        obj.position[2] - newTaskCount * TASK_SPACING_Z,
      ];
      const updated = { ...obj, position: newPos, cellId: getCellId(newPos) };
      // Persist position change
      if (spaceOwnerId) {
        saveObjectToCell(spaceOwnerId, currentSpaceId, updated);
      }
      return updated;
    }
    return obj;
  });

  // Create new task objects at the front of the container
  const containerPos = container.position;
  const containerScale = container.scale;
  const frontZ = containerPos[2] + containerScale[2] * 5 - 3;
  const taskStartX = containerPos[0] - containerScale[0] * 4;

  const newTaskObjects = tasks.map((task, i) => {
    const taskPosition = [
      taskStartX,
      containerPos[1] + TASK_OFFSET_Y,
      frontZ - i * TASK_SPACING_Z,
    ];
    const taskCellId = getCellId(taskPosition);
    // Preserve all fields from planScape's TextObject format
    const bodyText = task.content || task.description || task.body || task.text || '';
    return {
      id: task.id || generateId(),
      type: 'text',
      position: taskPosition,
      scale: task.scale || [...COLLAPSED_TASK_SCALE],
      color: task.color || '#ffffff',
      cellId: taskCellId,
      createdAt: task.createdAt || Date.now(),
      headerText: task.headerText || `${task.index}. ${task.title}`,
      headerStyle: task.headerStyle || { fontSize: 2, color: 'black' },
      text: bodyText,
      content: bodyText,
      textStyle: task.textStyle || { fontSize: TASK_FONT_SIZE, color: 'black' },
      merfolkData: {
        planTaskIndex: task.index ?? task.merfolkData?.planTaskIndex,
        status: task.merfolkData?.status || 'queued',
        repoSlug,
        isExpanded: false,
        githubIssueNumber: task.merfolkData?.githubIssueNumber || null,
        githubPrNumber: task.merfolkData?.githubPrNumber || null,
      },
    };
  });

  // Expand container to fit all tasks
  const totalTasks = existingTasks.length + newTaskCount;
  const neededDepth = Math.max(CONTAINER_BASE_SCALE[2], (totalTasks * TASK_SPACING_Z + 6) / 10);
  const neededHeight = Math.max(CONTAINER_BASE_SCALE[1], 15);
  const neededWidth = Math.max(CONTAINER_BASE_SCALE[0], 20);

  const updatedContainerScale = [neededWidth, neededHeight, neededDepth];
  const finalObjects = updatedObjects.map((obj) => {
    if (obj.id === container.id) {
      const updated = { ...obj, scale: updatedContainerScale };
      if (spaceOwnerId) {
        saveObjectToCell(spaceOwnerId, currentSpaceId, updated);
      }
      return updated;
    }
    return obj;
  });

  // Add new task objects
  const newCreatedIds = new Set(store.createdObjectIds);
  newTaskObjects.forEach((obj) => newCreatedIds.add(obj.id));

  useObjectsStore.setState({
    objects: [...finalObjects, ...newTaskObjects],
    createdObjectIds: newCreatedIds,
    isInitialLoading: false,
  });

  // Persist new tasks
  if (spaceOwnerId) {
    for (const obj of newTaskObjects) {
      saveObjectToCell(spaceOwnerId, currentSpaceId, obj);
    }
  }

  return newTaskObjects.map((obj) => obj.id);
}

/**
 * Clear tasks for a repo: delete unmerged tasks entirely, bump merged tasks backward.
 * @param {string} repoSlug
 * @param {object} user - Firebase user
 * @param {string} currentSpaceId
 * @returns {{ deleted: number, bumped: number }}
 */
export async function clearRepoTasks(repoSlug, user, currentSpaceId) {
  const store = useObjectsStore.getState();
  const allObjects = store.objects || [];

  const repoTasks = allObjects.filter(
    (obj) => obj.merfolkData?.planTaskIndex != null && obj.merfolkData?.repoSlug === repoSlug
  );

  const merged = repoTasks.filter((t) => t.merfolkData?.status === TASK_STATUS.MERGED);
  const unmerged = repoTasks.filter((t) => t.merfolkData?.status !== TASK_STATUS.MERGED);
  const unmergedIds = new Set(unmerged.map((t) => t.id));

  const spaceOwnerId = !window.isTrialMode && user
    ? (window.currentSpaceOwner || user.uid)
    : null;

  // Delete unmerged from Firebase
  if (spaceOwnerId) {
    for (const task of unmerged) {
      deleteObject(spaceOwnerId, currentSpaceId, task.id, task.position);
    }
  }

  // Bump merged tasks backward and change their background to light green
  const bumpDistance = unmerged.length * TASK_SPACING_Z;
  const updatedObjects = allObjects
    .filter((obj) => !unmergedIds.has(obj.id))
    .map((obj) => {
      if (merged.some((m) => m.id === obj.id)) {
        const newPos = bumpDistance > 0
          ? [obj.position[0], obj.position[1], obj.position[2] - bumpDistance]
          : [...obj.position];
        const updated = {
          ...obj,
          position: newPos,
          cellId: getCellId(newPos),
          color: '#c8e6c9', // Light green for completed/merged tasks
        };
        if (spaceOwnerId) {
          saveObjectToCell(spaceOwnerId, currentSpaceId, updated);
        }
        return updated;
      }
      return obj;
    });

  const newCreatedIds = new Set(store.createdObjectIds);
  unmergedIds.forEach((id) => newCreatedIds.delete(id));

  useObjectsStore.setState({
    objects: updatedObjects,
    createdObjectIds: newCreatedIds,
  });

  // Create divider grid between current and merged tasks
  if (merged.length > 0) {
    await createDividerGrid(repoSlug, user, currentSpaceId);
  }

  return { deleted: unmerged.length, bumped: merged.length };
}

/**
 * Create a divider grid plane inside a repo container, separating current from previous tasks.
 * Placed between the last current task and the first merged task.
 */
export async function createDividerGrid(repoSlug, user, currentSpaceId) {
  const container = findRepoContainer(repoSlug);
  if (!container) return null;

  const store = useObjectsStore.getState();
  const allObjects = store.objects || [];

  // Find current (non-merged) and merged tasks
  const repoTasks = allObjects.filter(
    (obj) => obj.merfolkData?.planTaskIndex != null && obj.merfolkData?.repoSlug === repoSlug
  );
  const currentTasks = repoTasks.filter((t) => t.merfolkData?.status !== TASK_STATUS.MERGED);
  const mergedTasks = repoTasks.filter((t) => t.merfolkData?.status === TASK_STATUS.MERGED);

  if (mergedTasks.length === 0) return null;

  // Remove any existing divider
  const existingDividers = allObjects.filter(
    (obj) => obj.merfolkData?.isDividerGrid && obj.merfolkData?.repoSlug === repoSlug
  );
  const dividerIds = new Set(existingDividers.map((d) => d.id));

  // Position divider between last current task and first merged task
  const containerPos = container.position;
  // Find the boundary Z position
  const currentMinZ = currentTasks.length > 0
    ? Math.min(...currentTasks.map((t) => t.position[2]))
    : containerPos[2];
  const mergedMaxZ = Math.max(...mergedTasks.map((t) => t.position[2]));
  const dividerZ = (currentMinZ + mergedMaxZ) / 2;

  const dividerPosition = [
    containerPos[0],
    containerPos[1],
    dividerZ,
  ];
  const dividerCellId = getCellId(dividerPosition);
  const dividerId = generateId();

  const dividerObj = {
    id: dividerId,
    type: 'plane',
    position: dividerPosition,
    scale: [container.scale[0] * 8, 1, container.scale[1] * 8],
    rotation: [Math.PI / 2, 0, 0],
    color: '#d0d0d0',
    opacity: 0.4,
    cellId: dividerCellId,
    createdAt: Date.now(),
    merfolkData: {
      isDividerGrid: true,
      repoSlug,
    },
  };

  const spaceOwnerId = !window.isTrialMode && user
    ? (window.currentSpaceOwner || user.uid)
    : null;

  // Remove old dividers, add new one
  const filteredObjects = allObjects.filter((obj) => !dividerIds.has(obj.id));
  const newCreatedIds = new Set(store.createdObjectIds);
  dividerIds.forEach((did) => newCreatedIds.delete(did));
  newCreatedIds.add(dividerId);

  useObjectsStore.setState({
    objects: [...filteredObjects, dividerObj],
    createdObjectIds: newCreatedIds,
  });

  // Delete old dividers from Firebase
  if (spaceOwnerId) {
    for (const d of existingDividers) {
      deleteObject(spaceOwnerId, currentSpaceId, d.id, d.position);
    }
    saveObjectToCell(spaceOwnerId, currentSpaceId, dividerObj);
  }

  return dividerId;
}

/**
 * Toggle a task TextObject between collapsed (title only) and expanded (full description).
 * Returns the updated scale.
 */
export function toggleTaskExpansion(taskId) {
  const store = useObjectsStore.getState();
  const allObjects = store.objects || [];
  const task = allObjects.find((obj) => obj.id === taskId);
  if (!task || !task.merfolkData?.planTaskIndex) return null;

  const isExpanded = task.merfolkData?.isExpanded || false;
  const newScale = isExpanded ? [...COLLAPSED_TASK_SCALE] : [...EXPANDED_TASK_SCALE];

  const updated = {
    ...task,
    scale: newScale,
    merfolkData: {
      ...task.merfolkData,
      isExpanded: !isExpanded,
    },
  };

  useObjectsStore.setState({
    objects: allObjects.map((obj) => (obj.id === taskId ? updated : obj)),
  });

  // Persist
  const user = window.currentUser;
  const spaceId = window.currentSpaceId;
  if (!window.isTrialMode && user && spaceId) {
    const spaceOwnerId = window.currentSpaceOwner || user.uid;
    saveObjectToCell(spaceOwnerId, spaceId, updated);
  }

  return newScale;
}
