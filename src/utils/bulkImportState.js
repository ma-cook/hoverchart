// Shared flag signaling that a bulk import / progressive-mount burst is in
// flight.  Expensive per-frame subsystems (frustum re-evaluation sweeps,
// connection pathfinding categorization) consult this to defer work until
// mounting settles, instead of paying O(N) repeatedly while the scene grows.

export const bulkImportState = {
  active: false,
};

/** Begin deferring expensive work. Safe to call redundantly. */
export function beginBulkImport() {
  bulkImportState.active = true;
}

/**
 * End deferral once `pending === 0`.  Returns true when this call actually
 * cleared the flag (so callers can run one final catch-up pass).
 */
export function endBulkImportIfIdle(pendingCount) {
  if (bulkImportState.active && pendingCount === 0) {
    bulkImportState.active = false;
    return true;
  }
  return false;
}

// Per-key throttle bookkeeping for the global LOD tier/edge/face filters.
const _filterThrottle = new Map();
const FILTER_THROTTLE_MS = 150;

/**
 * Throttle the O(N) tier/edge/face filter recomputes inside the Global*
 * renderers while a bulk import streams.  Instead of recomputing on every
 * mount batch (which can be several waves per frame as the scene grows), the
 * caller reuses its previous filtered array at most once per
 * FILTER_THROTTLE_MS window.  This keeps the scene visibly populating during
 * import while cutting the repeated full-scene scans.  Always returns false
 * (forcing a recompute) once the import settles or when there is no previous
 * result, so the final authoritative pass is never skipped.
 *
 * @param {string} key          stable identifier for this renderer's filter
 * @param {boolean} hasPrevious whether the caller currently holds a result
 */
export function shouldDeferGlobalFilter(key, hasPrevious) {
  if (!hasPrevious || !bulkImportState.active) return false;
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const last = _filterThrottle.get(key);
  if (last !== undefined && now - last < FILTER_THROTTLE_MS) return true;
  _filterThrottle.set(key, now);
  return false;
}
