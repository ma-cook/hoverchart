# Task: 1. GitHub API — Add revertCommit Function

## TL;DR
Replace click-to-expand on pipeline task TextObjects with a custom UI menu (black-bordered). Menu has Revert (force-resets main via merge_commit_sha), Delete (removes task), and Expand/Collapse buttons. Also fix pipeline task sizing — tasks are currently ~4x wider than the container and text is unreadably small due to oversized scale constants.

## Decisions
- Revert is force-push (destructive) — matches user intent
- Token from localStorage('github_token') — same as pipelineOrchestrator
- Owner/repo from merfolkData.repoSlug (format: owner/repo)
- Expand/collapse moved from click-to-toggle to menu button
- Custom menu styled like Cube repo menu (Html overlay)
- Task width from fixed scale constants (not dynamic text measurement) — simpler and consistent

---

**Why:** No revert function exists in the GitHub service. Need to fetch a commit's parent and force-update the branch ref.

5. Add `revertCommit(token, owner, repo, commitSha, branch = 'main')` to `githubIssuesService.js` after line 173, using existing `githubFetch` helper:
   - GET `/repos/:owner/:repo/git/commits/:commitSha` → extract `parents[0].sha`
   - PATCH `/repos/:owner/:repo/git/refs/heads/:branch` with `{ sha: parentSha, force: true }`
   - Return `{ ok, data, error }` matching all other service functions

**Files:**
- `src/services/githubIssuesService.js` — add `revertCommit()` function after `enableAutoMerge()`