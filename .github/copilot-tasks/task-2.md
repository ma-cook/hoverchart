# Task: 2. Scaffold the Comlink worker and client

**Why:** Hoverchart's worker convention (per `.github/copilot-instructions.md`) is one `*Worker.js` plus a matching `*WorkerClient.js` that provides a lazy singleton proxy. Mirroring `markdownLayoutWorker` exactly avoids surprises in Vite bundling and lifecycle.

Create two files:

**`src/workers/handTrackingWorker.js`** — body:
- `import { expose } from 'comlink';`
- Module-level `let landmarker = null;`
- `init(modelUrl)` — dynamic `import('@mediapipe/tasks-vision')` so the SDK lands in the worker chunk only. Build `FilesetResolver` from the SDK's `wasm` directory (CDN URL or bundled), construct `HandLandmarker` with `numHands: 2`, `runningMode: 'VIDEO'`, `modelAssetPath: modelUrl`.
- `detect(imageBitmap, timestampMs)` — calls `landmarker.detectForVideo(imageBitmap, timestampMs)`, returns a fully serializable `{ hands: [{ handedness: 'Left'|'Right', landmarks: Array<{x,y,z}>(21), worldLandmarks: Array<{x,y,z}>(21) }] }`. Calls `imageBitmap.close()` before returning.
- `dispose()` — `landmarker?.close()`, null it out.
- `expose({ init, detect, dispose });`

**`src/workers/handTrackingWorkerClient.js`** — copy [src/workers/markdownLayoutWorkerClient.js](src/workers/markdownLayoutWorkerClient.js) verbatim, swapping names: `getHandTrackingWorker()` / `terminateHandTrackingWorker()`, `import HandTrackingWorkerConstructor from './handTrackingWorker.js?worker';`.

If Vite's `?worker` import surfaces issues with MediaPipe's WASM resolution, fall back to the `new Worker(new URL('./handTrackingWorker.js', import.meta.url), { type: 'module' })` pattern used in [src/workers/textAtlasWorkerClient.js](src/workers/textAtlasWorkerClient.js).

**Files:**
- `src/workers/handTrackingWorker.js` — new.
- `src/workers/handTrackingWorkerClient.js` — new.