import { createWithEqualityFn } from 'zustand/traditional';

const usePipelineStore = createWithEqualityFn((set, get) => ({
  // Flat pipeline state (mirrors the active repo's state)
  isRunning: false,
  isPaused: false,
  autoApprove: false,
  currentTaskId: null,
  connectedRepo: null,
  pollIntervalId: null,
  taskOrder: [],

  // Multi-repo support — repoSlug key format: 'owner/repo'
  repos: new Map(),        // repoSlug → { owner, repo }
  activeRepoSlug: null,

  // ── Multi-repo actions ───────────────────────────────────────────────────

  addRepo: (owner, repo) => {
    const repoSlug = `${owner}/${repo}`;
    set((state) => {
      const repos = new Map(state.repos);
      repos.set(repoSlug, { owner, repo });
      return { repos, activeRepoSlug: repoSlug, connectedRepo: { owner, repo } };
    });
  },

  removeRepo: (repoSlug) => {
    set((state) => {
      const repos = new Map(state.repos);
      repos.delete(repoSlug);
      let newActiveSlug;
      if (state.activeRepoSlug === repoSlug) {
        newActiveSlug = repos.size > 0 ? [...repos.keys()][0] : null;
      } else {
        newActiveSlug = state.activeRepoSlug;
      }
      const newConnectedRepo = newActiveSlug ? (repos.get(newActiveSlug) ?? null) : null;
      return { repos, activeRepoSlug: newActiveSlug, connectedRepo: newConnectedRepo };
    });
  },

  setActiveRepo: (repoSlug) => {
    set((state) => {
      const repo = state.repos.get(repoSlug) || null;
      return { activeRepoSlug: repoSlug, connectedRepo: repo };
    });
  },

  // ── Flat pipeline actions (operate on active repo) ───────────────────────

  startPipeline: () =>
    set({ isRunning: true, isPaused: false }),

  pausePipeline: () => {
    const { pollIntervalId } = get();
    if (pollIntervalId) {
      clearTimeout(pollIntervalId);
    }
    set({ isPaused: true, pollIntervalId: null });
  },

  resumePipeline: () =>
    set({ isPaused: false }),

  stopPipeline: () => {
    const { pollIntervalId } = get();
    if (pollIntervalId) {
      clearTimeout(pollIntervalId);
    }
    set({
      isRunning: false,
      isPaused: false,
      currentTaskId: null,
      pollIntervalId: null,
    });
  },

  setAutoApprove: (value) => set({ autoApprove: value }),

  setConnectedRepo: (repo) => {
    if (repo) {
      get().addRepo(repo.owner, repo.repo);
    } else {
      set({ connectedRepo: null });
    }
  },

  setCurrentTaskId: (id) => set({ currentTaskId: id }),

  setTaskOrder: (ids) => set({ taskOrder: ids }),

  setPollIntervalId: (id) => set({ pollIntervalId: id }),

  // ── Persist/restore per-space state from localStorage ───────────────────

  persistState: (spaceId) => {
    const { repos, activeRepoSlug, connectedRepo, autoApprove, taskOrder } = get();
    try {
      localStorage.setItem(
        `pipeline_${spaceId}`,
        JSON.stringify({
          repos: [...repos.entries()],
          activeRepoSlug,
          connectedRepo,
          autoApprove,
          taskOrder,
        })
      );
    } catch {
      // localStorage may be unavailable
    }
  },

  restoreState: (spaceId) => {
    try {
      const stored = localStorage.getItem(`pipeline_${spaceId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const repos = new Map(parsed.repos || []);
        set({
          repos,
          activeRepoSlug: parsed.activeRepoSlug || null,
          connectedRepo: parsed.connectedRepo || null,
          autoApprove: parsed.autoApprove || false,
          taskOrder: parsed.taskOrder || [],
        });
      }
    } catch {
      // localStorage may be unavailable or corrupted
    }
  },
}));

export default usePipelineStore;
