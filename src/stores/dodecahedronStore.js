import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';

const useDodecahedronStore = createWithEqualityFn((set, get) => ({
  // State for all dodecahedrons
  dodecahedrons: new Map(), // Map of dodecahedronId -> dodecahedron state
  selectedDodecahedrons: new Set(), // Set of selected dodecahedron IDs
  transformingDodecahedrons: new Set(), // Set of dodecahedrons currently being transformed

  // Actions
  createDodecahedron: (dodecahedronId, initialState = {}) => {
    set((state) => {
      const newDodecahedrons = new Map(state.dodecahedrons);
      newDodecahedrons.set(dodecahedronId, {
        id: dodecahedronId,
        position: [0, 0, 0],
        scale: [1, 1, 1],
        headerText: '',
        headerStyle: {
          fontSize: 'medium',
          color: 'black',
          underline: false,
        },
        lineColor: 'black',
        faceColors: {},
        faceTexts: {},
        faceTextStyles: {},
        showTransform: false,
        showHeader: false,
        isResizing: false,
        highlightedFaces: new Set(),
        showStyleMenu: false,
        activeFace: null,
        showFaceUI: false,
        showObjectUI: true,
        showFaceTextInput: false,
        activeFaceText: null,
        showFaceTextStyleMenu: false,
        selectedIndicator: null,
        isConnected: false,
        connectedFaces: new Set(),
        showSnapLine: false,
        snapLinePoints: [],
        snapAxis: null,
        isScaleModified: false,
        ...initialState,
      });
      return { dodecahedrons: newDodecahedrons };
    });
  },

  updateDodecahedron: (dodecahedronId, updates) => {
    set((state) => {
      const newDodecahedrons = new Map(state.dodecahedrons);
      const existing = newDodecahedrons.get(dodecahedronId);
      if (existing) {
        newDodecahedrons.set(dodecahedronId, { ...existing, ...updates });
      }
      return { dodecahedrons: newDodecahedrons };
    });
  },

  updateDodecahedronFaceColor: (dodecahedronId, face, color) => {
    set((state) => {
      const newDodecahedrons = new Map(state.dodecahedrons);
      const existing = newDodecahedrons.get(dodecahedronId);
      if (existing) {
        const newFaceColors = { ...existing.faceColors, [face]: color };
        newDodecahedrons.set(dodecahedronId, {
          ...existing,
          faceColors: newFaceColors,
        });
      }
      return { dodecahedrons: newDodecahedrons };
    });
  },

  updateDodecahedronFaceText: (dodecahedronId, face, text) => {
    set((state) => {
      const newDodecahedrons = new Map(state.dodecahedrons);
      const existing = newDodecahedrons.get(dodecahedronId);
      if (existing) {
        const newFaceTexts = { ...existing.faceTexts, [face]: text };
        newDodecahedrons.set(dodecahedronId, {
          ...existing,
          faceTexts: newFaceTexts,
        });
      }
      return { dodecahedrons: newDodecahedrons };
    });
  },

  updateDodecahedronFaceTextStyle: (dodecahedronId, face, style) => {
    set((state) => {
      const newDodecahedrons = new Map(state.dodecahedrons);
      const existing = newDodecahedrons.get(dodecahedronId);
      if (existing) {
        const newFaceTextStyles = {
          ...existing.faceTextStyles,
          [face]: { ...existing.faceTextStyles[face], ...style },
        };
        newDodecahedrons.set(dodecahedronId, {
          ...existing,
          faceTextStyles: newFaceTextStyles,
        });
      }
      return { dodecahedrons: newDodecahedrons };
    });
  },

  deleteDodecahedron: (dodecahedronId) => {
    set((state) => {
      const newDodecahedrons = new Map(state.dodecahedrons);
      newDodecahedrons.delete(dodecahedronId);

      const newSelected = new Set(state.selectedDodecahedrons);
      newSelected.delete(dodecahedronId);

      const newTransforming = new Set(state.transformingDodecahedrons);
      newTransforming.delete(dodecahedronId);

      return {
        dodecahedrons: newDodecahedrons,
        selectedDodecahedrons: newSelected,
        transformingDodecahedrons: newTransforming,
      };
    });
  },

  selectDodecahedron: (dodecahedronId) => {
    set((state) => {
      const newSelected = new Set(state.selectedDodecahedrons);
      newSelected.add(dodecahedronId);
      return { selectedDodecahedrons: newSelected };
    });
  },

  deselectDodecahedron: (dodecahedronId) => {
    set((state) => {
      const newSelected = new Set(state.selectedDodecahedrons);
      newSelected.delete(dodecahedronId);
      return { selectedDodecahedrons: newSelected };
    });
  },

  clearSelectedDodecahedrons: () => {
    set({ selectedDodecahedrons: new Set() });
  },

  setTransformingDodecahedron: (dodecahedronId, isTransforming) => {
    set((state) => {
      const newTransforming = new Set(state.transformingDodecahedrons);
      if (isTransforming) {
        newTransforming.add(dodecahedronId);
      } else {
        newTransforming.delete(dodecahedronId);
      }
      return { transformingDodecahedrons: newTransforming };
    });
  },

  // Face management
  setDodecahedronHighlightedFaces: (dodecahedronId, faces) => {
    get().updateDodecahedron(dodecahedronId, {
      highlightedFaces: new Set(faces),
    });
  },

  addDodecahedronHighlightedFace: (dodecahedronId, face) => {
    const dodecahedron = get().getDodecahedron(dodecahedronId);
    if (dodecahedron) {
      const newHighlighted = new Set(dodecahedron.highlightedFaces);
      newHighlighted.add(face);
      get().updateDodecahedron(dodecahedronId, {
        highlightedFaces: newHighlighted,
      });
    }
  },

  removeDodecahedronHighlightedFace: (dodecahedronId, face) => {
    const dodecahedron = get().getDodecahedron(dodecahedronId);
    if (dodecahedron) {
      const newHighlighted = new Set(dodecahedron.highlightedFaces);
      newHighlighted.delete(face);
      get().updateDodecahedron(dodecahedronId, {
        highlightedFaces: newHighlighted,
      });
    }
  },

  setDodecahedronConnectedFaces: (dodecahedronId, faces) => {
    get().updateDodecahedron(dodecahedronId, {
      connectedFaces: new Set(faces),
    });
  },

  addDodecahedronConnectedFace: (dodecahedronId, face) => {
    const dodecahedron = get().getDodecahedron(dodecahedronId);
    if (dodecahedron) {
      const newConnected = new Set(dodecahedron.connectedFaces);
      newConnected.add(face);
      get().updateDodecahedron(dodecahedronId, {
        connectedFaces: newConnected,
      });
    }
  },

  removeDodecahedronConnectedFace: (dodecahedronId, face) => {
    const dodecahedron = get().getDodecahedron(dodecahedronId);
    if (dodecahedron) {
      const newConnected = new Set(dodecahedron.connectedFaces);
      newConnected.delete(face);
      get().updateDodecahedron(dodecahedronId, {
        connectedFaces: newConnected,
      });
    }
  },

  // UI state actions
  setDodecahedronShowTransform: (dodecahedronId, show) => {
    get().updateDodecahedron(dodecahedronId, { showTransform: show });
  },

  setDodecahedronShowHeader: (dodecahedronId, show) => {
    get().updateDodecahedron(dodecahedronId, { showHeader: show });
  },

  setDodecahedronIsResizing: (dodecahedronId, isResizing) => {
    get().updateDodecahedron(dodecahedronId, { isResizing });
  },

  setDodecahedronShowStyleMenu: (dodecahedronId, show) => {
    get().updateDodecahedron(dodecahedronId, { showStyleMenu: show });
  },

  setDodecahedronActiveFace: (dodecahedronId, face) => {
    get().updateDodecahedron(dodecahedronId, { activeFace: face });
  },

  setDodecahedronShowFaceUI: (dodecahedronId, show) => {
    get().updateDodecahedron(dodecahedronId, { showFaceUI: show });
  },

  setDodecahedronShowObjectUI: (dodecahedronId, show) => {
    get().updateDodecahedron(dodecahedronId, { showObjectUI: show });
  },

  setDodecahedronShowFaceTextInput: (dodecahedronId, show) => {
    get().updateDodecahedron(dodecahedronId, { showFaceTextInput: show });
  },

  setDodecahedronActiveFaceText: (dodecahedronId, face) => {
    get().updateDodecahedron(dodecahedronId, { activeFaceText: face });
  },

  setDodecahedronShowFaceTextStyleMenu: (dodecahedronId, show) => {
    get().updateDodecahedron(dodecahedronId, { showFaceTextStyleMenu: show });
  },

  // Batch close all style menus - more efficient than iterating from App
  closeAllStyleMenus: () => {
    const { dodecahedrons, updateDodecahedron } = get();
    dodecahedrons.forEach((dod, id) => {
      if (dod.showStyleMenu || dod.showFaceTextStyleMenu) {
        updateDodecahedron(id, { showStyleMenu: false, showFaceTextStyleMenu: false });
      }
    });
  },

  setDodecahedronSelectedIndicator: (dodecahedronId, indicator) => {
    get().updateDodecahedron(dodecahedronId, { selectedIndicator: indicator });
  },

  setDodecahedronIsConnected: (dodecahedronId, isConnected) => {
    get().updateDodecahedron(dodecahedronId, { isConnected });
  },

  setDodecahedronIsScaleModified: (dodecahedronId, isModified) => {
    get().updateDodecahedron(dodecahedronId, { isScaleModified: isModified });
  },

  // Selectors
  getDodecahedron: (dodecahedronId) => {
    return get().dodecahedrons.get(dodecahedronId);
  },

  isDodecahedronSelected: (dodecahedronId) => {
    return get().selectedDodecahedrons.has(dodecahedronId);
  },

  isDodecahedronTransforming: (dodecahedronId) => {
    return get().transformingDodecahedrons.has(dodecahedronId);
  },

  getAllDodecahedrons: () => {
    return Array.from(get().dodecahedrons.values());
  },

  getSelectedDodecahedrons: () => {
    const { dodecahedrons, selectedDodecahedrons } = get();
    return Array.from(selectedDodecahedrons)
      .map((id) => dodecahedrons.get(id))
      .filter(Boolean);
  },
}));

export default useDodecahedronStore;
