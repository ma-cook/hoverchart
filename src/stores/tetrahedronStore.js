import { createWithEqualityFn } from 'zustand/traditional';

const useTetrahedronStore = createWithEqualityFn((set, get) => ({
  // State for all tetrahedrons
  tetrahedrons: new Map(), // Map of tetrahedronId -> tetrahedron state
  selectedTetrahedrons: new Set(), // Set of selected tetrahedron IDs
  transformingTetrahedrons: new Set(), // Set of tetrahedrons currently being transformed

  // Actions
  createTetrahedron: (tetrahedronId, initialState = {}) => {
    set((state) => {
      const newTetrahedrons = new Map(state.tetrahedrons);
      newTetrahedrons.set(tetrahedronId, {
        id: tetrahedronId,
        position: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#000000',
        faceColors: {},
        faceTexts: {},
        headerText: '',
        textStyle: { fontSize: 1.5, color: 'black', underline: false },
        faceTextStyles: {
          bottom: { fontSize: 0.5, color: 'black', underline: false },
          front: { fontSize: 0.5, color: 'black', underline: false },
          left: { fontSize: 0.5, color: 'black', underline: false },
          right: { fontSize: 0.5, color: 'black', underline: false },
        },
        // Properties for snap line indicator
        showSnapLine: false,
        snapLinePoints: [],
        snapAxis: null,
        selectedFace: null,
        selectedIndicator: null,
        showTransform: false,
        showHeader: false,
        showFaceTextInput: false,
        isResizing: false,
        showObjectUI: true,
        showHeaderTextStyleUI: false,
        activeTextFace: null,
        isScaleModified: false, // Add scale modification tracking
        ...initialState,
      });
      return { tetrahedrons: newTetrahedrons };
    });
  },

  updateTetrahedron: (tetrahedronId, updates) => {
    set((state) => {
      const newTetrahedrons = new Map(state.tetrahedrons);
      const currentTetrahedron = newTetrahedrons.get(tetrahedronId);
      if (currentTetrahedron) {
        newTetrahedrons.set(tetrahedronId, {
          ...currentTetrahedron,
          ...updates,
        });
      }
      return { tetrahedrons: newTetrahedrons };
    });
  },

  getTetrahedron: (tetrahedronId) => {
    const state = get();
    return state.tetrahedrons.get(tetrahedronId);
  },

  selectTetrahedron: (tetrahedronId) => {
    set((state) => {
      const newSelected = new Set(state.selectedTetrahedrons);
      newSelected.add(tetrahedronId);
      return { selectedTetrahedrons: newSelected };
    });
  },

  deselectTetrahedron: (tetrahedronId) => {
    set((state) => {
      const newSelected = new Set(state.selectedTetrahedrons);
      newSelected.delete(tetrahedronId);
      return { selectedTetrahedrons: newSelected };
    });
  },

  isTetrahedronSelected: (tetrahedronId) => {
    const state = get();
    return state.selectedTetrahedrons.has(tetrahedronId);
  },

  // Face-specific actions
  setTetrahedronSelectedFace: (tetrahedronId, face) => {
    set((state) => {
      const newTetrahedrons = new Map(state.tetrahedrons);
      const tetrahedron = newTetrahedrons.get(tetrahedronId);
      if (tetrahedron) {
        newTetrahedrons.set(tetrahedronId, {
          ...tetrahedron,
          selectedFace: face,
        });
      }
      return { tetrahedrons: newTetrahedrons };
    });
  },

  setTetrahedronSelectedIndicator: (tetrahedronId, indicator) => {
    set((state) => {
      const newTetrahedrons = new Map(state.tetrahedrons);
      const tetrahedron = newTetrahedrons.get(tetrahedronId);
      if (tetrahedron) {
        newTetrahedrons.set(tetrahedronId, {
          ...tetrahedron,
          selectedIndicator: indicator,
        });
      }
      return { tetrahedrons: newTetrahedrons };
    });
  },

  setTetrahedronShowTransform: (tetrahedronId, show) => {
    set((state) => {
      const newTetrahedrons = new Map(state.tetrahedrons);
      const tetrahedron = newTetrahedrons.get(tetrahedronId);
      if (tetrahedron) {
        newTetrahedrons.set(tetrahedronId, {
          ...tetrahedron,
          showTransform: show,
        });
      }
      return { tetrahedrons: newTetrahedrons };
    });
  },

  setTetrahedronShowHeader: (tetrahedronId, show) => {
    set((state) => {
      const newTetrahedrons = new Map(state.tetrahedrons);
      const tetrahedron = newTetrahedrons.get(tetrahedronId);
      if (tetrahedron) {
        newTetrahedrons.set(tetrahedronId, {
          ...tetrahedron,
          showHeader: show,
        });
      }
      return { tetrahedrons: newTetrahedrons };
    });
  },

  setTetrahedronShowFaceTextInput: (tetrahedronId, show) => {
    set((state) => {
      const newTetrahedrons = new Map(state.tetrahedrons);
      const tetrahedron = newTetrahedrons.get(tetrahedronId);
      if (tetrahedron) {
        newTetrahedrons.set(tetrahedronId, {
          ...tetrahedron,
          showFaceTextInput: show,
        });
      }
      return { tetrahedrons: newTetrahedrons };
    });
  },

  setTetrahedronIsResizing: (tetrahedronId, isResizing) => {
    set((state) => {
      const newTetrahedrons = new Map(state.tetrahedrons);
      const tetrahedron = newTetrahedrons.get(tetrahedronId);
      if (tetrahedron) {
        newTetrahedrons.set(tetrahedronId, { ...tetrahedron, isResizing });
      }
      return { tetrahedrons: newTetrahedrons };
    });
  },

  setTetrahedronShowObjectUI: (tetrahedronId, show) => {
    set((state) => {
      const newTetrahedrons = new Map(state.tetrahedrons);
      const tetrahedron = newTetrahedrons.get(tetrahedronId);
      if (tetrahedron) {
        newTetrahedrons.set(tetrahedronId, {
          ...tetrahedron,
          showObjectUI: show,
        });
      }
      return { tetrahedrons: newTetrahedrons };
    });
  },

  setTetrahedronShowHeaderTextStyleUI: (tetrahedronId, show) => {
    set((state) => {
      const newTetrahedrons = new Map(state.tetrahedrons);
      const tetrahedron = newTetrahedrons.get(tetrahedronId);
      if (tetrahedron) {
        newTetrahedrons.set(tetrahedronId, {
          ...tetrahedron,
          showHeaderTextStyleUI: show,
        });
      }
      return { tetrahedrons: newTetrahedrons };
    });
  },

  // Batch close all style menus - more efficient than iterating from App
  closeAllStyleMenus: () => {
    set((state) => {
      const newTetrahedrons = new Map(state.tetrahedrons);
      let hasChanges = false;
      newTetrahedrons.forEach((tet, id) => {
        if (tet.showHeaderTextStyleUI) {
          newTetrahedrons.set(id, { ...tet, showHeaderTextStyleUI: false });
          hasChanges = true;
        }
      });
      return hasChanges ? { tetrahedrons: newTetrahedrons } : state;
    });
  },

  setTetrahedronActiveTextFace: (tetrahedronId, face) => {
    set((state) => {
      const newTetrahedrons = new Map(state.tetrahedrons);
      const tetrahedron = newTetrahedrons.get(tetrahedronId);
      if (tetrahedron) {
        newTetrahedrons.set(tetrahedronId, {
          ...tetrahedron,
          activeTextFace: face,
        });
      }
      return { tetrahedrons: newTetrahedrons };
    });
  },

  setTetrahedronIsScaleModified: (tetrahedronId, isScaleModified) => {
    set((state) => {
      const newTetrahedrons = new Map(state.tetrahedrons);
      const tetrahedron = newTetrahedrons.get(tetrahedronId);
      if (tetrahedron) {
        newTetrahedrons.set(tetrahedronId, { ...tetrahedron, isScaleModified });
      }
      return { tetrahedrons: newTetrahedrons };
    });
  },

  // Face color update
  updateTetrahedronFaceColor: (tetrahedronId, face, color) => {
    set((state) => {
      const newTetrahedrons = new Map(state.tetrahedrons);
      const tetrahedron = newTetrahedrons.get(tetrahedronId);
      if (tetrahedron) {
        const updatedFaceColors = { ...tetrahedron.faceColors, [face]: color };
        newTetrahedrons.set(tetrahedronId, {
          ...tetrahedron,
          faceColors: updatedFaceColors,
        });
      }
      return { tetrahedrons: newTetrahedrons };
    });
  },

  // Face text update
  updateTetrahedronFaceText: (tetrahedronId, face, text) => {
    set((state) => {
      const newTetrahedrons = new Map(state.tetrahedrons);
      const tetrahedron = newTetrahedrons.get(tetrahedronId);
      if (tetrahedron) {
        const updatedFaceTexts = { ...tetrahedron.faceTexts, [face]: text };
        newTetrahedrons.set(tetrahedronId, {
          ...tetrahedron,
          faceTexts: updatedFaceTexts,
        });
      }
      return { tetrahedrons: newTetrahedrons };
    });
  },

  // Face text style update
  updateTetrahedronFaceTextStyle: (tetrahedronId, face, style) => {
    set((state) => {
      const newTetrahedrons = new Map(state.tetrahedrons);
      const tetrahedron = newTetrahedrons.get(tetrahedronId);
      if (tetrahedron) {
        const currentFaceTextStyles = tetrahedron.faceTextStyles || {};
        const updatedFaceTextStyles = {
          ...currentFaceTextStyles,
          [face]: { ...currentFaceTextStyles[face], ...style },
        };
        newTetrahedrons.set(tetrahedronId, {
          ...tetrahedron,
          faceTextStyles: updatedFaceTextStyles,
        });
      }
      return { tetrahedrons: newTetrahedrons };
    });
  },

  // Transform tracking
  addTransformingTetrahedron: (tetrahedronId) => {
    set((state) => {
      const newTransforming = new Set(state.transformingTetrahedrons);
      newTransforming.add(tetrahedronId);
      return { transformingTetrahedrons: newTransforming };
    });
  },

  removeTransformingTetrahedron: (tetrahedronId) => {
    set((state) => {
      const newTransforming = new Set(state.transformingTetrahedrons);
      newTransforming.delete(tetrahedronId);
      return { transformingTetrahedrons: newTransforming };
    });
  },

  // Clear all tetrahedrons (for cleanup)
  clearAllTetrahedrons: () => {
    set({
      tetrahedrons: new Map(),
      selectedTetrahedrons: new Set(),
      transformingTetrahedrons: new Set(),
    });
  },

  // Delete tetrahedron
  deleteTetrahedron: (tetrahedronId) => {
    set((state) => {
      const newTetrahedrons = new Map(state.tetrahedrons);
      const newSelected = new Set(state.selectedTetrahedrons);
      const newTransforming = new Set(state.transformingTetrahedrons);

      newTetrahedrons.delete(tetrahedronId);
      newSelected.delete(tetrahedronId);
      newTransforming.delete(tetrahedronId);

      return {
        tetrahedrons: newTetrahedrons,
        selectedTetrahedrons: newSelected,
        transformingTetrahedrons: newTransforming,
      };
    });
  },
}));

export default useTetrahedronStore;
