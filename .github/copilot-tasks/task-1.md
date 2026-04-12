# Task: 1. Data Model — Add repoSlug to merfolkData

## TL;DR
Enhance GitHub Control Panel spaces to support multiple repos simultaneously. Each repo gets its own 3D task cluster (~200 units apart), its own independent pipeline, and the sidebar uses the same GitHub repo dropdown pattern as the diagram space. merfolkData gains a `repoSlug` field to tag tasks per-repo; pipelineStore becomes multi-repo with a Map of per-repo states.

## Decisions
- Layout: Separate clusters ~200 units apart along X axis, all within cell 0,0,0
- Pipelines: Independent per-repo (each has own start/pause/stop/auto-approve)
- Repo selection: Additive — selecting a repo from dropdown adds a new filing group
- Repo dropdown: Reuse the existing `fetchGithubRepositories` + dropdown list pattern from diagram space

---

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