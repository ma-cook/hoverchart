# Task: 4. Build the capture-loop service

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