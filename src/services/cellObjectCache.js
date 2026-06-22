/**
 * Cell Object Cache
 *
 * Two-tier cache for objects created during diagram generation that haven't
 * been persisted to Firestore yet (or need to survive cell unload/re-load
 * before the Cloud Function completes).
 *
 *   pendingCellObjects  – consumed once on first cell load (one-shot)
 *   allCellObjects      – never deleted, persistent fallback for re-loads
 *                         Cleared when a new diagram is generated.
 */

const pendingCellObjects = new Map();
const allCellObjects = new Map();

export function addPendingCellObjects(cellId, objects) {
  if (!objects || objects.length === 0) return;

  // pending – one-shot, consumed on first load
  let pending = pendingCellObjects.get(cellId);
  if (!pending) {
    pending = [];
    pendingCellObjects.set(cellId, pending);
  }
  pending.push(...objects);

  // all – persistent fallback
  let all = allCellObjects.get(cellId);
  if (!all) {
    all = [];
    allCellObjects.set(cellId, all);
  }
  all.push(...objects);
}

export function consumePendingCellObjects(cellId) {
  const objects = pendingCellObjects.get(cellId);
  if (objects) {
    pendingCellObjects.delete(cellId);
  }
  return objects || [];
}

export function consumePendingCellObjectsForCells(cellIds) {
  const result = [];
  for (const cellId of cellIds) {
    const objects = consumePendingCellObjects(cellId);
    if (objects.length > 0) result.push(...objects);
  }
  return result;
}

export function getAllCellObjectsForCells(cellIds) {
  const result = [];
  for (const cellId of cellIds) {
    const objects = allCellObjects.get(cellId);
    if (objects && objects.length > 0) result.push(...objects);
  }
  return result;
}

export function hasAnyPendingObjects() {
  return pendingCellObjects.size > 0;
}

export function clearAllCellCaches() {
  pendingCellObjects.clear();
  allCellObjects.clear();
}
