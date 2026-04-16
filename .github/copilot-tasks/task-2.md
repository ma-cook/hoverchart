# Task: 2. Replace Auto-Merge Logic

## TL;DR
GitHub's `enablePullRequestAutoMerge` GraphQL mutation requires "Allow auto-merge" in repo settings, which is only available on paid plans for private repos. The codebase already has `mergePullRequest()` defined but never called. Switch the orchestrator to use it directly via REST API — works on all plans, no repo settings needed.

## Decisions
- Use existing `mergePullRequest()` (squash merge via `PUT /repos/{owner}/{repo}/pulls/{number}/merge`)
- Keep `approvePullRequest()` call before merge (unchanged)
- `enableAutoMerge` can remain in githubIssuesService.js (just unused) — no need to delete

---

**File:** `src/services/pipelineOrchestrator.js` (lines ~155-165)

Replace the `enableAutoMerge(token, nodeId)` GraphQL call with `mergePullRequest(token, owner, repo, prNumber)`:

```js
      // Auto-approve and merge if enabled and Copilot has pushed commits
      if (currentState.autoApprove && prCheck.data.commits > 1 && !prCheck.data.auto_merge) {
        await approvePullRequest(token, owner, repo, prNumber);
        const mergeResult = await mergePullRequest(token, owner, repo, prNumber);
        if (!mergeResult.ok) {
          console.warn('[pipelineOrchestrator] Direct merge failed, will keep polling:', mergeResult.error);
        }
      }
```

---