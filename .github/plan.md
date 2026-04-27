# Plan: Hand Tracking Phase 0 — MediaPipe Proof-of-Concept

## TL;DR

Drop MediaPipe HandLandmarker into Hoverchart as a Comlink worker, expose the 21-joint two-hand pose through a transient Zustand store, and render debug joint spheres + bones inside the existing R3F `<Canvas>`. Goal is to prove the plumbing — camera permissions, worker threading, latency, projection — not to ship gestures or persistence. No Firebase, no calibration UI, no stereo, no WebXR. Single webcam, naive camera-relative mapping, debug-only renderer, opt-in toggle.

## Decisions

- MediaPipe SDK is dynamically imported **inside** the worker so its ~3 MB cost only loads when the user enables the feature.
- Joint data is transient — never persisted to Firestore or Realtime Database at any rate.
- Debug primitives are sphere meshes + a reused `InstancedLine` for the 20 bones; no `AtlasTextSprite` (atlas is glyph-oriented).
- World mapping is intentionally naive: `[(x − 0.5) × 200, −(y − 0.5) × 150, −z × 100]` relative to the camera target. Proper calibration is Phase 1.
- Worker scaffold mirrors `markdownLayoutWorkerClient.js` exactly (lazy singleton, `releaseProxy`, Vite `?worker` import).
- Toggle lives in the existing top-right UI strip near `SpacePresenceAvatars` for fast dev access.
- Out of scope: pinch/gesture wiring into raycasting, calibration UI, WebXR `XRHand`, stereo + MANO, Cloud Function changes, multi-user gesture broadcast.

## Relevant Files

- [src/workers/markdownLayoutWorkerClient.js](src/workers/markdownLayoutWorkerClient.js) — exact lazy-singleton + `releaseProxy` template to copy.
- [src/workers/markdownLayoutWorker.js](src/workers/markdownLayoutWorker.js) — `expose()` + Comlink workerApi shape to mirror.
- [src/workers/textAtlasWorkerClient.js](src/workers/textAtlasWorkerClient.js) — alternate `new Worker(new URL(...))` pattern; fallback if Vite's `?worker` chokes on MediaPipe's WASM.
- [src/App.jsx](src/App.jsx) — `<Canvas>` block (~lines 1700–1760); mount point for the new renderer alongside `<ObjectsRenderer>`.
- [src/components/ConnectionsRenderer.jsx](src/components/ConnectionsRenderer.jsx) — reference for an R3F overlay subscribing to a Zustand store.
- [src/components/InstancedLine.jsx](src/components/InstancedLine.jsx) — reuse for bone segments.
- [src/stores/index.js](src/stores/index.js) — re-export the new store.
- [src/components/SpacePresenceAvatars.jsx](src/components/SpacePresenceAvatars.jsx) — top-right strip where the toggle button is added.
- New: `src/workers/handTrackingWorker.js`, `src/workers/handTrackingWorkerClient.js`, `src/services/handTrackingService.js`, `src/stores/handTrackingStore.js`, `src/components/HandsRenderer.jsx`, `public/assets/mediapipe/hand_landmarker.task`.

---

## Phase 1: Install dependencies and host the model

**Why:** MediaPipe Tasks Vision is the inference SDK; the `.task` bundle is its model weights. Both must be available before any downstream work.

- Add `@mediapipe/tasks-vision` to `dependencies` in `package.json` and run `npm install`.
- Download the latest `hand_landmarker.task` (~6 MB) and place it at `public/assets/mediapipe/hand_landmarker.task`. Vite serves `public/` at the site root so the file is reachable at `/assets/mediapipe/hand_landmarker.task` in dev and production builds.
- Do not modify `firebase.json` cache headers in this phase — the asset is small enough that default caching is fine. Long-cache headers are a Phase 1+ optimization.
- Do not pull the SDK into the main bundle. It must only appear inside the worker chunk via dynamic `import()` (see Phase 2).

**Files:**
- `package.json` — add `@mediapipe/tasks-vision`.
- `public/assets/mediapipe/hand_landmarker.task` — new asset.

## Phase 2: Scaffold the Comlink worker and client

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

## Phase 3: Add the transient Zustand store

**Why:** The renderer and the toggle UI both need read access; the capture loop needs write access. The pattern matches `lodStore` / `faceIndicatorStore` — runtime-only state, never persisted to Firebase, no subscriptions through `subscribeToSpatialObjects`.

Create `src/stores/handTrackingStore.js`:

- Default state: `{ enabled: false, leftHand: null, rightHand: null, lastUpdate: 0, fps: 0, error: null }`.
- Actions: `setEnabled(bool)`, `setHands({ left, right })`, `setFps(num)`, `setError(string|null)`, `reset()`.
- Use `createWithEqualityFn` (matching the project's existing Zustand setup) so `HandsRenderer` can subscribe with `shallow`.

Re-export from [src/stores/index.js](src/stores/index.js) following the alphabetical ordering already present in that file.

**Files:**
- `src/stores/handTrackingStore.js` — new.
- `src/stores/index.js` — add re-export line.

## Phase 4: Build the capture-loop service

**Why:** Per the project conventions, Firebase and now device APIs (camera) live in services, not components. This module owns the `getUserMedia` lifecycle, the per-frame capture pump, and the worker handshake.

Create `src/services/handTrackingService.js`:

- `let videoEl = null; let stream = null; let inFlight = false; let rvfcHandle = null; let frameCounter = 0; let fpsTimer = 0;`
- `async function startHandTracking()`:
  1. Get the worker proxy via `getHandTrackingWorker()`.
  2. `await worker.init('/assets/mediapipe/hand_landmarker.task')`.
  3. `stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, frameRate: 30 } });`
  4. Create an off-DOM `<video>`, set `srcObject = stream`, `playsInline = true`, `muted = true`, `await video.play()`.
  5. Start the loop using `video.requestVideoFrameCallback` (with `requestAnimationFrame` fallback).
  6. Each frame: skip if `inFlight`, else set `inFlight = true`, build `bitmap = await createImageBitmap(video)`, call `worker.detect(transfer(bitmap, [bitmap]), performance.now())`, write the result into `handTrackingStore.setHands(...)`, increment FPS counter, clear `inFlight`.
  7. Once per second update `setFps(...)`.
  8. `useHandTrackingStore.getState().setEnabled(true)`.
- `function stopHandTracking()`:
  1. Cancel rVFC / rAF.
  2. `stream.getTracks().forEach(t => t.stop())`.
  3. Detach `videoEl.srcObject`, drop reference.
  4. `terminateHandTrackingWorker()`.
  5. `useHandTrackingStore.getState().reset()`.
- Module-level listener: `document.addEventListener('visibilitychange', ...)` — when hidden, pause the capture loop without tearing down the worker; resume when visible again.
- All errors funnel into `setError(...)` and call `stopHandTracking()` for irrecoverable cases (permission denied, model load failure).

Use `Comlink.transfer` for the `ImageBitmap` so it's moved (not copied) into the worker.

**Files:**
- `src/services/handTrackingService.js` — new.

## Phase 5: Render debug joints in the R3F scene

**Why:** Visual confirmation that data is reaching the main thread with sane positions and acceptable latency.

Create `src/components/HandsRenderer.jsx`:

- React-memoized component, no props.
- Subscribe to `handTrackingStore` with `shallow`, selecting `{ enabled, leftHand, rightHand }`.
- Early-return `null` if `!enabled || (!leftHand && !rightHand)`.
- For each non-null hand, map the 21 normalized landmarks to world space using the naive mapping `[(x − 0.5) × 200, −(y − 0.5) × 150, −z × 100]`. The mapping is anchored to the camera target by reading the `CustomCamera` ref's world position via `useThree()`'s `camera`.
- Render 21 small `<mesh><sphereGeometry args={[0.4, 8, 6]}/><meshBasicMaterial color="..." /></mesh>` per hand (`#ff6b6b` for left, `#4dabf7` for right).
- Render the 20 bones as a single `<InstancedLine>` per hand using the standard MediaPipe HAND_CONNECTIONS topology (thumb chain, four-finger chains, palm).
- No animation, no `useFrame` — re-renders are driven entirely by the store update from the capture service.

Mount the component inside the existing `<Canvas>` block in [src/App.jsx](src/App.jsx) as a sibling of `<ObjectsRenderer>` so it picks up the same camera and is unaffected by the spatial partitioning system.

**Files:**
- `src/components/HandsRenderer.jsx` — new.
- `src/App.jsx` — add the `<HandsRenderer />` JSX line inside the `<Canvas>` block.

## Phase 6: Wire up the toggle UI

**Why:** Tracking should be opt-in (camera permission, performance cost, privacy) and the FPS readout makes Phase 0 verification trivial.

- Add a small button to the existing fixed top-right strip rendered by [src/components/SpacePresenceAvatars.jsx](src/components/SpacePresenceAvatars.jsx) (or whichever wrapper hosts that strip).
- Reads `enabled`, `fps`, and `error` from `handTrackingStore`. Click handler calls `startHandTracking()` when off and `stopHandTracking()` when on.
- Label format: `🖐 Hands · {fps} fps` when on, `🖐 Hands` when off, red border when `error` is set with the error text in a tooltip / `title` attribute.
- Disable the button while a start/stop transition is in flight to prevent double-clicks racing the worker init.
- No new store — drive all UI state from `handTrackingStore`.

**Files:**
- `src/components/SpacePresenceAvatars.jsx` (or the matching parent) — add the toggle button JSX.

## Verification

1. `npm run build` succeeds, and inspecting `dist/assets/*.js` shows `tasks-vision` only inside a chunk that is **not** the entry chunk (lazy-loaded). Main bundle size is unchanged from current `main`.
2. With the toggle off, opening the app makes no network request to `/assets/mediapipe/`. Toggle on → exactly one request for `hand_landmarker.task` plus the SDK chunk.
3. Camera permission prompt appears the first time the toggle is clicked. Allowing → joint spheres appear within ~1 second. Denying → red error state on the toggle, no crash, no leftover camera indicator.
4. Chrome DevTools Performance recording during tracking shows a `handTrackingWorker` thread distinct from the main thread; main-thread CPU stays under ~50 % on a 2024-era laptop iGPU.
5. The toggle's FPS readout stabilizes at 25–30 fps within ~2 seconds of enabling.
6. Waving a hand quickly shows joint spheres tracking with under ~80 ms perceived latency.
7. Both hands visible at once produce two non-null entries in the store with correct `handedness` ('Left' / 'Right').
8. Switching to another tab for 5 seconds disables the camera indicator (capture pump pauses); switching back resumes tracking cleanly without a re-prompt.
9. Disabling the toggle removes the camera indicator immediately, the worker thread vanishes from the Performance panel, the off-DOM `<video>` element is no longer in `document`, and no console errors are logged.
10. No writes to Firestore or Realtime Database occur during a tracking session — confirmed via the Firebase emulator UI or DevTools Network panel filtered to `firestore`/`firebasedatabase`.

## Further Considerations

1. **Worker SDK loading strategy.** Recommendation: dynamic `import('@mediapipe/tasks-vision')` inside `init()`. Alternatives: top-of-worker import (always pays the cost when the worker spins up) or CDN script (fewer build-system entanglements but adds an external dependency).
2. **Toggle placement.** Recommendation: top-right strip for visibility during dev. Alternatives: hide it inside a settings sidebar (cleaner UX, harder to find while iterating) or expose only via a query-param flag (zero UI surface area).
3. **World-space mapping.** Recommendation: hardcoded camera-relative scale for Phase 0, accepting that hands won't be in their "real" position. Alternative: a one-button calibration (hold hands at chest, click) — defer to Phase 1 where it becomes the headline feature.