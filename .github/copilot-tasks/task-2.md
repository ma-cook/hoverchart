# Task: 2. Clear Tasks — Bump Instead of Delete

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