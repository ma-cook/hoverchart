/**
 * Cell Object Cache
 *
 * Two-tier cache for objects created during diagram generation that haven't
 * been persisted yet (or need to survive cell unload/re-load before the Cloud
 * Function completes).
 *
 *   pendingCellObjects  – consumed once on first cell load (one-shot)
 *   allCellObjects      – never deleted, persistent fallback for re-loads
 *                         Cleared when a new diagram is generated or on space
 *                         transition (see clearAllCellCaches callers).
 *
 * Both maps are keyed by `${spaceId}::${cellId}`.  A cellId alone is NOT
 * unique across spaces — objects of a deleted space would otherwise be
 * re-hydrated into a newly created space whenever an overlapping cell loads.
 * Namespacing by spaceId structurally guarantees cached objects can never
 * leak across spaces.
 */

const pendingCellObjects = new Map();
const allCellObjects = new Map();

// Append only objects whose id isn't already cached — repeated creation or
// hydration of the same object (e.g. rescan, or a container created again
// after an unload) must not pile up duplicates.  Duplicate cached objects
// re-hydrate into the store on every reload, inflating renderProgress.total.
function mergeUnique(target, objects) {
  if (!objects || objects.length === 0) return;
  const known = new Set(target.map((o) => o.id));
  for (const obj of objects) {
    if (!known.has(obj.id)) {
      target.push(obj);
      known.add(obj.id);
    }
  }
}

function spaceCellKey(spaceId, cellId) {
  return `${spaceId}::${cellId}`;
}

export function addPendingCellObjects(spaceId, cellId, objects) {
  if (!objects || objects.length === 0) return;
  const key = spaceCellKey(spaceId, cellId);

  // pending – one-shot, consumed on first load
  let pending = pendingCellObjects.get(key);
  if (!pending) {
    pending = [];
    pendingCellObjects.set(key, pending);
  }
  mergeUnique(pending, objects);

  // all – persistent fallback
  let all = allCellObjects.get(key);
  if (!all) {
    all = [];
    allCellObjects.set(key, all);
  }
  mergeUnique(all, objects);
}

export function consumePendingCellObjects(spaceId, cellId) {
  const key = spaceCellKey(spaceId, cellId);
  const objects = pendingCellObjects.get(key);
  if (objects) {
    pendingCellObjects.delete(key);
  }
  return objects || [];
}

export function consumePendingCellObjectsForCells(spaceId, cellIds) {
  const result = [];
  for (const cellId of cellIds) {
    const objects = consumePendingCellObjects(spaceId, cellId);
    if (objects.length > 0) result.push(...objects);
  }
  return result;
}

export function addToAllCellObjects(spaceId, cellId, objects) {
  if (!objects || objects.length === 0) return;
  const key = spaceCellKey(spaceId, cellId);
  let all = allCellObjects.get(key);
  if (!all) {
    all = [];
    allCellObjects.set(key, all);
  }
  mergeUnique(all, objects);
}

export function getAllCellObjectsForCells(spaceId, cellIds) {
  const result = [];
  for (const cellId of cellIds) {
    const objects = allCellObjects.get(spaceCellKey(spaceId, cellId));
    if (objects && objects.length > 0) result.push(...objects);
  }
  return result;
}

export function hasAnyPendingObjects(spaceId) {
  if (!spaceId) return pendingCellObjects.size > 0;
  const prefix = `${spaceId}::`;
  for (const key of pendingCellObjects.keys()) {
    if (key.startsWith(prefix)) return true;
  }
  return false;
}

export function clearAllCellCaches() {
  pendingCellObjects.clear();
  allCellObjects.clear();
}
