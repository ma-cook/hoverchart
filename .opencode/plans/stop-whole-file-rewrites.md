# Fix whole-file rewrites at the source (no edit-size caps)

## Problem

The LLM's edits still surface as whole-file rewrites. Root cause found: the *arbitrary
`MAX_PATCH_BLOCK_LINES = 200` cap in the emission layer is what creates the whole-file output.*

Flow that produces a whole-file block:
1. Model passes a whole-file `oldString`/`newString` to `edit`; it matches exactly, so the change
   is applied (the real diff vs the true original is often small — e.g. UIOverlay showed only a
   362-line region actually changing).
2. `generateSearchReplacePatch` diffs original vs modified, finds the 362-line region, and
   **refuses it** because `> MAX_PATCH_BLOCK_LINES` (`retrievalOrchestrator.js:417`).
3. It falls back to "edit-record hunks" (`retrievalOrchestrator.js:1245-1266`), which echoes the
   model's **raw whole-file** `oldString`/`newString` into the final text / pending changes.

User requirement: the pipeline must produce targeted (minimal) edits without the model having to
rewrite whole files, and must NOT cap legitimate large edits.

## Approach: diff at the source, never cap

The harness already has both the original and the modified content, so it can always emit the true
minimal diff. The cap is removed; the raw-record fallback is only used when the original is
genuinely unavailable.

## Changes

### 0. New `src/services/context/diffUtils.js` — shared minimal-diff engine

LCS-based line diff (`diffToHunks(before, after)`) returning SEARCH/REPLACE hunks that are:
- minimal per contiguous divergent region (handles top-of-file inserts, appends, deletes, whole-file
  rewrites),
- **never empty oldString**: pure insertions are anchored to a unique neighboring run of lines
  (above the insert, or below it for top-of-file inserts), because downstream `applySearchReplace`
  matches via `indexOf` — an empty search would corrupt the file by anchoring at position 0,
- whole-file rewrites → a single full-content hunk (a real diff, never a model-block echo).

Also fixes a pre-existing structural bug: the old lockstep loop `break`-ed *before* pushing a hunk
when a divergent region ran to EOF, so whole-file changes silently produced zero hunks and fell
through to the raw-record echo.

### 1. `src/services/context/retrievalOrchestrator.js` — emission (primary fix)

- `generateSearchReplacePatch` now delegates to `diffToHunks` (no `MAX_PATCH_BLOCK_LINES` refusal,
  no cap constant). Emits one SEARCH/REPLACE hunk per contiguous divergent region regardless of
  size, with corrected display context lines. The hunks are derived from the actual original
  content, so they match by construction (no "resync" risk — that concern applies to hallucinated
  oldStrings, which are already rejected by the edit tool's exact/fuzzy matching + `oversized` guard).
- Synthetic-block loop (lines ~1231-1240): when original content is available, ALWAYS use the diff
  result. Only fall back to `appliedEditRecords` when the original could not be obtained (GitHub
  fetch failed AND not cached). Log message updated.

### 2. `src/services/context/toolExecutor.js` — revert the cap, record minimal diffs

- **Removed** the `refuseWholeFileEdit` helper, its constants, and both guard calls added earlier
  (user rejected the cap; it blocks large edits and doesn't fix the source).
- **Defense-in-depth:** after a successful edit, store a *minimal before/after diff* in
  `appliedEditRecords` (via the shared `diffToHunks(matchContent, updated)`) instead of the model's
  raw `oldString`/`newString`. Then even the no-original fallback path emits minimal hunks.
  (Records are only consumed by the emission loop at `retrievalOrchestrator.js:1246`.)
- **Reinforcement (no blocking):** in the success response, when the model's `oldString` spanned
  more than half of a >40-line file, note it was applied as a minimal N-line change so the model
  learns targeted edits are preferred.

## Out of scope (unchanged)

- `write` tool already rejects existing files (`toolExecutor.js:~1626`).
- The code-gen text path (SpaceChat plain blocks): `isWholeFileProposal` warning + push rejection
  for existing files stay as-is.
- No new size limits anywhere.

## Verify

- ESLint on `retrievalOrchestrator.js` + `toolExecutor.js` + `diffUtils.js` (note: 8 pre-existing
  unused-var errors — 2 in toolExecutor, 6 in retrievalOrchestrator — are unrelated).
- `npm run build` (passes).
- Node smoke tests against the real `diffUtils.js` (small replace, 362-line region, whole-file
  rewrite, append/EOF, top-of-file insert, delete-tail, middle insert, two separated regions, no
  change, ambiguous-anchor inserts) — all pass; plus a wrapper test of `generateSearchReplacePatch`
  (context lines, tiny search blocks, 362-line region not refused). Temp tests deleted.

## Follow-up regression: edited-file diffs silently dropped from output

### Problem

New log evidence: the model made two **targeted** `edit` calls (both succeeded), yet the final
response logged `src/components/UIOverlay.jsx: no net change after edits — skipping synthetic
block` — no diff was emitted, so the applied edits vanished from the response and the model's prose
read as a line-by-line "remove one line, add the next line" whole-file rewrite.

Root cause: `originalFileContents` (retrievalOrchestrator.js) is used for **two conflicting roles** —
(a) a read cache served on re-reads, and (b) the "true pre-edit baseline" the emission loop diffs
against. After an edit, the end-of-round invalidation deletes the entry, but the next `read_file`
re-populated it from the content store (`repo:`/`github:` entries, ~line 963 and ~976), which now
holds the **post-edit** content. Emission then saw `originalContent === modifiedContent` → "no net
change" → synthetic block skipped.

Related same-round hole: if a round does `edit(file)` then `read_file(file)`, invalidation only ran
at the *end* of the round, so the read was served stale **pre-edit** content — the model saw its own
edit as missing and re-touched the file.

### Changes (retrievalOrchestrator.js)

1. **Immediate invalidation** right after an `edit`/`write` tool succeeds (`~line 980`): snapshot
   the pre-edit baseline into a new `preEditBaselines` map (first edit only), then delete the read
   cache entry and mark the file in `editedFilePaths`. Same-round reads now always hit the live
   store, never stale cache.
2. **Guard both cache re-population sites** (read pre-pass `~line 956` and post-execution
   `~line 976`) with `!editedFilePaths.has(fp)` so post-edit store content can never re-enter
   `originalFileContents`. After an edit, reads of that file execute `read_file` against the live
   store (fresh content) instead of being served from cache.
3. **Emission unchanged** except the baseline source: `originalContent = preEditBaselines.get(fp)
   ?? originalFileContents.get(fp)` — the snapshot is the true GitHub-HEAD pre-edit baseline (seeded
   by the F1 refresh at ~line 583 or the first pre-edit read), so `generateSearchReplacePatch`
   emits the correct minimal diff without needing the GitHub fallback. The GitHub-fetch fallback
   (`~line 1208`) and edit-record-hunks fallback remain as backstops.

### Verify

- ESLint: only the 6 pre-existing unused-var errors remain.
- `npm run build` passes.
- Node simulation of the map state transitions (7 cases: baseline→edit→same-round read→emission,
  pre-edit read→edit, failed edit keeps cache, edit-before-any-read → GitHub fallback, double edit,
  cross-round re-edit) — all pass. Temp test deleted.
- Reminder: the original symptom session ran a stale deployed bundle; a redeploy is required for
  this fix to take effect in production.
