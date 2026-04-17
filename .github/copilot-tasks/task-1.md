# Task: 1. Automerge Pipeline Correctness

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