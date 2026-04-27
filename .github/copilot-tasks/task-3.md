# Task: 3. Add the transient Zustand store

**Why:** The renderer and the toggle UI both need read access; the capture loop needs write access. The pattern matches `lodStore` / `faceIndicatorStore` — runtime-only state, never persisted to Firebase, no subscriptions through `subscribeToSpatialObjects`.

Create `src/stores/handTrackingStore.js`:

- Default state: `{ enabled: false, leftHand: null, rightHand: null, lastUpdate: 0, fps: 0, error: null }`.
- Actions: `setEnabled(bool)`, `setHands({ left, right })`, `setFps(num)`, `setError(string|null)`, `reset()`.
- Use `createWithEqualityFn` (matching the project's existing Zustand setup) so `HandsRenderer` can subscribe with `shallow`.

Re-export from [src/stores/index.js](src/stores/index.js) following the alphabetical ordering already present in that file.

**Files:**
- `src/stores/handTrackingStore.js` — new.
- `src/stores/index.js` — add re-export line.