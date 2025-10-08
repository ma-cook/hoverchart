import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';

const useWebcamStreamStore = createWithEqualityFn((set, get) => ({
  // Webcam streams state - keyed by stream ID
  webcamStreams: {}, // { streamId: { hasError, errorMessage, isLoading, retryTrigger } }

  // Get webcam stream state by ID
  getWebcamStream: (streamId) => {
    const state = get();
    return (
      state.webcamStreams[streamId] || {
        hasError: false,
        errorMessage: '',
        isLoading: false,
        retryTrigger: 0,
      }
    );
  },

  // Set webcam stream state
  setWebcamStream: (streamId, updates) => {
    set((state) => ({
      webcamStreams: {
        ...state.webcamStreams,
        [streamId]: {
          ...state.webcamStreams[streamId],
          ...updates,
        },
      },
    }));
  },

  // Update specific property of a webcam stream
  updateWebcamStreamProperty: (streamId, property, value) => {
    set((state) => ({
      webcamStreams: {
        ...state.webcamStreams,
        [streamId]: {
          ...state.webcamStreams[streamId],
          [property]: value,
        },
      },
    }));
  },

  // Set loading state
  setWebcamLoading: (streamId, isLoading) => {
    set((state) => ({
      webcamStreams: {
        ...state.webcamStreams,
        [streamId]: {
          ...state.webcamStreams[streamId],
          isLoading,
        },
      },
    }));
  },

  // Set error state
  setWebcamError: (streamId, hasError, errorMessage = '') => {
    set((state) => ({
      webcamStreams: {
        ...state.webcamStreams,
        [streamId]: {
          ...state.webcamStreams[streamId],
          hasError,
          errorMessage,
        },
      },
    }));
  },

  // Retry webcam stream
  retryWebcamStream: (streamId) => {
    set((state) => ({
      webcamStreams: {
        ...state.webcamStreams,
        [streamId]: {
          ...state.webcamStreams[streamId],
          retryTrigger: (state.webcamStreams[streamId]?.retryTrigger || 0) + 1,
          hasError: false,
          errorMessage: '',
        },
      },
    }));
  },

  // Clear webcam stream state
  clearWebcamStream: (streamId) => {
    set((state) => {
      const newWebcamStreams = { ...state.webcamStreams };
      delete newWebcamStreams[streamId];
      return {
        webcamStreams: newWebcamStreams,
      };
    });
  },

  // Clear all webcam streams
  clearAllWebcamStreams: () => {
    set({ webcamStreams: {} });
  },

  // Get all webcam streams
  getAllWebcamStreams: () => {
    const state = get();
    return state.webcamStreams;
  },
}));

export default useWebcamStreamStore;
