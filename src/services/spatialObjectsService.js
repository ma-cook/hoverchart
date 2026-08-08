import { api } from '../api-client';
import {
  addObjectToCell,
  updateObjectInCell as updateObjectInCellSpatial,
  deleteObjectFromCell as deleteObjectFromCellSpatial,
  getObjectsFromCells,
  getCellCoordinates,
  getCellId,
  moveObjectBetweenCells as moveObjectBetweenCellsSpatial,
  deleteAllCellsInSpace,
  findObjectInCells,
} from './spatialPartitioning';
import { getIsInitialLoading } from '../utils/loadingState';

// Re-export deleteAllCellsInSpace for convenience
export { deleteAllCellsInSpace };

// Cache and tracking for objects
export const objectsCache = new Map();
export const saveTimeouts = new Map(); // Legacy name kept for export compat — now tracks pending batch keys
export const updateThrottles = new Map();
export const lastReceivedObjects = new Map();
export const movingObjects = new Map(); // Track objects currently being moved to prevent race conditions
export const objectCellMap = new Map(); // Track which cell each object belongs to

// Track objects that are being deleted to prevent re-addition
const deletingObjects = new Set(); // Set of objectId strings being deleted

// ── Adaptive polling ────────────────────────────────────────────────
// Poll fast while changes are flowing, back off toward MAX when nothing
// changes, and stop entirely while the tab is hidden. Local saves wake the
// poller immediately so collaborative edits stay responsive.
export const POLL_INTERVAL_FAST_MS = 2000;
export const POLL_INTERVAL_MAX_MS = 30000;
export const POLL_BACKOFF_FACTOR = 1.5;
// Consecutive no-change polls at the max backoff before we stop polling
// entirely until a local write, tab refocus, or cell change wakes us.
export const HARD_IDLE_STREAK = 2;

const spatialPollWakes = new Set();
export const wakeSpatialPolling = () => {
  spatialPollWakes.forEach((wake) => {
    try { wake(); } catch { /* ignore */ }
  });
};

// DIAG: instance tracking to catch stacked/leaked spatial object pollers
if (typeof window !== 'undefined' && window.__objPollerSeq == null) window.__objPollerSeq = 0;
const liveObjPollers = new Set();

// ── Batched write queue ──────────────────────────────────────────────
// Instead of N individual setTimeout→Firestore writes, pending saves
// accumulate here and flush together in a single batch.
const pendingSaves = new Map(); // cacheKey → { ownerUserId, spaceId, objectId, objectToSave, oldCellId, newCellId, oldPosition }
let batchFlushTimer = null;
const BATCH_FLUSH_DELAY = 300; // ms — matches the old per-object setTimeout delay

function cancelPendingSave(cacheKey) {
  pendingSaves.delete(cacheKey);
  saveTimeouts.delete(cacheKey);
}

function enqueueSave(cacheKey, saveInfo) {
  pendingSaves.set(cacheKey, saveInfo);
  saveTimeouts.set(cacheKey, true); // keep saveTimeouts in sync for external .has() checks
  if (batchFlushTimer === null) {
    batchFlushTimer = setTimeout(flushSaveBatch, BATCH_FLUSH_DELAY);
  }
}

async function flushSaveBatch() {
  batchFlushTimer = null;
  if (pendingSaves.size === 0) return;

  // Snapshot and clear atomically
  const saves = new Map(pendingSaves);
  pendingSaves.clear();
  // Also clear the legacy tracking map
  for (const key of saves.keys()) saveTimeouts.delete(key);

  const sameCellSaves = [];
  const crossCellMoves = [];

  for (const [, info] of saves) {
    if (info.oldCellId && info.newCellId && info.oldCellId !== info.newCellId && info.oldPosition) {
      crossCellMoves.push(info);
    } else {
      sameCellSaves.push(info);
    }
  }

  // ── Same-cell writes: POST upserts (ON CONFLICT DO UPDATE handles both create+update) ──
  if (sameCellSaves.length > 0) {
    await Promise.all(
      sameCellSaves.map(info =>
        addObjectToCell(info.ownerUserId, info.spaceId, info.objectToSave)
          .catch(innerErr => {
            console.error(`[SaveBatch] Upsert failed for ${info.objectId}:`, innerErr);
            objectsCache.delete(`${info.spaceId}_${info.objectId}`);
          })
      )
    );
  }

  // ── Cross-cell moves remain individual (delete + add atomicity) ──
  for (const info of crossCellMoves) {
    try {
      await moveObjectBetweenCellsSpatial(
        info.ownerUserId, info.spaceId, info.objectId,
        info.oldPosition, info.objectToSave.position, info.objectToSave,
      );
    } catch (error) {
      console.error(`[SaveBatch] Cross-cell move failed for ${info.objectId}:`, error);
      const cacheKey = `${info.spaceId}_${info.objectId}`;
      objectsCache.delete(cacheKey);
    }
  }

  // Local writes indicate active editing — wake the poller so remote
  // state is re-fetched promptly and the backoff resets.
  wakeSpatialPolling();
}

/**
 * Clear all object caches - used when bulk deleting to prevent ghost objects
 */
export const clearAllObjectCaches = () => {
  objectsCache.clear();
  pendingSaves.clear();
  saveTimeouts.clear();
  if (batchFlushTimer !== null) {
    clearTimeout(batchFlushTimer);
    batchFlushTimer = null;
  }
  updateThrottles.clear();
  lastReceivedObjects.clear();
  movingObjects.clear();
  objectCellMap.clear();
  deletingObjects.clear();
  // Also clear any window-level tracking
  if (window._unloadedObjects) {
    window._unloadedObjects.clear();
  }
  if (window._unloadedCells) {
    window._unloadedCells.clear();
  }
  if (window._unloadedObjectsByCell) {
    window._unloadedObjectsByCell.clear();
  }
  console.log('🧹 Cleared all object caches');
};

/**
 * Seed the poll change-detection cache from a bulk fetch so the first poll
 * cycle doesn't re-flag every object as "new" (which held the poll at its
 * fastest cadence during the warm-up).
 * @param {string} spaceId - Space ID (must match the poller's spaceId)
 * @param {Array} objects - Objects already loaded into the store
 */
export const seedObjectsCache = (spaceId, objects) => {
  if (!spaceId || !Array.isArray(objects)) return;
  for (const obj of objects) {
    if (!obj || obj.id == null) continue;
    const cacheKey = `${spaceId}_${obj.id}`;
    if (objectsCache.has(cacheKey)) continue;
    try {
      const cached = { ...obj };
      cached._fingerprint = computeNonPositionFingerprint(obj);
      objectsCache.set(cacheKey, cached);
    } catch {
      // Ignore malformed entries
    }
  }
};

// Helper function for position-only comparison
const positionsEqual = (posA, posB) => {
  if (!posA || !posB) return false;
  if (!Array.isArray(posA) || !Array.isArray(posB)) return false;
  if (posA.length !== posB.length) return false;

  const epsilon = 0.001;
  for (let i = 0; i < posA.length; i++) {
    if (Math.abs(posA[i] - posB[i]) > epsilon) return false;
  }
  return true;
};

// Lightweight fingerprint for non-position change detection.
// Replaces structuredClone + lodash isEqual with a single JSON.stringify call
// that excludes volatile fields. The string is cached on the cache entry so
// repeat no-change saves are a cheap string === comparison.
const VOLATILE_KEYS = new Set(['position', 'lastUpdated', 'cellId', 'creatorId', 'updatedAt', 'updatedBy', '_fingerprint']);
const computeNonPositionFingerprint = (obj) => {
  const keys = Object.keys(obj).filter(k => !VOLATILE_KEYS.has(k)).sort();
  const subset = {};
  for (const k of keys) subset[k] = obj[k];
  return JSON.stringify(subset);
};

/**
 * Save object to the appropriate cell based on its position
 */
export const saveObjectToCell = async (userId, spaceId, object) => {
  // Check if we're still in initial loading phase - no saves during app startup
  if (getIsInitialLoading()) {
    return;
  }

  if (!userId || !spaceId || !object.id) {
    // console.warn('[SaveDebug] saveObjectToCell: Missing required parameters. Aborting.', { userId, spaceId, objectId: object?.id });
    return;
  }

  // For non-position updates, we need to find the object's current position from cache or existing data
  if (!object.position) {
    const objectId = object.id.toString();
    const cacheKey = `${spaceId}_${objectId}`;
    const cachedData = objectsCache.get(cacheKey);

    if (cachedData && cachedData.position) {
      // Use cached position for the update
      object = { ...object, position: cachedData.position };
    } else {
      console.warn(
        '[SaveDebug] saveObjectToCell: No position available for non-position update. Skipping save.',
        {
          userId,
          spaceId,
          objectId: object?.id,
        }
      );
      return;
    }
  }

  try {
    const objectId = object.id.toString();
    const cacheKey = `${spaceId}_${objectId}`;

    // Check if object is being deleted - if so, prevent save
    if (deletingObjects.has(objectId)) {
      return;
    }

    // Enhanced throttling
    const now = Date.now();
    const lastUpdateTime = updateThrottles.get(cacheKey) || 0;

    let throttleTime = 500; // Default throttle

    if (object.type === 'text' && object.indicatorPosition) {
      throttleTime = 2000;
    } else if (object.position) {
      throttleTime = 800;
    } else {
      throttleTime = 200;
    }

    if (now - lastUpdateTime < throttleTime) {
      // console.log(`[SaveDebug] Throttled save for object ${objectId}. Last update: ${lastUpdateTime}, Now: ${now}, Diff: ${now - lastUpdateTime}, Throttle: ${throttleTime}`);
      return;
    }

    updateThrottles.set(cacheKey, now);

    const ownerUserId = userId;

    const cachedData = objectsCache.get(cacheKey);

    // Cancel any previously queued save for this object
    cancelPendingSave(cacheKey);

    // ── Change detection BEFORE cloning ──────────────────────────────
    // During drags only position changes — positionsEqual is O(3) and
    // avoids the old structuredClone + lodash.isEqual overhead entirely.
    let oldCellId = null;
    let newCellId = null;
    let oldPosition = null;

    if (cachedData && cachedData.position) {
      oldPosition = cachedData.position;
      const oldCellCoords = getCellCoordinates(cachedData.position);
      oldCellId = getCellId(oldCellCoords.x, oldCellCoords.y, oldCellCoords.z);
    }

    const newCellCoords = getCellCoordinates(object.position);
    newCellId = getCellId(newCellCoords.x, newCellCoords.y, newCellCoords.z);

    // ── Change detection (no clone, no lodash.isEqual) ────────────────
    if (cachedData) {
      const positionChanged = !positionsEqual(cachedData.position, object.position);

      if (!positionChanged) {
        // Position identical — check non-position fields via cached fingerprint
        const newFingerprint = computeNonPositionFingerprint(object);
        if (newFingerprint === cachedData._fingerprint) {
          return; // Nothing changed at all
        }
      }
    }

    // Check if object is marked as unloaded
    if (window._unloadedObjects && window._unloadedObjects.has(objectId)) {
      return;
    }

    // ── Shallow copy + fingerprint (replaces structuredClone) ────────
    const newData = { ...object };
    newData._fingerprint = computeNonPositionFingerprint(object);

    // Update cache before enqueuing
    objectsCache.set(cacheKey, newData);

    const objectToSave = {
      ...newData,
      lastUpdated: new Date().toISOString(),
      creatorId: ownerUserId,
    };
    // Remove internal fingerprint before sending to API
    delete objectToSave._fingerprint;

    lastReceivedObjects.set(`${spaceId}_${objectId}`, objectToSave);

    // ── Enqueue into batched write queue ─────────────────────────────
    enqueueSave(cacheKey, {
      ownerUserId,
      spaceId,
      objectId,
      objectToSave,
      oldCellId,
      newCellId,
      oldPosition,
    });
  } catch (error) {
    console.error(
      '[SaveDebug] Error in saveObjectToCell (outer try-catch):',
      error
    );
  }
};

/**
 * Delete object from its cell
 */
export const deleteObjectFromSpatialCell = async (
  userId,
  spaceId,
  objectId,
  position
) => {
  if (!userId || !spaceId || !objectId) {
    throw new Error(
      'Missing required parameters for deleteObjectFromSpatialCell'
    );
  }

  try {
    const objectIdString = objectId.toString();
    const cacheKey = `${spaceId}_${objectIdString}`;

    // Mark object as being deleted to prevent any save operations
    deletingObjects.add(objectIdString);

    // Auto-cleanup deletion blacklist after timeout to prevent permanent blocking
    setTimeout(() => {
      if (deletingObjects.has(objectIdString)) {
        deletingObjects.delete(objectIdString);
        console.warn(
          `⚠️ [Delete Debug] Auto-cleared deletion blacklist for ${objectIdString} after timeout`
        );
      }
    }, 30000); // 30 second timeout

    // Clear from cache immediately to prevent re-additions

    objectsCache.delete(cacheKey);
    lastReceivedObjects.delete(cacheKey);

    // Clear any pending batched save that might re-add the object
    cancelPendingSave(cacheKey);

    updateThrottles.delete(cacheKey);

    const ownerUserId = userId;

    // If no position provided, try to find the object in all cells
    if (!position) {
      const found = await findObjectInCells(
        ownerUserId,
        spaceId,
        objectIdString
      );

      if (found && found.object && found.object.position) {
        position = found.object.position;
      } else {
        console.warn(
          `⚠️ [Delete Debug] Could not find object ${objectIdString} in any cell`
        );
        return; // Object doesn't exist in database anyway
      }
    }

    const deleteResult = await deleteObjectFromCellSpatial(
      ownerUserId,
      spaceId,
      objectIdString,
      position
    );

    if (!deleteResult) {
      // If deletion failed, remove from blacklist to allow retry
      deletingObjects.delete(objectIdString);

      throw new Error(
        `Failed to delete object ${objectIdString} from spatial cell`
      );
    }

    // Remove from deletion blacklist after successful deletion
    deletingObjects.delete(objectIdString);

    // Additional safety: Clear any cached references that might cause re-addition
    setTimeout(() => {
      objectsCache.delete(cacheKey);
      lastReceivedObjects.delete(cacheKey);
    }, 100);
  } catch (error) {
    // Clean up deletion blacklist on error
    const objectIdString = objectId.toString();
    deletingObjects.delete(objectIdString);
    console.error(
      `❌ [Delete Debug] Error deleting object ${objectId} from cell (cleaned up blacklist):`,
      error
    );
    throw error; // Re-throw to allow caller to handle
  }
};

/**
 * Update an object within its cell (with cell boundary detection)
 */
export const updateObjectInSpatialCell = async (
  userId,
  spaceId,
  objectData
) => {
  // Check if we're still in initial loading phase - no saves during app startup
  if (getIsInitialLoading()) {
    return;
  }

  if (!userId || !spaceId || !objectData.id) {
    console.error(
      '[updateObjectInSpatialCell] Missing userId, spaceId, or object ID.'
    );
    throw new Error('Missing required IDs for object update.');
  }

  // Validate position data
  if (
    !objectData.position ||
    !Array.isArray(objectData.position) ||
    objectData.position.length !== 3
  ) {
    console.error(
      '[updateObjectInSpatialCell] Invalid or missing position data:',
      {
        id: objectData.id,
        position: objectData.position,
        positionType: typeof objectData.position,
        isArray: Array.isArray(objectData.position),
      }
    );
    throw new Error('Invalid position data for spatial object update.');
  }

  try {
    const objectId = objectData.id.toString();
    const moveKey = `${spaceId}_${objectId}`;

    // Race condition protection: Check if object is already being moved
    if (movingObjects.has(moveKey)) {
      const moveInfo = movingObjects.get(moveKey);
      const timeSinceMove = Date.now() - moveInfo.timestamp;

      // If a move is already in progress and it's recent (less than 2 seconds), skip this update
      if (timeSinceMove < 2000) {
        return;
      } else {
        // Clean up stale move tracking
        movingObjects.delete(moveKey);
      }
    }

    // Mark object as being moved
    movingObjects.set(moveKey, { timestamp: Date.now() });

    // Set up cleanup timeout
    const cleanupTimeout = setTimeout(() => {
      movingObjects.delete(moveKey);
    }, 3000); // Clean up after 3 seconds

    try {
      const ownerUserId = userId;

      const objectToUpdate = {
        ...objectData,
        lastUpdated: new Date().toISOString(),
        updatedBy: userId,
      };

      // If object has position, check for cell boundary crossings
      if (objectData.position && Array.isArray(objectData.position)) {
        const cacheKey = `${spaceId}_${objectData.id}`;
        const cachedData = objectsCache.get(cacheKey);

        if (cachedData && cachedData.position) {
          // Calculate old and new cell IDs
          const oldCellCoords = getCellCoordinates(cachedData.position);
          const newCellCoords = getCellCoordinates(objectData.position);
          const oldCellId = getCellId(
            oldCellCoords.x,
            oldCellCoords.y,
            oldCellCoords.z
          );
          const newCellId = getCellId(
            newCellCoords.x,
            newCellCoords.y,
            newCellCoords.z
          );

          if (oldCellId !== newCellId) {
            // Use moveObjectBetweenCells for cell boundary crossings
            await moveObjectBetweenCellsSpatial(
              ownerUserId,
              spaceId,
              objectData.id,
              cachedData.position,
              objectData.position,
              objectToUpdate
            );

            // Update cache with new position
            objectsCache.set(cacheKey, { ...objectToUpdate });
            return;
          }
        }
      }

      // No cell boundary crossing - use direct update
      await updateObjectInCellSpatial(ownerUserId, spaceId, objectToUpdate);
    } finally {
      // Always clean up the moving object tracking
      clearTimeout(cleanupTimeout);
      movingObjects.delete(moveKey);
    }
  } catch (error) {
    console.error(
      `[updateObjectInSpatialCell] Failed to update object ${objectData.id}:`,
      error
    );
    throw error;
  }
};

/**
 * Clear cache entries for a cell
 */

/**
 * Keep track of object subscriptions by cell
 */
const objectSubscriptionsByCell = new Map(); // cellId -> Set of object subscription keys

/**
 * Force-cleanup all active spatial-object subscriptions for the given cell IDs
 * (or all cells when no argument is provided). Used after a bulk-delete to
 * prevent listeners from re-emitting stale docs into the store.
 */
export const cleanupSpatialObjectSubscriptions = (cellIds) => {
  const targets = cellIds
    ? new Set(Array.isArray(cellIds) ? cellIds : [cellIds])
    : null;

  objectSubscriptionsByCell.forEach((subscriptions, cellId) => {
    if (!targets || targets.has(cellId)) {
      objectSubscriptionsByCell.delete(cellId);
    }
  });
};

/**
 * Subscribe to objects in loaded cells with polling
 */
export const subscribeToSpatialObjects = (
  userId,
  spaceId,
  loadedCells,
  callback
) => {
  if (!spaceId) return () => {};

  // Ensure loadedCells is always an array
  const safeCells = Array.isArray(loadedCells) ? loadedCells : [];

  // DIAG
  const instanceId = ++window.__objPollerSeq;
  console.log(`[diag][objPoller #${instanceId}] CREATED cells=${safeCells.length}`, new Error().stack?.split('\n').slice(1, 4).join('\n'));
  liveObjPollers.add(instanceId);

  // Clean up tracking for cells that are no longer loaded
  objectSubscriptionsByCell.forEach((subscriptions, cellId) => {
    if (!safeCells.includes(cellId)) {
      objectSubscriptionsByCell.delete(cellId);
    }
  });

  // Clear caches for any cells that are not in the loadedCells list
  for (const [objectId, cellId] of objectCellMap) {
    if (!safeCells.includes(cellId)) {
      const cacheKey = `${spaceId}_${objectId}`;
      objectsCache.delete(cacheKey);
      lastReceivedObjects.delete(cacheKey);
      cancelPendingSave(cacheKey);
      updateThrottles.delete(cacheKey);
      objectCellMap.delete(objectId);
    }
  }

  const isAnonymous = !userId;
  let isSubscribed = true;

  // Track known object IDs per cell for removal detection
  const previousCellObjectIds = new Map(); // cellKey -> Set<objectId>

  // Adaptive polling state: poll fast while changes flow, back off when
  // idle, and pause entirely while the tab is hidden. After a couple of
  // consecutive fully-idle polls at the max backoff we enter a hard idle
  // (zero requests) and only resume on a local write, tab refocus, or a
  // cell change.
  let isPolling = false;
  let pollDelay = POLL_INTERVAL_FAST_MS;
  let pollTimer = null;
  let isHardIdle = false;
  let idleStreak = 0;
  // DIAG (always-on): high-frequency polling detector
  let pollsInWindow = 0;
  let windowStartMs = 0;
  let highRateWarnedAt = 0;

  const poll = async () => {
    if (!isSubscribed || isPolling) return;
    if (document.hidden) return;
    isPolling = true;
    let anythingChanged = false;
    let fetchFailed = false;
    let totalAdds = 0;
    let totalRemoves = 0;
    try {
      const ownerIdFromUrl = window.currentSpaceOwner;

      if (isAnonymous && !ownerIdFromUrl) {
        return;
      }

      const effectiveOwnerId = isAnonymous ? ownerIdFromUrl : userId;
      let ownerUserId = effectiveOwnerId;
      if (!isAnonymous) {
        if (window.currentSpaceOwner) {
          ownerUserId = window.currentSpaceOwner;
        } else {
          ownerUserId = window.currentSpaceOwner || userId;
        }
      }
      window.currentSpaceOwner = ownerUserId;

      if (safeCells.length === 0) {
        return;
      }

      // Fetch ALL loaded cells in a single batched request instead of one
      // request per cell. The backend matches any of the repeated cell_id
      // params. A 304 (browser holds the identical cached body) comes back
      // as null from the api-client and means "nothing changed" — skip the
      // diff entirely rather than treating the cache as an error.
      let objects = [];
      try {
        objects = await api.get(`/api/spaces/${spaceId}/objects`, {
          params: { cell_id: safeCells },
        });
        if (objects == null) {
          return;
        }
      } catch {
        fetchFailed = true;
        return;
      }

      // Normalize: flatten metadata.* to top level for frontend compatibility
      for (const obj of objects) {
        if (obj.metadata) {
          const meta = typeof obj.metadata === 'string' ? JSON.parse(obj.metadata) : obj.metadata;
          for (const key of ['merfolkData', 'faceColors', 'faceTexts', 'faceTextStyles', 'textStyle', 'headerStyle', 'size', 'lineColor', 'lineThickness', 'borderColor', 'borderStyle']) {
            if (meta[key] !== undefined && obj[key] === undefined) {
              obj[key] = meta[key];
            }
          }
        }
      }

      // Group the response by cell so the per-cell add/remove diff stays intact
      const objectsByCell = new Map();
      for (const obj of objects) {
        if (!obj.cellId) continue;
        if (!objectsByCell.has(obj.cellId)) objectsByCell.set(obj.cellId, []);
        objectsByCell.get(obj.cellId).push(obj);
      }

      for (const cellKey of safeCells) {
        if (!cellKey || typeof cellKey !== 'string') {
          continue;
        }

        const [x, y, z] = cellKey.split(',').map(Number);
        const cellObjects = objectsByCell.get(cellKey) || [];

        if (!objectSubscriptionsByCell.has(cellKey)) {
          objectSubscriptionsByCell.set(cellKey, new Set());
        }

        // Detect removed objects
        const currentIds = new Set(cellObjects.map(o => o.id));
        const previousIds = previousCellObjectIds.get(cellKey) || new Set();

        const batchedAdds = [];
        const batchedRemoves = [];

        // Process added objects
        for (const objectData of cellObjects) {
          const objectId = objectData.id;

          // DATA MIGRATION: Sanitize fontSize values from old data
          if (
            objectData.textStyle?.fontSize &&
            typeof objectData.textStyle.fontSize === 'string'
          ) {
            const parsed = parseFloat(objectData.textStyle.fontSize);
            objectData.textStyle.fontSize = isNaN(parsed) ? 1.5 : parsed;
          }
          if (
            objectData.headerStyle?.fontSize &&
            typeof objectData.headerStyle.fontSize === 'string'
          ) {
            const parsed = parseFloat(objectData.headerStyle.fontSize);
            objectData.headerStyle.fontSize = isNaN(parsed) ? 1.5 : parsed;
          }
          if (objectData.faceTextStyles) {
            Object.keys(objectData.faceTextStyles).forEach((face) => {
              const style = objectData.faceTextStyles[face];
              if (style?.fontSize && typeof style.fontSize === 'string') {
                const parsed = parseFloat(style.fontSize);
                style.fontSize = isNaN(parsed) ? 0.5 : parsed;
              }
            });
          }

          // Skip if object is marked as unloaded
          if (window._unloadedObjects?.has(objectId.toString())) {
            window._unloadedObjects.delete(objectId.toString());
            if (window._unloadedObjectsByCell) {
              for (const [, objSet] of window._unloadedObjectsByCell) {
                objSet.delete(objectId.toString());
              }
            }
          }

          const cacheKey = `${spaceId}_${objectId}`;

          // Check if object data has changed
          const cachedData = objectsCache.get(cacheKey);
          let hasChanged = false;
          if (cachedData) {
            const positionChanged = !positionsEqual(
              cachedData.position,
              objectData.position
            );

            let otherDataChanged = false;
            if (!positionChanged) {
              const incomingFp = computeNonPositionFingerprint(objectData);
              otherDataChanged = incomingFp !== cachedData._fingerprint;
            }

            hasChanged = positionChanged || otherDataChanged;

            if (hasChanged) {
              if (cachedData.lastUpdated && objectData.lastUpdated) {
                const cachedTime = cachedData.lastUpdated.toMillis
                  ? cachedData.lastUpdated.toMillis()
                  : new Date(cachedData.lastUpdated).getTime();
                const newTime = objectData.lastUpdated.toMillis
                  ? objectData.lastUpdated.toMillis()
                  : new Date(objectData.lastUpdated).getTime();

                if (newTime <= cachedTime) {
                  continue;
                }
              }
            }
          } else {
            hasChanged = true;
          }

          if (hasChanged) {
            if (window._bulkDeleteInProgress) {
              continue;
            }

            if (
              window._currentTransformingObjects &&
              window._currentTransformingObjects.has(objectId)
            ) {
              continue;
            }

            try {
              const cached = { ...objectData };
              cached._fingerprint = computeNonPositionFingerprint(objectData);
              objectsCache.set(cacheKey, cached);
            } catch (error) {
              console.warn(
                '⚠️ Failed to cache object in spatialObjectsService:',
                error,
                'objectData:',
                objectData
              );
              objectsCache.set(cacheKey, { ...objectData });
            }
            lastReceivedObjects.set(cacheKey, objectData);
            batchedAdds.push({
              type: 'added',
              id: objectId,
              object: objectData,
              cellCoords: { x, y, z: z || 0 },
            });
          }
        }

        // Detect removed objects via diff
        for (const id of previousIds) {
          if (!currentIds.has(id)) {
            const cacheKey = `${spaceId}_${id}`;
            objectsCache.delete(cacheKey);
            lastReceivedObjects.delete(cacheKey);
            batchedRemoves.push({
              type: 'removed',
              id,
              cellCoords: { x, y, z: z || 0 },
            });
          }
        }

        previousCellObjectIds.set(cellKey, currentIds);

        if (batchedAdds.length > 0) {
          anythingChanged = true;
          totalAdds += batchedAdds.length;
          callback({
            type: 'batch-added',
            changes: batchedAdds,
          });
        }
        if (batchedRemoves.length > 0) {
          anythingChanged = true;
          totalRemoves += batchedRemoves.length;
          callback({
            type: 'batch-removed',
            changes: batchedRemoves,
          });
        }
      }
    } catch (error) {
      console.error('Error polling spatial objects:', error);
    } finally {
      isPolling = false;
      // DIAG (always-on): warn once per 60s if polling at a sustained high rate
      const nowMs = performance.now();
      if (nowMs - windowStartMs > 30000) { windowStartMs = nowMs; pollsInWindow = 0; }
      pollsInWindow += 1;
      if (pollsInWindow >= 12 && nowMs - highRateWarnedAt > 60000) {
        highRateWarnedAt = nowMs;
        console.warn(`[diag][objPoller #${instanceId}] HIGH-RATE: ${pollsInWindow} polls in <30s (changed=${anythingChanged} fetchFailed=${fetchFailed} live=${liveObjPollers.size})`, new Error().stack?.split('\n').slice(1, 3).join('\n'));
      }
      if (window.__POLL_DIAG) {
        console.log(`[diag][objPoller #${instanceId}] poll changed=${anythingChanged} adds=${totalAdds} removes=${totalRemoves} fetchFailed=${fetchFailed} delay=${pollDelay} cells=${safeCells.length} cacheSize=${objectsCache.size} live=${liveObjPollers.size}`);
      }
      if (anythingChanged) {
        pollDelay = POLL_INTERVAL_FAST_MS;
        idleStreak = 0;
      } else {
        pollDelay = Math.min(POLL_INTERVAL_MAX_MS, pollDelay * POLL_BACKOFF_FACTOR);
        if (fetchFailed) {
          // Errors never count toward hard idle — keep retrying (backing
          // off) so the poller recovers once the network/backend returns.
          idleStreak = 0;
        } else if (pollDelay >= POLL_INTERVAL_MAX_MS) {
          idleStreak += 1;
          if (idleStreak >= HARD_IDLE_STREAK) {
            isHardIdle = true;
          }
        } else {
          idleStreak = 0;
        }
      }
      scheduleNextPoll();
    }
  };

  const scheduleNextPoll = () => {
    if (!isSubscribed || isHardIdle) return;
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
    if (document.hidden) return;
    pollTimer = setTimeout(() => {
      pollTimer = null;
      poll();
    }, pollDelay);
  };

  let lastWakeLogMs = 0;
  const wake = () => {
    if (!isSubscribed) return;
    // DIAG (always-on, rate-limited): capture WHO wakes the poller
    const wakeNow = performance.now();
    if (wakeNow - lastWakeLogMs > 5000) {
      lastWakeLogMs = wakeNow;
      console.log(`[diag][objPoller #${instanceId}] WAKE`, new Error().stack?.split('\n').slice(1, 5).join('\n'));
    }
    if (isHardIdle) {
      isHardIdle = false;
      idleStreak = 0;
    }
    pollDelay = POLL_INTERVAL_FAST_MS;
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
    poll();
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      if (pollTimer) {
        clearTimeout(pollTimer);
        pollTimer = null;
      }
    } else {
      isHardIdle = false;
      idleStreak = 0;
      pollDelay = POLL_INTERVAL_FAST_MS;
      if (!isPolling) poll();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  spatialPollWakes.add(wake);

  // Initial fetch (schedules subsequent polls)
  poll();

  // Return cleanup function
  return () => {
    // DIAG
    console.log(`[diag][objPoller #${instanceId}] CLEANUP live=${liveObjPollers.size}`);
    liveObjPollers.delete(instanceId);
    isSubscribed = false;
    spatialPollWakes.delete(wake);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
    previousCellObjectIds.clear();
  };
};

/**
 * Update subscriptions when loaded cells change
 */
export const updateCellSubscriptions = (
  currentUnsubscribe,
  userId,
  spaceId,
  loadedCells,
  callback
) => {
  // Clean up current subscriptions
  if (currentUnsubscribe) {
    currentUnsubscribe();
  }

  // Ensure loadedCells is always an array
  const safeCells = Array.isArray(loadedCells) ? loadedCells : [];

  // Start new subscriptions for the updated cell list
  return subscribeToSpatialObjects(userId, spaceId, safeCells, callback);
};

/**
 * Move object between cells (for when object position changes significantly)
 */
export const moveObjectBetweenCells = async (
  userId,
  spaceId,
  objectData,
  oldPosition,
  newPosition
) => {
  // Check if we're still in initial loading phase - no saves during app startup
  if (getIsInitialLoading()) {
    return false;
  }

  if (!userId || !spaceId || !objectData || !oldPosition || !newPosition) {
    return false;
  }

  try {
    const ownerUserId = userId;

    // Get old and new cell coordinates
    const oldCellCoords = getCellCoordinates(oldPosition);
    const newCellCoords = getCellCoordinates(newPosition); // If the cell hasn't changed, just update the object in place
    if (
      oldCellCoords.x === newCellCoords.x &&
      oldCellCoords.y === newCellCoords.y &&
      oldCellCoords.z === newCellCoords.z
    ) {
      const updatedObject = {
        ...objectData,
        position: newPosition,
        lastUpdated: new Date().toISOString(),
        updatedBy: userId,
      };

      await updateObjectInCellSpatial(ownerUserId, spaceId, updatedObject);
      return true;
    }

    // Move object between cells
    await moveObjectBetweenCellsSpatial(
      ownerUserId,
      spaceId,
      objectData.id,
      oldPosition,
      newPosition,
      { ...objectData, position: newPosition }
    );

    return true;
  } catch (error) {
    console.error('Error moving object between cells:', error);
    return false;
  }
};
/**
 * Load all objects from currently loaded cells
 */
export const loadObjectsFromCells = async (userId, spaceId, loadedCells) => {
  if (!userId || !spaceId || !loadedCells || loadedCells.length === 0) {
    return [];
  }

  try {
    const ownerUserId = userId;
    const cellCoords = loadedCells.map((cellKey) => {
      const [x, y, z] = cellKey.split(',').map(Number);
      return { x, y, z: z || 0 }; // Default z to 0 for backward compatibility
    });

    const objects = await getObjectsFromCells(ownerUserId, spaceId, cellCoords);

    return objects;
  } catch (error) {
    console.error('Error loading objects from cells:', error);
    return [];
  }
};

// Convenience functions that provide a simpler API for common operations
// These wrap the spatial-aware functions for cases where you don't need to manage cells directly

/**
 * Save object using spatial partitioning (convenience wrapper)
 * @param {string} userId - User ID
 * @param {string} spaceId - Space ID
 * @param {Object} object - Object data (must include position)
 * @returns {Promise<void>}
 */
export const saveObject = async (userId, spaceId, object) => {
  return saveObjectToCell(userId, spaceId, object);
};

/**
 * Delete object using spatial partitioning (convenience wrapper)
 * @param {string} userId - User ID
 * @param {string} spaceId - Space ID
 * @param {string} objectId - Object ID
 * @param {Array} position - Object position [x, y, z] (needed to find the correct cell)
 * @returns {Promise<void>}
 */
export const deleteObject = async (userId, spaceId, objectId, position) => {
  return deleteObjectFromSpatialCell(userId, spaceId, objectId, position);
};

/**
 * Update object using spatial partitioning (convenience wrapper)
 * @param {string} userId - User ID
 * @param {string} spaceId - Space ID
 * @param {Object} objectData - Updated object data
 * @returns {Promise<void>}
 */
export const updateObject = async (userId, spaceId, objectData) => {
  return updateObjectInSpatialCell(userId, spaceId, objectData);
};

/**
 * Subscribe to all objects in a space using spatial partitioning
 * Note: This subscribes to objects in the provided loaded cells only
 * @param {string} userId - User ID
 * @param {string} spaceId - Space ID
 * @param {Array} loadedCells - Array of loaded cell IDs
 * @param {Function} callback - Callback for object changes
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToObjects = (userId, spaceId, loadedCells, callback) => {
  return subscribeToSpatialObjects(userId, spaceId, loadedCells, callback);
};

// Debug utility to check deletion blacklist
export const getObjectDeletionStatus = () => {
  return {
    deletingObjects: [...deletingObjects],
    deletingCount: deletingObjects.size,
  };
};

// Debug utility to clear deletion blacklist (emergency use)
export const clearObjectDeletionBlacklist = () => {
  const count = deletingObjects.size;
  deletingObjects.clear();

  return count;
};

// Expose deletion status globally for cross-module access
if (typeof window !== 'undefined') {
  window.getObjectDeletionStatus = getObjectDeletionStatus;
  window.clearObjectDeletionBlacklist = clearObjectDeletionBlacklist;
}

export { positionsEqual };
