/**
 * handTrackingWorker.js
 *
 * Web Worker that runs the full ONNX two-stage MediaPipe Hands pipeline
 * (BlazePalm + landmark regressor) off the main thread.
 *
 * Public API (exposed via Comlink):
 *   init(config)               — load ORT, create both sessions.
 *   detect(bitmap, vw, vh, ts) — run inference on an ImageBitmap, return hands.
 *   dispose()                  — release both sessions.
 *
 * The main thread captures camera frames into ImageBitmaps and transfers
 * them here; this worker handles letterbox preprocessing, palm detection,
 * NMS, ROI extraction, landmark regression, and tracking-based palm skip.
 */

import { expose, transfer } from 'comlink';
import { getAnchors } from '../services/handTracking/anchors.js';
import { decodePalmDetections } from '../services/handTracking/palmDecode.js';
import {
  imageDataToTensor,
  letterboxToImageData,
  extractRotatedRoi,
  roiToImage,
  MODEL_INPUT_SIZE,
} from '../services/handTracking/imageOps.js';

const HAND_PRESENCE_THRESHOLD = 0.5;
const MAX_HANDS = 2;

/**
 * Confidence above which we trust the previous frame's landmarks enough to
 * skip the palm detector and derive next frame's ROI directly. Mirrors the
 * "tracking" branch in MediaPipe's hands graph.
 */
const TRACKING_CONFIDENCE_THRESHOLD = 0.8;

/**
 * When tracking succeeds for at least one hand but not both, we *could* run
 * palm detection every frame to look for a newly-appearing second hand.
 * That's catastrophically expensive on single-thread WASM, so instead we run
 * the top-up palm pass only every Nth frame.
 */
const SINGLE_HAND_TOPUP_INTERVAL = 30;

/** ROI derivation from landmarks 0 (wrist) and 9 (middle finger MCP). */
const KP_WRIST = 0;
const KP_MIDDLE_MCP = 9;
/** Match palmDecode.js: same expansion factors so the ROI shape stays stable. */
const ROI_THETA0 = Math.PI / 2;
const ROI_DSCALE = 2.6;
const ROI_DY = -0.5;

let ort = null;
let handDetectorSession = null;
let handLandmarkSession = null;
let executionProvidersUsed = null;

/** OffscreenCanvases reused across calls to avoid per-frame allocation. */
let letterboxCanvas = null;
let letterboxCtx = null;
let roiCanvas = null;
let roiCtx = null;

/**
 * Per-hand tracking state from the previous frame. When non-null, we attempt
 * to run the landmark model directly using `prevRoi` and skip palm detection.
 */
let prevHandsState = []; // [{ roi, score, handedness }]
let topUpCounter = 0;

/**
 * Pooled tensor buffers — each frame would otherwise allocate two
 * Float32Array(3*256*256) (~768KB each). Reusing them eliminates ~1.5MB of
 * per-frame heap churn.
 */
let pooledPalmBuffer = null;
let pooledLandmarkBuffer = null;

function ensureCanvases() {
  if (letterboxCanvas) return;
  letterboxCanvas = new OffscreenCanvas(MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
  letterboxCtx = letterboxCanvas.getContext('2d', { willReadFrequently: true });
  roiCanvas = new OffscreenCanvas(MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
  roiCtx = roiCanvas.getContext('2d', { willReadFrequently: true });
}

async function init(config) {
  if (!ort) {
    const mod = await import('onnxruntime-web');
    mod.env.wasm.wasmPaths = config.wasmBase;
    mod.env.wasm.numThreads = config.numThreads ?? 1;
    mod.env.logLevel = 'warning';
    ort = mod;
  }

  if (handDetectorSession && handLandmarkSession) {
    return { executionProviders: executionProvidersUsed };
  }

  // Try the requested execution providers in order, falling back on failure.
  // Typical input: ['webgpu', 'wasm'] or ['wasm'].
  const providerList = (config.executionProviders ?? ['wasm']).slice();
  let lastError = null;

  for (const provider of providerList) {
    try {
      const sessionOptions = {
        executionProviders: [provider],
        graphOptimizationLevel: 'all',
      };

      handDetectorSession = await ort.InferenceSession.create(config.detectorUrl, {
        ...sessionOptions,
        externalData: [
          { data: config.detectorDataUrl, path: 'hand_detector.data' },
        ],
      });

      handLandmarkSession = await ort.InferenceSession.create(config.landmarkUrl, {
        ...sessionOptions,
        externalData: [
          { data: config.landmarkDataUrl, path: 'hand_landmark_detector.data' },
        ],
      });

      executionProvidersUsed = [provider];
      // eslint-disable-next-line no-console
      console.info('[handTrackingWorker] ONNX sessions ready', { provider });
      return { executionProviders: executionProvidersUsed };
    } catch (err) {
      lastError = err;
      // eslint-disable-next-line no-console
      console.warn(
        `[handTrackingWorker] EP "${provider}" failed, trying next:`,
        err?.message ?? err
      );
      // Release any partially-created session before falling back.
      try { await handDetectorSession?.release?.(); } catch { /* ignore */ }
      try { await handLandmarkSession?.release?.(); } catch { /* ignore */ }
      handDetectorSession = null;
      handLandmarkSession = null;
    }
  }

  throw lastError ?? new Error('No execution provider succeeded');
}

function sigmoid(x) {
  if (x > 100) return 1;
  if (x < -100) return 0;
  return 1 / (1 + Math.exp(-x));
}

/**
 * Build a rotated ROI (in source-video pixel space) from a previous frame's
 * landmarks. Mirrors palmDecode's `detectionToRoi`, but using landmark 0
 * (wrist) and landmark 9 (middle MCP) instead of palm keypoints.
 */
function roiFromLandmarks(landmarks, vw, vh) {
  // landmarks are normalized [0,1] of source video
  const w = landmarks[KP_WRIST];
  const m = landmarks[KP_MIDDLE_MCP];
  if (!w || !m) return null;

  const x1 = w.x * vw;
  const y1 = w.y * vh;
  const x2 = m.x * vw;
  const y2 = m.y * vh;

  const dx = x1 - x2;
  const dy = y1 - y2;
  const theta = Math.atan2(dy, dx) - ROI_THETA0;

  let scale = Math.sqrt(dx * dx + dy * dy) * 2;
  const xc = x1;
  const yc = y1 + ROI_DY * scale;
  scale *= ROI_DSCALE;

  if (!Number.isFinite(xc) || !Number.isFinite(yc) || scale <= 0) return null;
  return { xc, yc, scale, theta };
}

/**
 * Run stage 1 (palm detection) on the letterboxed frame and return the
 * decoded detections, each with a `roi` already mapped into video-pixel
 * space.
 */
async function runPalmDetection(bitmap, vw, vh) {
  const { imageData: lbImage, transform: lbTransform } = letterboxToImageData(
    bitmap, letterboxCtx, vw, vh
  );
  if (!pooledPalmBuffer) pooledPalmBuffer = new Float32Array(3 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE);
  const palmTensor = imageDataToTensor(lbImage, 'neg1to1', pooledPalmBuffer);
  const palmInput = new ort.Tensor(
    'float32',
    palmTensor,
    [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]
  );

  const palmOut = await handDetectorSession.run({ image: palmInput });
  const boxCoords = palmOut.box_coords.data;
  const boxScores = palmOut.box_scores.data;

  const detections = decodePalmDetections(boxCoords, boxScores, getAnchors());
  // Map each detection's ROI from 256x256-letterbox space → video pixel space.
  for (const det of detections) {
    det.videoRoi = {
      xc: (det.roi.xc - lbTransform.dx) / lbTransform.scale,
      yc: (det.roi.yc - lbTransform.dy) / lbTransform.scale,
      scale: det.roi.scale / lbTransform.scale,
      theta: det.roi.theta,
    };
  }
  return detections;
}

/**
 * Run stage 2 (landmark regression) for a single ROI. Returns null if the
 * hand-presence score falls below threshold.
 */
async function runLandmarks(bitmap, videoRoi, vw, vh) {
  const roiImage = extractRotatedRoi(
    bitmap, roiCtx,
    videoRoi.xc, videoRoi.yc, videoRoi.scale, videoRoi.theta
  );
  if (!pooledLandmarkBuffer) pooledLandmarkBuffer = new Float32Array(3 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE);
  const lmTensor = imageDataToTensor(roiImage, 'zero1', pooledLandmarkBuffer);
  const lmInput = new ort.Tensor(
    'float32',
    lmTensor,
    [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]
  );

  const lmOut = await handLandmarkSession.run({ image: lmInput });
  const score = sigmoid(lmOut.scores.data[0]);
  if (score < HAND_PRESENCE_THRESHOLD) return null;

  const lr = sigmoid(lmOut.lr.data[0]);
  const handedness = lr >= 0.5 ? 'Right' : 'Left';

  const lm = lmOut.landmarks.data;
  // Pack as Float32Array(63) — much cheaper to transfer + lower GC pressure
  // than 21 plain objects, and the renderer reads it directly.
  const flat = new Float32Array(63);
  // We also need {x,y} objects of unmirrored normalized coords for ROI
  // derivation next frame — kept locally only.
  const rawNormalized = new Array(21);
  for (let i = 0; i < 21; i++) {
    const lx = lm[i * 3 + 0];
    const ly = lm[i * 3 + 1];
    const lz = lm[i * 3 + 2];
    const v = roiToImage(lx, ly, videoRoi);
    const nx = v.x / vw;
    const ny = v.y / vh;
    // Mirror selfie-camera horizontally for the renderer.
    flat[i * 3 + 0] = 1 - nx;
    flat[i * 3 + 1] = ny;
    flat[i * 3 + 2] = lz;
    rawNormalized[i] = { x: nx, y: ny };
  }

  return { score, handedness, landmarks: flat, rawNormalized };
}

/**
 * Main entry point. Receives an ImageBitmap (transferred), runs the
 * pipeline, and returns up to MAX_HANDS hands plus the source video size.
 */
async function detect(bitmap, vw, vh) {
  ensureCanvases();
  if (!handDetectorSession || !handLandmarkSession) {
    bitmap.close?.();
    return { hands: [] };
  }

  try {
    // ---- Tracking branch: try to skip palm detection ---------------------
    const trackingResults = [];
    if (prevHandsState.length > 0) {
      for (const prev of prevHandsState) {
        if (!prev || prev.score < TRACKING_CONFIDENCE_THRESHOLD) continue;
        const result = await runLandmarks(bitmap, prev.roi, vw, vh);
        if (result) trackingResults.push(result);
      }
    }

    let hands = trackingResults;

    // ---- Detection branch: only if tracking failed or didn't run ---------
    if (hands.length === 0) {
      const detections = await runPalmDetection(bitmap, vw, vh);
      const limit = Math.min(detections.length, MAX_HANDS);
      for (let d = 0; d < limit; d++) {
        const result = await runLandmarks(bitmap, detections[d].videoRoi, vw, vh);
        if (result) hands.push(result);
      }
    } else if (hands.length < MAX_HANDS && (++topUpCounter % SINGLE_HAND_TOPUP_INTERVAL) === 0) {
      // Tracking found one hand. Look for a newly-appearing second hand,
      // but only every SINGLE_HAND_TOPUP_INTERVAL frames — palm detection
      // is by far the most expensive stage on single-thread WASM, so
      // running it every frame would tank the FPS.
      const detections = await runPalmDetection(bitmap, vw, vh);
      // Only add detections whose ROI is far from any tracked hand.
      for (const det of detections) {
        if (hands.length >= MAX_HANDS) break;
        const tooClose = hands.some((h) => {
          // Compare wrist landmarks if available
          const w = h.rawNormalized[KP_WRIST];
          const dx = (det.videoRoi.xc / vw) - w.x;
          const dy = (det.videoRoi.yc / vh) - w.y;
          return dx * dx + dy * dy < 0.04; // ~0.2 normalized distance
        });
        if (tooClose) continue;
        const result = await runLandmarks(bitmap, det.videoRoi, vw, vh);
        if (result) hands.push(result);
      }
    }

    // Update previous-frame state from the hands we kept.
    prevHandsState = hands.map((h) => ({
      score: h.score,
      handedness: h.handedness,
      roi: roiFromLandmarks(h.rawNormalized, vw, vh),
    })).filter((h) => h.roi);

    // One-time diagnostic so we can see whether the pipeline is producing
    // hands. Drop after Phase 0 verification.
    if (!self.__handsDetectLogged && hands.length > 0) {
      // eslint-disable-next-line no-console
      console.info('[handTrackingWorker] first hand detected', {
        count: hands.length,
        handedness: hands[0].handedness,
        score: hands[0].score,
        firstLandmark: [hands[0].landmarks[0], hands[0].landmarks[1], hands[0].landmarks[2]],
      });
      self.__handsDetectLogged = true;
    }

    // Build the response — strip rawNormalized, transfer Float32Array buffers.
    const transferList = [];
    const responseHands = hands.map((h) => {
      transferList.push(h.landmarks.buffer);
      return {
        handedness: h.handedness,
        score: h.score,
        landmarks: h.landmarks,
      };
    });

    return transfer({ hands: responseHands }, transferList);
  } finally {
    // Always release the bitmap so the main thread can issue the next one.
    bitmap.close?.();
  }
}

async function dispose() {
  prevHandsState = [];
  if (handDetectorSession) {
    try { await handDetectorSession.release?.(); } catch { /* ignore */ }
    handDetectorSession = null;
  }
  if (handLandmarkSession) {
    try { await handLandmarkSession.release?.(); } catch { /* ignore */ }
    handLandmarkSession = null;
  }
  executionProvidersUsed = null;
}

expose({ init, detect, dispose });
