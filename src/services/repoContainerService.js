import useObjectsStore from '../stores/objectsStore';
import { saveObjectToCell, deleteObject, updateThrottles } from './spatialObjectsService';
import { getCellCoordinates } from './spatialPartitioning';
import { TASK_STATUS } from './pipelineTaskService';

const CONTAINER_BASE_SCALE = [15, 15, 15];
const REPO_OFFSET_X = 200;
const COLLAPSED_TASK_SCALE = [4, 3, 1];
const EXPANDED_TASK_SCALE = [8, 18, 1];
const TASK_FONT_SIZE = 72;
const ARCHIVED_TASK_COLOR = '#c8e6c9'; // light green for cleared/merged tasks

// Grid layout constants
const GRID_COLS = 2;
const GRID_DEFAULT_ROWS = 2;
const GRID_CELL_PADDING = 5; // world units from container edge

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

function getCellId(position) {
  const coords = getCellCoordinates(position);
  return `${coords.x},${coords.y},${coords.z}`;
}

/**
 * Compute grid dimensions from active and merged task counts.
 * Front layer(s) hold active tasks; back layer(s) hold merged tasks.
 * Each layer is GRID_COLS wide × N rows tall.
 */
export function computeGridLayout(activeCount, mergedCount) {
  const activeRows = Math.max(GRID_DEFAULT_ROWS, Math.ceil(activeCount / GRID_COLS));
  const mergedPerLayer = GRID_COLS * GRID_DEFAULT_ROWS; // 4 per back layer
  const backLayers = mergedCount > 0 ? Math.max(1, Math.ceil(mergedCount / mergedPerLayer)) : 0;
  const totalLayers = 1 + backLayers; // 1 front + N back
  const totalRows = Math.max(GRID_DEFAULT_ROWS, activeRows);
  return { activeRows, backLayers, totalLayers, totalRows, cols: GRID_COLS };
}

/**
 * Compute container scale to fit the grid.
 */
function computeContainerScale(activeCount, mergedCount) {
  const { totalRows, totalLayers } = computeGridLayout(activeCount, mergedCount);
  // Each axis: scale * 10 = full extent in world units
  // Default [15,15,15] = 150 wu per axis, fits 2×2×2 grid (75 wu per cell)
  const baseCell = 75; // world units per cell at default scale
  const neededX = (GRID_COLS * baseCell + GRID_CELL_PADDING * 2) / 10;
  const neededY = (totalRows * baseCell + GRID_CELL_PADDING * 2) / 10;
  const neededZ = (Math.max(2, totalLayers) * baseCell + GRID_CELL_PADDING * 2) / 10;
  return [
    Math.max(CONTAINER_BASE_SCALE[0], neededX),
    Math.max(CONTAINER_BASE_SCALE[1], neededY),
    Math.max(CONTAINER_BASE_SCALE[2], neededZ),
  ];
}

/**
 * Get the 3D position for a task in a grid cell.
 * @param {number[]} containerPos - Container center [x,y,z]
 * @param {number[]} containerScale - Container scale [sx,sy,sz]
 * @param {number} col - Column index (0-based, left to right)
 * @param {number} row - Row index (0-based, top to bottom)
 * @param {number} layerIndex - Layer index (0 = front)
 * @param {number} totalRows - Total rows in the grid
 * @param {number} totalLayers - Total layers (front + back)
 */
function getGridCellPosition(containerPos, containerScale, col, row, layerIndex, totalRows, totalLayers) {
  const halfW = containerScale[0] * 5;
  const halfH = containerScale[1] * 5;
  const halfD = containerScale[2] * 5;

  const pad = GRID_CELL_PADDING;
  const usableW = halfW * 2 - pad * 2;
  const usableH = halfH * 2 - pad * 2;
  const usableD = halfD * 2 - pad * 2;

  const cellW = usableW / GRID_COLS;
  const cellH = usableH / totalRows;

  const x = containerPos[0] - halfW + pad + cellW * (col + 0.5);
  const y = containerPos[1] + halfH - pad - cellH * (row + 0.5);

  let z;
  if (totalLayers <= 1) {
    // 2D mode: place on front face
    z = containerPos[2] + halfD - pad;
  } else {
    // 3D mode: distribute layers evenly from front to back
    const layerSpacing = usableD / totalLayers;
    z = containerPos[2] + halfD - pad - layerSpacing * (layerIndex + 0.5);
  }

  return [x, y, z];
}

/**
 * Reposition ALL tasks for a repo into the grid layout.
 * Active tasks go in the front layer; merged tasks go in back layer(s).
 * Also updates container scale and cleans up any stale divider planes.
 */
export function repositionAllTasks(repoSlug) {
  const container = findRepoContainer(repoSlug);
  if (!container) return;

  const store = useObjectsStore.getState();
  const allObjects = store.objects || [];

  const repoTasks = allObjects.filter(
    (obj) => obj.merfolkData?.planTaskIndex != null && obj.merfolkData?.repoSlug === repoSlug
  );

  const activeTasks = repoTasks
    .filter((t) => !t.merfolkData?.cleared && t.merfolkData?.status !== TASK_STATUS.MERGED)
    .sort((a, b) => a.merfolkData.planTaskIndex - b.merfolkData.planTaskIndex);
  const mergedTasks = repoTasks
    .filter((t) => t.merfolkData?.cleared || t.merfolkData?.status === TASK_STATUS.MERGED)
    .sort((a, b) => a.merfolkData.planTaskIndex - b.merfolkData.planTaskIndex);

  const newScale = computeContainerScale(activeTasks.length, mergedTasks.length);
  const layout = computeGridLayout(activeTasks.length, mergedTasks.length);

  const spaceOwnerId = window.currentSpaceOwner;
  const currentSpaceId = window.currentSpaceId;

  // Clean up any existing divider planes for this repo
  const dividerIds = new Set(
    allObjects
      .filter((obj) => obj.merfolkData?.isDividerGrid && obj.merfolkData?.repoSlug === repoSlug)
      .map((d) => d.id)
  );
  if (dividerIds.size > 0 && spaceOwnerId && currentSpaceId) {
    for (const d of allObjects.filter((obj) => dividerIds.has(obj.id))) {
      deleteObject(spaceOwnerId, currentSpaceId, d.id, d.position);
    }
  }

  // Build a set of task IDs for quick lookup
  const activeIds = new Set(activeTasks.map((t) => t.id));
  const mergedIds = new Set(mergedTasks.map((t) => t.id));

  const updatedObjects = allObjects
    .filter((obj) => !dividerIds.has(obj.id)) // remove dividers
    .map((obj) => {
      // Update container scale
      if (obj.id === container.id) {
        const updated = { ...obj, scale: newScale };
        if (spaceOwnerId && currentSpaceId) {
          saveObjectToCell(spaceOwnerId, currentSpaceId, updated);
        }
        return updated;
      }
      // Position active tasks in front layer
      if (activeIds.has(obj.id)) {
        const idx = activeTasks.findIndex((t) => t.id === obj.id);
        const col = idx % GRID_COLS;
        const row = Math.floor(idx / GRID_COLS);
        const pos = getGridCellPosition(container.position, newScale, col, row, 0, layout.totalRows, layout.totalLayers);
        const updated = { ...obj, position: pos, cellId: getCellId(pos), _repoLocalUpdate: Date.now() };
        if (spaceOwnerId && currentSpaceId) {
          updateThrottles.delete(`${currentSpaceId}_${obj.id}`);
          saveObjectToCell(spaceOwnerId, currentSpaceId, updated);
        }
        return updated;
      }
      // Position merged tasks in back layer(s)
      if (mergedIds.has(obj.id)) {
        const idx = mergedTasks.findIndex((t) => t.id === obj.id);
        const perLayer = GRID_COLS * layout.totalRows;
        const layerIndex = 1 + Math.floor(idx / perLayer); // layers 1, 2, ...
        const withinLayer = idx % perLayer;
        const col = withinLayer % GRID_COLS;
        const row = Math.floor(withinLayer / GRID_COLS);
        const pos = getGridCellPosition(container.position, newScale, col, row, layerIndex, layout.totalRows, layout.totalLayers);
        const updated = {
          ...obj,
          position: pos,
          cellId: getCellId(pos),
          color: ARCHIVED_TASK_COLOR, // light green for merged
          _repoLocalUpdate: Date.now(),
        };
        if (spaceOwnerId && currentSpaceId) {
          updateThrottles.delete(`${currentSpaceId}_${obj.id}`);
          saveObjectToCell(spaceOwnerId, currentSpaceId, updated);
        }
        return updated;
      }
      return obj;
    });

  const newCreatedIds = new Set(store.createdObjectIds);
  dividerIds.forEach((id) => newCreatedIds.delete(id));

  useObjectsStore.setState({ objects: updatedObjects, createdObjectIds: newCreatedIds });
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
 * Get all repo containers in the objects store.
 */
export function getAllRepoContainers() {
  const objects = useObjectsStore.getState().objects || [];
  return objects.filter((obj) => obj.merfolkData?.isRepoContainer);
}

/**
 * Assign repoSlug to orphan tasks (tasks with planTaskIndex but no repoSlug).
 * If only one repo container exists, assigns all orphans to it.
 * Returns the repoSlug that was assigned, or null.
 */
export function assignRepoSlugToOrphanTasks() {
  const containers = getAllRepoContainers();
  if (containers.length === 0) {
    console.warn('[repoContainerService] assignRepoSlugToOrphanTasks: no repo containers found');
    return null;
  }

  // Use the first (or only) container's repoSlug
  const targetSlug = containers[0].merfolkData.repoSlug;
  if (!targetSlug) return null;

  const store = useObjectsStore.getState();
  const allObjects = store.objects || [];

  const orphans = allObjects.filter(
    (obj) => obj.merfolkData?.planTaskIndex != null && !obj.merfolkData?.repoSlug
  );
  if (orphans.length === 0) return null;

  const orphanIds = new Set(orphans.map((o) => o.id));

  const updatedObjects = allObjects.map((obj) => {
    if (!orphanIds.has(obj.id)) return obj;
    // Only update in-memory — do NOT save to Firebase here.
    // repositionIncomingTasks will save the COMPLETE data (type:'text',
    // TextObject fields, final positions). Saving partial data here causes
    // a race: the 800ms throttle blocks the full save, and the Firebase
    // snapshot then overwrites our store with this incomplete data.
    return {
      ...obj,
      merfolkData: {
        ...obj.merfolkData,
        repoSlug: targetSlug,
      },
    };
  });

  useObjectsStore.setState({ objects: updatedObjects });
  console.log(`[repoContainerService] Assigned repoSlug "${targetSlug}" to ${orphans.length} orphan tasks`);
  return targetSlug;
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
 * Reposition incoming tasks (from planScape bulkImport) into the repo container.
 * Tasks arriving via bulkImport have arbitrary positions; this moves them
 * to the correct grid layout and marks them as positioned.
 */
export function repositionIncomingTasks(repoSlug) {
  const container = findRepoContainer(repoSlug);
  if (!container) {
    console.warn('[repoContainerService] repositionIncomingTasks: no container for', repoSlug);
    return 0;
  }

  const store = useObjectsStore.getState();
  const allObjects = store.objects || [];

  // Find tasks for this repo that haven't been positioned yet
  const unpositioned = allObjects.filter(
    (obj) =>
      obj.merfolkData?.planTaskIndex != null &&
      obj.merfolkData?.repoSlug === repoSlug &&
      !obj.merfolkData?.positioned
  );
  if (unpositioned.length === 0) {
    console.log('[repoContainerService] repositionIncomingTasks: no unpositioned tasks for', repoSlug);
    return 0;
  }

  // Sort by planTaskIndex so order is deterministic
  unpositioned.sort((a, b) => a.merfolkData.planTaskIndex - b.merfolkData.planTaskIndex);

  const spaceOwnerId = window.currentSpaceOwner;
  const currentSpaceId = window.currentSpaceId;

  const unpositionedIds = new Set(unpositioned.map((t) => t.id));

  // Mark unpositioned tasks as positioned with correct type/style, then reposition all
  const updatedObjects = allObjects.map((obj) => {
    if (!unpositionedIds.has(obj.id)) return obj;

    const bodyText = obj.content || obj.text || '';
    return {
      ...obj,
      type: 'text',
      scale: obj.scale && obj.scale[0] >= 3 ? obj.scale : [...COLLAPSED_TASK_SCALE],
      color: obj.color || '#ffffff',
      content: bodyText,
      text: bodyText,
      headerText: obj.headerText || `Task ${obj.merfolkData.planTaskIndex}`,
      headerStyle: obj.headerStyle || { fontSize: 2, color: 'black' },
      textStyle: obj.textStyle || { fontSize: TASK_FONT_SIZE, color: 'black' },
      _repoLocalUpdate: Date.now(),
      merfolkData: {
        ...obj.merfolkData,
        positioned: true,
        isExpanded: false,
        status: obj.merfolkData?.status || TASK_STATUS.QUEUED,
      },
    };
  });

  useObjectsStore.setState({ objects: updatedObjects });

  // Clear throttle entries for all repositioned tasks so their saves aren't
  // silently dropped by the 800ms throttle in saveObjectToCell.
  if (currentSpaceId) {
    for (const id of unpositionedIds) {
      updateThrottles.delete(`${currentSpaceId}_${id}`);
    }
  }

  // Now reposition all tasks (including newly positioned ones) into grid
  repositionAllTasks(repoSlug);

  console.log(`[repoContainerService] Repositioned ${unpositioned.length} tasks into container for ${repoSlug}`);
  return unpositioned.length;
}

/**
 * Create task TextObjects inside a repo container.
 * Tasks are placed in a grid layout; repositionAllTasks handles final positioning.
 * Returns array of created task object IDs.
 */
export async function createTaskObjects(tasks, repoSlug, user, currentSpaceId) {
  const container = findRepoContainer(repoSlug);
  if (!container) {
    console.error(`[repoContainerService] No container found for ${repoSlug}`);
    return [];
  }

  const store = useObjectsStore.getState();
  const spaceOwnerId = !window.isTrialMode && user
    ? (window.currentSpaceOwner || user.uid)
    : null;

  // Create new task objects with temporary positions (repositionAllTasks will fix them)
  const newTaskObjects = tasks.map((task) => {
    const bodyText = task.content || task.description || task.body || task.text || '';
    return {
      id: task.id || generateId(),
      type: 'text',
      position: [...container.position], // temporary, will be grid-positioned
      scale: task.scale || [...COLLAPSED_TASK_SCALE],
      color: task.color || '#ffffff',
      cellId: getCellId(container.position),
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
        positioned: true,
        isExpanded: false,
        githubIssueNumber: task.merfolkData?.githubIssueNumber || null,
        githubPrNumber: task.merfolkData?.githubPrNumber || null,
      },
    };
  });

  // Add new task objects to store
  const newCreatedIds = new Set(store.createdObjectIds);
  newTaskObjects.forEach((obj) => newCreatedIds.add(obj.id));

  useObjectsStore.setState({
    objects: [...(store.objects || []), ...newTaskObjects],
    createdObjectIds: newCreatedIds,
    isInitialLoading: false,
  });

  // Persist new tasks
  if (spaceOwnerId) {
    for (const obj of newTaskObjects) {
      saveObjectToCell(spaceOwnerId, currentSpaceId, obj);
    }
  }

  // Reposition all tasks into grid (including the new ones)
  repositionAllTasks(repoSlug);

  return newTaskObjects.map((obj) => obj.id);
}

/**
 * Clear tasks for a repo: mark ALL tasks as cleared (add merfolkData.cleared: true),
 * set color to light green, and reposition them all to back layer(s).
 * @param {string} repoSlug
 * @param {object} user - Firebase user
 * @param {string} currentSpaceId
 * @returns {{ bumped: number }}
 */
export async function clearRepoTasks(repoSlug, user, currentSpaceId) {
  const store = useObjectsStore.getState();
  const allObjects = store.objects || [];

  const repoTasks = allObjects.filter(
    (obj) => obj.merfolkData?.planTaskIndex != null && obj.merfolkData?.repoSlug === repoSlug
  );

  const taskIds = new Set(repoTasks.map((t) => t.id));

  const spaceOwnerId = !window.isTrialMode && user
    ? (window.currentSpaceOwner || user.uid)
    : null;

  // Mark all tasks as cleared with light green color
  const updatedObjects = allObjects.map((obj) => {
    if (taskIds.has(obj.id)) {
      return {
        ...obj,
        color: ARCHIVED_TASK_COLOR,
        merfolkData: { ...obj.merfolkData, cleared: true },
      };
    }
    return obj;
  });

  useObjectsStore.setState({ objects: updatedObjects });

  // Persist each cleared task to Firebase
  if (spaceOwnerId) {
    const updatedById = new Map(updatedObjects.map((o) => [o.id, o]));
    for (const task of repoTasks) {
      const updated = updatedById.get(task.id);
      if (updated) {
        saveObjectToCell(spaceOwnerId, currentSpaceId, updated);
      }
    }
  }

  // Reposition all tasks (cleared ones go to back layers)
  repositionAllTasks(repoSlug);

  return { bumped: repoTasks.length };
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
