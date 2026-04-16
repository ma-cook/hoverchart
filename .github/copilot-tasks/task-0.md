# Task: 0. Fix Pipeline Task Sizing & Readability

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

**Why:** Tasks render ~4x wider than the container (79.5 vs 20 world units) because `COLLAPSED_TASK_SCALE[0] = 15` produces `15 × 5.3 × 30 = 2385px` CSS width. Text at 42px inside that 2385px box appears unreadably small in 3D space. The width formula is `scale[0] × 5.3 × conversionFactor(30)` in TextObject.jsx, and the drei `<Html transform>` maps ~30 CSS pixels per world unit.

1. In `repoContainerService.js` — reduce `COLLAPSED_TASK_SCALE` from `[15, 3, 1]` to `[4, 3, 1]` so collapsed task width ≈ 21 world units (fits within the 20-unit container). Reduce `EXPANDED_TASK_SCALE` from `[25, 18, 1]` to `[8, 18, 1]` proportionally.
2. In `repoContainerService.js` — increase `TASK_FONT_SIZE` from `42` to `72` so text is legible at typical camera distances where the container is visible. May need visual tuning.
3. In `repoContainerService.js` — adjust container expansion width: change `neededWidth = Math.max(15, 20)` to `Math.max(15, 15)` since tasks no longer need the extra 5 units of container width at the smaller scale.
4. In `repoContainerService.js` — lower the `repositionIncomingTasks()` guard from `obj.scale[0] >= 10` to `obj.scale[0] >= 3` so tasks with the new smaller scale aren't overwritten on re-import.

**Files:**
- `src/services/repoContainerService.js` — constants at lines 10-12, container expansion at ~line 378, reposition guard at ~line 239