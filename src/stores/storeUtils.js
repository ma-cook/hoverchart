/**
 * Store migration utilities and helpers
 * These utilities help with transitioning from local state to Zustand stores
 */

import {
  useFaceIndicatorStore,
  useCubeStore,
  useDodecahedronStore,
  usePlaneStore,
  useFaceStore,
  useConnectionStore,
} from './';

// Hook to initialize all stores for a component
export const useStoreInitialization = () => {
  const initializeFaceIndicator = useFaceIndicatorStore(
    (state) => state.createIndicator
  );
  const initializeCube = useCubeStore((state) => state.createCube);
  const initializeDodecahedron = useDodecahedronStore(
    (state) => state.createDodecahedron
  );
  const initializePlane = usePlaneStore((state) => state.createPlane);
  const initializeFace = useFaceStore((state) => state.createFace);
  const initializeConnection = useConnectionStore(
    (state) => state.createConnection
  );

  return {
    initializeFaceIndicator,
    initializeCube,
    initializeDodecahedron,
    initializePlane,
    initializeFace,
    initializeConnection,
  };
};

// Hook to get all store selectors for a specific object type
export const useCubeSelectors = (cubeId) => {
  const cube = useCubeStore((state) => state.getCube(cubeId));
  const isSelected = useCubeStore((state) => state.isCubeSelected(cubeId));
  const isTransforming = useCubeStore((state) =>
    state.isCubeTransforming(cubeId)
  );

  return {
    cube,
    isSelected,
    isTransforming,
    // Derived state for convenience
    selectedFace: cube?.selectedFace,
    selectedIndicator: cube?.selectedIndicator,
    showTransform: cube?.showTransform,
    showHeader: cube?.showHeader,
    showFaceTextInput: cube?.showFaceTextInput,
    isResizing: cube?.isResizing,
    showObjectUI: cube?.showObjectUI,
    showHeaderTextStyleUI: cube?.showHeaderTextStyleUI,
    activeTextFace: cube?.activeTextFace,
    scale: cube?.scale,
    color: cube?.color,
    faceColors: cube?.faceColors,
    faceTexts: cube?.faceTexts,
    faceTextStyles: cube?.faceTextStyles,
    headerText: cube?.headerText,
    textStyle: cube?.textStyle,
  };
};

// Hook to get all store actions for a specific object type
export const useCubeActions = (cubeId) => {
  const createCube = useCubeStore((state) => state.createCube);
  const updateCube = useCubeStore((state) => state.updateCube);
  const deleteCube = useCubeStore((state) => state.deleteCube);
  const selectCube = useCubeStore((state) => state.selectCube);
  const deselectCube = useCubeStore((state) => state.deselectCube);
  const setTransformingCube = useCubeStore(
    (state) => state.setTransformingCube
  );
  const setCubeSelectedFace = useCubeStore(
    (state) => state.setCubeSelectedFace
  );
  const setCubeSelectedIndicator = useCubeStore(
    (state) => state.setCubeSelectedIndicator
  );
  const setCubeShowTransform = useCubeStore(
    (state) => state.setCubeShowTransform
  );
  const setCubeShowHeader = useCubeStore((state) => state.setCubeShowHeader);
  const setCubeShowFaceTextInput = useCubeStore(
    (state) => state.setCubeShowFaceTextInput
  );
  const setCubeIsResizing = useCubeStore((state) => state.setCubeIsResizing);
  const setCubeShowObjectUI = useCubeStore(
    (state) => state.setCubeShowObjectUI
  );
  const setCubeShowHeaderTextStyleUI = useCubeStore(
    (state) => state.setCubeShowHeaderTextStyleUI
  );
  const setCubeActiveTextFace = useCubeStore(
    (state) => state.setCubeActiveTextFace
  );
  const updateCubeFaceColor = useCubeStore(
    (state) => state.updateCubeFaceColor
  );
  const updateCubeFaceText = useCubeStore((state) => state.updateCubeFaceText);
  const updateCubeFaceTextStyle = useCubeStore(
    (state) => state.updateCubeFaceTextStyle
  );

  return {
    createCube,
    updateCube,
    deleteCube,
    selectCube,
    deselectCube,
    setTransformingCube,
    setCubeSelectedFace,
    setCubeSelectedIndicator,
    setCubeShowTransform,
    setCubeShowHeader,
    setCubeShowFaceTextInput,
    setCubeIsResizing,
    setCubeShowObjectUI,
    setCubeShowHeaderTextStyleUI,
    setCubeActiveTextFace,
    updateCubeFaceColor,
    updateCubeFaceText,
    updateCubeFaceTextStyle,
  };
};

// Similar hooks for other object types
export const usePlaneSelectors = (planeId) => {
  const plane = usePlaneStore((state) => state.getPlane(planeId));
  const isSelected = usePlaneStore((state) => state.isPlaneSelected(planeId));
  const isTransforming = usePlaneStore((state) =>
    state.isPlaneTransforming(planeId)
  );

  return {
    plane,
    isSelected,
    isTransforming,
    // Derived state for convenience
    scale: plane?.scale,
    color: plane?.color,
    headerText: plane?.headerText,
    borderStyle: plane?.borderStyle,
    borderColor: plane?.borderColor,
    lineThickness: plane?.lineThickness,
    headerStyle: plane?.headerStyle,
    faceText: plane?.faceText,
    faceTextStyle: plane?.faceTextStyle,
    imageUrl: plane?.imageUrl,
    webcamActive: plane?.webcamActive,
    showUI: plane?.showUI,
    showTextInput: plane?.showTextInput,
    showTextStyleUI: plane?.showTextStyleUI,
    showTransform: plane?.showTransform,
    isResizing: plane?.isResizing,
    showHeader: plane?.showHeader,
    showHeaderStyleUI: plane?.showHeaderStyleUI,
    indicatorSelected: plane?.indicatorSelected,
  };
};

export const usePlaneActions = (planeId) => {
  const createPlane = usePlaneStore((state) => state.createPlane);
  const updatePlane = usePlaneStore((state) => state.updatePlane);
  const deletePlane = usePlaneStore((state) => state.deletePlane);
  const selectPlane = usePlaneStore((state) => state.selectPlane);
  const deselectPlane = usePlaneStore((state) => state.deselectPlane);
  const setTransformingPlane = usePlaneStore(
    (state) => state.setTransformingPlane
  );
  const setPlaneShowUI = usePlaneStore((state) => state.setPlaneShowUI);
  const setPlaneShowTextInput = usePlaneStore(
    (state) => state.setPlaneShowTextInput
  );
  const setPlaneShowTextStyleUI = usePlaneStore(
    (state) => state.setPlaneShowTextStyleUI
  );
  const setPlaneShowTransform = usePlaneStore(
    (state) => state.setPlaneShowTransform
  );
  const setPlaneIsResizing = usePlaneStore((state) => state.setPlaneIsResizing);
  const setPlaneShowHeader = usePlaneStore((state) => state.setPlaneShowHeader);
  const setPlaneShowHeaderStyleUI = usePlaneStore(
    (state) => state.setPlaneShowHeaderStyleUI
  );
  const setPlaneIndicatorSelected = usePlaneStore(
    (state) => state.setPlaneIndicatorSelected
  );
  const setPlaneWebcamActive = usePlaneStore(
    (state) => state.setPlaneWebcamActive
  );

  return {
    createPlane,
    updatePlane,
    deletePlane,
    selectPlane,
    deselectPlane,
    setTransformingPlane,
    setPlaneShowUI,
    setPlaneShowTextInput,
    setPlaneShowTextStyleUI,
    setPlaneShowTransform,
    setPlaneIsResizing,
    setPlaneShowHeader,
    setPlaneShowHeaderStyleUI,
    setPlaneIndicatorSelected,
    setPlaneWebcamActive,
  };
};

// Utilities for managing global state across all stores
export const useGlobalStoreUtils = () => {
  const clearAllCubes = useCubeStore((state) => state.clearSelectedCubes);
  const clearAllPlanes = usePlaneStore((state) => state.clearSelectedPlanes);
  const clearAllDodecahedrons = useDodecahedronStore(
    (state) => state.clearSelectedDodecahedrons
  );
  const clearAllConnections = useConnectionStore(
    (state) => state.clearSelectedConnections
  );
  const clearAllFaces = useFaceStore((state) => state.clearSelectedFaces);
  const clearAllIndicators = useFaceIndicatorStore(
    (state) => state.clearAllIndicators
  );

  const clearAllSelections = () => {
    clearAllCubes();
    clearAllPlanes();
    clearAllDodecahedrons();
    clearAllConnections();
    clearAllFaces();
  };

  const resetAllStores = () => {
    clearAllSelections();
    clearAllIndicators();
  };

  return {
    clearAllSelections,
    resetAllStores,
  };
};
