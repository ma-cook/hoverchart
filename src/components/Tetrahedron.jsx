import React, { useRef, useMemo, useEffect, useCallback } from 'react';

import { TransformControls as DreiTransformControls } from '@react-three/drei';
import * as THREE from 'three';
import TetrahedronFace from './TetrahedronFace';
import { useFaceIndicatorStore } from '../stores';
import AtlasTextSprite from './AtlasTextSprite';
import ObjectUI from './ObjectUI';

import HeaderInput from './HeaderInput';

// Fast comparison helpers to replace JSON.stringify in React.memo
const arraysEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

const shallowObjEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return a === b;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
};
import TextStyleUI from './TextStyleUI';

import InstancedLine from './InstancedLine';
import { tetrahedronTransformMap } from './GlobalTetrahedronEdgesRenderer';
import isEqual from 'lodash/isEqual';
import {
  useTetrahedronStore,
  useObjectsStore,
  getObjectById,
  useConnectionStore,
  useIndicatorsStore,
} from '../stores';
import { shallow } from 'zustand/shallow';

// Module-level cached hitbox material (avoids per-render allocation)
const HITBOX_MATERIAL = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
import useLODStore, { LOD_LEVELS } from '../stores/lodStore';
// Import snapping utilities
import { calculateAxisSnap } from '../utils/snappingUtils';
// Import snap line indicator
import SnapLineIndicator from './SnapLineIndicator';
// Import unified utilities
import { useDebouncedUpdate } from '../hooks/useDebouncedUpdate';
import { debounce } from '../utils/unifiedPerformanceUtils';

const EMPTY_CONNECTIONS = [];

const TETRAHEDRON_SIZE = 5;

const tetrahedronVertices = [
  [0, TETRAHEDRON_SIZE, 0], // top vertex
  [-TETRAHEDRON_SIZE, -TETRAHEDRON_SIZE, TETRAHEDRON_SIZE], // bottom-left-front
  [TETRAHEDRON_SIZE, -TETRAHEDRON_SIZE, TETRAHEDRON_SIZE], // bottom-right-front
  [0, -TETRAHEDRON_SIZE, -TETRAHEDRON_SIZE * 1.5], // bottom-back
];

// FLYWEIGHT: Module-level shared geometries — all Tetrahedron instances reuse these
const _createTriangleGeometry = (vertices) => {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(vertices.flat());
  const normals = new Float32Array(9);
  const uvs = new Float32Array([0.5, 1.0, 0.0, 0.0, 1.0, 0.0]);

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  // Calculate normal using temp vectors
  const v1x = vertices[0][0], v1y = vertices[0][1], v1z = vertices[0][2];
  const v2x = vertices[1][0], v2y = vertices[1][1], v2z = vertices[1][2];
  const v3x = vertices[2][0], v3y = vertices[2][1], v3z = vertices[2][2];
  // edge1 = v2 - v1, edge2 = v3 - v1
  const e1x = v2x - v1x, e1y = v2y - v1y, e1z = v2z - v1z;
  const e2x = v3x - v1x, e2y = v3y - v1y, e2z = v3z - v1z;
  // cross product
  let nx = e1y * e2z - e1z * e2y;
  let ny = e1z * e2x - e1x * e2z;
  let nz = e1x * e2y - e1y * e2x;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (len > 0) { nx /= len; ny /= len; nz /= len; }

  for (let i = 0; i < 3; i++) {
    normals[i * 3] = nx;
    normals[i * 3 + 1] = ny;
    normals[i * 3 + 2] = nz;
  }

  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  const indices = new Uint16Array([0, 1, 2]);
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.frustumCulled = false;
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
  return geometry;
};

const SHARED_TETRAHEDRON_FACES = {
  bottom: _createTriangleGeometry([tetrahedronVertices[1], tetrahedronVertices[2], tetrahedronVertices[3]]),
  front: _createTriangleGeometry([tetrahedronVertices[0], tetrahedronVertices[2], tetrahedronVertices[1]]),
  left: _createTriangleGeometry([tetrahedronVertices[0], tetrahedronVertices[1], tetrahedronVertices[3]]),
  right: _createTriangleGeometry([tetrahedronVertices[0], tetrahedronVertices[3], tetrahedronVertices[2]]),
};

// Get face indicator positions and rotations
const getFaceIndicatorProps = (faceName) => {
  // Calculate face centers based on tetrahedron vertices
  const vertices = tetrahedronVertices;

  switch (faceName) {
    case 'bottom': {
      // Bottom face: vertices 1, 2, 3 (bottom triangle)
      const center = [
        (vertices[1][0] + vertices[2][0] + vertices[3][0]) / 3,
        (vertices[1][1] + vertices[2][1] + vertices[3][1]) / 3,
        (vertices[1][2] + vertices[2][2] + vertices[3][2]) / 3,
      ];
      return {
        position: [center[0], center[1] - 0.3, center[2]], // Offset slightly for indicator
        rotation: [0, 0, 0],
        normal: [0, -1, 0],
      };
    }
    case 'front': {
      // Front face: vertices 0, 2, 1 (top, bottom-right-front, bottom-left-front)
      const center = [
        (vertices[0][0] + vertices[2][0] + vertices[1][0]) / 3,
        (vertices[0][1] + vertices[2][1] + vertices[1][1]) / 3,
        (vertices[0][2] + vertices[2][2] + vertices[1][2]) / 3,
      ];
      return {
        position: [center[0], center[1], center[2] + 0.3], // Offset slightly for indicator
        rotation: [0, 0, 0],
        normal: [0, 0.5, 0.866],
      };
    }
    case 'left': {
      // Left face: vertices 0, 1, 3 (top, bottom-left-front, bottom-back)
      const center = [
        (vertices[0][0] + vertices[1][0] + vertices[3][0]) / 3,
        (vertices[0][1] + vertices[1][1] + vertices[3][1]) / 3,
        (vertices[0][2] + vertices[1][2] + vertices[3][2]) / 3,
      ];
      return {
        position: [center[0] - 0.3, center[1], center[2]], // Offset slightly for indicator
        rotation: [0, 0, 0],
        normal: [-0.866, 0.5, -0.433],
      };
    }
    case 'right': {
      // Right face: vertices 0, 3, 2 (top, bottom-back, bottom-right-front)
      const center = [
        (vertices[0][0] + vertices[3][0] + vertices[2][0]) / 3,
        (vertices[0][1] + vertices[3][1] + vertices[2][1]) / 3,
        (vertices[0][2] + vertices[3][2] + vertices[2][2]) / 3,
      ];
      return {
        position: [center[0] + 0.3, center[1], center[2]], // Offset slightly for indicator
        rotation: [0, 0, 0],
        normal: [0.866, 0.5, -0.433],
      };
    }
    default:
      return {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        normal: [0, 1, 0],
      };
  }
};

const Tetrahedron = ({
  id,
  selected,
  onClick,
  onFaceIndicatorClick,
  onFaceClick,
  showAllCubesIndicators,
  globalIndicatorSelected,
  indicatorMode,
  selectedIndicators = [],
  setActiveTextStyleUI,
  onUpdate,
  onDelete,
  onTransformStart,
  onTransformEnd,
  onMove,
  lineWidth, // Add lineWidth prop
  renderEdges = true, // Add renderEdges prop - default true for backwards compatibility
}) => {
  // Create triangle geometries for each face (moved inside component to ensure proper disposal)

  const DEFAULT_COLOR = '#000000';

  const TETRAHEDRON_SIZE = 5;

  const tetrahedronFaces = useMemo(
    () => [
      { name: 'bottom', normal: [0, -1, 0] },
      { name: 'front', normal: [0, 0.5, 0.866] },
      { name: 'left', normal: [-0.866, 0.5, -0.433] },
      { name: 'right', normal: [0.866, 0.5, -0.433] },
    ],
    []
  );
  const setIndicatorActive = useFaceIndicatorStore(
    (state) => state.setIndicatorActive
  );
  // Tetrahedron vertices (regular tetrahedron)

  // FLYWEIGHT: Use module-level shared geometries instead of creating per instance
  const tetrahedronTriangleFaces = SHARED_TETRAHEDRON_FACES;

  // PERFORMANCE: O(1) lookup via objectsById cache instead of O(N) .find().
  const objectData = useObjectsStore(
    useCallback((state) => getObjectById(state, id), [id])
  );

  // Extract properties with defaults
  const position = React.useMemo(
    () => objectData?.position || [0, 0, 0],
    [objectData?.position]
  );
  const scale = React.useMemo(
    () => objectData?.scale || [1, 1, 1],
    [objectData?.scale]
  );
  const color = objectData?.color || DEFAULT_COLOR;
  const headerText = objectData?.headerText || '';
  const textStyle = React.useMemo(
    () => objectData?.textStyle || { fontSize: 1.5, color: 'black' },
    [objectData?.textStyle]
  );
  const faceColors = React.useMemo(
    () => objectData?.faceColors || {},
    [objectData?.faceColors]
  );
  const faceTexts = React.useMemo(
    () => objectData?.faceTexts || {},
    [objectData?.faceTexts]
  );
  const faceTextStyles = React.useMemo(
    () => objectData?.faceTextStyles || {},
    [objectData?.faceTextStyles]
  );

  // PERFORMANCE: O(1) index lookup instead of O(C) filter. Shallow equality prevents
  // re-renders when this tetrahedron's connections haven't changed.
  const connectionsFromStore = useConnectionStore(
    useCallback(
      (state) => state.connectionsByObjectId.get(String(id)) || EMPTY_CONNECTIONS,
      [id]
    ),
    shallow
  );

  // Refs
  const contentRef = useRef();
  const meshRef = useRef();

  // Create debounced update functions using unified utility
  const debouncedUpdate = useMemo(
    () =>
      debounce((id, updateData) => {
        if (onUpdate) {
          onUpdate(id, updateData);
        }
      }, 300),
    [onUpdate]
  );

  // Get LOD level for this tetrahedron
  const lodLevel = useLODStore(
    useCallback((state) => state.getLODLevel(id), [id])
  );
  const isChildOfContainer = useLODStore(
    useCallback((state) => state.isChildOfContainer(id), [id])
  );
  const isParentObject = useLODStore(
    useCallback((state) => state.isParent(id), [id])
  );
  const showFaceText = useLODStore(
    useCallback((state) => state.faceTextVisible.get(id) !== false, [id])
  );

  // Replace all individual selectors with a single consolidated selector
  const tetrahedronState = useTetrahedronStore((state) => ({
    tetrahedron: state.getTetrahedron(id),
    isSelected: state.isTetrahedronSelected(id),
    faceColors: state.getTetrahedron(id)?.faceColors,
    faceTexts: state.getTetrahedron(id)?.faceTexts,
    faceTextStyles: state.getTetrahedron(id)?.faceTextStyles,
    selectedFace: state.getTetrahedron(id)?.selectedFace,
    selectedIndicator: state.getTetrahedron(id)?.selectedIndicator,
    showTransform: state.getTetrahedron(id)?.showTransform,
    showHeader: state.getTetrahedron(id)?.showHeader,
    showFaceTextInput: state.getTetrahedron(id)?.showFaceTextInput,
    isResizing: state.getTetrahedron(id)?.isResizing,
    showObjectUI: state.getTetrahedron(id)?.showObjectUI,
    showHeaderTextStyleUI: state.getTetrahedron(id)?.showHeaderTextStyleUI,
    activeTextFace: state.getTetrahedron(id)?.activeTextFace,
    color: state.getTetrahedron(id)?.color,
    headerText: state.getTetrahedron(id)?.headerText,
    textStyle: state.getTetrahedron(id)?.textStyle,
    scale: state.getTetrahedron(id)?.scale,
    showSnapLine: state.getTetrahedron(id)?.showSnapLine,
    snapLinePoints: state.getTetrahedron(id)?.snapLinePoints,
    snapAxis: state.getTetrahedron(id)?.snapAxis,
  }));

  // Replace individual action selectors with a single actions object
  const tetrahedronActions = useTetrahedronStore((state) => ({
    createTetrahedron: state.createTetrahedron,
    updateTetrahedron: state.updateTetrahedron,
    selectTetrahedron: state.selectTetrahedron,
    deselectTetrahedron: state.deselectTetrahedron,
    setTetrahedronSelectedFace: state.setTetrahedronSelectedFace,
    setTetrahedronSelectedIndicator: state.setTetrahedronSelectedIndicator,
    setTetrahedronShowTransform: state.setTetrahedronShowTransform,
    setTetrahedronShowHeader: state.setTetrahedronShowHeader,
    setTetrahedronShowFaceTextInput: state.setTetrahedronShowFaceTextInput,
    setTetrahedronIsResizing: state.setTetrahedronIsResizing,
    setTetrahedronShowObjectUI: state.setTetrahedronShowObjectUI,
    setTetrahedronShowHeaderTextStyleUI:
      state.setTetrahedronShowHeaderTextStyleUI,
    setTetrahedronActiveTextFace: state.setTetrahedronActiveTextFace,
    updateTetrahedronFaceColor: state.updateTetrahedronFaceColor,
    updateTetrahedronFaceText: state.updateTetrahedronFaceText,
    updateTetrahedronFaceTextStyle: state.updateTetrahedronFaceTextStyle,
  }));

  // Get hover state from indicators store
  const hoveredObjectId = useIndicatorsStore((state) => state.hoveredObjectId);
  const setHoveredObjectId = useIndicatorsStore(
    (state) => state.setHoveredObjectId
  );

  // Initialize tetrahedron in store if it doesn't exist
  useEffect(() => {
    if (!tetrahedronState.tetrahedron) {
      tetrahedronActions.createTetrahedron(id, {
        position,
        scale,
        color,
        faceColors,
        faceTexts,
        headerText,
        textStyle,
        faceTextStyles,
      });
    }
  }, [
    id,
    tetrahedronState.tetrahedron,
    tetrahedronActions.createTetrahedron,
    position,
    scale,
    color,
    faceColors,
    faceTexts,
    headerText,
    textStyle,
    faceTextStyles,
  ]);

  // Handle selection changes
  useEffect(() => {
    if (selected && !tetrahedronState.isSelected) {
      tetrahedronActions.selectTetrahedron(id);
    } else if (!selected && tetrahedronState.isSelected) {
      tetrahedronActions.deselectTetrahedron(id);
    }
  }, [
    selected,
    tetrahedronState.isSelected,
    tetrahedronActions.selectTetrahedron,
    tetrahedronActions.deselectTetrahedron,
    id,
  ]);

  // Reset selection states when tetrahedron is deselected
  useEffect(() => {
    if (!selected) {
      tetrahedronActions.setTetrahedronSelectedFace(id, null);
      tetrahedronActions.setTetrahedronSelectedIndicator(id, null);
      tetrahedronActions.setTetrahedronShowTransform(id, false);
      setActiveTextStyleUI(null);
      tetrahedronActions.setTetrahedronShowHeaderTextStyleUI(id, false);
      tetrahedronActions.setTetrahedronActiveTextFace(id, null);
    }
  }, [
    selected,
    id,
    tetrahedronActions.setTetrahedronSelectedFace,
    tetrahedronActions.setTetrahedronSelectedIndicator,
    tetrahedronActions.setTetrahedronShowTransform,
    setActiveTextStyleUI,
    tetrahedronActions.setTetrahedronShowHeaderTextStyleUI,
    tetrahedronActions.setTetrahedronActiveTextFace,
  ]);

  // Check if a face is connected via a connection
  const isIndicatorConnected = useCallback(
    (faceName) => {
      if (!connectionsFromStore || !id) return false;
      return connectionsFromStore.some((conn) => {
        const startMatch =
          conn.start?.cube?.id === id && conn.start?.face === faceName;
        const endMatch =
          conn.end?.cube?.id === id && conn.end?.face === faceName;
        return startMatch || endMatch;
      });
    },
    [connectionsFromStore, id]
  );

  // Check if an indicator should be shown as active
  const isIndicatorActive = useCallback(
    (faceName) => {
      return (
        tetrahedronState.selectedIndicator === faceName &&
        !isIndicatorConnected(faceName)
      );
    },
    [tetrahedronState.selectedIndicator, isIndicatorConnected]
  );

  // Calculate UI positions based on tetrahedron scale
  const getUIPositions = useMemo(() => {
    const uiOffset = 0.01;
    const currentScale = tetrahedronState.scale || scale;

    return {
      objectUI: [0, TETRAHEDRON_SIZE + 20 / currentScale[1], uiOffset],
      headerInput: [0, TETRAHEDRON_SIZE + 5 / currentScale[1], uiOffset],
      headerText: [0, TETRAHEDRON_SIZE + 5 / currentScale[1], uiOffset],
      textStyleUI: [0, TETRAHEDRON_SIZE + 7 / currentScale[1], uiOffset],
    };
  }, [tetrahedronState.scale, scale]);

  // Determine if an indicator should be shown
  const shouldShowIndicator = useCallback(
    (faceName) => {
      // Always show indicators that are connected
      if (isIndicatorConnected(faceName)) {
        return true;
      }
      // Show indicators during connection creation on ALL objects
      if (selectedIndicators.length > 0) {
        return true;
      }
      // Show indicator for the active face when tetrahedron is selected
      if (tetrahedronState?.selectedFace === faceName && selected) {
        return true;
      }
      // Show all indicators when explicitly requested
      if (showAllCubesIndicators || globalIndicatorSelected) {
        return true;
      }
      // Show ALL indicators when ANY indicator is selected on this tetrahedron (exact same as Dodecahedron)
      if (
        tetrahedronState?.selectedIndicator !== null &&
        tetrahedronState?.selectedIndicator !== undefined
      ) {
        return true;
      }
      // Show indicators based on mode (exact same as Dodecahedron)
      switch (indicatorMode) {
        case 'all':
          return true; // Show on all tetrahedrons always in 'all' mode
        case 'indicators':
          // In indicators mode, ONLY show for the currently hovered object
          return hoveredObjectId === id;
        case 'single':
          return (
            tetrahedronState?.selectedIndicator === faceName ||
            (selected && faceName === tetrahedronState?.selectedFace)
          );
        default:
          // In default mode (no indicator clicked yet), show for connected faces
          if (tetrahedronState?.connectedFaces?.has(faceName)) return true;
          return false;
      }
    },
    [
      isIndicatorConnected,
      selectedIndicators.length,
      tetrahedronState?.selectedFace,
      tetrahedronState?.selectedIndicator,
      tetrahedronState?.connectedFaces,
      selected,
      showAllCubesIndicators,
      globalIndicatorSelected,
      indicatorMode,
      hoveredObjectId,
      id,
    ]
  );

  // Check if any face has a connected indicator (for lazy face mounting)
  const hasConnectedIndicators = useMemo(() =>
    tetrahedronFaces.some(({ name }) => isIndicatorConnected(name)),
    [isIndicatorConnected, tetrahedronFaces]
  );

  // Lazy face mounting: skip TetrahedronFace components when not needed
  const shouldMountFaces = selected ||
    showAllCubesIndicators ||
    globalIndicatorSelected ||
    selectedIndicators.length > 0 ||
    indicatorMode === 'all' ||
    indicatorMode === 'indicators' ||
    hasConnectedIndicators;

  // Tetrahedron edge line points (wireframe) - flattened for InstancedLine
  // Format: [x1,y1,z1, x2,y2,z2, x3,y3,z3, ...] for edge pairs
  const tetrahedronEdgePoints = useMemo(
    () => [
      // Bottom triangle (3 edges)
      ...tetrahedronVertices[1],
      ...tetrahedronVertices[2],
      ...tetrahedronVertices[2],
      ...tetrahedronVertices[3],
      ...tetrahedronVertices[3],
      ...tetrahedronVertices[1],
      // Top edges (3 edges)
      ...tetrahedronVertices[0],
      ...tetrahedronVertices[1],
      ...tetrahedronVertices[0],
      ...tetrahedronVertices[2],
      ...tetrahedronVertices[0],
      ...tetrahedronVertices[3],
    ],
    []
  );

  // Get material for a face

  // Event handlers
  const handleSceneClick = useCallback(() => {
    tetrahedronActions.setTetrahedronShowObjectUI(id, true);
    tetrahedronActions.setTetrahedronShowHeaderTextStyleUI(id, false);
    tetrahedronActions.setTetrahedronActiveTextFace(id, null);
    setActiveTextStyleUI(null);
    onClick();
  }, [
    onClick,
    setActiveTextStyleUI,
    id,
    tetrahedronActions.setTetrahedronShowObjectUI,
    tetrahedronActions.setTetrahedronShowHeaderTextStyleUI,
    tetrahedronActions.setTetrahedronActiveTextFace,
  ]);

  // Add useCallback for updating database
  const updateDatabase = useCallback(() => {
    if (!onUpdate || !id || !objectData) return;

    const { isInitialLoading } = useObjectsStore.getState();
    if (isInitialLoading) {
      return;
    }

    const currentScale = tetrahedronState.scale ||
      objectData.scale || [1, 1, 1];

    const validPosition =
      Array.isArray(objectData.position) &&
      objectData.position.length === 3 &&
      objectData.position.every((val) => typeof val === 'number' && !isNaN(val))
        ? objectData.position
        : [0, 0, 0];

    const currentState = {
      type: 'tetrahedron',
      position: validPosition,
      scale: currentScale,
      color: objectData.color || '#000000',
      headerText: objectData.headerText || '',
      textStyle: objectData.textStyle || {
        fontSize: 1.5,
        color: 'black',
        underline: false,
      },
      faceColors: objectData.faceColors || {},
      faceTexts: objectData.faceTexts || {},
      faceTextStyles: objectData.faceTextStyles || {},
    };

    const lastUpdate = contentRef.current?.lastUpdate;
    if (!lastUpdate || !isEqual(lastUpdate, currentState)) {
      contentRef.current.lastUpdate = currentState;
      onUpdate(id, currentState);
    }
  }, [id, objectData, onUpdate, tetrahedronState.scale]);

  // Use unified debounced update instead of duplicate pattern
  useDebouncedUpdate(updateDatabase, objectData);

  const handleFaceClick = useCallback(
    (e, faceName) => {
      e.stopPropagation();
      const newSelectedFace =
        tetrahedronState.selectedFace === faceName ? null : faceName;
      tetrahedronActions.setTetrahedronSelectedFace(id, newSelectedFace);
      tetrahedronActions.setTetrahedronShowObjectUI(id, false);

      onFaceClick?.({
        cube: contentRef.current, // Changed from 'tetrahedron' to 'cube' for compatibility
        face: faceName,
        id: id,
      });
    },
    [
      id,
      onFaceClick,
      tetrahedronState.selectedFace,
      tetrahedronActions.setTetrahedronSelectedFace,
      tetrahedronActions.setTetrahedronShowObjectUI,
    ]
  );

  const handleColoredFaceClick = useCallback(
    (e, faceName) => {
      e.stopPropagation();
      if (selected) {
        handleFaceClick(e, faceName);
      } else {
        handleSceneClick();
      }
    },
    [selected, handleFaceClick, handleSceneClick]
  );

  const handleIndicatorClick = useCallback(
    (e, faceName) => {
      e.stopPropagation();
      const { position: facePos } = getFaceIndicatorProps(faceName);
      const indicatorData = {
        type: 'tetrahedron',
        face: faceName,
        cube: {
          id,
          position: tetrahedronState.tetrahedron?.position || position,
          scale: tetrahedronState.scale || scale,
          userData: { objectId: id.toString() },
        },
        position: tetrahedronState.tetrahedron?.position || position,
        faceCenter: facePos,
      };
      // ... world position calculation ...
      tetrahedronActions.setTetrahedronSelectedIndicator(
        id,
        tetrahedronState.selectedIndicator === faceName ? null : faceName
      );
      // NEW: Update global faceIndicatorStore to activate this indicator (exact same as Dodecahedron)
      const indicatorId = `${id}-${faceName}`;
      setIndicatorActive(indicatorId, true); // Always activate globally
      console.log(
        'Tetrahedron handleIndicatorClick called for',
        faceName,
        'indicatorId:',
        indicatorId
      );
      onFaceIndicatorClick?.(indicatorData);
    },
    [
      id,
      onFaceIndicatorClick,
      tetrahedronState,
      tetrahedronActions,
      setIndicatorActive,
    ]
  );

  const handleTransformToggle = useCallback(() => {
    const newShowTransform = !tetrahedronState.showTransform;
    tetrahedronActions.setTetrahedronShowTransform(id, newShowTransform);
    if (newShowTransform) {
      tetrahedronActions.setTetrahedronIsResizing(id, false);
    }
  }, [
    tetrahedronState.showTransform,
    id,
    tetrahedronActions.setTetrahedronShowTransform,
    tetrahedronActions.setTetrahedronIsResizing,
  ]);

  const handleResizeToggle = useCallback(() => {
    const newIsResizing = !tetrahedronState.isResizing;
    tetrahedronActions.setTetrahedronIsResizing(id, newIsResizing);
    if (newIsResizing) {
      tetrahedronActions.setTetrahedronShowTransform(id, false);
    }
  }, [
    tetrahedronState.isResizing,
    id,
    tetrahedronActions.setTetrahedronIsResizing,
    tetrahedronActions.setTetrahedronShowTransform,
  ]);

  const handleHeaderToggle = useCallback(() => {
    tetrahedronActions.setTetrahedronShowHeader(
      id,
      !tetrahedronState.showHeader
    );
    if (!tetrahedronState.showHeader) {
      tetrahedronActions.setTetrahedronShowObjectUI(id, false);
    }
  }, [
    tetrahedronState.showHeader,
    id,
    tetrahedronActions.setTetrahedronShowHeader,
    tetrahedronActions.setTetrahedronShowObjectUI,
  ]);

  const handleHeaderSubmit = useCallback(
    (text) => {
      tetrahedronActions.updateTetrahedron(id, { headerText: text });
      if (onUpdate) {
        onUpdate(id, {
          color: tetrahedronState.color || color,
          headerText: text,
          scale: tetrahedronState.scale || scale,
          position: position,
          faceColors: tetrahedronState.faceColors || faceColors,
          faceTexts: tetrahedronState.faceTexts || faceTexts,
          faceTextStyles: tetrahedronState.faceTextStyles || faceTextStyles,
          textStyle: tetrahedronState.textStyle || textStyle,
          type: 'tetrahedron',
        });
      }
      tetrahedronActions.setTetrahedronShowHeader(id, false);
      tetrahedronActions.setTetrahedronShowObjectUI(id, false);
    },
    [
      id,
      onUpdate,
      tetrahedronState,
      color,
      scale,
      faceColors,
      faceTexts,
      faceTextStyles,
      textStyle,
      tetrahedronActions.updateTetrahedron,
      tetrahedronActions.setTetrahedronShowHeader,
      tetrahedronActions.setTetrahedronShowObjectUI,
      position,
    ]
  );

  const handleLineColorChange = useCallback(
    (newColor) => {
      tetrahedronActions.updateTetrahedron(id, { color: newColor });

      // Use unified debounced update
      debouncedUpdate(id, {
        color: newColor,
        headerText: tetrahedronState.headerText || headerText,
        scale: tetrahedronState.scale || scale,
        position: position,
        faceColors: tetrahedronState.faceColors || faceColors,
        faceTexts: tetrahedronState.faceTexts || faceTexts,
        faceTextStyles: tetrahedronState.faceTextStyles || faceTextStyles,
        textStyle: tetrahedronState.textStyle || textStyle,
        type: 'tetrahedron',
      });
    },
    [
      id,
      debouncedUpdate,
      tetrahedronState,
      headerText,
      scale,
      faceColors,
      faceTexts,
      faceTextStyles,
      textStyle,
      tetrahedronActions.updateTetrahedron,
      position,
    ]
  );

  const handleDrag = (e) => {
    if (!e.target || !e.target.object || !e.target.object.position) {
      console.error('Invalid transform event in handleDrag');
      return;
    }

    const newPos = e.target.object.position;
    if (
      typeof newPos.x !== 'number' ||
      typeof newPos.y !== 'number' ||
      typeof newPos.z !== 'number'
    ) {
      console.error('Invalid position values in handleDrag', newPos);
      return;
    }

    const currentPosition = [newPos.x, newPos.y, newPos.z];

    // Update transform map for real-time edge sync
    tetrahedronTransformMap.set(id, {
      position: currentPosition,
      scale: tetrahedronState.scale || scale,
    });

    try {
      const objectsStore = useObjectsStore.getState();
      const currentObjects = Array.isArray(objectsStore.objects)
        ? objectsStore.objects
        : [];

      const snapResult = calculateAxisSnap(currentPosition, currentObjects, id);
      const finalPosition = snapResult?.position || currentPosition;

      if (snapResult) {
        e.target.object.position.set(
          snapResult.position[0],
          snapResult.position[1],
          snapResult.position[2]
        );

        // Update transform map with snapped position
        tetrahedronTransformMap.set(id, {
          position: finalPosition,
          scale: tetrahedronState.scale || scale,
        });

        tetrahedronActions.updateTetrahedron(id, {
          showSnapLine: true,
          snapLinePoints: snapResult.linePoints,
          snapAxis: snapResult.snapAxis,
        });

        setTimeout(() => {
          tetrahedronActions.updateTetrahedron(id, { showSnapLine: false });
        }, 2000);
      } else {
        tetrahedronActions.updateTetrahedron(id, { showSnapLine: false });
      }

      const updatedObjects = currentObjects.map((obj) =>
        obj.id === id ? { ...obj, position: finalPosition } : obj
      );
      objectsStore.setObjects(updatedObjects);

      if (onMove) {
        onMove(finalPosition);
      }

      tetrahedronActions.updateTetrahedron(id, { position: finalPosition });
    } catch (error) {
      console.error('Error in tetrahedron handleDrag:', error);
    }
  };

  const handleScale = useCallback(
    (e) => {
      if (!e.target || !e.target.object) return;

      const newScale = [
        e.target.object.scale.x,
        e.target.object.scale.y,
        e.target.object.scale.z,
      ];

      const epsilon = 0.0001;
      const currentScale = tetrahedronState.scale || scale;
      if (
        Math.abs(newScale[0] - currentScale[0]) < epsilon &&
        Math.abs(newScale[1] - currentScale[1]) < epsilon &&
        Math.abs(newScale[2] - currentScale[2]) < epsilon
      ) {
        return;
      }

      // Update transform map for real-time edge sync during scaling
      tetrahedronTransformMap.set(id, {
        position: position,
        scale: newScale,
      });

      tetrahedronActions.updateTetrahedron(id, { scale: newScale });
    },
    [id, tetrahedronState.scale, scale, position, tetrahedronActions.updateTetrahedron]
  );

  // Face text handling functions
  const getFaceTextOffset = useCallback((fontSize, faceName) => {
    const baseOffset = fontSize * 0.3;
    // Different faces might need different offsets
    switch (faceName) {
      case 'bottom':
        return -baseOffset;
      case 'front':
      case 'left':
      case 'right':
        return baseOffset;
      default:
        return 0;
    }
  }, []);

  const handleFaceTextStyleClick = useCallback(
    (e, faceName) => {
      e.stopPropagation();
      e.nativeEvent?.stopPropagation?.();

      tetrahedronActions.setTetrahedronActiveTextFace(id, faceName);
      setActiveTextStyleUI(contentRef.current);
      tetrahedronActions.setTetrahedronShowHeaderTextStyleUI(id, false);
      tetrahedronActions.setTetrahedronSelectedFace(id, null);
      tetrahedronActions.setTetrahedronShowObjectUI(id, false);

      return false; // Prevent event bubbling
    },
    [
      id,
      tetrahedronActions.setTetrahedronActiveTextFace,
      setActiveTextStyleUI,
      tetrahedronActions.setTetrahedronShowHeaderTextStyleUI,
      tetrahedronActions.setTetrahedronSelectedFace,
      tetrahedronActions.setTetrahedronShowObjectUI,
    ]
  );

  const handleFaceTextStyleChange = useCallback(
    (newStyle) => {
      const activeFace = tetrahedronState.activeTextFace;
      if (!activeFace) return;

      const updatedFaceTextStyles = {
        ...(tetrahedronState.faceTextStyles || faceTextStyles),
        [activeFace]: {
          ...(tetrahedronState.faceTextStyles?.[activeFace] ||
            faceTextStyles?.[activeFace] ||
            {}),
          ...newStyle,
        },
      };

      tetrahedronActions.updateTetrahedronFaceTextStyle(id, activeFace, {
        ...(tetrahedronState.faceTextStyles?.[activeFace] ||
          faceTextStyles?.[activeFace] ||
          {}),
        ...newStyle,
      });

      if (onUpdate) {
        // Use unified debounced update
        debouncedUpdate(id, {
          color: tetrahedronState.color || color,
          headerText: tetrahedronState.headerText || headerText,
          scale: tetrahedronState.scale || scale,
          position: position,
          faceColors: tetrahedronState.faceColors || faceColors,
          faceTexts: tetrahedronState.faceTexts || faceTexts,
          faceTextStyles: updatedFaceTextStyles,
          textStyle: tetrahedronState.textStyle || textStyle,
          type: 'tetrahedron',
        });
      }
    },
    [
      id,
      debouncedUpdate,
      tetrahedronState,
      color,
      headerText,
      scale,
      position,
      faceColors,
      faceTexts,
      faceTextStyles,
      textStyle,
      tetrahedronActions.updateTetrahedronFaceTextStyle,
      onUpdate,
    ]
  );

  // Render face texts
  const renderFaceTexts = useMemo(() => {
    return tetrahedronFaces.map(({ name, normal }) => {
      const faceText = tetrahedronState.faceTexts?.[name] || faceTexts?.[name];
      if (!faceText) return null;

      const { position: facePos, rotation } = getFaceIndicatorProps(name);
      const textStyle = tetrahedronState.faceTextStyles?.[name] ||
        faceTextStyles?.[name] || {
          fontSize: 0.5,
          color: 'black',
          underline: false,
        };
      const yOffset = getFaceTextOffset(textStyle.fontSize, name);

      // Adjust offset multiplier for colored faces (reduced for better positioning)
      const offsetMultiplier =
        name === 'bottom'
          ? 0.2
          : tetrahedronState.faceColors && tetrahedronState.faceColors[name]
          ? 0.05
          : 0.03;

      // Calculate position with offset to prevent z-fighting
      const offsetPosition = [
        facePos[0] + normal[0] * offsetMultiplier,
        facePos[1] + normal[1] * offsetMultiplier,
        facePos[2] + normal[2] * offsetMultiplier,
      ];

      // Calculate inverse scale
      const currentScale = tetrahedronState.scale || scale;
      const inverseScale = currentScale.map((s) => 1 / Math.max(0.0001, s));

      // Use rotation as-is for tetrahedron faces
      const adjustedRotation = rotation;

      return (
        <group
          key={`text-${name}`}
          position={offsetPosition}
          rotation={adjustedRotation}
          scale={inverseScale}
        >
          <AtlasTextSprite
            text={faceText}
            position={[0, yOffset, 0]}
            onClick={(e) => {
              e.stopPropagation();
              e.nativeEvent?.stopPropagation?.();
              handleFaceTextStyleClick(e, name);
              return false; // Prevent event bubbling
            }}
            style={{
              ...textStyle,
              isFaceText: true,
              renderOrder: 2,
              depthTest: true,
              depthWrite: true,
            }}
            normal={normal}
            billboard={false}
            side={THREE.FrontSide}
            scale={1}
          />

          {/* Text style UI for the active face */}
          {tetrahedronState.activeTextFace === name && (
            <TextStyleUI
              position={[0, 6, 0]}
              onStyleChange={handleFaceTextStyleChange}
              onClose={() => {
                tetrahedronActions.setTetrahedronActiveTextFace(id, null);
                setActiveTextStyleUI(null);
                tetrahedronActions.setTetrahedronShowHeaderTextStyleUI(
                  id,
                  false
                );
              }}
              currentStyle={
                tetrahedronState.faceTextStyles?.[name] ||
                faceTextStyles?.[name] ||
                {}
              }
            />
          )}
        </group>
      );
    });
  }, [
    tetrahedronState,
    faceTexts,
    faceTextStyles,
    scale,
    getFaceTextOffset,
    handleFaceTextStyleClick,
    handleFaceTextStyleChange,
    id,
    tetrahedronActions,
    setActiveTextStyleUI,
  ]);

  // Render faces
  const renderFaces = useMemo(() => {
    return tetrahedronFaces.map(({ name, normal }) => (
      <TetrahedronFace
        key={`face-${name}`}
        id={id}
        faceName={name}
        faceData={{
          geometry: tetrahedronTriangleFaces[name],
          position: getFaceIndicatorProps(name).position,
          rotation: [0, 0, 0],
          normal,
        }}
        selected={selected}
        onFaceClick={handleColoredFaceClick}
        onIndicatorClick={handleIndicatorClick}
        shouldShowIndicator={shouldShowIndicator}
        isIndicatorConnected={isIndicatorConnected}
        isIndicatorActive={isIndicatorActive}
        debouncedUpdate={debouncedUpdate}
        onUpdate={onUpdate}
        position={position}
        color={color}
        headerText={headerText}
        scale={scale}
        faceColors={faceColors}
        faceTexts={faceTexts}
        faceTextStyles={faceTextStyles}
        textStyle={textStyle}
        selectedIndicatorsLength={selectedIndicators.length}
        showAllCubesIndicators={showAllCubesIndicators}
        globalIndicatorSelected={globalIndicatorSelected}
        showFaceText={showFaceText}
      />
    ));
  }, [
    id,
    selected,
    handleColoredFaceClick,
    handleIndicatorClick,
    shouldShowIndicator,
    isIndicatorConnected,
    isIndicatorActive,
    debouncedUpdate,
    onUpdate,
    position,
    color,
    headerText,
    scale,
    faceColors,
    faceTexts,
    faceTextStyles,
    textStyle,
    tetrahedronTriangleFaces,
    tetrahedronFaces,
    selectedIndicators.length,
    showAllCubesIndicators,
    globalIndicatorSelected,
    showFaceText,
  ]);

  // LOD-based rendering decisions
  // Grouping containers are excluded from LOD system - always render at full detail
  const isGroupingContainer = objectData?.merfolkData?.isContainer === true;
  
  // If LOD level is LOW (2), don't render (except grouping containers)
  if (!isGroupingContainer && lodLevel === LOD_LEVELS.LOW) {
    return null;
  }
  
  // Determine what to render based on LOD level
  // Grouping containers always render at full detail
  // All other objects respond to LOD
  const isLODRestricted = !isGroupingContainer;
  const shouldRenderFullDetail = !isLODRestricted || lodLevel === LOD_LEVELS.FULL;

  return (
    <>
      {/* Snap line indicator */}
      {tetrahedronState.showSnapLine && (
        <SnapLineIndicator
          points={tetrahedronState.snapLinePoints}
          axis={tetrahedronState.snapAxis}
          visible={tetrahedronState.showSnapLine}
        />
      )}
      {/* Main tetrahedron group */}
      <group
        ref={contentRef}
        position={position}
        scale={tetrahedronState.scale || scale}
        userData={{
          isTetrahedron: true,
          objectId: id.toString(),
        }}
        onPointerEnter={(e) => {
          e.stopPropagation();
          setHoveredObjectId(id);
        }}
        onPointerLeave={(e) => {
          e.stopPropagation();
          setHoveredObjectId(null);
        }}
      >
        {/* Invisible hit box - only active when not selected to avoid interfering with face clicks */}
        {!selected && (
          <mesh
            ref={meshRef}
            onClick={(e) => {
              e.stopPropagation();
              handleSceneClick();
            }}
            userData={{ isHelper: true, isClickHelper: true }}
          >
            <boxGeometry args={[10, 10, 10]} />
            <primitive object={HITBOX_MATERIAL} attach="material" />
          </mesh>
        )}

        {/* LOD MEDIUM: Simple boxes now rendered by GlobalTetrahedronMediumLODRenderer (1 draw call for all) */}

        {/* Tetrahedron edge lines - batched into single InstancedLine */}
        {/* Only render if renderEdges is true (when not using GlobalTetrahedronEdgesRenderer) */}
        {shouldRenderFullDetail && renderEdges && (
          <InstancedLine
            points={tetrahedronEdgePoints}
            color={tetrahedronState.color || color}
            lineWidth={lineWidth !== undefined ? lineWidth : 1}
          />
        )}

        {/* Render faces - only at full detail and when needed */}
        {shouldRenderFullDetail && shouldMountFaces && renderFaces}

        {/* Face text elements - only at full detail */}
        {shouldRenderFullDetail && renderFaceTexts}

        {/* Header text - only at full detail */}
        {shouldRenderFullDetail && (tetrahedronState.headerText || headerText) && (
          <group
            scale={(tetrahedronState.scale || scale).map(
              (s) => 1 / Math.max(0.0001, s)
            )}
            position={getUIPositions.headerText}
          >
            <AtlasTextSprite
              text={tetrahedronState.headerText || headerText}
              position={[0, 0, 0]}
              followTarget={meshRef}
              onClick={(e) => {
                e.stopPropagation();
                e.nativeEvent?.stopPropagation?.();
                tetrahedronActions.setTetrahedronShowHeaderTextStyleUI(
                  id,
                  true
                );
                tetrahedronActions.setTetrahedronActiveTextFace(id, null);
                setActiveTextStyleUI(contentRef.current);
                tetrahedronActions.setTetrahedronSelectedFace(id, null);
                tetrahedronActions.setTetrahedronShowObjectUI(id, false);
              }}
              style={{
                ...(tetrahedronState.textStyle || textStyle),
                isHeaderText: true,
              }}
              billboard={true}
              scale={1}
            />

            {tetrahedronState.showHeaderTextStyleUI && (
              <TextStyleUI
                position={[0, 2 / (tetrahedronState.scale || scale)[1], 0]}
                followTarget={null}
                onStyleChange={(newStyle) => {
                  const updatedTextStyle = {
                    ...(tetrahedronState.textStyle || textStyle),
                    ...newStyle,
                  };

                  tetrahedronActions.updateTetrahedron(id, {
                    textStyle: updatedTextStyle,
                  });

                  if (onUpdate) {
                    onUpdate(id, {
                      color: tetrahedronState.color || color,
                      headerText: tetrahedronState.headerText || headerText,
                      scale: tetrahedronState.scale || scale,
                      position: position,
                      faceColors: tetrahedronState.faceColors || faceColors,
                      faceTexts: tetrahedronState.faceTexts || faceTexts,
                      faceTextStyles:
                        tetrahedronState.faceTextStyles || faceTextStyles,
                      textStyle: updatedTextStyle,
                      type: 'tetrahedron',
                    });
                  }
                }}
                onClose={() => {
                  tetrahedronActions.setTetrahedronShowHeaderTextStyleUI(
                    id,
                    false
                  );
                  setActiveTextStyleUI(null);
                }}
                currentStyle={tetrahedronState.textStyle || textStyle}
              />
            )}
          </group>
        )}

        {/* Header input - only at full detail */}
        {shouldRenderFullDetail && selected && tetrahedronState.showHeader && (
          <HeaderInput
            position={getUIPositions.headerInput}
            onTextSubmit={handleHeaderSubmit}
            inputId={`tetrahedron-${id}-header`}
            followTarget={null}
            initialText={tetrahedronState.headerText || headerText}
          />
        )}
      </group>
      {/* Object UI */}
      {selected &&
        !tetrahedronState.showHeader &&
        tetrahedronState.showObjectUI && (
          <ObjectUI
            onTransformToggle={handleTransformToggle}
            onHeaderToggle={handleHeaderToggle}
            onResizeToggle={handleResizeToggle}
            onLineColorChange={handleLineColorChange}
            onDelete={() => onDelete?.(id)}
            showTransform={tetrahedronState.showTransform}
            showHeader={tetrahedronState.showHeader}
            followTarget={contentRef}
            objectId={id}
          />
        )}
      {/* Transform controls */}
      {selected && tetrahedronState.showTransform && contentRef.current && (
        <DreiTransformControls
          object={contentRef.current}
          onObjectChange={handleDrag}
          onMouseDown={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = false;
            }
          }}
          onMouseUp={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = true;
            }
            // Clear transform map - state is now authoritative
            tetrahedronTransformMap.delete(id);
          }}
          mode="translate"
          space="world"
          size={0.5}
        />
      )}
      {/* Scale transform controls */}
      {selected && tetrahedronState.isResizing && contentRef.current && (
        <DreiTransformControls
          object={contentRef.current}
          onChange={handleScale}
          onMouseDown={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = false;
            }
            onTransformStart?.(id);
          }}
          onMouseUp={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = true;
            }

            // Clear transform map - state is now authoritative
            tetrahedronTransformMap.delete(id);

            if (onUpdate) {
              onUpdate(id, {
                type: 'tetrahedron',
                position: position,
                scale: tetrahedronState.scale || scale,
                color: tetrahedronState.color || color,
                headerText: tetrahedronState.headerText || headerText,
                faceColors: tetrahedronState.faceColors || faceColors,
                faceTexts: tetrahedronState.faceTexts || faceTexts,
                faceTextStyles:
                  tetrahedronState.faceTextStyles || faceTextStyles,
                textStyle: tetrahedronState.textStyle || textStyle,
              });
            }

            onTransformEnd?.(id);
          }}
          mode="scale"
          space="world"
          size={0.5}
        />
      )}{' '}
      {/* Original content */}
    </>
  );
};

export default React.memo(Tetrahedron, (prevProps, nextProps) => {
  // Custom comparison function
  if (prevProps.id !== nextProps.id) return false;
  if (prevProps.selected !== nextProps.selected) return false;
  if (prevProps.showAllCubesIndicators !== nextProps.showAllCubesIndicators)
    return false;
  if (prevProps.globalIndicatorSelected !== nextProps.globalIndicatorSelected)
    return false;
  if (prevProps.indicatorMode !== nextProps.indicatorMode) return false;
  if (!arraysEqual(prevProps.selectedIndicators, nextProps.selectedIndicators))
    return false;
  if (!arraysEqual(prevProps.position, nextProps.position))
    return false;
  if (!arraysEqual(prevProps.scale, nextProps.scale))
    return false;
  if (!shallowObjEqual(prevProps.faceColors, nextProps.faceColors))
    return false;
  if (!shallowObjEqual(prevProps.faceTexts, nextProps.faceTexts))
    return false;
  if (!shallowObjEqual(prevProps.faceTextStyles, nextProps.faceTextStyles))
    return false;
  if (prevProps.color !== nextProps.color) return false;
  if (prevProps.headerText !== nextProps.headerText) return false;
  return true;
});
