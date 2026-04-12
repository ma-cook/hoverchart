# Plan: Multi-Repo GitHub Control Panel

## TL;DR
Enhance GitHub Control Panel spaces to support multiple repos simultaneously. Each repo gets its own 3D task cluster (~200 units apart), its own independent pipeline, and the sidebar uses the same GitHub repo dropdown pattern as the diagram space. merfolkData gains a `repoSlug` field to tag tasks per-repo; pipelineStore becomes multi-repo with a Map of per-repo states.

## Decisions
- Layout: Separate clusters ~200 units apart along X axis, all within cell 0,0,0
- Pipelines: Independent per-repo (each has own start/pause/stop/auto-approve)
- Repo selection: Additive — selecting a repo from dropdown adds a new filing group
- Repo dropdown: Reuse the existing `fetchGithubRepositories` + dropdown list pattern from diagram space

---

## Phase 1: Data Model — Add repoSlug to merfolkData

**Why:** Currently tasks have no repo affiliation. Multi-repo requires filtering tasks by repo.

1. Add `repoSlug` field to merfolkData schema — format `"owner/repo"` string
   - VS Code extension (external) will send `merfolkData.repoSlug` in bulkImport payload
   - Manual task creation in-space should tag with the currently selected repo
2. Modify `pipelineTaskService.js`:
   - Add `getPipelineTasksForRepo(objects, repoSlug)` — filters by `obj.merfolkData?.repoSlug === repoSlug`
   - Add `getRepoSlugsFromTasks(objects)` — extracts unique repoSlug values from all pipeline tasks
   - Keep existing `getPipelineTasks()` as-is for backward compatibility (returns all tasks regardless of repo)
3. Modify `updateTaskStatus()` — no change needed, already generic

**Files:**
- `src/services/pipelineTaskService.js` — add `getPipelineTasksForRepo()`, `getRepoSlugsFromTasks()`

## Phase 2: Pipeline Store — Multi-Repo State

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

## Phase 3: Pipeline Orchestrator — Per-Repo Pipelines

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

## Phase 4: Sidebar — Repo Dropdown & Per-Repo Controls

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

## Phase 5: 3D Task Positioning — Repo Clusters

**Why:** Tasks from different repos need visual separation in 3D space.

7. Modify VS Code extension payload (documented for external consumers):
   - Each repo's tasks get a base X offset: `repoIndex * 200` 
   - Task position within a repo: `[repoBaseX + taskIndex * 40, 0, 0]`
   - `merfolkData.repoSlug = "owner/repo"` on every task object
   - All stay in cell `0,0,0` (200 * maxRepos well within 6667 cell size)

8. Add `getRepoBasePosition(repoSlug, allObjects)` to `pipelineTaskService.js`:
   - Determines the X offset for a repo's cluster based on existing repo positions
   - New repos start at the next available slot: `existingRepoCount * 200`
   - Used by the sidebar when the user manually creates tasks for a repo

**Files:**
- `src/services/pipelineTaskService.js` — add `getRepoBasePosition()`
- External: VS Code extension payload documentation (positions include repo offset)

## Phase 6: TextObject Ticket Rendering — Repo Badge

**Why:** Task cards should visually indicate which repo they belong to.

9. Modify `TextObject.jsx` pipeline footer:
   - Add repo name badge below the status badge when `merfolkData.repoSlug` exists
   - Small text, muted color, truncated with ellipsis if too long
   - Format: display just repo name (not owner), e.g., "hoverchart"

**Files:**
- `src/components/TextObject.jsx` — add repo badge to pipeline footer

---

## Relevant Files

### Modified
| File | Change |
|------|--------|
| `src/stores/pipelineStore.js` | Restructure from single-repo to `repos` Map with per-repo pipeline state |
| `src/services/pipelineTaskService.js` | Add `getPipelineTasksForRepo()`, `getRepoSlugsFromTasks()`, `getRepoBasePosition()` |
| `src/services/pipelineOrchestrator.js` | Add `repoSlug` param to all pipeline functions, read from repos Map |
| `src/components/UIOverlay.jsx` | Replace text input with repo dropdown, add multi-repo chips, per-repo controls |
| `src/components/TextObject.jsx` | Add repo name badge to pipeline task footer |

### Unchanged
| File | Why |
|------|-----|
| `functions/index.js` (bulkImport) | Already passes through `merfolkData` including new `repoSlug` field ✅ |
| `src/services/githubIssuesService.js` | Already parameterized by owner/repo ✅ |
| `src/stores/index.js` | Already re-exports pipelineStore ✅ |

---

## Verification
1. Open a GitHub Control Panel space → authenticate → click "Show Repositories" → see user's repo list
2. Click a repo → it appears as a chip in the "Connected repos" section
3. Click a second repo → both chips visible, space now has two repo slots
4. Import tasks for repo A (via bulkImport with repoSlug) → tasks appear at X=0 cluster
5. Import tasks for repo B → tasks appear at X=200 cluster
6. Select repo A in sidebar → task list, summary, controls show only repo A's tasks
7. Start pipeline for repo A → repo A's chip turns green, tasks progress
8. Select repo B → start its pipeline independently → both pipelines poll concurrently
9. Pause repo A pipeline → repo A pauses, repo B continues unaffected
10. TextObject cards show repo name badge (e.g., "hoverchart") below status pill
11. Remove a repo chip → its pipeline stops, tasks remain in space but repo is no longer tracked

## Scope Boundaries
- **Included:** Multi-repo tracking, per-repo pipelines, repo dropdown, 3D cluster positioning, repo badge on task cards
- **Excluded:** Drag-and-drop repo reordering, repo-specific visual themes/colors, cross-repo task dependencies, repo task auto-creation from sidebar
