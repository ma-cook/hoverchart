/**
 * src/services/handTracking/anchors.js
 *
 * Generate the 2944 SSD anchors used by the MediaPipe BlazePalm hand
 * detector at 256×256 input. Reproduces the configuration baked into
 * Qualcomm's ONNX export (which is itself a port of zmurez/MediaPipePyTorch).
 *
 * Anchor configuration (from MediaPipePyTorch BlazePalm):
 *   num_layers = 5
 *   strides    = [8, 16, 32, 32, 32]
 *   aspect_ratios = [1.0]
 *   interpolated_scale_aspect_ratio = 1.0  (adds one extra scale per layer)
 *   fixed_anchor_size = true               (so w = h = 1.0)
 *   anchor_offset_{x,y} = 0.5
 *   min_scale = 0.1484375, max_scale = 0.75
 *   input_size = 256
 *
 * Total anchor count: 32×32×2 + 16×16×2 + 8×8×6 = 2048 + 512 + 384 = 2944.
 *
 * Each anchor is a [x_center, y_center, w, h] tuple in [0,1] normalized
 * coords. With fixed_anchor_size, w = h = 1.
 */

const NUM_LAYERS = 5;
const STRIDES = [8, 16, 32, 32, 32];
const INPUT_SIZE = 256;
const ANCHOR_OFFSET = 0.5;

let cachedAnchors = null;

/**
 * Build (or return cached) anchors as a Float32Array of length 2944*4
 * laid out as [cx0,cy0,w0,h0, cx1,cy1,w1,h1, ...].
 */
export function getAnchors() {
  if (cachedAnchors) return cachedAnchors;

  const anchors = [];
  let layerId = 0;
  while (layerId < NUM_LAYERS) {
    // Walk forward over consecutive layers that share the same stride —
    // each contributes one anchor per cell (1 aspect_ratio + 1 interpolated).
    let lastSameStride = layerId;
    let anchorsPerCell = 0;
    while (
      lastSameStride < NUM_LAYERS &&
      STRIDES[lastSameStride] === STRIDES[layerId]
    ) {
      anchorsPerCell += 2; // 1 from aspect_ratios + 1 from interpolated_scale
      lastSameStride++;
    }

    const stride = STRIDES[layerId];
    const fmHeight = Math.ceil(INPUT_SIZE / stride);
    const fmWidth = Math.ceil(INPUT_SIZE / stride);

    for (let y = 0; y < fmHeight; y++) {
      for (let x = 0; x < fmWidth; x++) {
        const xc = (x + ANCHOR_OFFSET) / fmWidth;
        const yc = (y + ANCHOR_OFFSET) / fmHeight;
        for (let i = 0; i < anchorsPerCell; i++) {
          // fixed_anchor_size → w = h = 1
          anchors.push(xc, yc, 1.0, 1.0);
        }
      }
    }

    layerId = lastSameStride;
  }

  cachedAnchors = new Float32Array(anchors);
  return cachedAnchors;
}

/** Exported for sanity checks/tests. */
export const ANCHOR_COUNT = 2944;
