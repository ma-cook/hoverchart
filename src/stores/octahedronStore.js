import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';

const useOctahedronStore = createWithEqualityFn((set, get) => ({
  octahedrons: new Map(),
  selectedOctahedrons: new Set(),
  transformingOctahedrons: new Set(),

  createOctahedron: (octahedronId, initialState = {}) => {
    set((state) => {
      const newOctahedrons = new Map(state.octahedrons);
      newOctahedrons.set(octahedronId, {
        id: octahedronId,
        position: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#000000',
        faceColors: {},
        faceTexts: {},
        headerText: '',
        textStyle: { fontSize: 1.5, color: 'black', underline: false },
        faceTextStyles: {
          f0: { fontSize: 0.5, color: 'black', underline: false },
          f1: { fontSize: 0.5, color: 'black', underline: false },
          f2: { fontSize: 0.5, color: 'black', underline: false },
          f3: { fontSize: 0.5, color: 'black', underline: false },
          f4: { fontSize: 0.5, color: 'black', underline: false },
          f5: { fontSize: 0.5, color: 'black', underline: false },
          f6: { fontSize: 0.5, color: 'black', underline: false },
          f7: { fontSize: 0.5, color: 'black', underline: false },
        },
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
        isScaleModified: false,
        ...initialState,
      });
      return { octahedrons: newOctahedrons };
    });
  },

  updateOctahedron: (octahedronId, updates) => {
    set((state) => {
      const newOctahedrons = new Map(state.octahedrons);
      const currentOctahedron = newOctahedrons.get(octahedronId);
      if (currentOctahedron) {
        newOctahedrons.set(octahedronId, {
          ...currentOctahedron,
          ...updates,
        });
      }
      return { octahedrons: newOctahedrons };
    });
  },

  getOctahedron: (octahedronId) => {
    const state = get();
    return state.octahedrons.get(octahedronId);
  },

  selectOctahedron: (octahedronId) => {
    set((state) => {
      const newSelected = new Set(state.selectedOctahedrons);
      newSelected.add(octahedronId);
      return { selectedOctahedrons: newSelected };
    });
  },

  deselectOctahedron: (octahedronId) => {
    set((state) => {
      const newSelected = new Set(state.selectedOctahedrons);
      newSelected.delete(octahedronId);
      return { selectedOctahedrons: newSelected };
    });
  },

  isOctahedronSelected: (octahedronId) => {
    const state = get();
    return state.selectedOctahedrons.has(octahedronId);
  },

  setOctahedronSelectedFace: (octahedronId, face) => {
    set((state) => {
      const newOctahedrons = new Map(state.octahedrons);
      const octahedron = newOctahedrons.get(octahedronId);
      if (octahedron) {
        newOctahedrons.set(octahedronId, { ...octahedron, selectedFace: face });
      }
      return { octahedrons: newOctahedrons };
    });
  },

  setOctahedronSelectedIndicator: (octahedronId, indicator) => {
    set((state) => {
      const newOctahedrons = new Map(state.octahedrons);
      const octahedron = newOctahedrons.get(octahedronId);
      if (octahedron) {
        newOctahedrons.set(octahedronId, { ...octahedron, selectedIndicator: indicator });
      }
      return { octahedrons: newOctahedrons };
    });
  },

  setOctahedronShowTransform: (octahedronId, show) => {
    set((state) => {
      const newOctahedrons = new Map(state.octahedrons);
      const octahedron = newOctahedrons.get(octahedronId);
      if (octahedron) {
        newOctahedrons.set(octahedronId, { ...octahedron, showTransform: show });
      }
      return { octahedrons: newOctahedrons };
    });
  },

  setOctahedronShowHeader: (octahedronId, show) => {
    set((state) => {
      const newOctahedrons = new Map(state.octahedrons);
      const octahedron = newOctahedrons.get(octahedronId);
      if (octahedron) {
        newOctahedrons.set(octahedronId, { ...octahedron, showHeader: show });
      }
      return { octahedrons: newOctahedrons };
    });
  },

  setOctahedronShowFaceTextInput: (octahedronId, show) => {
    set((state) => {
      const newOctahedrons = new Map(state.octahedrons);
      const octahedron = newOctahedrons.get(octahedronId);
      if (octahedron) {
        newOctahedrons.set(octahedronId, { ...octahedron, showFaceTextInput: show });
      }
      return { octahedrons: newOctahedrons };
    });
  },

  setOctahedronIsResizing: (octahedronId, isResizing) => {
    set((state) => {
      const newOctahedrons = new Map(state.octahedrons);
      const octahedron = newOctahedrons.get(octahedronId);
      if (octahedron) {
        newOctahedrons.set(octahedronId, { ...octahedron, isResizing });
      }
      return { octahedrons: newOctahedrons };
    });
  },

  setOctahedronShowObjectUI: (octahedronId, show) => {
    set((state) => {
      const newOctahedrons = new Map(state.octahedrons);
      const octahedron = newOctahedrons.get(octahedronId);
      if (octahedron) {
        newOctahedrons.set(octahedronId, { ...octahedron, showObjectUI: show });
      }
      return { octahedrons: newOctahedrons };
    });
  },

  setOctahedronShowHeaderTextStyleUI: (octahedronId, show) => {
    set((state) => {
      const newOctahedrons = new Map(state.octahedrons);
      const octahedron = newOctahedrons.get(octahedronId);
      if (octahedron) {
        newOctahedrons.set(octahedronId, { ...octahedron, showHeaderTextStyleUI: show });
      }
      return { octahedrons: newOctahedrons };
    });
  },

  closeAllStyleMenus: () => {
    set((state) => {
      const newOctahedrons = new Map(state.octahedrons);
      let hasChanges = false;
      newOctahedrons.forEach((oct, id) => {
        if (oct.showHeaderTextStyleUI) {
          newOctahedrons.set(id, { ...oct, showHeaderTextStyleUI: false });
          hasChanges = true;
        }
      });
      return hasChanges ? { octahedrons: newOctahedrons } : state;
    });
  },

  setOctahedronActiveTextFace: (octahedronId, face) => {
    set((state) => {
      const newOctahedrons = new Map(state.octahedrons);
      const octahedron = newOctahedrons.get(octahedronId);
      if (octahedron) {
        newOctahedrons.set(octahedronId, { ...octahedron, activeTextFace: face });
      }
      return { octahedrons: newOctahedrons };
    });
  },

  setOctahedronIsScaleModified: (octahedronId, isModified) => {
    set((state) => {
      const newOctahedrons = new Map(state.octahedrons);
      const octahedron = newOctahedrons.get(octahedronId);
      if (octahedron) {
        newOctahedrons.set(octahedronId, { ...octahedron, isScaleModified: isModified });
      }
      return { octahedrons: newOctahedrons };
    });
  },

  updateOctahedronFaceColor: (octahedronId, face, color) => {
    set((state) => {
      const newOctahedrons = new Map(state.octahedrons);
      const octahedron = newOctahedrons.get(octahedronId);
      if (octahedron) {
        const updatedFaceColors = { ...octahedron.faceColors, [face]: color };
        newOctahedrons.set(octahedronId, { ...octahedron, faceColors: updatedFaceColors });
      }
      return { octahedrons: newOctahedrons };
    });
  },

  updateOctahedronFaceText: (octahedronId, face, text) => {
    set((state) => {
      const newOctahedrons = new Map(state.octahedrons);
      const octahedron = newOctahedrons.get(octahedronId);
      if (octahedron) {
        const updatedFaceTexts = { ...octahedron.faceTexts, [face]: text };
        newOctahedrons.set(octahedronId, { ...octahedron, faceTexts: updatedFaceTexts });
      }
      return { octahedrons: newOctahedrons };
    });
  },

  updateOctahedronFaceTextStyle: (octahedronId, face, style) => {
    set((state) => {
      const newOctahedrons = new Map(state.octahedrons);
      const octahedron = newOctahedrons.get(octahedronId);
      if (octahedron) {
        const currentFaceTextStyles = octahedron.faceTextStyles || {};
        const updatedFaceTextStyles = {
          ...currentFaceTextStyles,
          [face]: { ...currentFaceTextStyles[face], ...style },
        };
        newOctahedrons.set(octahedronId, { ...octahedron, faceTextStyles: updatedFaceTextStyles });
      }
      return { octahedrons: newOctahedrons };
    });
  },

  addTransformingOctahedron: (octahedronId) => {
    set((state) => {
      const newTransforming = new Set(state.transformingOctahedrons);
      newTransforming.add(octahedronId);
      return { transformingOctahedrons: newTransforming };
    });
  },

  removeTransformingOctahedron: (octahedronId) => {
    set((state) => {
      const newTransforming = new Set(state.transformingOctahedrons);
      newTransforming.delete(octahedronId);
      return { transformingOctahedrons: newTransforming };
    });
  },

  clearAllOctahedrons: () => {
    set({
      octahedrons: new Map(),
      selectedOctahedrons: new Set(),
      transformingOctahedrons: new Set(),
    });
  },

  deleteOctahedron: (octahedronId) => {
    set((state) => {
      const newOctahedrons = new Map(state.octahedrons);
      const newSelected = new Set(state.selectedOctahedrons);
      const newTransforming = new Set(state.transformingOctahedrons);
      newOctahedrons.delete(octahedronId);
      newSelected.delete(octahedronId);
      newTransforming.delete(octahedronId);
      return {
        octahedrons: newOctahedrons,
        selectedOctahedrons: newSelected,
        transformingOctahedrons: newTransforming,
      };
    });
  },
}));

export default useOctahedronStore;
