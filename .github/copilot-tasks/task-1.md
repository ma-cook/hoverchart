# Task: 1. GitHub API — Add revertCommit Function

## TL;DR
Replace click-to-expand on pipeline task TextObjects with a custom UI menu (black-bordered). Menu has Revert (force-resets main via merge_commit_sha), Delete (removes task), and Expand/Collapse buttons. Requires saving merge_commit_sha when PRs merge, adding revertCommit API function, and modifying TextObject click + render logic.

## Decisions
- Revert is force-push (destructive) — matches user intent
- Token from localStorage('github_token') — same as pipelineOrchestrator
- Owner/repo from merfolkData.repoSlug (format: owner/repo)
- Expand/collapse moved from click-to-toggle to menu button
- Custom menu styled like Cube repo menu (Html overlay)

---

**Why:** No revert function exists in the GitHub service. Need to fetch a commit's parent and force-update the branch ref.

2. Add `revertCommit(token, owner, repo, commitSha, branch = 'main')` to `githubIssuesService.js` after line 173, using existing `githubFetch` helper:
   - GET `/repos/:owner/:repo/git/commits/:commitSha` → extract `parents[0].sha`
   - PATCH `/repos/:owner/:repo/git/refs/heads/:branch` with `{ sha: parentSha, force: true }`
   - Return `{ ok, data, error }` matching all other service functions

**Files:**
- `src/services/githubIssuesService.js` — add `revertCommit()` function after `enableAutoMerge()`