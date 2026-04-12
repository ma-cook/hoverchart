import { createWithEqualityFn } from 'zustand/traditional';

const usePipelineStore = createWithEqualityFn((set, get) => ({
  isRunning: false,
  isPaused: false,
  autoApprove: false,
  currentTaskId: null,
  connectedRepo: null,
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

  // Persist/restore per-space state from localStorage
  persistState: (spaceId) => {
    const { connectedRepo, autoApprove, taskOrder } = get();
    try {
      localStorage.setItem(
        `pipeline_${spaceId}`,
        JSON.stringify({ connectedRepo, autoApprove, taskOrder })
      );
    } catch {
      // localStorage may be unavailable
    }
  },

  restoreState: (spaceId) => {
    try {
      const stored = localStorage.getItem(`pipeline_${spaceId}`);
      if (stored) {
        const { connectedRepo, autoApprove, taskOrder } = JSON.parse(stored);
        set({
          connectedRepo: connectedRepo || null,
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
