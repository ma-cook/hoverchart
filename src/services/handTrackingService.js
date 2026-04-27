/**
 * handTrackingService.js
 *
 * Owns the getUserMedia lifecycle, per-frame capture pump, and worker handshake
 * for MediaPipe hand-landmark detection.
 *
 * Public API:
 *   startHandTracking()  — acquire camera, load model, begin capture loop.
 *   stopHandTracking()   — tear everything down and reset the store.
 */

import { transfer } from 'comlink';
import {
  getHandTrackingWorker,
  terminateHandTrackingWorker,
} from '../workers/handTrackingWorkerClient';
import useHandTrackingStore from '../stores/handTrackingStore';

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

/** @type {HTMLVideoElement | null} */
let videoEl = null;

/** @type {MediaStream | null} */
let stream = null;

/** Guard against overlapping detect() calls. */
let inFlight = false;

/** rVFC handle (number) or rAF handle (number). */
let rvfcHandle = null;

/** Whether we are currently using requestVideoFrameCallback (vs rAF). */
let usingRvfc = false;

/** Frames captured since the last FPS snapshot. */
let frameCounter = 0;

/** Timestamp (ms) of the last FPS snapshot. */
let fpsTimer = 0;

/** Set to true while the page is hidden — the loop skips detect() but keeps running. */
let paused = false;

// ---------------------------------------------------------------------------
// Capture loop
// ---------------------------------------------------------------------------

/**
 * One iteration of the capture loop.
 * Called by either requestVideoFrameCallback or requestAnimationFrame.
 */
async function captureFrame() {
  if (!videoEl || !stream) return; // torn down while frame was in flight

  // Re-schedule immediately so we keep the loop alive regardless of errors.
  scheduleNextFrame();

  // Skip detection while the page is hidden or a previous detect is still running.
  if (paused || inFlight) return;

  inFlight = true;
  try {
    const worker = getHandTrackingWorker();
    const bitmap = await createImageBitmap(videoEl);
    const result = await worker.detect(transfer(bitmap, [bitmap]), performance.now());

    const { hands } = result;
    const left = hands.find((h) => h.handedness === 'Left') ?? null;
    const right = hands.find((h) => h.handedness === 'Right') ?? null;
    useHandTrackingStore.getState().setHands({ left, right });

    // FPS bookkeeping — update once per second.
    frameCounter++;
    const now = performance.now();
    if (now - fpsTimer >= 1000) {
      useHandTrackingStore.getState().setFps(
        Math.round((frameCounter * 1000) / (now - fpsTimer))
      );
      frameCounter = 0;
      fpsTimer = now;
    }
  } catch (err) {
    console.error('[handTrackingService] detect error:', err);
    useHandTrackingStore.getState().setError(err?.message ?? String(err));
  } finally {
    inFlight = false;
  }
}

/**
 * Schedule the next frame using rVFC when available, falling back to rAF.
 */
function scheduleNextFrame() {
  if (!videoEl) return;

  if (usingRvfc) {
    rvfcHandle = videoEl.requestVideoFrameCallback(captureFrame);
  } else {
    rvfcHandle = requestAnimationFrame(captureFrame);
  }
}

/**
 * Cancel any pending frame callback.
 * usingRvfc determines which API owns the handle — check it independently of
 * videoEl so teardown always cancels the right callback.
 */
function cancelNextFrame() {
  if (rvfcHandle === null) return;

  if (usingRvfc) {
    // videoEl may already be null during teardown; only cancel if still alive.
    if (videoEl) {
      videoEl.cancelVideoFrameCallback(rvfcHandle);
    }
  } else {
    cancelAnimationFrame(rvfcHandle);
  }
  rvfcHandle = null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialise the worker + model, acquire the camera, and start the capture loop.
 */
export async function startHandTracking() {
  const { setEnabled, setError } = useHandTrackingStore.getState();

  try {
    // 1. Worker + model
    const worker = getHandTrackingWorker();
    await worker.init('/assets/mediapipe/hand_landmarker.task');

    // 2. Camera stream
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, frameRate: 30 },
    });

    // 3. Off-DOM video element
    videoEl = document.createElement('video');
    videoEl.srcObject = stream;
    videoEl.playsInline = true;
    videoEl.muted = true;
    await videoEl.play();

    // 4. Start capture loop
    usingRvfc = typeof videoEl.requestVideoFrameCallback === 'function';
    frameCounter = 0;
    fpsTimer = performance.now();
    scheduleNextFrame();

    // 5. Register visibility-change listener and mark as enabled.
    document.addEventListener('visibilitychange', handleVisibilityChange);
    setEnabled(true);
  } catch (err) {
    console.error('[handTrackingService] startHandTracking error:', err);
    setError(err?.message ?? String(err));

    // Permission denied / model load failure — irrecoverable, tear down.
    stopHandTracking();
  }
}

/**
 * Stop the capture loop, release camera resources, and reset the store.
 */
export function stopHandTracking() {
  // 1. Cancel the pending frame callback.
  cancelNextFrame();

  // 2. Stop all camera tracks.
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }

  // 3. Detach and drop the video element.
  if (videoEl) {
    videoEl.srcObject = null;
    videoEl = null;
  }

  // 4. Terminate the worker and remove the visibility listener.
  terminateHandTrackingWorker();
  document.removeEventListener('visibilitychange', handleVisibilityChange);

  // 5. Reset state flags.
  inFlight = false;
  usingRvfc = false;
  paused = false;
  rvfcHandle = null;
  frameCounter = 0;
  fpsTimer = 0;

  // 6. Reset the store.
  useHandTrackingStore.getState().reset();
}

// ---------------------------------------------------------------------------
// Visibility-change handling — pause without tearing down the worker
// ---------------------------------------------------------------------------

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    paused = true;
  } else {
    // Resume: reset the FPS timer so we don't report a huge spike.
    if (paused) {
      fpsTimer = performance.now();
      frameCounter = 0;
    }
    paused = false;
  }
}
