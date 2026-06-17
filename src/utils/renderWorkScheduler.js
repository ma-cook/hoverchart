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
 * Frame-time monitoring: tracks actual frame durations so that per-frame
 * hooks (LOD, frustum culling, billboard) can skip work when the main
 * thread is overloaded, preventing total freezes.
 *
 * Usage:
 *   import { acquireBudget, isCameraMoving, notifyCameraMove, isFrameBudgetExhausted } from '../utils/renderWorkScheduler';
 *
 *   // Call from OrbitControls 'change' handler or useFrame:
 *   notifyCameraMove();
 *
 *   // In progressive mounting rAF loop:
 *   if (isCameraMoving()) return; // skip this frame, camera is panning
 *   const allowed = acquireBudget(requestedCount);
 *
 *   // In useFrame hooks, skip non-essential work when frames are slow:
 *   if (isFrameBudgetExhausted()) return;
 */

// ── Per-frame budget ──────────────────────────────────────────────

/** Maximum new items (components, buffer entries, textures) to process per frame.
 *  ObjectsRenderer requests up to 8 (or 2 during movement),
 *  ConnectionsRenderer requests up to 12 (or 2 during movement).
 *  Budget of 20 allows both to run at full speed on idle frames. */
let _frameBudget = 20;

/** How much of the budget has been consumed this frame. */
let _frameUsed = 0;

/** Whether we have already scheduled a rAF reset for this frame. */
let _resetScheduled = false;

// ── Frame-time monitoring ─────────────────────────────────────────
// Tracks how long frames actually take so that useFrame hooks can
// voluntarily skip non-essential work when the main thread is lagging.
//
// CRITICAL: This runs on its OWN persistent rAF loop, independent of
// acquireBudget(). The old design only measured frame time inside
// _resetForNextFrame (which was scheduled by acquireBudget). Once
// progressive mounting finished, acquireBudget stopped being called,
// _smoothFrameTime froze at a high value, and isFrameBudgetExhausted()
// permanently returned true — blocking LOD, text billboarding, and
// connection visibility updates forever.

/** Timestamp of the previous rAF tick (for computing frame delta). */
let _prevFrameTs = 0;

/** Smoothed frame time in ms (EMA with alpha=0.15 — slower reaction avoids
 *  single-spike overreaction, recovers in ~5 frames instead of ~10). */
let _smoothFrameTime = 16;

/** Threshold: if smoothed frame time exceeds this, frame budget is considered
 *  exhausted. 40ms ≈ 25fps — a safer threshold that avoids the starvation
 *  spiral on mid-range GPUs where the old 28ms value permanently disabled
 *  LOD and culling. */
const FRAME_TIME_BUDGET_MS = 40;

/** Number of consecutive frames where _smoothFrameTime > FRAME_TIME_BUDGET_MS.
 *  `isFrameBudgetExhausted()` only returns true after this many consecutive
 *  bad frames, preventing a single spike from disabling essential culling. */
let _consecutiveBadFrames = 0;

/** How many consecutive bad frames before we start shedding work. */
const BAD_FRAME_THRESHOLD = 5;

/** Number of camera move events in the last 500ms — detects "rapid" panning. */
let _moveCount = 0;
let _moveCountResetTime = 0;
const MOVE_COUNT_WINDOW_MS = 500;

/** Whether the persistent frame-time tracking loop is running. */
let _frameTrackingRunning = false;

/**
 * Persistent rAF loop that continuously measures frame time.
 * Starts automatically and runs for the lifetime of the app.
 */
function _frameTimeTracker(ts) {
  if (_prevFrameTs > 0) {
    const dt = ts - _prevFrameTs;
    // EMA smoothing (alpha=0.15) — smoother than the old 0.3, recovers faster
    // from brief spikes while still tracking sustained degradation.
    _smoothFrameTime = _smoothFrameTime * 0.85 + dt * 0.15;

    // Track consecutive bad frames for starvation prevention
    if (_smoothFrameTime > FRAME_TIME_BUDGET_MS) {
      _consecutiveBadFrames++;
    } else {
      _consecutiveBadFrames = 0;
    }
  }
  _prevFrameTs = ts;
  requestAnimationFrame(_frameTimeTracker);
}

// Start the persistent frame-time tracking loop immediately
if (!_frameTrackingRunning) {
  _frameTrackingRunning = true;
  requestAnimationFrame(_frameTimeTracker);
}

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
const MOVE_SETTLE_MS = 50;

/**
 * Call this whenever the camera is known to be moving
 * (e.g. OrbitControls 'change', or detected in useFrame).
 */
export function notifyCameraMove() {
  _lastMoveTs = performance.now();

  // Track move frequency for rapid-movement detection
  const now = performance.now();
  if (now - _moveCountResetTime > MOVE_COUNT_WINDOW_MS) {
    _moveCount = 0;
    _moveCountResetTime = now;
  }
  _moveCount++;
}

/**
 * Returns `true` if the camera was moving within the last MOVE_SETTLE_MS.
 * Progressive mounting should defer work while this is true.
 */
export function isCameraMoving() {
  return performance.now() - _lastMoveTs < MOVE_SETTLE_MS;
}

/**
 * Returns `true` if the camera is being moved rapidly (many move events
 * per second). During rapid movement, even throttled work like visibility
 * updates should be deferred to prevent React re-render cascades.
 *
 * "Rapid" = more than 8 OrbitControls change events in 500ms.
 */
export function isCameraMovingRapidly() {
  if (!isCameraMoving()) return false;
  return _moveCount > 8;
}

/**
 * Returns `true` when the frame budget is considered exhausted — i.e. the
 * renderer has been consistently slow for several consecutive frames.
 *
 * A single spike does NOT trigger exhaustion; only sustained degradation
 * (BAD_FRAME_THRESHOLD consecutive frames above 40ms) causes this to fire.
 * This prevents the starvation spiral where one bad frame disables LOD and
 * culling — the very systems that would bring frame time back down.
 *
 * @returns {boolean}
 */
export function isFrameBudgetExhausted() {
  return _consecutiveBadFrames >= BAD_FRAME_THRESHOLD;
}

/**
 * Returns the current smoothed frame time in ms.
 * Useful for adaptive throttling.
 * @returns {number}
 */
export function getSmoothedFrameTime() {
  return _smoothFrameTime;
}
