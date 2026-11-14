/**
 * RenderLoopGovernor — keeps the 3D canvas at full frame rate while the user
 * is interacting or an animation is active, then drops to on-demand rendering
 * when the scene has settled.
 *
 * R3F runs in `demand` mode for the diagram. While active, a lightweight rAF
 * pump invalidates one frame per display refresh; when idle the pump stops and
 * the demand loop naturally goes to sleep. Keeping the store in `demand` (and
 * only switching to `never` for the 2D view) avoids fighting CanvasImpl's
 * `frameloop` prop and means a static scene costs no CPU/GPU at all.
 *
 * This module is intentionally framework-free. FrameloopController registers
 * the R3F setters; any component can request a frame or hold a lease.
 */

import { getLastFrameTs } from './renderWorkScheduler';

const INTERACTION_HOLD_MS = 1500;
const MOUNT_HOLD_MS = 2200;
const LEASE_RELEASE_GRACE_MS = 250;
// Frames closer together than this mean the clock is already current.
const CLOCK_GAP_MS = 250;

let registration = null;
let viewMode = '3d';
let hidden = false;
let activeUntil = 0;
let currentFrameloop = 'demand';
let idleTimer = null;
let pumpFrame = null;
let wasActive = false;

const leases = new Set();
const settleListeners = new Set();

const now = () => performance.now();

function clearIdleTimer() {
  if (idleTimer !== null) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
}

function stopPump() {
  if (pumpFrame !== null) {
    cancelAnimationFrame(pumpFrame);
    pumpFrame = null;
  }
}

function applyFrameloop(mode) {
  if (currentFrameloop === mode) return false;
  currentFrameloop = mode;
  registration?.setFrameloop(mode);
  return true;
}

function hasActivity() {
  return leases.size > 0 || now() < activeUntil;
}

function notifySettled() {
  for (const listener of settleListeners) {
    try {
      listener();
    } catch {
      /* listeners must never break the render loop */
    }
  }
}

// Demand rendering stops ticking R3F's clock. Consume the accumulated gap
// before the first frame after idle so animations don't jump/snap on resume.
function consumeClockDelta() {
  if (now() - getLastFrameTs() <= CLOCK_GAP_MS) return;
  try {
    registration?.consumeClockDelta?.();
  } catch {
    /* clock may be disposed during teardown */
  }
}

function pump() {
  pumpFrame = null;
  if (!registration || viewMode !== '3d' || hidden || !hasActivity()) {
    reconcile();
    return;
  }
  registration.invalidate();
  pumpFrame = requestAnimationFrame(pump);
}

function ensurePump() {
  if (pumpFrame !== null) return;
  if (!registration || viewMode !== '3d' || hidden || !hasActivity()) return;
  pumpFrame = requestAnimationFrame(pump);
}

function scheduleIdleCheck() {
  clearIdleTimer();
  if (!registration || viewMode !== '3d' || hidden) return;
  if (leases.size > 0) return;

  const delay = Math.max(0, activeUntil - now()) + 25;
  idleTimer = setTimeout(() => {
    idleTimer = null;
    reconcile();
  }, delay);
}

function reconcile() {
  clearIdleTimer();
  if (!registration) return;

  if (viewMode !== '3d' || hidden) {
    stopPump();
    applyFrameloop('never');
    if (wasActive) {
      wasActive = false;
      notifySettled();
    }
    return;
  }

  // The diagram always uses demand mode; the pump supplies continuous frames.
  applyFrameloop('demand');

  if (hasActivity()) {
    wasActive = true;
    ensurePump();
    scheduleIdleCheck();
  } else {
    stopPump();
    if (wasActive) {
      wasActive = false;
      notifySettled();
    }
  }
}

/**
 * Register the R3F render-loop bridge. Called by FrameloopController.
 * @param {{
 *   setFrameloop: (mode: string) => void,
 *   invalidate: () => void,
 *   getFrameloop?: () => string,
 *   consumeClockDelta?: () => void,
 * }} api
 */
export function registerRenderLoop(api) {
  registration = api;
  currentFrameloop = api.getFrameloop?.() || 'demand';
  if (viewMode === '3d' && !hidden) {
    activeUntil = Math.max(activeUntil, now() + MOUNT_HOLD_MS);
    consumeClockDelta();
  }
  reconcile();
}

export function unregisterRenderLoop() {
  clearIdleTimer();
  stopPump();
  registration = null;
  currentFrameloop = 'demand';
  wasActive = false;
}

/**
 * Switch between the 3D canvas and the 2D overlay.
 * @param {'3d'|'2d'} mode
 */
export function setRenderViewMode(mode) {
  const nextMode = mode === '2d' ? '2d' : '3d';
  const changed = nextMode !== viewMode;
  viewMode = nextMode;

  if (viewMode !== '3d') {
    activeUntil = 0;
    reconcile();
    return;
  }

  if (changed) {
    activeUntil = now() + MOUNT_HOLD_MS;
    consumeClockDelta();
  }
  reconcile();
}

export function setRenderLoopHidden(isHidden) {
  const nextHidden = Boolean(isHidden);
  if (hidden === nextHidden) return;
  hidden = nextHidden;

  if (hidden) {
    reconcile();
    return;
  }

  if (viewMode === '3d') {
    activeUntil = Math.max(activeUntil, now() + 400);
    consumeClockDelta();
  }
  reconcile();
}

/**
 * Mark user interaction so the loop runs continuously for a short settle
 * window (orbit damping, hover feedback, drags, keyboard navigation).
 * @param {number} durationMs
 */
export function noteInteraction(durationMs = INTERACTION_HOLD_MS) {
  if (viewMode !== '3d' || hidden) return;
  if (!wasActive) consumeClockDelta();
  activeUntil = Math.max(activeUntil, now() + durationMs);
  wasActive = true;
  ensurePump();
  scheduleIdleCheck();
}

/**
 * Hold full-rate frames for a continuous animation owned by `owner`.
 * Always pair with releaseRenderLease.
 * @param {string} owner
 */
export function acquireRenderLease(owner) {
  if (leases.has(owner)) return;
  if (viewMode === '3d' && !hidden && !hasActivity()) consumeClockDelta();
  leases.add(owner);
  reconcile();
}

export function releaseRenderLease(owner) {
  if (!leases.delete(owner)) return;
  if (leases.size === 0) {
    activeUntil = Math.max(activeUntil, now() + LEASE_RELEASE_GRACE_MS);
  }
  reconcile();
}

/**
 * Schedule a single frame. Safe to call in any mode.
 */
export function requestRender() {
  if (!registration) return;
  if (viewMode === '3d' && !hidden) {
    consumeClockDelta();
  }
  registration.invalidate();
}

export function getDesiredFrameloop() {
  if (viewMode !== '3d' || hidden) return 'never';
  return 'demand';
}

export function isInteractionActive() {
  return viewMode === '3d' && !hidden && hasActivity();
}

/**
 * Notify when the scene transitions from active rendering to settled/idle.
 * Used by adaptive quality to restore full resolution for the final frame.
 * @param {() => void} listener
 * @returns {() => void} unsubscribe
 */
export function subscribeRenderSettled(listener) {
  settleListeners.add(listener);
  return () => settleListeners.delete(listener);
}
