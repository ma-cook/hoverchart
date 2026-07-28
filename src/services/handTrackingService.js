/**
 * handTrackingService.js
 *
 * Main-thread driver for the ONNX MediaPipe Hands pipeline. The actual
 * inference runs inside `handTrackingWorker.js` (Comlink); this module owns:
 *   • camera lifecycle (`getUserMedia`, off-DOM <video>, teardown)
 *   • the per-frame capture pump (driven by `requestVideoFrameCallback`)
 *   • visibility-based pause/resume
 *   • forwarding worker results into `handTrackingStore`
 *
 * The capture pump uses `createImageBitmap(video)` + Comlink `transfer` so
 * pixel data moves to the worker without a copy. The render thread is
 * therefore free of all preprocessing, ORT calls, and tensor allocation.
 */

import { transfer } from 'comlink';
import useHandTrackingStore from '../stores/handTrackingStore';
import {
  getHandTrackingWorker,
  terminateHandTrackingWorker,
} from '../workers/handTrackingWorkerClient';

const CAMERA_WIDTH = 320;
const CAMERA_HEIGHT = 240;

const ORT_VERSION = '1.24.3';
const ORT_WASM_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;

const HAND_DETECTOR_URL = '/assets/onnx/hand_detector.onnx';
const HAND_DETECTOR_DATA_URL = '/assets/onnx/hand_detector.data';
const HAND_LANDMARK_URL = '/assets/onnx/hand_landmark_detector.onnx';
const HAND_LANDMARK_DATA_URL = '/assets/onnx/hand_landmark_detector.data';

/** @type {MediaStream | null} */
let stream = null;
/** @type {HTMLVideoElement | null} */
let video = null;

let rafHandle = 0;
let rvfcHandle = 0;
let frameCounter = 0;
let fpsTimer = 0;
let running = false;
let paused = false;
let inferring = false;
let visibilityHandler = null;
let workerProxy = null;
let workerInitPromise = null;

async function ensureWorker() {
  if (workerInitPromise) return workerInitPromise;
  workerProxy = getHandTrackingWorker();

  // Probe execution providers in order. WebGPU is dramatically faster when
  // available (no WebGL context required). WASM is the fallback.
  const numThreads = Math.min(
    4,
    typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 1) : 1
  );
  const executionProviders =
    typeof navigator !== 'undefined' && 'gpu' in navigator
      ? ['webgpu', 'wasm']
      : ['wasm'];

  workerInitPromise = workerProxy
    .init({
      wasmBase: ORT_WASM_BASE,
      detectorUrl: HAND_DETECTOR_URL,
      detectorDataUrl: HAND_DETECTOR_DATA_URL,
      landmarkUrl: HAND_LANDMARK_URL,
      landmarkDataUrl: HAND_LANDMARK_DATA_URL,
      executionProviders,
      numThreads,
    })
    .then((info) => {
      console.info('[handTrackingService] worker ready', info);
      return info;
    });

  return workerInitPromise;
}

async function openCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('getUserMedia is not available in this browser.');
  }

  stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: CAMERA_WIDTH },
      height: { ideal: CAMERA_HEIGHT },
      facingMode: 'user',
    },
    audio: false,
  });

  video = document.createElement('video');
  video.autoplay = true;
  video.playsInline = true;
  video.muted = true;
  video.srcObject = stream;
  video.style.cssText =
    'position:fixed;left:-100000px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
  document.body.appendChild(video);

  await new Promise((resolve, reject) => {
    const onLoaded = () => { cleanup(); resolve(); };
    const onError = (e) => { cleanup(); reject(e); };
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('error', onError);
    };
    video.addEventListener('loadedmetadata', onLoaded, { once: true });
    video.addEventListener('error', onError, { once: true });
  });

  await video.play();
}

/**
 * Run one inference cycle: grab the current video frame as an ImageBitmap,
 * transfer it to the worker, then publish the result to the store.
 */
async function runOnce() {
  if (!video || video.readyState < 2) return;
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return;

  let bitmap;
  try {
    bitmap = await createImageBitmap(video);
  } catch (err) {
    console.warn('[handTrackingService] createImageBitmap failed:', err);
    return;
  }

  try {
    const { hands } = await workerProxy.detect(
      transfer(bitmap, [bitmap]),
      vw,
      vh
    );

    // Slot hands by detection order (MediaPipe handedness is unreliable).
    const slotted = { left: null, right: null };
    for (let i = 0; i < hands.length; i++) {
      const slot = i === 0 ? 'left' : 'right';
      slotted[slot] = {
        handedness: hands[i].handedness,
        landmarks: hands[i].landmarks, // Float32Array(63)
      };
    }
    useHandTrackingStore.getState().setHands(slotted);

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
  }
}

/**
 * Schedule the next capture. Prefers requestVideoFrameCallback (which fires
 * exactly once per camera frame at ~30Hz) and falls back to rAF on browsers
 * that don't support it.
 */
function scheduleNext() {
  if (!running) return;
  const v = video;
  if (!v) return;

  if (typeof v.requestVideoFrameCallback === 'function') {
    rvfcHandle = v.requestVideoFrameCallback(onFrame);
  } else {
    rafHandle = requestAnimationFrame(onFrame);
  }
}

async function onFrame() {
  if (!running) return;
  if (paused || inferring) {
    scheduleNext();
    return;
  }
  inferring = true;
  try {
    await runOnce();
  } finally {
    inferring = false;
    scheduleNext();
  }
}

function onVisibilityChange() {
  paused = document.hidden;
}

function teardownCamera() {
  if (rafHandle) {
    cancelAnimationFrame(rafHandle);
    rafHandle = 0;
  }
  if (rvfcHandle && video?.cancelVideoFrameCallback) {
    try { video.cancelVideoFrameCallback(rvfcHandle); } catch { /* ignore */ }
    rvfcHandle = 0;
  }
  if (stream) {
    for (const track of stream.getTracks()) {
      try { track.stop(); } catch { /* ignore */ }
    }
    stream = null;
  }
  if (video) {
    try { video.pause(); } catch { /* ignore */ }
    if (video.parentNode) video.parentNode.removeChild(video);
    video.srcObject = null;
    video = null;
  }
}

export async function startHandTracking() {
  if (running) return;
  const store = useHandTrackingStore.getState();
  store.setError(null);

  try {
    await ensureWorker();
    await openCamera();

    visibilityHandler = onVisibilityChange;
    document.addEventListener('visibilitychange', visibilityHandler);

    running = true;
    paused = document.hidden;
    inferring = false;
    frameCounter = 0;
    fpsTimer = performance.now();

    store.setEnabled(true);
    scheduleNext();

    console.info('[handTrackingService] started');
  } catch (err) {
    console.error('[handTrackingService] start failed:', err);
    store.setError(err?.message ?? String(err));
    await stopHandTracking();
  }
}

export async function stopHandTracking() {
  running = false;
  inferring = false;

  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
    visibilityHandler = null;
  }

  teardownCamera();

  if (workerProxy) {
    try { await workerProxy.dispose(); } catch { /* ignore */ }
  }
  terminateHandTrackingWorker();
  workerProxy = null;
  workerInitPromise = null;

  frameCounter = 0;
  fpsTimer = 0;
  paused = false;

  useHandTrackingStore.getState().reset();
}
