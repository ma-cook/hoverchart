# Task: 3. Pipeline Orchestrator — Per-Repo Pipelines

## TL;DR
Enhance GitHub Control Panel spaces to support multiple repos simultaneously. Each repo gets its own 3D task cluster (~200 units apart), its own independent pipeline, and the sidebar uses the same GitHub repo dropdown pattern as the diagram space. merfolkData gains a `repoSlug` field to tag tasks per-repo; pipelineStore becomes multi-repo with a Map of per-repo states.

## Decisions
- Layout: Separate clusters ~200 units apart along X axis, all within cell 0,0,0
- Pipelines: Independent per-repo (each has own start/pause/stop/auto-approve)
- Repo selection: Additive — selecting a repo from dropdown adds a new filing group
- Repo dropdown: Reuse the existing `fetchGithubRepositories` + dropdown list pattern from diagram space

---

**Why:** Current orchestrator runs one pipeline globally. Need independent per-repo pipelines.

5. Modify `pipelineOrchestrator.js`:
   - `startPipeline(spaceOwnerId, spaceId, tasks)` → `startPipeline(spaceOwnerId, spaceId, tasks, repoSlug)`
   - Read pipeline state from `pipelineStore.repos.get(repoSlug)` rather than top-level store fields
   - Use `pipelineStore.startRepoPipeline(repoSlug)` instead of `pipelineStore.startPipeline()`
   - `processTask()` — reads owner/repo from the repo entry in the store, not a global `connectedRepo`
   - `pausePipeline(repoSlug)`, `resumePipeline(repoSlug)`, `stopPipeline(repoSlug)` — all scoped
   - Multiple repo pipelines can run concurrently (each has its own polling intervals)

**Files:**
- `src/services/pipelineOrchestrator.js` — add repoSlug parameter to all functions, read from repos Map