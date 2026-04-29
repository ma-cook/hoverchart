/**
 * src/services/handTracking/imageOps.js
 *
 * CPU-only image preprocessing helpers for the ONNX hand pipeline.
 * No WebGL is used anywhere — only Canvas2D and ImageData.
 *
 * Two transforms live here:
 *   1. letterboxToTensor()      — RGBA ImageData → NCHW Float32 tensor.
 *   2. extractRotatedRoi()      — sample a rotated ROI from the source
 *                                  video into a 256×256 canvas via an
 *                                  affine canvas transform, then convert
 *                                  to NCHW Float32 tensor in [0,1].
 *
 * Both produce 1×3×256×256 RGB float tensors. The palm detector wants
 * inputs normalized to [-1, 1] (matches MediaPipePyTorch convention);
 * the landmark detector wants [0, 1]. The caller selects the range.
 */

const MODEL_SIZE = 256;
const PIXELS = MODEL_SIZE * MODEL_SIZE;

/**
 * Convert an RGBA ImageData (assumed already MODEL_SIZE×MODEL_SIZE) into a
 * planar NCHW Float32Array with the requested normalization range.
 *
 * @param {ImageData} imageData
 * @param {'neg1to1'|'zero1'} range
 * @param {Float32Array} [out] Optional pre-allocated buffer of length
 *   3 * MODEL_SIZE * MODEL_SIZE. When provided, it is filled in place and
 *   returned, eliminating the per-frame allocation. Caller is responsible
 *   for not retaining the buffer across calls if they pool it.
 */
export function imageDataToTensor(imageData, range, out) {
  const src = imageData.data;
  if (!out || out.length !== 3 * PIXELS) {
    out = new Float32Array(3 * PIXELS);
  }
  const rPlane = 0;
  const gPlane = PIXELS;
  const bPlane = 2 * PIXELS;

  if (range === 'neg1to1') {
    // (v - 127.5) / 127.5
    for (let i = 0, p = 0; i < src.length; i += 4, p++) {
      out[rPlane + p] = (src[i + 0] - 127.5) / 127.5;
      out[gPlane + p] = (src[i + 1] - 127.5) / 127.5;
      out[bPlane + p] = (src[i + 2] - 127.5) / 127.5;
    }
  } else {
    // v / 255
    const inv255 = 1 / 255;
    for (let i = 0, p = 0; i < src.length; i += 4, p++) {
      out[rPlane + p] = src[i + 0] * inv255;
      out[gPlane + p] = src[i + 1] * inv255;
      out[bPlane + p] = src[i + 2] * inv255;
    }
  }
  return out;
}

/**
 * Letterbox the video frame into a MODEL_SIZE square, returning both the
 * ImageData (for tensor build) and the transform parameters needed to
 * convert detections back into original-video pixel space.
 *
 * Transform: source_x = (target_x - dx) / scale, similarly for y.
 *
 * @param {HTMLVideoElement|HTMLCanvasElement|ImageBitmap} source
 * @param {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} ctx
 * @param {number} sourceWidth
 * @param {number} sourceHeight
 * @returns {{imageData: ImageData, transform: {scale:number, dx:number, dy:number}}}
 */
export function letterboxToImageData(source, ctx, sourceWidth, sourceHeight) {
  const scale = Math.min(MODEL_SIZE / sourceWidth, MODEL_SIZE / sourceHeight);
  const dw = sourceWidth * scale;
  const dh = sourceHeight * scale;
  const dx = (MODEL_SIZE - dw) / 2;
  const dy = (MODEL_SIZE - dh) / 2;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, MODEL_SIZE, MODEL_SIZE);
  ctx.drawImage(source, dx, dy, dw, dh);

  const imageData = ctx.getImageData(0, 0, MODEL_SIZE, MODEL_SIZE);
  return { imageData, transform: { scale, dx, dy } };
}

/**
 * Sample a rotated ROI from the source video into a MODEL_SIZE square via
 * a single canvas affine transform.
 *
 * The ROI is given in *original-video pixel space*: center (xc, yc),
 * side length `scale` (the longer axis of a square), rotation `theta`.
 *
 * The forward transform target ← source applied here is:
 *   target = T(MODEL_SIZE/2, MODEL_SIZE/2)
 *          ∘ R(-theta)
 *          ∘ S(MODEL_SIZE / scale)
 *          ∘ T(-xc, -yc) (source)
 *
 * Use {@link roiToImage} below for the inverse mapping when restoring
 * landmarks back into source-video coordinates.
 *
 * @returns ImageData for the 256×256 ROI
 */
export function extractRotatedRoi(source, ctx, xc, yc, scale, theta) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // Mediapipe uses 127.5 fill (mid-grey) for outside-image regions so the
  // landmark net's [-1,1] domain centers around zero.
  ctx.fillStyle = 'rgb(128,128,128)';
  ctx.fillRect(0, 0, MODEL_SIZE, MODEL_SIZE);

  const k = MODEL_SIZE / scale;
  ctx.translate(MODEL_SIZE / 2, MODEL_SIZE / 2);
  ctx.rotate(-theta);
  ctx.scale(k, k);
  ctx.translate(-xc, -yc);
  ctx.drawImage(source, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  return ctx.getImageData(0, 0, MODEL_SIZE, MODEL_SIZE);
}

/**
 * Inverse of the rotated-ROI transform applied by extractRotatedRoi(). Given
 * a normalized [0,1] landmark coordinate inside the 256×256 ROI, return its
 * position in source-video pixel space.
 *
 * @param {number} lx [0,1]
 * @param {number} ly [0,1]
 * @param {{xc:number,yc:number,scale:number,theta:number}} roi
 */
export function roiToImage(lx, ly, roi) {
  const tx = lx * MODEL_SIZE - MODEL_SIZE / 2;
  const ty = ly * MODEL_SIZE - MODEL_SIZE / 2;
  const k = roi.scale / MODEL_SIZE;
  const cosT = Math.cos(roi.theta);
  const sinT = Math.sin(roi.theta);
  return {
    x: roi.xc + k * (cosT * tx - sinT * ty),
    y: roi.yc + k * (sinT * tx + cosT * ty),
  };
}

export const MODEL_INPUT_SIZE = MODEL_SIZE;
