# Task: 1. Update Import

## TL;DR
GitHub's `enablePullRequestAutoMerge` GraphQL mutation requires "Allow auto-merge" in repo settings, which is only available on paid plans for private repos. The codebase already has `mergePullRequest()` defined but never called. Switch the orchestrator to use it directly via REST API — works on all plans, no repo settings needed.

## Decisions
- Use existing `mergePullRequest()` (squash merge via `PUT /repos/{owner}/{repo}/pulls/{number}/merge`)
- Keep `approvePullRequest()` call before merge (unchanged)
- `enableAutoMerge` can remain in githubIssuesService.js (just unused) — no need to delete

---

**File:** `src/services/pipelineOrchestrator.js` (lines 7-19)

Replace `enableAutoMerge` with `mergePullRequest` in the import block:

```js
import {
  getRepoInfo,
  getBranchRef,
  createBranchRef,
  deleteBranchRef,
  getFileContents,
  createFileOnBranch,
  createPullRequest,
  addComment,
  approvePullRequest,
  mergePullRequest,
  getPullRequest,
} from './githubIssuesService';
```