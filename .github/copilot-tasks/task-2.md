# Task: 2. Pipeline Store — Multi-Repo State

## TL;DR
Enhance GitHub Control Panel spaces to support multiple repos simultaneously. Each repo gets its own 3D task cluster (~200 units apart), its own independent pipeline, and the sidebar uses the same GitHub repo dropdown pattern as the diagram space. merfolkData gains a `repoSlug` field to tag tasks per-repo; pipelineStore becomes multi-repo with a Map of per-repo states.

## Decisions
- Layout: Separate clusters ~200 units apart along X axis, all within cell 0,0,0
- Pipelines: Independent per-repo (each has own start/pause/stop/auto-approve)
- Repo selection: Additive — selecting a repo from dropdown adds a new filing group
- Repo dropdown: Reuse the existing `fetchGithubRepositories` + dropdown list pattern from diagram space

---

**Why:** Current store has single `connectedRepo`, `isRunning`, etc. Need per-repo pipeline state.

4. Restructure `pipelineStore.js`:
   - Replace single-repo fields with a `repos` Map keyed by repoSlug:
     ```
     repos: Map<repoSlug, {
       owner: string,
       repo: string,
       isRunning: false,
       isPaused: false,
       autoApprove: false,
       currentTaskId: null,
       pollIntervalId: null,
     }>
     ```
   - Add `activeRepoSlug: null` — the repo currently selected in the sidebar for viewing controls
   - Keep `taskOrder: []` global (ordered list of all task IDs)
   - New actions:
     - `addRepo(owner, repo)` — adds to `repos` Map
     - `removeRepo(repoSlug)` — removes from Map, stops pipeline if running
     - `setActiveRepo(repoSlug)` — sets sidebar focus
     - `startRepoPipeline(repoSlug)`, `pauseRepoPipeline(repoSlug)`, `resumeRepoPipeline(repoSlug)`, `stopRepoPipeline(repoSlug)`
     - `setRepoAutoApprove(repoSlug, bool)`
     - `setRepoCurrentTaskId(repoSlug, taskId)`
     - `setRepoPollIntervalId(repoSlug, intervalId)`
   - Persist/restore: serialize entire `repos` Map + `activeRepoSlug` per-space in localStorage keyed by `pipeline_${spaceId}`

**Files:**
- `src/stores/pipelineStore.js` — restructure from single-repo to multi-repo Map