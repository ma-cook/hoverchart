import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';

const useFaceStore = createWithEqualityFn((set, get) => ({
  // State for all faces across all objects
  faces: new Map(), // Map of faceId -> face state
  selectedFaces: new Set(), // Set of selected face IDs
  highlightedFaces: new Set(), // Set of highlighted face IDs
  activeFaces: new Set(), // Set of faces with active UI

  // Actions
  createFace: (faceId, initialState = {}) => {
    set((state) => {
      const newFaces = new Map(state.faces);
      newFaces.set(faceId, {
        id: faceId,
        objectId: null,
        objectType: null, // 'cube', 'dodecahedron', 'plane'
        faceKey: null, // face identifier (e.g., 'front', 'back', 'top', etc.)
        color: null,
        text: '',
        textStyle: {
          fontSize: 0.5,
          color: 'black',
          underline: false,
        },
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        normal: [0, 0, 1],
        isSelected: false,
        isHighlighted: false,
        isActive: false,
        showTextInput: false,
        showColorPicker: false,
        showTextStyleUI: false,
        ...initialState,
      });
      return { faces: newFaces };
    });
  },

  updateFace: (faceId, updates) => {
    set((state) => {
      const newFaces = new Map(state.faces);
      const existing = newFaces.get(faceId);
      if (existing) {
        newFaces.set(faceId, { ...existing, ...updates });
      }
      return { faces: newFaces };
    });
  },

  updateFaceTextStyle: (faceId, style) => {
    const face = get().getFace(faceId);
    if (face) {
      const newTextStyle = { ...face.textStyle, ...style };
      get().updateFace(faceId, { textStyle: newTextStyle });
    }
  },

  deleteFace: (faceId) => {
    set((state) => {
      const newFaces = new Map(state.faces);
      newFaces.delete(faceId);

      const newSelected = new Set(state.selectedFaces);
      newSelected.delete(faceId);

      const newHighlighted = new Set(state.highlightedFaces);
      newHighlighted.delete(faceId);

      const newActive = new Set(state.activeFaces);
      newActive.delete(faceId);

      return {
        faces: newFaces,
        selectedFaces: newSelected,
        highlightedFaces: newHighlighted,
        activeFaces: newActive,
      };
    });
  },

  // Face selection
  selectFace: (faceId) => {
    set((state) => {
      const newSelected = new Set(state.selectedFaces);
      newSelected.add(faceId);
      return { selectedFaces: newSelected };
    });
    get().updateFace(faceId, { isSelected: true });
  },

  deselectFace: (faceId) => {
    set((state) => {
      const newSelected = new Set(state.selectedFaces);
      newSelected.delete(faceId);
      return { selectedFaces: newSelected };
    });
    get().updateFace(faceId, { isSelected: false });
  },

  clearSelectedFaces: () => {
    const { selectedFaces } = get();
    selectedFaces.forEach((faceId) => {
      get().updateFace(faceId, { isSelected: false });
    });
    set({ selectedFaces: new Set() });
  },

  // Face highlighting
  highlightFace: (faceId) => {
    set((state) => {
      const newHighlighted = new Set(state.highlightedFaces);
      newHighlighted.add(faceId);
      return { highlightedFaces: newHighlighted };
    });
    get().updateFace(faceId, { isHighlighted: true });
  },

  unhighlightFace: (faceId) => {
    set((state) => {
      const newHighlighted = new Set(state.highlightedFaces);
      newHighlighted.delete(faceId);
      return { highlightedFaces: newHighlighted };
    });
    get().updateFace(faceId, { isHighlighted: false });
  },

  clearHighlightedFaces: () => {
    const { highlightedFaces } = get();
    highlightedFaces.forEach((faceId) => {
      get().updateFace(faceId, { isHighlighted: false });
    });
    set({ highlightedFaces: new Set() });
  },

  // Face activation (for UI)
  activateFace: (faceId) => {
    set((state) => {
      const newActive = new Set(state.activeFaces);
      newActive.add(faceId);
      return { activeFaces: newActive };
    });
    get().updateFace(faceId, { isActive: true });
  },

  deactivateFace: (faceId) => {
    set((state) => {
      const newActive = new Set(state.activeFaces);
      newActive.delete(faceId);
      return { activeFaces: newActive };
    });
    get().updateFace(faceId, { isActive: false });
  },

  clearActiveFaces: () => {
    const { activeFaces } = get();
    activeFaces.forEach((faceId) => {
      get().updateFace(faceId, { isActive: false });
    });
    set({ activeFaces: new Set() });
  },

  // UI state actions
  setFaceShowTextInput: (faceId, show) => {
    get().updateFace(faceId, { showTextInput: show });
  },

  setFaceShowColorPicker: (faceId, show) => {
    get().updateFace(faceId, { showColorPicker: show });
  },

  setFaceShowTextStyleUI: (faceId, show) => {
    get().updateFace(faceId, { showTextStyleUI: show });
  },

  // Bulk operations by object
  getFacesByObject: (objectId) => {
    const { faces } = get();
    return Array.from(faces.values()).filter(
      (face) => face.objectId === objectId
    );
  },

  getFacesByObjectType: (objectType) => {
    const { faces } = get();
    return Array.from(faces.values()).filter(
      (face) => face.objectType === objectType
    );
  },

  deleteFacesByObject: (objectId) => {
    const facesToDelete = get().getFacesByObject(objectId);
    facesToDelete.forEach((face) => {
      get().deleteFace(face.id);
    });
  },

  updateFacesByObject: (objectId, updates) => {
    const facesToUpdate = get().getFacesByObject(objectId);
    facesToUpdate.forEach((face) => {
      get().updateFace(face.id, updates);
    });
  },

  // Utility functions for face ID generation
  generateFaceId: (objectId, faceKey) => {
    return `${objectId}_${faceKey}`;
  },

  // Selectors
  getFace: (faceId) => {
    return get().faces.get(faceId);
  },

  isFaceSelected: (faceId) => {
    return get().selectedFaces.has(faceId);
  },

  isFaceHighlighted: (faceId) => {
    return get().highlightedFaces.has(faceId);
  },

  isFaceActive: (faceId) => {
    return get().activeFaces.has(faceId);
  },

  getAllFaces: () => {
    return Array.from(get().faces.values());
  },

  getSelectedFaces: () => {
    const { faces, selectedFaces } = get();
    return Array.from(selectedFaces)
      .map((id) => faces.get(id))
      .filter(Boolean);
  },

  getHighlightedFaces: () => {
    const { faces, highlightedFaces } = get();
    return Array.from(highlightedFaces)
      .map((id) => faces.get(id))
      .filter(Boolean);
  },

  getActiveFaces: () => {
    const { faces, activeFaces } = get();
    return Array.from(activeFaces)
      .map((id) => faces.get(id))
      .filter(Boolean);
  },
}));

export default useFaceStore;
