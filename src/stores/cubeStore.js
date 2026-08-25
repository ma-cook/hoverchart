import { createWithEqualityFn } from 'zustand/traditional';
import importPerf from '../utils/importPerf';

// Selector cache to avoid creating new selector functions on every render
const selectorCache = new Map();

// Get or create a cached selector for a specific cube
export const getCubeSelector = (cubeId) => {
  if (!selectorCache.has(cubeId)) {
    selectorCache.set(cubeId, (state) => state.cubes.get(cubeId));
  }
  return selectorCache.get(cubeId);
};

// Get or create a cached selector for cube face color
export const getCubeFaceColorSelector = (cubeId, faceName) => {
  const key = `${cubeId}-${faceName}-color`;
  if (!selectorCache.has(key)) {
    selectorCache.set(
      key,
      (state) => state.cubes.get(cubeId)?.faceColors?.[faceName]
    );
  }
  return selectorCache.get(key);
};

// Get or create a cached selector for cube selected face
export const getCubeSelectedFaceSelector = (cubeId, faceName) => {
  const key = `${cubeId}-${faceName}-selected`;
  if (!selectorCache.has(key)) {
    selectorCache.set(
      key,
      (state) => state.cubes.get(cubeId)?.selectedFace === faceName
    );
  }
  return selectorCache.get(key);
};

// PERFORMANCE OPTIMIZATION: Combined selector for face state
// Returns { faceColor, isSelected } in a single subscription instead of two
// This reduces subscriptions from 12 per cube (6 faces × 2) to 6 per cube
export const getCubeFaceStateSelector = (cubeId, faceName) => {
  const key = `${cubeId}-${faceName}-state`;
  if (!selectorCache.has(key)) {
    selectorCache.set(key, (state) => {
      const cube = state.cubes.get(cubeId);
      return {
        faceColor: cube?.faceColors?.[faceName],
        isSelected: cube?.selectedFace === faceName,
      };
    });
  }
  return selectorCache.get(key);
};

const useCubeStore = createWithEqualityFn((set, get) => ({
  // State for all cubes
  cubes: new Map(), // Map of cubeId -> cube state
  selectedCubes: new Set(), // Set of selected cube IDs
  transformingCubes: new Set(), // Set of cubes currently being transformed
  _unmodifiedVersion: 0, // Version counter bumped only when unmodified-relevant data changes

  // Actions
  createCube: (cubeId, initialState = {}) => {
    if (!importPerf.enabled) return get()._createCubeImpl(cubeId, initialState);
    importPerf.begin('createCube');
    try {
      return get()._createCubeImpl(cubeId, initialState);
    } finally {
      importPerf.end('createCube');
    }
  },

  _createCubeImpl: (cubeId, initialState = {}) => {
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
      // PERF FIX: do NOT bump _unmodifiedVersion here.  Creating a cube never
      // changes the unmodified status of EXISTING cubes; consumers that need
      // to learn about the new cube already re-run per mount batch via the
      // cubes-array identity.  The old bump forced a full O(mounted-cubes)
      // rebuild of unmodifiedCubeIds + instanced refilters on EVERY mount.
      return { cubes: newCubes };
    });
  },

  updateCube: (cubeId, updates) => {
    if (!importPerf.enabled) return get()._updateCubeImpl(cubeId, updates);
    importPerf.begin('updateCube');
    try {
      return get()._updateCubeImpl(cubeId, updates);
    } finally {
      importPerf.end('updateCube');
    }
  },

  _updateCubeImpl: (cubeId, updates) => {
    set((state) => {
      const existing = state.cubes.get(cubeId);
      if (!existing) return state;

      // PERF FIX: no-op detection BEFORE cloning the Map.  During imports
      // thousands of freshly-mounted cubes fire reset-selection writes that
      // are semantically no-ops; previously each one cloned the ENTIRE cubes
      // Map and notified every mounted Cube's subscriptions — O(mounted) per
      // write, ~7 writes per mount, i.e. the main quadratic freeze driver.
      // Returning `state` itself makes zustand skip merge + notify entirely.
      let changed = false;
      for (const k in updates) {
        if (!Object.is(existing[k], updates[k])) {
          changed = true;
          break;
        }
      }
      if (!changed) return state;

      const newCubes = new Map(state.cubes);
      newCubes.set(cubeId, { ...existing, ...updates });

      const relevantKeys = ['faceColors', 'faceTexts', 'headerText'];
      const hasRelevantChange =
        relevantKeys.some((k) => k in updates && !Object.is(existing[k], updates[k]));
      return {
        cubes: newCubes,
        _unmodifiedVersion: hasRelevantChange
          ? state._unmodifiedVersion + 1
          : state._unmodifiedVersion,
      };
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
      return { cubes: newCubes, _unmodifiedVersion: state._unmodifiedVersion + 1 };
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
      return { cubes: newCubes, _unmodifiedVersion: state._unmodifiedVersion + 1 };
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
      return { cubes: newCubes, _unmodifiedVersion: state._unmodifiedVersion + 1 };
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
        _unmodifiedVersion: state._unmodifiedVersion + 1,
      };
    });
  },

  selectCube: (cubeId) => {
    set((state) => {
      if (state.selectedCubes.has(cubeId)) return state; // PERF: no-op guard
      const newSelected = new Set(state.selectedCubes);
      newSelected.add(cubeId);
      return { selectedCubes: newSelected };
    });
  },

  deselectCube: (cubeId) => {
    set((state) => {
      if (!state.selectedCubes.has(cubeId)) return state; // PERF: no-op guard
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
      // PERF: no-op guard — avoids Set clone + notify during mount storms
      if (state.transformingCubes.has(cubeId) === isTransforming) return state;
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

  // Batch close all style menus - more efficient than iterating from App
  closeAllStyleMenus: () => {
    const { cubes, updateCube } = get();
    cubes.forEach((cube, id) => {
      if (cube.showHeaderTextStyleUI) {
        updateCube(id, { showHeaderTextStyleUI: false });
      }
    });
  },

  setCubeActiveTextFace: (cubeId, face) => {
    get().updateCube(cubeId, { activeTextFace: face });
  },

  setCubeIsScaleModified: (cubeId, isModified) => {
    set((state) => {
      const existing = state.cubes.get(cubeId);
      // PERF: no-op guard
      if (!existing || Object.is(existing.isScaleModified, isModified)) {
        return state;
      }
      const newCubes = new Map(state.cubes);
      newCubes.set(cubeId, { ...existing, isScaleModified: isModified });
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
