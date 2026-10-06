// Pure queue helpers for LOD level transitions.
//
// Kept free of React/zustand/three so the routing and budgeting rules can be
// unit tested directly. LODManager owns the queues (as refs) and flushes what
// these return through a single batchSetLODLevels call per frame.

/**
 * Route a batch of requested LOD level changes into the two transition queues.
 *
 * Rules (all relative to the object's *store* level, which is authoritative —
 * a queued-but-not-yet-applied transition must not become the reference):
 *  - requesting the level the store already holds cancels any pending
 *    transition and is otherwise a no-op;
 *  - a downgrade (numerically higher than the store level) goes to
 *    `downgradeQueue` and cancels any pending upgrade;
 *  - an upgrade (numerically lower than the store level) goes to
 *    `upgradeQueue` and cancels any pending downgrade;
 *  - the latest requested level for an object wins.
 *
 * @param {object} opts
 * @param {Map<string, {level:number}>} opts.upgradeQueue  pending upgrades (value holds .level)
 * @param {Map<string, number>}          opts.downgradeQueue pending downgrades (value is level)
 * @param {Iterable<[string, number]>}   opts.updates       requested [objectId, newLevel] pairs
 * @param {Map<string, number>}          opts.currentLevels known current levels
 * @param {number}                       [opts.fullLevel=0] level treated as default for unknown ids
 */
export function enqueueLodTransitions({
  upgradeQueue,
  downgradeQueue,
  updates,
  currentLevels,
  fullLevel = 0,
}) {
  if (!updates) return;

  for (const [objectId, newLevel] of updates) {
    const currentLevel = currentLevels.get(objectId) ?? fullLevel;
    if (newLevel === currentLevel) {
      // Store already holds the requested level — drop any stale pending
      // transition so an over-budget queue can't apply an outdated level.
      upgradeQueue.delete(objectId);
      downgradeQueue.delete(objectId);
      continue;
    }

    if (newLevel > currentLevel) {
      downgradeQueue.set(objectId, newLevel);
      upgradeQueue.delete(objectId);
    } else {
      upgradeQueue.set(objectId, { level: newLevel });
      downgradeQueue.delete(objectId);
    }
  }
}

/**
 * Take up to `budget` pending downgrades in insertion order (no sort —
 * downgrades are not distance-sensitive and sorting a large queue every
 * frame is itself O(Q log Q)).
 *
 * Taken entries are removed from the queue. Deleting the *current* key
 * while iterating a Map is well-defined (the iterator advances past it), so
 * no collect-then-delete pass is needed.
 *
 * @returns {Array<[string, number]>} [objectId, level] pairs ready for the store
 */
export function takeDowngradeBatch(downgradeQueue, budget) {
  const batch = [];
  if (!downgradeQueue || downgradeQueue.size === 0 || budget <= 0) return batch;

  for (const [objectId, level] of downgradeQueue) {
    if (batch.length >= budget) break;
    batch.push([objectId, level]);
    downgradeQueue.delete(objectId);
  }
  return batch;
}
