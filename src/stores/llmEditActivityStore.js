import { createWithEqualityFn } from 'zustand/traditional';

/**
 * Tracks which repo files the LLM is *currently* editing, so the 3D scene can
 * highlight the objects that represent those files (symbols/components/etc.)
 * while the agent works on them.
 *
 * Source of truth is the agent harness (retrievalOrchestrator): on every
 * successful `edit`/`write` it calls `markFileEditing(filePath, round)`, and at
 * each tool round boundary it calls `pruneIdleFiles(round, maxAgeRounds)` so a
 * file that has not been touched for a few rounds is no longer "active" (the
 * agent works file-by-file, so this naturally clears a file once the agent
 * moves on). A run-end `clearAll()` guarantees no stale red survives.
 *
 * activeFiles: Map<filePath, lastEditRound>  (normalized path → round number)
 */
const useLlmEditActivityStore = createWithEqualityFn((set, get) => ({
  // filePath → the tool-round number in which it was last edited
  activeFiles: new Map(),

  // True while an agent run is in progress (edits may be active).
  isRunning: false,

  beginRun() {
    set({ isRunning: true });
  },

  endRun() {
    set({ isRunning: false, activeFiles: new Map() });
  },

  markFileEditing(filePath, round = 0) {
    if (!filePath) return;
    const next = new Map(get().activeFiles);
    next.set(String(filePath), Number(round) || 0);
    set({ activeFiles: next });
  },

  /**
   * Drop files whose last edit round is older than `maxAgeRounds` relative to
   * the current round. Called at round boundaries so a file clears once the
   * agent stops editing it.
   */
  pruneIdleFiles(currentRound, maxAgeRounds = 2) {
    const round = Number(currentRound) || 0;
    const active = get().activeFiles;
    if (active.size === 0) return;
    let changed = false;
    const next = new Map();
    for (const [filePath, lastRound] of active) {
      if (round - lastRound <= maxAgeRounds) {
        next.set(filePath, lastRound);
      } else {
        changed = true;
      }
    }
    if (changed) set({ activeFiles: next });
  },

  clearFile(filePath) {
    const active = get().activeFiles;
    if (!active.has(String(filePath))) return;
    const next = new Map(active);
    next.delete(String(filePath));
    set({ activeFiles: next });
  },

  clearAll() {
    if (get().activeFiles.size === 0 && !get().isRunning) return;
    set({ activeFiles: new Map(), isRunning: false });
  },
}));

export default useLlmEditActivityStore;
