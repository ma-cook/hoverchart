/**
 * repoContentSignal.js
 *
 * Lightweight external store that bumps a version counter whenever the
 * ContentStore's repo: entries change (population, hydration, edits, clear).
 * React components subscribe via useSyncExternalStore so UI that depends on
 * content-store state (e.g. the object `</>` code button) re-evaluates when
 * chunked repo contents arrive asynchronously after a scan or page load.
 */

let _version = 0;
const _listeners = new Set();
let _scheduled = false;

function flush() {
  _scheduled = false;
  for (const listener of Array.from(_listeners)) {
    try {
      listener();
    } catch {
      /* a failing subscriber must never break store mutations */
    }
  }
}

export function subscribeToRepoContent(listener) {
  _listeners.add(listener);
  return () => {
    _listeners.delete(listener);
  };
}

export function getRepoContentVersion() {
  return _version;
}

/**
 * Bump the version and coalesce: bursts of mutations (e.g. one mergeBulk per
 * populate batch) collapse into a single flush on the next tick, so a large
 * repo population doesn't trigger a re-render per batch.
 */
export function notifyRepoContentChanged() {
  _version++;
  if (!_scheduled) {
    _scheduled = true;
    setTimeout(flush, 0);
  }
}