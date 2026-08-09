# Stop the LLM from rewriting entire files (edit tool)

## Problem

The app's LLM (tool round in SpaceChat) still performs whole-file rewrites. Evidence from the console:

- `[ToolRound] src/components/UIOverlay.jsx: refusing 362/362-line diff region (cap 200)`
- `[ToolRound] ...: diff was too large to emit safely — falling back to edit-record hunks`
- `[ToolRound] Generated 2 synthetic code block(s) from edit/write tools`
- Applied rewrites seen in pending changes: graphPersistence.js +98/-88, UIOverlay.jsx +1757/-1738.

Root cause: the `write` tool already rejects existing files (`toolExecutor.js:1626`), but the `edit`
tool applies a whole-file `oldString`/`newString` with no size guard (exact match at
`toolExecutor.js:1510-1519`). The post-run synthetic-block stage refuses to echo the rewrite as a
patch (region cap 200, `retrievalOrchestrator.js:417`) but the edit-record fallback re-emits the raw
whole-file records uncapped (`retrievalOrchestrator.js:1255-1266`). Prompt guidance already exists
(`zenService.js:815`, `retrievalOrchestrator.js:72`, `toolProvider.js:226`) but is not enforced.

## Scope (user-approved)

**Edit-tool guard only.** No changes to the synthetic-block fallback, prompts, or code-gen text path.

## Changes

### `src/services/context/toolExecutor.js`

1. Add constants near the top (after `MAX_HITS_PER_FILE`):
   - `MAX_EDIT_OLD_LINES = 200`
   - `MAX_EDIT_OLD_RATIO = 0.5`
   - `MIN_EDIT_CAP_FILE_LINES = 40`

2. Add a pure module-level helper:

```js
function refuseWholeFileEdit(content, cleanedOldString, filePath) {
  const fileLineCount = content.split('\n').length;
  if (fileLineCount <= MIN_EDIT_CAP_FILE_LINES) return null;
  const oldLineCount = cleanedOldString.split('\n').length;
  if (oldLineCount > MAX_EDIT_OLD_LINES || oldLineCount / fileLineCount > MAX_EDIT_OLD_RATIO) {
    return {
      success: false,
      content: `edit refused: oldString spans ${oldLineCount}/${fileLineCount} lines of ${filePath} — this is a whole-file rewrite, not a targeted edit. Make smaller, targeted edits (one function or block per edit call), copying oldString verbatim from read_file output. For changes spanning more than a few blocks, call "edit" multiple times.`,
    };
  }
  return null;
}
```

3. In the `edit` case, after `let matchContent = loadContent();` (line ~1509), before
   `const attemptEdit = ...`:

```js
const wholeFileRefusal = refuseWholeFileEdit(matchContent, cleanedOldString, filePath);
if (wholeFileRefusal) return wholeFileRefusal;
```

4. In the GitHub-refresh retry path (after `matchContent = loadContent();` at line ~1534, before
   `attempt = attemptEdit(matchContent);`):

```js
const refreshRefusal = refuseWholeFileEdit(matchContent, cleanedOldString, filePath);
if (refreshRefusal) return refreshRefusal;
```

### Rationale for thresholds

- `200` line absolute cap: matches the existing `MAX_PATCH_BLOCK_LINES = 200` cap used to refuse
  giant diff regions, so enforcement and emission agree.
- `0.5` ratio: catches near-whole-file rewrites in small/medium files (e.g. 100/100 → refused).
- `40` line exemption: full rewrites of genuinely tiny files stay legal.
- Check runs on the cleaned oldString (line-number prefixes stripped) and CRLF-reconciled content,
  so a model pasting `read_file` output with line numbers is still caught.

Behavior after fix: the rewrite is refused at the tool, the model gets an actionable error, and it
must retry with smaller targeted edits. No whole-file change can be applied.

## Verify

- ESLint on `src/services/context/toolExecutor.js`.
- `npm run build` passes.
- Optional: quick Node smoke test of `refuseWholeFileEdit` logic (pure function) with a stub — the
  values can be copied into a throwaway script since the module pulls in stores/workers.
