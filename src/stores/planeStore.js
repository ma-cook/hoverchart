import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';

const usePlaneStore = createWithEqualityFn((set, get) => ({
  // State for all planes
  planes: new Map(), // Map of planeId -> plane state
  selectedPlanes: new Set(), // Set of selected plane IDs
  transformingPlanes: new Set(), // Set of planes currently being transformed

  // Actions
  createPlane: (planeId, initialState = {}) => {
    set((state) => {
      const newPlanes = new Map(state.planes);
      newPlanes.set(planeId, {
        id: planeId,
        position: [0, 0, 0],
        scale: [1, 1, 1],
        color: 'white', // Default to white instead of null to prevent black default
        headerText: '',
        borderStyle: 'solid',
        borderColor: 'black',
        lineThickness: 1,
        headerStyle: {
          fontSize: 1.5,
          color: 'black',
          underline: false,
        },
        faceText: '',
        faceTextStyle: {
          fontSize: 0.5,
          color: 'black',
          underline: false,
        },
        imageUrl: null,
        webcamActive: false,
        webcamInitialized: false,
        screenShareActive: false,
        screenShareInitialized: false,
        showUI: false,
        showTextInput: false,
        showTextStyleUI: false,
        showSnapLine: false,
        snapLinePoints: [],
        snapAxis: null,
        showTransform: false,
        isResizing: false,
        showHeader: false,
        showHeaderStyleUI: false,
        indicatorSelected: false,
        isBroadcasting: false,
        isViewingBroadcast: false,
        isScreenSharing: false,
        broadcastInfo: null,
        viewerCount: 0,
        imageTexture: null,
        isUploadingImage: false,
        ...initialState,
      });
      return { planes: newPlanes };
    });
  },

  updatePlane: (planeId, updates) => {
    set((state) => {
      const newPlanes = new Map(state.planes);
      const existing = newPlanes.get(planeId);
      if (existing) {
        newPlanes.set(planeId, { ...existing, ...updates });
      }
      return { planes: newPlanes };
    });
  },

  deletePlane: (planeId) => {
    set((state) => {
      const newPlanes = new Map(state.planes);
      newPlanes.delete(planeId);

      const newSelected = new Set(state.selectedPlanes);
      newSelected.delete(planeId);

      const newTransforming = new Set(state.transformingPlanes);
      newTransforming.delete(planeId);

      return {
        planes: newPlanes,
        selectedPlanes: newSelected,
        transformingPlanes: newTransforming,
      };
    });
  },

  selectPlane: (planeId) => {
    set((state) => {
      const newSelected = new Set(state.selectedPlanes);
      newSelected.add(planeId);
      return { selectedPlanes: newSelected };
    });
  },

  deselectPlane: (planeId) => {
    set((state) => {
      const newSelected = new Set(state.selectedPlanes);
      newSelected.delete(planeId);
      return { selectedPlanes: newSelected };
    });
  },

  clearSelectedPlanes: () => {
    set({ selectedPlanes: new Set() });
  },

  setTransformingPlane: (planeId, isTransforming) => {
    set((state) => {
      const newTransforming = new Set(state.transformingPlanes);
      if (isTransforming) {
        newTransforming.add(planeId);
      } else {
        newTransforming.delete(planeId);
      }
      return { transformingPlanes: newTransforming };
    });
  },

  // Style and content actions
  updatePlaneHeaderStyle: (planeId, style) => {
    const plane = get().getPlane(planeId);
    if (plane) {
      const newHeaderStyle = { ...plane.headerStyle, ...style };
      get().updatePlane(planeId, { headerStyle: newHeaderStyle });
    }
  },

  updatePlaneFaceTextStyle: (planeId, style) => {
    const plane = get().getPlane(planeId);
    if (plane) {
      const newFaceTextStyle = { ...plane.faceTextStyle, ...style };
      get().updatePlane(planeId, { faceTextStyle: newFaceTextStyle });
    }
  },

  // UI state actions
  setPlaneShowUI: (planeId, show) => {
    get().updatePlane(planeId, { showUI: show });
  },

  setPlaneShowTextInput: (planeId, show) => {
    get().updatePlane(planeId, { showTextInput: show });
  },

  setPlaneShowTextStyleUI: (planeId, show) => {
    get().updatePlane(planeId, { showTextStyleUI: show });
  },

  setPlaneShowTransform: (planeId, show) => {
    get().updatePlane(planeId, { showTransform: show });
  },

  setPlaneIsResizing: (planeId, isResizing) => {
    get().updatePlane(planeId, { isResizing });
  },

  setPlaneShowHeader: (planeId, show) => {
    get().updatePlane(planeId, { showHeader: show });
  },

  setPlaneShowHeaderStyleUI: (planeId, show) => {
    get().updatePlane(planeId, { showHeaderStyleUI: show });
  },

  setPlaneIndicatorSelected: (planeId, selected) => {
    get().updatePlane(planeId, { indicatorSelected: selected });
  },

  // Media state actions
  setPlaneWebcamActive: (planeId, active) => {
    get().updatePlane(planeId, { webcamActive: active });
  },

  setPlaneWebcamInitialized: (planeId, initialized) => {
    get().updatePlane(planeId, { webcamInitialized: initialized });
  },

  setPlaneScreenShareActive: (planeId, active) => {
    get().updatePlane(planeId, { screenShareActive: active });
  },

  setPlaneScreenShareInitialized: (planeId, initialized) => {
    get().updatePlane(planeId, { screenShareInitialized: initialized });
  },

  setPlaneIsBroadcasting: (planeId, broadcasting) => {
    get().updatePlane(planeId, { isBroadcasting: broadcasting });
  },

  setPlaneIsViewingBroadcast: (planeId, viewing) => {
    get().updatePlane(planeId, { isViewingBroadcast: viewing });
  },

  setPlaneIsScreenSharing: (planeId, sharing) => {
    get().updatePlane(planeId, { isScreenSharing: sharing });
  },

  setPlaneBroadcastInfo: (planeId, info) => {
    get().updatePlane(planeId, { broadcastInfo: info });
  },

  setPlaneViewerCount: (planeId, count) => {
    get().updatePlane(planeId, { viewerCount: count });
  },

  setPlaneImageTexture: (planeId, texture) => {
    get().updatePlane(planeId, { imageTexture: texture });
  },

  setPlaneIsUploadingImage: (planeId, uploading) => {
    get().updatePlane(planeId, { isUploadingImage: uploading });
  },

  // Selectors
  getPlane: (planeId) => {
    return get().planes.get(planeId);
  },

  isPlaneSelected: (planeId) => {
    return get().selectedPlanes.has(planeId);
  },

  isPlaneTransforming: (planeId) => {
    return get().transformingPlanes.has(planeId);
  },

  getAllPlanes: () => {
    return Array.from(get().planes.values());
  },

  getSelectedPlanes: () => {
    const { planes, selectedPlanes } = get();
    return Array.from(selectedPlanes)
      .map((id) => planes.get(id))
      .filter(Boolean);
  },
}));

export default usePlaneStore;
