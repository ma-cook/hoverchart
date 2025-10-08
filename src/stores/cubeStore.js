import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';

const useCubeStore = createWithEqualityFn((set, get) => ({
  // State for all cubes
  cubes: new Map(), // Map of cubeId -> cube state
  selectedCubes: new Set(), // Set of selected cube IDs
  transformingCubes: new Set(), // Set of cubes currently being transformed

  // Actions
  createCube: (cubeId, initialState = {}) => {
    set((state) => {
      const newCubes = new Map(state.cubes);
      newCubes.set(cubeId, {
        id: cubeId,
        position: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#000000',
        faceColors: {},
        faceTexts: {},
        headerText: '',
        textStyle: { fontSize: 1.5, color: 'black', underline: false },
        faceTextStyles: {
          front: { fontSize: 0.5, color: 'black', underline: false },
          back: { fontSize: 0.5, color: 'black', underline: false },
          top: { fontSize: 0.5, color: 'black', underline: false },
          bottom: { fontSize: 0.5, color: 'black', underline: false },
          right: { fontSize: 0.5, color: 'black', underline: false },
          left: { fontSize: 0.5, color: 'black', underline: false },
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
      return { cubes: newCubes };
    });
  },

  updateCube: (cubeId, updates) => {
    set((state) => {
      const newCubes = new Map(state.cubes);
      const existing = newCubes.get(cubeId);
      if (existing) {
        newCubes.set(cubeId, { ...existing, ...updates });
      }
      return { cubes: newCubes };
    });
  },

  updateCubeFaceColor: (cubeId, face, color) => {
    set((state) => {
      const newCubes = new Map(state.cubes);
      const existing = newCubes.get(cubeId);
      if (existing) {
        const newFaceColors = { ...existing.faceColors, [face]: color };
        newCubes.set(cubeId, { ...existing, faceColors: newFaceColors });
      }
      return { cubes: newCubes };
    });
  },

  updateCubeFaceText: (cubeId, face, text) => {
    set((state) => {
      const newCubes = new Map(state.cubes);
      const existing = newCubes.get(cubeId);
      if (existing) {
        const newFaceTexts = { ...existing.faceTexts, [face]: text };
        newCubes.set(cubeId, { ...existing, faceTexts: newFaceTexts });
      }
      return { cubes: newCubes };
    });
  },

  updateCubeFaceTextStyle: (cubeId, face, style) => {
    set((state) => {
      const newCubes = new Map(state.cubes);
      const existing = newCubes.get(cubeId);
      if (existing) {
        const newFaceTextStyles = {
          ...existing.faceTextStyles,
          [face]: { ...existing.faceTextStyles[face], ...style },
        };
        newCubes.set(cubeId, {
          ...existing,
          faceTextStyles: newFaceTextStyles,
        });
      }
      return { cubes: newCubes };
    });
  },

  deleteCube: (cubeId) => {
    set((state) => {
      const newCubes = new Map(state.cubes);
      newCubes.delete(cubeId);

      const newSelected = new Set(state.selectedCubes);
      newSelected.delete(cubeId);

      const newTransforming = new Set(state.transformingCubes);
      newTransforming.delete(cubeId);

      return {
        cubes: newCubes,
        selectedCubes: newSelected,
        transformingCubes: newTransforming,
      };
    });
  },

  selectCube: (cubeId) => {
    set((state) => {
      const newSelected = new Set(state.selectedCubes);
      newSelected.add(cubeId);
      return { selectedCubes: newSelected };
    });
  },

  deselectCube: (cubeId) => {
    set((state) => {
      const newSelected = new Set(state.selectedCubes);
      newSelected.delete(cubeId);
      return { selectedCubes: newSelected };
    });
  },

  clearSelectedCubes: () => {
    set({ selectedCubes: new Set() });
  },

  setTransformingCube: (cubeId, isTransforming) => {
    set((state) => {
      const newTransforming = new Set(state.transformingCubes);
      if (isTransforming) {
        newTransforming.add(cubeId);
      } else {
        newTransforming.delete(cubeId);
      }
      return { transformingCubes: newTransforming };
    });
  },

  // UI state actions
  setCubeSelectedFace: (cubeId, face) => {
    get().updateCube(cubeId, { selectedFace: face });
  },

  setCubeSelectedIndicator: (cubeId, indicator) => {
    get().updateCube(cubeId, { selectedIndicator: indicator });
  },

  setCubeShowTransform: (cubeId, show) => {
    get().updateCube(cubeId, { showTransform: show });
  },

  setCubeShowHeader: (cubeId, show) => {
    get().updateCube(cubeId, { showHeader: show });
  },

  setCubeShowFaceTextInput: (cubeId, show) => {
    get().updateCube(cubeId, { showFaceTextInput: show });
  },

  setCubeIsResizing: (cubeId, isResizing) => {
    get().updateCube(cubeId, { isResizing });
  },

  setCubeShowObjectUI: (cubeId, show) => {
    get().updateCube(cubeId, { showObjectUI: show });
  },

  setCubeShowHeaderTextStyleUI: (cubeId, show) => {
    get().updateCube(cubeId, { showHeaderTextStyleUI: show });
  },

  setCubeActiveTextFace: (cubeId, face) => {
    get().updateCube(cubeId, { activeTextFace: face });
  },

  setCubeIsScaleModified: (cubeId, isModified) => {
    set((state) => {
      const newCubes = new Map(state.cubes);
      const existing = newCubes.get(cubeId);
      if (existing) {
        newCubes.set(cubeId, { ...existing, isScaleModified: isModified });
      }
      return { cubes: newCubes };
    });
  },

  // Selectors
  getCube: (cubeId) => {
    return get().cubes.get(cubeId);
  },

  isCubeSelected: (cubeId) => {
    return get().selectedCubes.has(cubeId);
  },

  isCubeTransforming: (cubeId) => {
    return get().transformingCubes.has(cubeId);
  },

  getAllCubes: () => {
    return Array.from(get().cubes.values());
  },

  getSelectedCubes: () => {
    const { cubes, selectedCubes } = get();
    return Array.from(selectedCubes)
      .map((id) => cubes.get(id))
      .filter(Boolean);
  },
}));

export default useCubeStore;
