import * as THREE from 'three';

// Global picking gate for very large diagrams.
//
// Every pointer move normally triggers R3F raycasting against every
// interactive mesh, including custom O(N) raycasters that iterate all
// connection segments. On ~100k-object scenes this alone drops frames to
// near zero whenever the mouse moves.
//
// TWO entry points matter:
//   - R3F's event system raycasts with the SINGULAR
//     `raycaster.intersectObject(obj, true)`, one call per interactive
//     object, all synchronously inside one pointer event
//     (@react-three/fiber dist/events-*.esm.js).
//   - `intersectObjects` (plural) has no live caller in this app, but is
//     gated for suppression so any future caller behaves consistently.
//
// IMPORTANT: the rate limit must NOT simply return [] for rejected picks.
// R3F's pointermove path calls `cancelPointer(hits)` — empty hits fire
// onPointerOut on whatever is hovered, so a throttled [] makes hover
// flicker at the throttle rate. Worse, pointerdown stores
// `internal.initialHits = hits`, so a rejected [] makes the subsequent
// click resolve to nothing (and fire onPointerMissed). Instead, a pick
// made inside the rate-limit window is served from a per-object cache of
// the last result: at most one real raycast pass per PICK_MIN_INTERVAL_MS,
// while hover/click keep working. The pointerdown burst bypass guarantees
// clicks are computed against the ray at press time, never a stale one.
//
// While the camera is moving, picking is suppressed entirely plus a short
// tail after motion stops (hover re-checks right after you stop). A click
// right after orbiting may fall through within that window.

const MOTION_TAIL_MS = 150;
const PICK_MIN_INTERVAL_MS = 33;
// Recompute (ignore the cache) this long after a pointer press so the click
// resolves against the ray where the user actually pressed.
const POINTER_DOWN_BYPASS_MS = 50;

const originals = { intersectObject: null, intersectObjects: null };

/** object -> { raycaster, recursive, hits, at } — last raycast result per object. */
const hitCache = new Map();

let suppressedUntil = 0;
let bypassUntil = 0;
let installed = false;

/**
 * Suppress picking for `ms` (motion tail), extending any existing window.
 * Also drops the result cache, since camera motion invalidates it.
 * Returns the timestamp suppression runs until.
 */
export const suppressPicking = (ms = MOTION_TAIL_MS) => {
  const until = performance.now() + ms;
  if (until > suppressedUntil) suppressedUntil = until;
  if (hitCache.size > 0) hitCache.clear();
  return suppressedUntil;
};

export const isPickingSuppressed = () => performance.now() < suppressedUntil;

/**
 * Force the next picks to recompute instead of serving cached results.
 * Installed as a capture-phase window listener for pointerdown.
 * @param {number} [ms] how long picks stay uncached. Non-numeric input (e.g.
 *   a PointerEvent handed over by addEventListener) falls back to the default.
 */
export const bypassPicking = (ms = POINTER_DOWN_BYPASS_MS) => {
  const duration =
    typeof ms === 'number' && !Number.isNaN(ms) ? ms : POINTER_DOWN_BYPASS_MS;
  bypassUntil = performance.now() + duration;
};

// Wraps bypassPicking so the listener never receives the PointerEvent as `ms`.
const onPointerDown = () => bypassPicking();

function gatedIntersectObject(object, recursive = true, ...rest) {
  const now = performance.now();
  if (now < suppressedUntil) return [];

  // An explicit optionalTarget must receive the results directly, and a
  // pointer press must see the current ray — neither may use the cache.
  if (rest.length > 0 || now < bypassUntil) {
    return originals.intersectObject.call(this, object, recursive, ...rest);
  }

  const entry = hitCache.get(object);
  if (
    entry &&
    entry.raycaster === this &&
    entry.recursive === recursive &&
    now - entry.at < PICK_MIN_INTERVAL_MS
  ) {
    return entry.hits;
  }

  const hits = originals.intersectObject.call(this, object, recursive);
  hitCache.set(object, { raycaster: this, recursive, hits, at: now });
  return hits;
}

function gatedIntersectObjects(...args) {
  if (performance.now() < suppressedUntil) return [];
  return originals.intersectObjects.apply(this, args);
}

/**
 * Patch Raycaster.prototype: singular (R3F's path) gets motion suppression
 * plus the rate-limited result cache; plural gets motion suppression.
 * Idempotent; returns true if it patched.
 */
export function installRaycasterGate() {
  if (installed) return false;
  installed = true;

  originals.intersectObject = THREE.Raycaster.prototype.intersectObject;
  originals.intersectObjects = THREE.Raycaster.prototype.intersectObjects;
  THREE.Raycaster.prototype.intersectObject = gatedIntersectObject;
  THREE.Raycaster.prototype.intersectObjects = gatedIntersectObjects;

  // window capture fires before R3F's canvas-target pointerdown handler, so
  // the bypass is already open by the time R3F raycasts for the press.
  if (typeof window !== 'undefined') {
    window.addEventListener('pointerdown', onPointerDown, true);
  }
  return true;
}

/**
 * Restore the unpatched Raycaster methods and reset gate state.
 * Intended for tests — production code installs once and never resets.
 */
export function resetRaycasterGate() {
  if (typeof window !== 'undefined') {
    window.removeEventListener('pointerdown', onPointerDown, true);
  }
  if (originals.intersectObject) {
    THREE.Raycaster.prototype.intersectObject = originals.intersectObject;
    originals.intersectObject = null;
  }
  if (originals.intersectObjects) {
    THREE.Raycaster.prototype.intersectObjects = originals.intersectObjects;
    originals.intersectObjects = null;
  }
  hitCache.clear();
  bypassUntil = 0;
  suppressedUntil = 0;
  installed = false;
}
