import { createWithEqualityFn } from 'zustand/traditional';

const DEFAULT_SCREEN_SHARE = {
  hasError: false,
  errorMessage: '',
  isLoading: false,
  retryTrigger: 0,
  streamData: null,
};

const useScreenShareStore = createWithEqualityFn((set, get) => ({
  // Screen share streams state - keyed by planeId or unique identifier
  screenShares: {}, // { streamId: { hasError, errorMessage, isLoading, retryTrigger, streamData } }

  // Get screen share state by stream ID.
  // Always returns a copy of DEFAULT_SCREEN_SHARE so retryTrigger is never undefined.
  getScreenShare: (streamId) => {
    const { screenShares } = get();
    return screenShares[streamId] ?? { ...DEFAULT_SCREEN_SHARE };
  },

  // Set loading state for a screen share
  setScreenShareLoading: (streamId, isLoading) => {
    set((state) => ({
      screenShares: {
        ...state.screenShares,
        [streamId]: {
          ...DEFAULT_SCREEN_SHARE,
          ...state.screenShares[streamId],
          isLoading,
        },
      },
    }));
  },

  // Set error state for a screen share
  setScreenShareError: (streamId, hasError, errorMessage = '') => {
    set((state) => ({
      screenShares: {
        ...state.screenShares,
        [streamId]: {
          ...DEFAULT_SCREEN_SHARE,
          ...state.screenShares[streamId],
          hasError,
          errorMessage,
        },
      },
    }));
  },

  // Trigger retry for a screen share
  retryScreenShare: (streamId) => {
    set((state) => ({
      screenShares: {
        ...state.screenShares,
        [streamId]: {
          ...DEFAULT_SCREEN_SHARE,
          ...state.screenShares[streamId],
          retryTrigger: (state.screenShares[streamId]?.retryTrigger ?? 0) + 1,
          hasError: false,
          errorMessage: '',
        },
      },
    }));
  },

  // Set stream data for a screen share
  setScreenShareData: (streamId, streamData) => {
    set((state) => ({
      screenShares: {
        ...state.screenShares,
        [streamId]: {
          ...DEFAULT_SCREEN_SHARE,
          ...state.screenShares[streamId],
          streamData,
        },
      },
    }));
  },

  // Clear screen share state
  clearScreenShare: (streamId) => {
    set((state) => {
      const newScreenShares = { ...state.screenShares };
      delete newScreenShares[streamId];
      return { screenShares: newScreenShares };
    });
  },

  // Clear all screen shares
  clearAllScreenShares: () => {
    set({ screenShares: {} });
  },

  // Reset screen share to initial state
  resetScreenShare: (streamId) => {
    set((state) => ({
      screenShares: {
        ...state.screenShares,
        [streamId]: {
          hasError: false,
          errorMessage: '',
          isLoading: false,
          retryTrigger: 0,
          streamData: null,
        },
      },
    }));
  },
}));

export default useScreenShareStore;
