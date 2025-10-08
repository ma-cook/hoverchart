import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';

const useUIOverlayStore = createWithEqualityFn((set, get) => ({
  // UI Overlay state - can have multiple overlay instances if needed
  overlays: {}, // { overlayId: { menuOpen, templateOpen, templateConfig } }

  // Default overlay state
  defaultOverlay: {
    menuOpen: false,
    templateOpen: false,
    templateConfig: {
      objectType: 'cube',
      numberOfObjects: 5,
      distance: 10,
      templateShape: 'plane',
      orientation: 'horizontal',
    },
  },

  // Get UI overlay state by ID (defaults to 'main' if no ID provided)
  getUIOverlay: (overlayId = 'main') => {
    const state = get();
    return state.overlays[overlayId] || { ...state.defaultOverlay };
  },

  // Set UI overlay state
  setUIOverlay: (overlayId = 'main', updates) => {
    set((state) => ({
      overlays: {
        ...state.overlays,
        [overlayId]: {
          ...state.overlays[overlayId],
          ...updates,
        },
      },
    }));
  },
  // Update specific property of a UI overlay
  updateUIOverlayProperty: (overlayId = 'main', property, value) => {
    set((state) => {
      // Ensure overlay exists, if not create it with default values
      if (!state.overlays[overlayId]) {
        state.overlays[overlayId] = { ...state.defaultOverlay };
      }

      return {
        overlays: {
          ...state.overlays,
          [overlayId]: {
            ...state.overlays[overlayId],
            [property]: value,
          },
        },
      };
    });
  },
  // Toggle menu open state
  toggleMenu: (overlayId = 'main') => {
    set((state) => {
      // Ensure overlay exists, if not create it with default values
      if (!state.overlays[overlayId]) {
        state.overlays[overlayId] = { ...state.defaultOverlay };
      }

      return {
        overlays: {
          ...state.overlays,
          [overlayId]: {
            ...state.overlays[overlayId],
            menuOpen: !state.overlays[overlayId].menuOpen,
          },
        },
      };
    });
  },
  // Toggle template open state
  toggleTemplate: (overlayId = 'main') => {
    set((state) => {
      // Ensure overlay exists, if not create it with default values
      if (!state.overlays[overlayId]) {
        state.overlays[overlayId] = { ...state.defaultOverlay };
      }

      return {
        overlays: {
          ...state.overlays,
          [overlayId]: {
            ...state.overlays[overlayId],
            templateOpen: !state.overlays[overlayId].templateOpen,
          },
        },
      };
    });
  },

  // Update template configuration
  updateTemplateConfig: (overlayId = 'main', field, value) => {
    const state = get();
    const overlay = state.getUIOverlay(overlayId);
    const updatedConfig = {
      ...overlay.templateConfig,
      [field]: value,
    };
    state.updateUIOverlayProperty(overlayId, 'templateConfig', updatedConfig);
  },

  // Clear UI overlay state
  clearUIOverlay: (overlayId = 'main') => {
    set((state) => {
      const newOverlays = { ...state.overlays };
      delete newOverlays[overlayId];
      return {
        overlays: newOverlays,
      };
    });
  },

  // Clear all UI overlays
  clearAllUIOverlays: () => {
    set({ overlays: {} });
  },

  // Get all UI overlays
  getAllUIOverlays: () => {
    const state = get();
    return state.overlays;
  },
}));

export default useUIOverlayStore;
