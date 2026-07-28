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
/**
 * Stricter score required for a tracked ROI to remain in `prevHandsState`.
 * Higher than the initial-detection presence threshold because the landmark
 * model returns spurious mid-range scores on background crops; without this
 * the tracking branch can latch on to nothing and never re-arm the palm
 * detector. 0.7 was the smallest value that reliably dropped phantom hands
 * within ~1 second of the real hand leaving frame.
 */
const TRACKED_HAND_KEEP_THRESHOLD = 0.7;
const MAX_HANDS = 1;

/**
 * Two ROIs are considered the same physical hand if their centers are within
 * `ROI_DEDUP_CENTER_FRAC * min(scale_a, scale_b)` pixels of each other. The
 * palm detector's NMS (IoU 0.3) sometimes leaves overlapping detections of a
 * single hand at slightly different orientations, which would otherwise both
 * propagate into tracking and report `currentTrackedHands: 2` for one hand.
 */
const ROI_DEDUP_CENTER_FRAC = 0.5;

/**
 * Confidence above which we trust the previous frame's landmarks enough to
 * skip the palm detector and derive next frame's ROI directly. Mirrors the
 * "tracking" branch in MediaPipe's hands graph.
 *
 * Set equal to HAND_PRESENCE_THRESHOLD: if the landmark model considers a
 * hand present at all, we trust its ROI. A higher threshold (e.g. 0.8)
 * causes the tracking branch to fail on most frames and forces the
 * expensive palm detector to run every frame, which destroys FPS.
 */
const TRACKING_CONFIDENCE_THRESHOLD = 0.5;

/** ROI derivation from landmarks 0 (wrist) and 9 (middle finger MCP). */
const KP_WRIST = 0;
const KP_MIDDLE_MCP = 9;
/** Match palmDecode.js: same expansion factors so the ROI shape stays stable. */
const ROI_THETA0 = Math.PI / 2;
const _ROI_DSCALE = 2.6;
const _ROI_DY = -0.5;

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
 * Drop hands whose ROI centers are within ROI_DEDUP_CENTER_FRAC of each
 * other's scale — these are duplicate detections of the same physical hand.
 * Keeps the higher-scoring entry of any colliding pair.
 */
function dedupeByRoi(hands) {
  if (hands.length <= 1) return hands;
  // Sort high → low so the survivor of any collision is the strongest.
  const sorted = hands.slice().sort((a, b) => b.score - a.score);
  const kept = [];
  for (const h of sorted) {
    const roi = h._roi || roiFromLandmarks(h.rawNormalized, h._vw, h._vh);
    if (!roi) continue;
    let collides = false;
    for (const k of kept) {
      const dx = roi.xc - k._roi.xc;
      const dy = roi.yc - k._roi.yc;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const limit = Math.min(roi.scale, k._roi.scale) * ROI_DEDUP_CENTER_FRAC;
      if (dist < limit) { collides = true; break; }
    }
    if (!collides) {
      h._roi = roi;
      kept.push(h);
    }
  }
  return kept;
}

/**
 * Build a rotated ROI (in source-video pixel space) from a previous frame's
 * landmarks. We use the bounding box of all 21 landmarks (centered, squared,
 * with a safety margin) — same approach as MediaPipe's HandLandmarkSubgraph.
 *
 * The earlier implementation reused the palm-detector's parameters
 * (DSCALE=2.6, DY=-0.5) on landmarks 0/9. Those constants were tuned for
 * BlazePalm's kp1/kp2 keypoints, not for the landmark model's wrist/MCP, so
 * the ROI was systematically mispositioned. Each tracking iteration pushed
 * the ROI further off the hand, producing unbounded drift.
 */
function roiFromLandmarks(landmarks, vw, vh) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    if (!lm) continue;
    const x = lm.x * vw;
    const y = lm.y * vh;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;

  const xc = (minX + maxX) * 0.5;
  const yc = (minY + maxY) * 0.5;
  const sideBB = Math.max(maxX - minX, maxY - minY);
  // Margin so the next-frame hand stays inside the crop even if it moves a
  // bit. 1.8x is roughly what MediaPipe uses for the landmark-tracking ROI.
  const scale = sideBB * 1.8;
  if (!(scale > 0)) return null;

  // Orient so wrist (lm 0) -> middle MCP (lm 9) points "up" in the ROI.
  const w = landmarks[KP_WRIST];
  const m = landmarks[KP_MIDDLE_MCP];
  let theta = 0;
  if (w && m) {
    const dx = w.x * vw - m.x * vw;
    const dy = w.y * vh - m.y * vh;
    theta = Math.atan2(dy, dx) - ROI_THETA0;
  }

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

  const stats = self.__handStats || (self.__handStats = {
    palmCalls: 0,
    landmarkCalls: 0,
    frames: 0,
    lastReport: performance.now(),
  });
  stats.frames++;

  try {
    // ---- Tracking branch: try to skip palm detection ---------------------
    // We require TRACKED_HAND_KEEP_THRESHOLD here (rather than the looser
    // presence threshold) so a phantom ROI that latches on to background
    // can't keep the tracking branch alive forever.
    const trackingResults = [];
    if (prevHandsState.length > 0) {
      for (const prev of prevHandsState) {
        if (!prev || prev.score < TRACKING_CONFIDENCE_THRESHOLD) continue;
        stats.landmarkCalls++;
        const result = await runLandmarks(bitmap, prev.roi, vw, vh);
        if (result && result.score >= TRACKED_HAND_KEEP_THRESHOLD) {
          result._vw = vw; result._vh = vh;
          trackingResults.push(result);
        }
      }
    }

    let hands = dedupeByRoi(trackingResults).slice(0, MAX_HANDS);

    // ---- Detection branch: only if tracking failed entirely -------------
    if (hands.length === 0) {
      stats.palmCalls++;
      const detections = await runPalmDetection(bitmap, vw, vh);
      const palmResults = [];
      const limit = Math.min(detections.length, MAX_HANDS);
      for (let d = 0; d < limit; d++) {
        stats.landmarkCalls++;
        const result = await runLandmarks(bitmap, detections[d].videoRoi, vw, vh);
        if (result) {
          result._vw = vw; result._vh = vh;
          palmResults.push(result);
        }
      }
      hands = dedupeByRoi(palmResults).slice(0, MAX_HANDS);
    }

    // Update previous-frame state from the (deduped) hands we kept.
    prevHandsState = hands.map((h) => ({
      score: h.score,
      handedness: h.handedness,
      roi: h._roi || roiFromLandmarks(h.rawNormalized, vw, vh),
    })).filter((h) => h.roi);

    // Report pipeline stats once per second so we can see exactly which
    // branches are running.
    const now = performance.now();
    if (now - stats.lastReport >= 1000) {
      // eslint-disable-next-line no-console
      console.info('[handTrackingWorker]', {
        frames: stats.frames,
        palmCallsPerSec: stats.palmCalls,
        landmarkCallsPerSec: stats.landmarkCalls,
        currentTrackedHands: prevHandsState.length,
      });
      stats.frames = 0;
      stats.palmCalls = 0;
      stats.landmarkCalls = 0;
      stats.lastReport = now;
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
