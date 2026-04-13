import { createWithEqualityFn } from 'zustand/traditional';

const usePipelineStore = createWithEqualityFn((set, get) => ({
  isRunning: false,
  isPaused: false,
  autoApprove: false,
  currentTaskId: null,
  connectedRepo: null,
  connectedRepos: [],
  pollIntervalId: null,
  taskOrder: [],

  startPipeline: () =>
    set({ isRunning: true, isPaused: false }),

  pausePipeline: () => {
    const { pollIntervalId } = get();
    if (pollIntervalId) {
      clearInterval(pollIntervalId);
    }
    set({ isPaused: true, pollIntervalId: null });
  },

  resumePipeline: () =>
    set({ isPaused: false }),

  stopPipeline: () => {
    const { pollIntervalId } = get();
    if (pollIntervalId) {
      clearInterval(pollIntervalId);
    }
    set({
      isRunning: false,
      isPaused: false,
      currentTaskId: null,
      pollIntervalId: null,
    });
  },

  setAutoApprove: (value) => set({ autoApprove: value }),

  setConnectedRepo: (repo) => set({ connectedRepo: repo }),

  setCurrentTaskId: (id) => set({ currentTaskId: id }),

  setTaskOrder: (ids) => set({ taskOrder: ids }),

  setPollIntervalId: (id) => set({ pollIntervalId: id }),

  // Multi-repo management
  addRepo: (owner, repo) => {
    const slug = `${owner}/${repo}`;
    const { connectedRepos } = get();
    if (connectedRepos.some((r) => r.slug === slug)) return;
    const updated = [...connectedRepos, { owner, repo, slug }];
    set({ connectedRepos: updated, connectedRepo: updated[0] });
  },

  removeRepo: (slug) => {
    const { connectedRepos } = get();
    const updated = connectedRepos.filter((r) => r.slug !== slug);
    set({ connectedRepos: updated, connectedRepo: updated[0] || null });
  },

  getRepo: (slug) => {
    return get().connectedRepos.find((r) => r.slug === slug) || null;
  },

  // Persist/restore per-space state from localStorage
  persistState: (spaceId) => {
    const { connectedRepo, connectedRepos, autoApprove, taskOrder } = get();
    try {
      localStorage.setItem(
        `pipeline_${spaceId}`,
        JSON.stringify({ connectedRepo, connectedRepos, autoApprove, taskOrder })
      );
    } catch {
      // localStorage may be unavailable
    }
  },

  restoreState: (spaceId) => {
    try {
      const stored = localStorage.getItem(`pipeline_${spaceId}`);
      if (stored) {
        const { connectedRepo, connectedRepos, autoApprove, taskOrder } = JSON.parse(stored);
        set({
          connectedRepo: connectedRepo || null,
          connectedRepos: connectedRepos || [],
          autoApprove: autoApprove || false,
          taskOrder: taskOrder || [],
        });
      }
    } catch {
      // localStorage may be unavailable or corrupted
    }
  },
}));

export default usePipelineStore;
