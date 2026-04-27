/**
 * handTrackingWorker.js
 *
 * Web Worker that runs MediaPipe HandLandmarker inference off the main thread.
 *
 * Exposed API (via Comlink):
 *   init(modelUrl)             — load the MediaPipe WASM + model asset.
 *   detect(imageBitmap, ts)    — run video-mode detection, returns serialisable result.
 *   dispose()                  — tear down the landmarker and free resources.
 */

import { expose } from 'comlink';

/** @type {import('@mediapipe/tasks-vision').HandLandmarker | null} */
let landmarker = null;

/**
 * Initialise the HandLandmarker.
 *
 * @param {string} modelUrl - URL (or bundled asset path) to the hand_landmarker.task model file.
 */
async function init(modelUrl) {
  // Dynamic import keeps the MediaPipe SDK out of the main bundle.
  const vision = await import('@mediapipe/tasks-vision');
  const { FilesetResolver, HandLandmarker } = vision;

  const wasmFileset = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
  );

  landmarker = await HandLandmarker.createFromOptions(wasmFileset, {
    baseOptions: {
      modelAssetPath: modelUrl,
      delegate: 'GPU',
    },
    numHands: 2,
    runningMode: 'VIDEO',
  });
}

/**
 * Run hand-landmark detection on a single video frame.
 *
 * @param {ImageBitmap} imageBitmap - The current video frame as a transferable ImageBitmap.
 * @param {number} timestampMs - Frame timestamp in milliseconds.
 * @returns {{ hands: Array<{ handedness: 'Left'|'Right', landmarks: Array<{x:number,y:number,z:number}>, worldLandmarks: Array<{x:number,y:number,z:number}> }> }}
 */
function detect(imageBitmap, timestampMs) {
  if (!landmarker) {
    imageBitmap.close();
    return { hands: [] };
  }

  const raw = landmarker.detectForVideo(imageBitmap, timestampMs);

  // Free the bitmap immediately — it is no longer needed after detection.
  imageBitmap.close();

  // Serialise to plain objects so the result is structured-clone safe.
  const hands = (raw.handednesses ?? []).map((handednessCategories, i) => {
    const handedness =
      handednessCategories[0]?.categoryName === 'Left' ? 'Left' : 'Right';

    const landmarks = (raw.landmarks[i] ?? []).map(({ x, y, z }) => ({ x, y, z }));
    const worldLandmarks = (raw.worldLandmarks[i] ?? []).map(({ x, y, z }) => ({ x, y, z }));

    return { handedness, landmarks, worldLandmarks };
  });

  return { hands };
}

/**
 * Release the HandLandmarker and free native resources.
 */
function dispose() {
  landmarker?.close();
  landmarker = null;
}

expose({ init, detect, dispose });
