# Task: 1. Data Model — Save Merge Commit SHA

## TL;DR
Replace click-to-expand on pipeline task TextObjects with a custom UI menu (black-bordered). Menu has Revert (force-resets main via merge_commit_sha), Delete (removes task), and Expand/Collapse buttons. Requires saving merge_commit_sha when PRs merge, adding revertCommit API function, and modifying TextObject click + render logic.

## Decisions
- Revert is force-push (destructive) — matches user intent
- Token from localStorage('github_token') — same as pipelineOrchestrator
- Owner/repo from merfolkData.repoSlug (format: owner/repo)
- Expand/collapse moved from click-to-toggle to menu button
- Custom menu styled like Cube repo menu (Html overlay)

---

**Why:** The revert feature needs to know which commit to revert. GitHub's PR response includes `merge_commit_sha` but we don't currently store it.

1. Modify `pipelineOrchestrator.js` line 129 — pass `{ mergeCommitSha: prCheck.data.merge_commit_sha }` as the `extraFields` arg to `updateTaskStatus()`. The function already supports `extraFields` that get merged into `merfolkData` in Firestore.

**Files:**
- `src/services/pipelineOrchestrator.js` — add mergeCommitSha to updateTaskStatus call