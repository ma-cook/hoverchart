import { createWithEqualityFn } from 'zustand/traditional';

const DEFAULT_STATE = {
  enabled: false,
  leftHand: null,
  rightHand: null,
  lastUpdate: 0,
  fps: 0,
  error: null,
};

const useHandTrackingStore = createWithEqualityFn((set) => ({
  ...DEFAULT_STATE,

  setEnabled: (enabled) => set({ enabled }),

  setHands: ({ left, right }) =>
    set({ leftHand: left, rightHand: right, lastUpdate: Date.now() }),

  setFps: (fps) => set({ fps }),

  setError: (error) => set({ error }),

  reset: () => set({ ...DEFAULT_STATE }),
}));

export default useHandTrackingStore;
