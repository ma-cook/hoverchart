# Task: 6. Wire up the toggle UI

**Why:** Tracking should be opt-in (camera permission, performance cost, privacy) and the FPS readout makes Phase 0 verification trivial.

- Add a small button to the existing fixed top-right strip rendered by [src/components/SpacePresenceAvatars.jsx](src/components/SpacePresenceAvatars.jsx) (or whichever wrapper hosts that strip).
- Reads `enabled`, `fps`, and `error` from `handTrackingStore`. Click handler calls `startHandTracking()` when off and `stopHandTracking()` when on.
- Label format: `🖐 Hands · {fps} fps` when on, `🖐 Hands` when off, red border when `error` is set with the error text in a tooltip / `title` attribute.
- Disable the button while a start/stop transition is in flight to prevent double-clicks racing the worker init.
- No new store — drive all UI state from `handTrackingStore`.

**Files:**
- `src/components/SpacePresenceAvatars.jsx` (or the matching parent) — add the toggle button JSX.

---

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