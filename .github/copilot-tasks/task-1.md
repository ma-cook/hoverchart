# Task: 1. Install dependencies and host the model

**Why:** MediaPipe Tasks Vision is the inference SDK; the `.task` bundle is its model weights. Both must be available before any downstream work.

- Add `@mediapipe/tasks-vision` to `dependencies` in `package.json` and run `npm install`.
- Download the latest `hand_landmarker.task` (~6 MB) and place it at `public/assets/mediapipe/hand_landmarker.task`. Vite serves `public/` at the site root so the file is reachable at `/assets/mediapipe/hand_landmarker.task` in dev and production builds.
- Do not modify `firebase.json` cache headers in this phase — the asset is small enough that default caching is fine. Long-cache headers are a Phase 1+ optimization.
- Do not pull the SDK into the main bundle. It must only appear inside the worker chunk via dynamic `import()` (see Phase 2).

**Files:**
- `package.json` — add `@mediapipe/tasks-vision`.
- `public/assets/mediapipe/hand_landmarker.task` — new asset.