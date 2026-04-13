# Plan: Pipeline Task Custom Menu with Revert & Delete

## TL;DR
Replace click-to-expand on pipeline task TextObjects with a custom UI menu (black-bordered). Menu has Revert (force-resets main via merge_commit_sha), Delete (removes task), and Expand/Collapse buttons. Requires saving merge_commit_sha when PRs merge, adding revertCommit API function, and modifying TextObject click + render logic.

## Decisions
- Revert is force-push (destructive) — matches user intent
- Token from localStorage('github_token') — same as pipelineOrchestrator
- Owner/repo from merfolkData.repoSlug (format: owner/repo)
- Expand/collapse moved from click-to-toggle to menu button
- Custom menu styled like Cube repo menu (Html overlay)

---

## Phase 1: Data Model — Save Merge Commit SHA

**Why:** The revert feature needs to know which commit to revert. GitHub's PR response includes `merge_commit_sha` but we don't currently store it.

1. Modify `pipelineOrchestrator.js` line 129 — pass `{ mergeCommitSha: prCheck.data.merge_commit_sha }` as the `extraFields` arg to `updateTaskStatus()`. The function already supports `extraFields` that get merged into `merfolkData` in Firestore.

**Files:**
- `src/services/pipelineOrchestrator.js` — add mergeCommitSha to updateTaskStatus call

## Phase 2: GitHub API — Add revertCommit Function

**Why:** No revert function exists in the GitHub service. Need to fetch a commit's parent and force-update the branch ref.

2. Add `revertCommit(token, owner, repo, commitSha, branch = 'main')` to `githubIssuesService.js` after line 173, using existing `githubFetch` helper:
   - GET `/repos/:owner/:repo/git/commits/:commitSha` → extract `parents[0].sha`
   - PATCH `/repos/:owner/:repo/git/refs/heads/:branch` with `{ sha: parentSha, force: true }`
   - Return `{ ok, data, error }` matching all other service functions

**Files:**
- `src/services/githubIssuesService.js` — add `revertCommit()` function after `enableAutoMerge()`

## Phase 3: TextObject — Black Border & Custom Task Menu

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

## Relevant Files

### Modified
| File | Change |
|------|--------|
| `src/services/pipelineOrchestrator.js` | Pass `mergeCommitSha` as extraFields to `updateTaskStatus()` on merge |
| `src/services/githubIssuesService.js` | Add `revertCommit()` — fetch parent SHA, force-update branch ref |
| `src/components/TextObject.jsx` | Black border, replace TextObjectUI with custom task menu (Revert/Delete/Expand) |

### Unchanged
| File | Why |
|------|-----|
| `src/services/pipelineTaskService.js` | `updateTaskStatus()` already supports `extraFields` ✅ |
| `src/services/spatialObjectsService.js` | `deleteObject()` already exists ✅ |

---

## Verification
1. Pipeline merges a task → inspect `merfolkData.mergeCommitSha` in Firestore or dev tools
2. Click a pipeline task → custom menu appears (not the text formatting toolbar)
3. All pipeline tasks render with black border
4. Click Delete → task removed from scene and Firebase
5. Click Expand/Collapse → task toggles size as before
6. Click Revert on a merged task → GitHub main branch reset to previous commit (verify via git log)

## Scope Boundaries
- **Included:** Black border styling, custom pipeline task menu with Revert/Delete/Expand, merge_commit_sha persistence
- **Excluded:** Undo for revert operations, confirmation dialogs before revert, batch revert of multiple tasks