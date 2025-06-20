import { create } from 'zustand';

const useTransformControlsStore = create((set, get) => ({
  // Transform controls state - keyed by object ID or unique identifier
  transformControls: {}, // { objectId: { isInitialized, isDragging, lastPosition, etc. } }

  // Get transform control state by ID
  getTransformControl: (objectId) => {
    const state = get();
    return (
      state.transformControls[objectId] || {
        isInitialized: false,
        isDragging: false,
        lastPosition: null,
        lastReportedTime: 0,
        appliedScale: null,
      }
    );
  },

  // Set transform control state
  setTransformControl: (objectId, updates) => {
    set((state) => ({
      transformControls: {
        ...state.transformControls,
        [objectId]: {
          ...state.transformControls[objectId],
          ...updates,
        },
      },
    }));
  },

  // Update specific property of a transform control
  updateTransformControlProperty: (objectId, property, value) => {
    set((state) => ({
      transformControls: {
        ...state.transformControls,
        [objectId]: {
          ...state.transformControls[objectId],
          [property]: value,
        },
      },
    }));
  },

  // Clear transform control state
  clearTransformControl: (objectId) => {
    set((state) => {
      const newTransformControls = { ...state.transformControls };
      delete newTransformControls[objectId];
      return {
        transformControls: newTransformControls,
      };
    });
  },

  // Clear all transform controls
  clearAllTransformControls: () => {
    set({ transformControls: {} });
  },

  // Get all transform controls
  getAllTransformControls: () => {
    const state = get();
    return state.transformControls;
  },
}));

export default useTransformControlsStore;
