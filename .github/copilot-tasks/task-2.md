# Task: 2. TextObject — Black Border & Custom Task Menu

## TL;DR
Replace click-to-expand on pipeline task TextObjects with a custom UI menu (black-bordered). Menu has Revert (force-resets main via merge_commit_sha), Delete (removes task), and Expand/Collapse buttons. Requires saving merge_commit_sha when PRs merge, adding revertCommit API function, and modifying TextObject click + render logic.

## Decisions
- Revert is force-push (destructive) — matches user intent
- Token from localStorage('github_token') — same as pipelineOrchestrator
- Owner/repo from merfolkData.repoSlug (format: owner/repo)
- Expand/collapse moved from click-to-toggle to menu button
- Custom menu styled like Cube repo menu (Html overlay)

---

**Why:** Pipeline tasks need a distinct visual style (black border) and a custom action menu instead of the text formatting toolbar.

3. Add imports to `TextObject.jsx` — `revertCommit` from githubIssuesService, `deleteObject` from spatialObjectsService
4. Change pipeline task border styling at line ~1715 — replace `borderLeft: 4px solid ${getStatusColor()}` with `border: 2px solid black`
5. Modify click handler at lines 993-1000 — remove the early return that calls `toggleTaskExpansion()` on click; let pipeline tasks follow the normal click → select flow so `selected` becomes `true`
6. Modify render block at lines 2337-2346 — when `selected && isPipelineTask`, render a custom `Html` menu instead of `TextObjectUI`:
   - **Revert button** — enabled only when `merfolkData.mergeCommitSha` exists; reads token from `localStorage.getItem('github_token')`, parses owner/repo from `merfolkData.repoSlug`; calls `revertCommit()`
   - **Delete button** — calls `onDelete(id)` (existing prop from parent)
   - **Expand/Collapse button** — calls existing `toggleTaskExpansion(id)`
   - **Close button** — deselects the task

**Files:**
- `src/components/TextObject.jsx` — imports, border styling, click handler, custom menu render

---