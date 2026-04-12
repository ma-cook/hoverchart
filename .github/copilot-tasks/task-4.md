# Task: 4. Sidebar — Repo Dropdown & Per-Repo Controls

## TL;DR
Enhance GitHub Control Panel spaces to support multiple repos simultaneously. Each repo gets its own 3D task cluster (~200 units apart), its own independent pipeline, and the sidebar uses the same GitHub repo dropdown pattern as the diagram space. merfolkData gains a `repoSlug` field to tag tasks per-repo; pipelineStore becomes multi-repo with a Map of per-repo states.

## Decisions
- Layout: Separate clusters ~200 units apart along X axis, all within cell 0,0,0
- Pipelines: Independent per-repo (each has own start/pause/stop/auto-approve)
- Repo selection: Additive — selecting a repo from dropdown adds a new filing group
- Repo dropdown: Reuse the existing `fetchGithubRepositories` + dropdown list pattern from diagram space

---

**Why:** Replace the manual text input with the GitHub repo dropdown, add multi-repo UI.

6. Modify `UIOverlay.jsx` github_control_panel section:
   - **Repo dropdown** (reuse diagram pattern):
     - "Show Repositories" / "Hide Repositories" toggle button using existing `showRepos` state + `fetchRepositories()` callback
     - Render `repositories.map(repo => ...)` list — clicking a repo calls `pipelineStore.addRepo(repo.owner.login, repo.name)` and sets it as active
     - Show "✓ Connected" badge on auth (already exists)
   - **Connected repos list** — horizontal/vertical chips showing all added repos:
     - Each chip: repo name, colored dot (green if pipeline running, gray if idle), click to select as active, × to remove
   - **Active repo controls** (shown when a repo is selected):
     - Repo name header
     - Pipeline summary: status counts filtered by `getPipelineTasksForRepo(allObjects, activeRepoSlug)`
     - Start/Pause/Resume/Stop buttons — call `startPipeline(spaceOwnerId, spaceId, repoTasks, activeRepoSlug)` etc.
     - Auto-approve checkbox — scoped to active repo
     - Currently processing task
     - Task list — only tasks for the active repo
   - **State hooks:**
     - Replace `pipelineConnectedRepo` with `pipelineRepos` (full Map) and `pipelineActiveRepoSlug`
     - `pipelineTasks` → `pipelineRepoTasks` derived from `getPipelineTasksForRepo(allObjects, activeRepoSlug)`
     - Remove `pipelineRepoInput` state (no longer needed — using dropdown)

**Files:**
- `src/components/UIOverlay.jsx` — replace manual repo input with dropdown, multi-repo chip list, per-repo controls