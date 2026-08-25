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
