# Plan: Pipeline Automerge, Efficiency, Clear Tasks & Repo Menu Fixes

## TL;DR
Fix critical bugs in the automerge pipeline (wrong timer API, no guard against double-start, premature merge, no Zustand sync), fix clearRepoTasks to bump all tasks instead of deleting non-merged ones, and make the repo container menu scale as a 3D object using `<Html transform>`.

---

## Phase 1: Automerge Pipeline Correctness

### Step 1.1 — Fix clearTimeout/clearInterval mismatch (CRITICAL)
- **File:** `src/stores/pipelineStore.js` line 25-26
- `clearInterval(pollIntervalId)` must be `clearTimeout(pollIntervalId)` — current code does NOT cancel setTimeout timers
- Also add `clearTimeout` in `stopPipeline()` cleanup

### Step 1.2 — Guard against double startPipeline (CRITICAL)
- **File:** `src/services/pipelineOrchestrator.js` line ~186
- Add early return if `store.isRunning` is already true at start of `startPipeline()`
- Prevents duplicate poll loops and double PR creation

### Step 1.3 — Fix approval error handling
- **File:** `src/services/pipelineOrchestrator.js` lines ~155-173
- `approvePullRequest()` result is currently ignored — check `.ok` before calling `mergePullRequest()`
- If approval fails, log error and continue polling (don't try merge)

### Step 1.4 — Stabilize commit detection before merge
- **File:** `src/services/pipelineOrchestrator.js` in `pollPR`
- Current: merges on first poll where `commits > 1` — could merge while Copilot is still working
- Fix: Track `lastCommitCount` across polls. Only merge when commit count stabilizes (same count for 2 consecutive polls = ~60s of stability)
- Store `lastSeenCommits` in a closure variable within processTask

### Step 1.5 — Sync Zustand after updateTaskStatus
- **File:** `src/services/pipelineTaskService.js` `updateTaskStatus()` 
- After Firebase write, also update the local Zustand store via `useObjectsStore.setState()` so UI reflects status changes immediately
- Update the matching object's `merfolkData.status` and any `extraFields`

### Step 1.6 — Clean up orphaned setTimeout on pipeline stop
- **File:** `src/services/pipelineOrchestrator.js` in `pollPR`
- Add check at start of `pollPR`: if `!currentState.isRunning`, do NOT create another setTimeout, just resolve(false)
- This prevents orphaned timer chains after `stopPipeline()`

---

## Phase 2: Clear Tasks — Bump Instead of Delete

### Step 2.1 — Rewrite clearRepoTasks to bump all tasks (*depends on Step 1.5*)
- **File:** `src/services/repoContainerService.js` `clearRepoTasks()`
- Current: DELETES non-merged tasks, only bumps merged ones
- New behavior: Keep ALL tasks, mark them all as "cleared" (add `merfolkData.cleared: true`), move them ALL to back layer(s)
- Set color to `#c8e6c9` (light green) for all bumped tasks
- Update Firebase with new position/color for each task
- Call `repositionAllTasks()` which will place them in back layers

### Step 2.2 — Update repositionAllTasks to handle cleared tasks
- **File:** `src/services/repoContainerService.js` `repositionAllTasks()`
- Current split: active (status !== MERGED) vs merged (status === MERGED)
- New split: active (not cleared AND status !== MERGED) vs archived (cleared OR status === MERGED)
- This ensures bumped-but-not-merged tasks go to back layers too

### Step 2.3 — Update RepoGrid to count cleared tasks in merged layer
- **File:** `src/components/RepoGrid.jsx`
- Grid visualization should count cleared tasks as part of the back layer count
- Check how activeCount/mergedCount are derived and update to include cleared tasks

---

## Phase 3: Efficiency & Memory Leaks

### Step 3.1 — Batch Firebase writes in repositionAllTasks (*parallel with Phase 1*)
- **File:** `src/services/repoContainerService.js` 
- Currently: N individual `saveObjectToCell()` calls in a `.map()` loop
- Collect all updates, then batch-write (or at minimum, don't await each individually)
- Consider using the existing bulkimport Cloud Function for large batches

### Step 3.2 — Add distance-based visibility to repo container menu
- **File:** `src/components/Cube.jsx` repo menu section (~line 1593)
- Only render the `<Html>` element when camera is close enough (reuse `shouldRenderText` or add a distance check)
- Already partially done (`shouldRenderText` check), but `<Html>` DOM elements are expensive — consider a tighter threshold

### Step 3.3 — Prevent double-click on Start/Clear buttons
- **File:** `src/components/Cube.jsx` button onClick handlers
- Add simple `disabled` state during async operations or `e.detail > 1` check
- Prevents double startPipeline() from UI side

---

## Phase 4: Repo Container Menu 3D Positioning

### Step 4.1 — Change `<Html>` to `<Html transform>` for 3D scaling
- **File:** `src/components/Cube.jsx` repo menu section (~line 1600)
- Current: `<Html center>` — renders as screen-space overlay, doesn't scale with camera distance
- Change to: `<Html transform center>` — renders as a 3D element that scales/shrinks naturally with camera zoom
- The `transform` prop makes the HTML element part of the 3D scene, so it appears smaller when far and larger when close
- This matches the behavior of TextObject which uses `<Html transform>`

### Step 4.2 — Adjust sizing for transform mode
- When using `<Html transform>`, the element is measured in world units, not pixels
- May need to adjust font sizes and padding to look correct at the default viewing distance
- The parent group already has inverse-scale applied (`(1/s)` per axis), so the menu will be in world-coordinate space

### Step 4.3 — Verify positioning above header
- Current: `position={[x, headerY + 3/scaleY, z]}` 
- With `transform` mode, verify the menu sits above the header text and doesn't overlap
- May need to increase the Y offset slightly since transform mode uses different sizing

---

## Relevant Files

- `src/services/pipelineOrchestrator.js` — automerge flow, processTask, pollPR (Steps 1.2, 1.3, 1.4, 1.6)
- `src/stores/pipelineStore.js` — timer cleanup, stopPipeline (Step 1.1)
- `src/services/pipelineTaskService.js` — updateTaskStatus Zustand sync (Step 1.5)
- `src/services/repoContainerService.js` — clearRepoTasks, repositionAllTasks (Steps 2.1, 2.2, 3.1)
- `src/components/Cube.jsx` — repo menu rendering, 3D positioning (Steps 3.2, 3.3, 4.1–4.3)
- `src/components/RepoGrid.jsx` — grid visualization (Step 2.3)
- `src/components/TextObject.jsx` — auto-collapse effect (verify no regression)

## Verification

1. **Automerge flow:** Create a test task with autoApprove enabled → verify it waits for commit stabilization (2 polls) before merging → verify Zustand status updates in real time
2. **Double-start guard:** Click Start twice rapidly → verify only one pipeline loop runs
3. **Timer cleanup:** Start pipeline → Stop mid-poll → verify no console logs from orphaned timers after 60s
4. **Clear tasks:** Add 4 tasks (2 queued, 1 in-progress, 1 merged) → click Clear → verify all 4 are in back layer, front is empty, all tasks still exist in store and Firebase
5. **Repo menu 3D:** Zoom in/out on repo container → verify menu scales with distance like a 3D object, stays above header text
6. **Double-click protection:** Double-click Start button → verify no duplicate pipeline runs

## Decisions
- Cleared tasks use `merfolkData.cleared: true` flag rather than changing their status — preserves original status history
- Commit stabilization window = 2 consecutive polls (60s) — balances speed vs safety
- `<Html transform>` for repo menu instead of a custom 3D mesh — simpler, matches existing TextObject pattern
- Batch writes are a nice-to-have but not blocking — individual writes still work, just slower


