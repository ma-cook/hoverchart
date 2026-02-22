/**
 * RenderWorkScheduler — Global GPU-work coordinator
 *
 * During camera movement, multiple independent systems (ObjectsRenderer,
 * ConnectionsRenderer, text atlas) may try to mount new resources in the
 * same animation frame, overwhelming the GPU and crashing the graphics card.
 *
 * This singleton enforces a **shared per-frame budget** so the total new
 * work across ALL systems is bounded.
 *
 * It also tracks whether the camera is actively moving so consumers can
 * **completely defer** non-essential mounting work during pans/orbits,
 * keeping OrbitControls smooth.
 *
 * Usage:
 *   import { acquireBudget, isCameraMoving, notifyCameraMove } from '../utils/renderWorkScheduler';
 *
 *   // Call from OrbitControls 'change' handler or useFrame:
 *   notifyCameraMove();
 *
 *   // In progressive mounting rAF loop:
 *   if (isCameraMoving()) return; // skip this frame, camera is panning
 *   const allowed = acquireBudget(requestedCount);
 */

// ── Per-frame budget ──────────────────────────────────────────────

/** Maximum new items (components, buffer entries, textures) to process per frame. */
let _frameBudget = 8;

/** How much of the budget has been consumed this frame. */
let _frameUsed = 0;

/** Whether we have already scheduled a rAF reset for this frame. */
let _resetScheduled = false;

/** rAF callback: resets the budget for the next frame. */
function _resetForNextFrame() {
  _frameUsed = 0;
  _resetScheduled = false;
}

/**
 * Request `count` items from this frame's budget.
 * Returns the number actually allowed (0 … count) and debits the budget.
 *
 * @param {number} count - Desired number of work items
 * @returns {number} Allowed count (may be 0 if budget is exhausted)
 */
export function acquireBudget(count) {
  if (!_resetScheduled) {
    _resetScheduled = true;
    requestAnimationFrame(_resetForNextFrame);
  }
  const allowed = Math.max(0, Math.min(count, _frameBudget - _frameUsed));
  _frameUsed += allowed;
  return allowed;
}

/**
 * Set the global per-frame budget.
 * @param {number} budget
 */
export function setFrameBudget(budget) {
  _frameBudget = budget;
}

/**
 * Get the current per-frame budget setting.
 * @returns {number}
 */
export function getFrameBudget() {
  return _frameBudget;
}

// ── Camera-movement awareness ─────────────────────────────────────
// Any system that detects camera motion calls `notifyCameraMove()`.
// During the "moving" window, `isCameraMoving()` returns true so
// progressive mounters can skip the frame entirely and yield the
// main thread to OrbitControls / the GPU for rendering.

/** Timestamp of the last camera-move notification. */
let _lastMoveTs = 0;

/**
 * Duration (ms) after the last move notification during which
 * `isCameraMoving()` returns true. This acts as a "settle" window:
 * once the user stops panning/orbiting, mounting resumes after this gap.
 */
const MOVE_SETTLE_MS = 150;

/**
 * Call this whenever the camera is known to be moving
 * (e.g. OrbitControls 'change', or detected in useFrame).
 */
export function notifyCameraMove() {
  _lastMoveTs = performance.now();
}

/**
 * Returns `true` if the camera was moving within the last MOVE_SETTLE_MS.
 * Progressive mounting should defer work while this is true.
 */
export function isCameraMoving() {
  return performance.now() - _lastMoveTs < MOVE_SETTLE_MS;
}
