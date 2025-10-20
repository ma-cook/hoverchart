import React, { useRef, useMemo, useEffect, useCallback } from 'react';

import { TransformControls as DreiTransformControls } from '@react-three/drei';
import * as THREE from 'three';
import TetrahedronFace from './TetrahedronFace';
import { useFaceIndicatorStore } from '../stores';
import TextSprite from './TextSprite';
import ObjectUI from './ObjectUI';

import HeaderInput from './HeaderInput';
import TextStyleUI from './TextStyleUI';

import PooledLine from './PooledLine';
import isEqual from 'lodash/isEqual';
import {
  useTetrahedronStore,
  useObjectsStore,
  useConnectionStore,
  useIndicatorsStore,
} from '../stores';
// Import snapping utilities
import { calculateAxisSnap } from '../utils/snappingUtils';
// Import snap line indicator
import SnapLineIndicator from './SnapLineIndicator';
// Import unified utilities
import { useDebouncedUpdate } from '../hooks/useDebouncedUpdate';
import { debounce } from '../utils/unifiedPerformanceUtils';

const TETRAHEDRON_SIZE = 5;

const tetrahedronVertices = [
  [0, TETRAHEDRON_SIZE, 0], // top vertex
  [-TETRAHEDRON_SIZE, -TETRAHEDRON_SIZE, TETRAHEDRON_SIZE], // bottom-left-front
  [TETRAHEDRON_SIZE, -TETRAHEDRON_SIZE, TETRAHEDRON_SIZE], // bottom-right-front
  [0, -TETRAHEDRON_SIZE, -TETRAHEDRON_SIZE * 1.5], // bottom-back
];

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

  const tetrahedronTriangleFaces = useMemo(() => {
    const createTriangleGeometry = (vertices) => {
      const geometry = new THREE.BufferGeometry();

      const positions = new Float32Array(vertices.flat());
      const normals = new Float32Array(9); // 3 vertices * 3 components
      const uvs = new Float32Array([
        0.5,
        1.0, // top vertex
        0.0,
        0.0, // bottom left
        1.0,
        0.0, // bottom right
      ]);

      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

      // Calculate normal for the triangle
      const v1 = new THREE.Vector3(
        vertices[0][0],
        vertices[0][1],
        vertices[0][2]
      );
      const v2 = new THREE.Vector3(
        vertices[1][0],
        vertices[1][1],
        vertices[1][2]
      );
      const v3 = new THREE.Vector3(
        vertices[2][0],
        vertices[2][1],
        vertices[2][2]
      );

      const normal = new THREE.Vector3()
        .crossVectors(
          new THREE.Vector3().subVectors(v2, v1),
          new THREE.Vector3().subVectors(v3, v1)
        )
        .normalize();

      // Set the same normal for all vertices
      for (let i = 0; i < 3; i++) {
        normals[i * 3] = normal.x;
        normals[i * 3 + 1] = normal.y;
        normals[i * 3 + 2] = normal.z;
      }

      geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));

      // Add indices for proper face rendering and raycasting
      const indices = new Uint16Array([0, 1, 2]);
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));

      // Disable frustum culling to prevent premature culling at edge angles
      geometry.frustumCulled = false;

      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();
      return geometry;
    };

    return {
      bottom: createTriangleGeometry([
        tetrahedronVertices[1], // bottom-left-front
        tetrahedronVertices[2], // bottom-right-front
        tetrahedronVertices[3], // bottom-back
      ]),
      front: createTriangleGeometry([
        tetrahedronVertices[0], // top
        tetrahedronVertices[2], // bottom-right-front
        tetrahedronVertices[1], // bottom-left-front
      ]),
      left: createTriangleGeometry([
        tetrahedronVertices[0], // top
        tetrahedronVertices[1], // bottom-left-front
        tetrahedronVertices[3], // bottom-back
      ]),
      right: createTriangleGeometry([
        tetrahedronVertices[0], // top
        tetrahedronVertices[3], // bottom-back
        tetrahedronVertices[2], // bottom-right-front
      ]),
    };
  }, []);

  // Get object data from objects store
  const objects = useObjectsStore((state) => state.objects);
  const objectData = objects.find((obj) => obj.id === id);

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

  // Get connections from store
  const connectionsFromStore = useConnectionStore((state) => state.connections);

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

  // Tetrahedron edge line points (wireframe)
  const tetrahedronLinePoints = useMemo(
    () => [
      // Bottom triangle
      tetrahedronVertices[1],
      tetrahedronVertices[2],
      tetrahedronVertices[2],
      tetrahedronVertices[3],
      tetrahedronVertices[3],
      tetrahedronVertices[1],
      // Top edges
      tetrahedronVertices[0],
      tetrahedronVertices[1],
      tetrahedronVertices[0],
      tetrahedronVertices[2],
      tetrahedronVertices[0],
      tetrahedronVertices[3],
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
        fontSize: 'medium',
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
      tetrahedronActions.updateTetrahedron(id, { scale: newScale });
    },
    [id, tetrahedronState.scale, scale, tetrahedronActions.updateTetrahedron]
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
          <TextSprite
            text={faceText}
            position={[0, yOffset, 0]}
            followTarget={null}
            onClick={(e) => {
              e.stopPropagation();
              e.nativeEvent?.stopPropagation?.();
              handleFaceTextStyleClick(e, name);
              return false; // Prevent event bubbling
            }}
            style={{
              ...textStyle,
              fixedSize: true,
              isFaceText: true,
              renderOrder: 2,
              depthTest: true,
              depthWrite: true,
            }}
            normal={normal}
            billboard={false}
            side={THREE.FrontSide}
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
  ]);

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
            <meshBasicMaterial
              visible={false}
              side={THREE.DoubleSide} // Allow interaction from both sides
            />
          </mesh>
        )}

        {/* Tetrahedron edge lines */}
        <PooledLine
          points={tetrahedronLinePoints}
          color={tetrahedronState.color || color}
          lineWidth={lineWidth !== undefined ? lineWidth : 1}
          dashed={false}
          enablePooling={true}
        />

        {/* Render faces */}
        {renderFaces}

        {/* Face text elements */}
        {renderFaceTexts}

        {/* Header text */}
        {(tetrahedronState.headerText || headerText) && (
          <group
            scale={(tetrahedronState.scale || scale).map(
              (s) => 1 / Math.max(0.0001, s)
            )}
            position={getUIPositions.headerText}
          >
            <TextSprite
              text={tetrahedronState.headerText || headerText}
              position={[0, 0, 0]}
              followTarget={null}
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
                fixedSize: false,
              }}
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

        {/* Header input */}
        {selected && tetrahedronState.showHeader && (
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
  if (
    JSON.stringify(prevProps.selectedIndicators) !==
    JSON.stringify(nextProps.selectedIndicators)
  )
    return false;
  if (JSON.stringify(prevProps.position) !== JSON.stringify(nextProps.position))
    return false;
  if (JSON.stringify(prevProps.scale) !== JSON.stringify(nextProps.scale))
    return false;
  if (
    JSON.stringify(prevProps.faceColors) !==
    JSON.stringify(nextProps.faceColors)
  )
    return false;
  if (
    JSON.stringify(prevProps.faceTexts) !== JSON.stringify(nextProps.faceTexts)
  )
    return false;
  if (
    JSON.stringify(prevProps.faceTextStyles) !==
    JSON.stringify(nextProps.faceTextStyles)
  )
    return false;
  if (prevProps.color !== nextProps.color) return false;
  if (prevProps.headerText !== nextProps.headerText) return false;
  return true;
});
