# Task: 5. Render debug joints in the R3F scene

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