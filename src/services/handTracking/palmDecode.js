/**
 * src/services/handTracking/palmDecode.js
 *
 * Decode raw BlazePalm output (box_coords [1,2944,18] + box_scores [1,2944,1])
 * into rotated ROIs ready to feed the landmark model.
 *
 * Pipeline:
 *   1. Sigmoid + threshold the scores (with 100-clamp for stability).
 *   2. Decode each surviving anchor's box + 7 keypoints from raw offsets.
 *   3. Non-max suppression on the boxes.
 *   4. Compute a rotated ROI per surviving detection, matching MediaPipe's
 *      "alignment" method: use kp0 (palm base) and kp2 (middle finger MCP)
 *      to derive center, scale, and rotation, then expand by 2.6×.
 *
 * All math follows zmurez/MediaPipePyTorch BlazeDetector + BlazePalm:
 *   x_scale=y_scale=w_scale=h_scale = 256
 *   num_keypoints = 7
 *   min_score_thresh = 0.5
 *   min_suppression_threshold = 0.3 (IoU)
 *   detection2roi_method = 'alignment'
 *   kp1 = 0, kp2 = 2
 *   dy = -0.5, dscale = 2.6, theta0 = π/2
 */

const RAW_SCALE = 256;
const NUM_KEYPOINTS = 7;
const COORDS_PER_ANCHOR = 18; // 4 box + 14 keypoint coords
const SCORE_CLIPPING_THRESH = 100;
const MIN_SCORE_THRESH = 0.5;
const MIN_SUPPRESSION_IOU = 0.3;

const KP1 = 0; // wrist
const KP2 = 2; // middle finger MCP
const DY = -0.5;
const DSCALE = 2.6;
const THETA0 = Math.PI / 2;

/** Numerically stable sigmoid with the same clipping MediaPipe uses. */
function sigmoid(x) {
  const c = Math.max(-SCORE_CLIPPING_THRESH, Math.min(SCORE_CLIPPING_THRESH, x));
  return 1 / (1 + Math.exp(-c));
}

/**
 * Decode the palm detector output and return surviving detections after
 * NMS, each with an associated rotated ROI.
 *
 * Output detection shape:
 *   {
 *     score, // sigmoid'd confidence in [0,1]
 *     box: { ymin, xmin, ymax, xmax }, // normalized [0,1] of the 256×256 input
 *     keypoints: Float32Array(14),     // [kp0_x, kp0_y, kp1_x, kp1_y, ...] normalized
 *     roi: { xc, yc, scale, theta },   // ROI in 256×256 input space (xc/yc/scale in pixels)
 *   }
 *
 * @param {Float32Array} boxCoords   raw [1, 2944, 18] flat
 * @param {Float32Array} boxScores   raw [1, 2944, 1] flat
 * @param {Float32Array} anchors     [2944*4] from getAnchors()
 */
export function decodePalmDetections(boxCoords, boxScores, anchors) {
  const numAnchors = boxScores.length;
  const detections = [];

  for (let i = 0; i < numAnchors; i++) {
    const score = sigmoid(boxScores[i]);
    if (score < MIN_SCORE_THRESH) continue;

    const baseB = i * COORDS_PER_ANCHOR;
    const baseA = i * 4;
    const ax = anchors[baseA + 0];
    const ay = anchors[baseA + 1];
    const aw = anchors[baseA + 2]; // 1.0 (fixed)
    const ah = anchors[baseA + 3]; // 1.0 (fixed)

    // Decode box (cx,cy,w,h) → ymin,xmin,ymax,xmax in normalized coords.
    const cx = boxCoords[baseB + 0] / RAW_SCALE * aw + ax;
    const cy = boxCoords[baseB + 1] / RAW_SCALE * ah + ay;
    const w  = boxCoords[baseB + 2] / RAW_SCALE * aw;
    const h  = boxCoords[baseB + 3] / RAW_SCALE * ah;

    // Decode 7 keypoints (normalized to [0,1]).
    const kps = new Float32Array(NUM_KEYPOINTS * 2);
    for (let k = 0; k < NUM_KEYPOINTS; k++) {
      const off = 4 + k * 2;
      kps[k * 2 + 0] = boxCoords[baseB + off + 0] / RAW_SCALE * aw + ax;
      kps[k * 2 + 1] = boxCoords[baseB + off + 1] / RAW_SCALE * ah + ay;
    }

    detections.push({
      score,
      box: {
        ymin: cy - h / 2,
        xmin: cx - w / 2,
        ymax: cy + h / 2,
        xmax: cx + w / 2,
      },
      keypoints: kps,
    });
  }

  if (detections.length === 0) return [];

  // Sort by score descending so NMS keeps the strongest first.
  detections.sort((a, b) => b.score - a.score);

  const kept = [];
  const used = new Array(detections.length).fill(false);
  for (let i = 0; i < detections.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    const ai = detections[i];
    kept.push(ai);
    for (let j = i + 1; j < detections.length; j++) {
      if (used[j]) continue;
      if (iou(ai.box, detections[j].box) >= MIN_SUPPRESSION_IOU) used[j] = true;
    }
  }

  // Compute rotated ROI for each kept detection. ROI is expressed in 256×256
  // input-space pixels — caller converts back to original-image pixels via
  // the same letterbox transform used during preprocessing.
  for (const det of kept) {
    det.roi = detectionToRoi(det);
  }

  return kept;
}

/** Standard axis-aligned IoU on normalized box rects. */
function iou(a, b) {
  const ix1 = Math.max(a.xmin, b.xmin);
  const iy1 = Math.max(a.ymin, b.ymin);
  const ix2 = Math.min(a.xmax, b.xmax);
  const iy2 = Math.min(a.ymax, b.ymax);
  const iw = Math.max(0, ix2 - ix1);
  const ih = Math.max(0, iy2 - iy1);
  const inter = iw * ih;
  const aa = Math.max(0, a.xmax - a.xmin) * Math.max(0, a.ymax - a.ymin);
  const ab = Math.max(0, b.xmax - b.xmin) * Math.max(0, b.ymax - b.ymin);
  const union = aa + ab - inter;
  return union > 0 ? inter / union : 0;
}

/**
 * MediaPipe "alignment" ROI: derive center/scale from kp1 (palm base) and
 * kp2 (middle finger MCP). theta is the angle from kp1→kp2 minus 90°,
 * making the rotated ROI's +y axis point along kp1→kp2.
 *
 * Output xc/yc/scale are in 256×256 input pixel space.
 */
function detectionToRoi(det) {
  const kps = det.keypoints;
  const x1 = kps[KP1 * 2 + 0];
  const y1 = kps[KP1 * 2 + 1];
  const x2 = kps[KP2 * 2 + 0];
  const y2 = kps[KP2 * 2 + 1];

  const dx = x1 - x2;
  const dy = y1 - y2;
  const theta = Math.atan2(dy, dx) - THETA0;

  // Distance kp1↔kp2, doubled, then expanded by dscale.
  let scale = Math.sqrt(dx * dx + dy * dy) * 2;
  let xc = x1;
  let yc = y1 + DY * scale; // shift center toward palm
  scale *= DSCALE;

  return {
    xc: xc * RAW_SCALE,
    yc: yc * RAW_SCALE,
    scale: scale * RAW_SCALE,
    theta,
  };
}
