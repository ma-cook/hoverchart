import React, { useRef, useMemo, useEffect, useCallback } from 'react';

import { TransformControls as DreiTransformControls } from '@react-three/drei';
import * as THREE from 'three';
import FaceIndicator from './FaceIndicator';
import TextSprite from './TextSprite';
import ObjectUI from './ObjectUI';
import FaceUI from './FaceUI';
import HeaderInput from './HeaderInput';
import TextStyleUI from './TextStyleUI';
import FaceTextInput from './FaceTextInput';
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

// Constants to avoid recreation
const DEFAULT_COLOR = '#000000';
const DEFAULT_OPACITY = 0.1;
const SELECTED_OPACITY = 0.3;
const TETRAHEDRON_SIZE = 5;

// Tetrahedron face definitions (4 triangular faces)
const tetrahedronFaces = [
  { name: 'bottom', normal: [0, -1, 0] },
  { name: 'front', normal: [0, 0.5, 0.866] },
  { name: 'left', normal: [-0.866, 0.5, -0.433] },
  { name: 'right', normal: [0.866, 0.5, -0.433] },
];

// Tetrahedron vertices (regular tetrahedron)
const tetrahedronVertices = [
  [0, TETRAHEDRON_SIZE, 0], // top vertex
  [-TETRAHEDRON_SIZE, -TETRAHEDRON_SIZE, TETRAHEDRON_SIZE], // bottom-left-front
  [TETRAHEDRON_SIZE, -TETRAHEDRON_SIZE, TETRAHEDRON_SIZE], // bottom-right-front
  [0, -TETRAHEDRON_SIZE, -TETRAHEDRON_SIZE * 1.5], // bottom-back
];

// Create triangle geometries for each face
// (This will be created inside the component)

// Define the actual triangle faces using tetrahedron vertices
// (This will be created inside the component)

// Face material properties (base settings)
const faceMaterialProps = {
  transparent: true,
  opacity: 0.1,
  side: THREE.DoubleSide, // Use DoubleSide to prevent premature culling
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -4,
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
  activeIndicator,
  indicatorMode,
  selectedIndicators = [],
  setActiveTextStyleUI,
  onUpdate,
  onDelete,
  onTransformStart,
  onTransformEnd,
  onMove,
}) => {
  // Create triangle geometries for each face (moved inside component to ensure proper disposal)
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
  const position = objectData?.position || [0, 0, 0];
  const scale = objectData?.scale || [1, 1, 1];
  const color = objectData?.color || DEFAULT_COLOR;
  const headerText = objectData?.headerText || '';
  const textStyle = objectData?.textStyle || { fontSize: 1.5, color: 'black' };
  const faceColors = objectData?.faceColors || {};
  const faceTexts = objectData?.faceTexts || {};
  const faceTextStyles = objectData?.faceTextStyles || {};

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

  // Store state and actions
  const tetrahedron = useTetrahedronStore((state) => state.getTetrahedron(id));
  const createTetrahedron = useTetrahedronStore(
    (state) => state.createTetrahedron
  );
  const updateTetrahedron = useTetrahedronStore(
    (state) => state.updateTetrahedron
  );
  const selectTetrahedron = useTetrahedronStore(
    (state) => state.selectTetrahedron
  );
  const deselectTetrahedron = useTetrahedronStore(
    (state) => state.deselectTetrahedron
  );
  const isTetrahedronSelected = useTetrahedronStore((state) =>
    state.isTetrahedronSelected(id)
  );
  const setTetrahedronSelectedFace = useTetrahedronStore(
    (state) => state.setTetrahedronSelectedFace
  );
  const setTetrahedronSelectedIndicator = useTetrahedronStore(
    (state) => state.setTetrahedronSelectedIndicator
  );
  const setTetrahedronShowTransform = useTetrahedronStore(
    (state) => state.setTetrahedronShowTransform
  );
  const setTetrahedronShowHeader = useTetrahedronStore(
    (state) => state.setTetrahedronShowHeader
  );
  const setTetrahedronShowFaceTextInput = useTetrahedronStore(
    (state) => state.setTetrahedronShowFaceTextInput
  );
  const setTetrahedronIsResizing = useTetrahedronStore(
    (state) => state.setTetrahedronIsResizing
  );
  const setTetrahedronShowObjectUI = useTetrahedronStore(
    (state) => state.setTetrahedronShowObjectUI
  );
  const setTetrahedronShowHeaderTextStyleUI = useTetrahedronStore(
    (state) => state.setTetrahedronShowHeaderTextStyleUI
  );
  const setTetrahedronActiveTextFace = useTetrahedronStore(
    (state) => state.setTetrahedronActiveTextFace
  );
  const updateTetrahedronFaceColor = useTetrahedronStore(
    (state) => state.updateTetrahedronFaceColor
  );
  const updateTetrahedronFaceText = useTetrahedronStore(
    (state) => state.updateTetrahedronFaceText
  );
  const updateTetrahedronFaceTextStyle = useTetrahedronStore(
    (state) => state.updateTetrahedronFaceTextStyle
  );

  // Get hover state from indicators store
  const hoveredObjectId = useIndicatorsStore((state) => state.hoveredObjectId);
  const setHoveredObjectId = useIndicatorsStore(
    (state) => state.setHoveredObjectId
  );

  // Initialize tetrahedron in store if it doesn't exist
  useEffect(() => {
    if (!tetrahedron) {
      createTetrahedron(id, {
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
    tetrahedron,
    createTetrahedron,
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
    if (selected && !isTetrahedronSelected) {
      selectTetrahedron(id);
    } else if (!selected && isTetrahedronSelected) {
      deselectTetrahedron(id);
    }
  }, [
    selected,
    isTetrahedronSelected,
    selectTetrahedron,
    deselectTetrahedron,
    id,
  ]);

  // Reset selection states when tetrahedron is deselected
  useEffect(() => {
    if (!selected) {
      setTetrahedronSelectedFace(id, null);
      setTetrahedronSelectedIndicator(id, null);
      setTetrahedronShowTransform(id, false);
      setActiveTextStyleUI(null);
      setTetrahedronShowHeaderTextStyleUI(id, false);
      setTetrahedronActiveTextFace(id, null);
    }
  }, [
    selected,
    id,
    setTetrahedronSelectedFace,
    setTetrahedronSelectedIndicator,
    setTetrahedronShowTransform,
    setActiveTextStyleUI,
    setTetrahedronShowHeaderTextStyleUI,
    setTetrahedronActiveTextFace,
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
        tetrahedron?.selectedIndicator === faceName &&
        !isIndicatorConnected(faceName)
      );
    },
    [tetrahedron?.selectedIndicator, isIndicatorConnected]
  );

  // Calculate UI positions based on tetrahedron scale
  const getUIPositions = useMemo(() => {
    const uiOffset = 0.01;
    const currentScale = tetrahedron?.scale || scale;

    return {
      objectUI: [0, TETRAHEDRON_SIZE + 20 / currentScale[1], uiOffset],
      headerInput: [0, TETRAHEDRON_SIZE + 5 / currentScale[1], uiOffset],
      headerText: [0, TETRAHEDRON_SIZE + 5 / currentScale[1], uiOffset],
      textStyleUI: [0, TETRAHEDRON_SIZE + 7 / currentScale[1], uiOffset],
    };
  }, [tetrahedron?.scale, scale]);

  // Determine if an indicator should be shown
  const shouldShowIndicator = useCallback(
    (faceName) => {
      if (isIndicatorConnected(faceName)) {
        return true;
      }

      if (selectedIndicators.length > 0) {
        return true;
      }

      if (tetrahedron?.selectedFace === faceName && selected) {
        return true;
      }

      if (showAllCubesIndicators) {
        return true;
      }

      switch (indicatorMode) {
        case 'all':
          return true;
        case 'indicators':
          // In indicators mode, ONLY show for the currently hovered object
          return hoveredObjectId === id;
        case 'single':
          return (
            (activeIndicator?.cube?.id === id &&
              activeIndicator?.face === faceName) ||
            isIndicatorConnected(faceName)
          );
        default:
          // In default mode, don't show indicators
          return false;
      }
    },
    [
      isIndicatorConnected,
      selectedIndicators.length,
      tetrahedron?.selectedFace,
      selected,
      showAllCubesIndicators,
      indicatorMode,
      activeIndicator,
      id,
      hoveredObjectId,
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
  const getFaceMaterial = useCallback(
    (faceName) => ({
      ...faceMaterialProps,
      color: tetrahedron?.faceColors?.[faceName]
        ? new THREE.Color(tetrahedron.faceColors[faceName])
        : tetrahedron?.selectedFace === faceName
        ? new THREE.Color('#99ccff')
        : new THREE.Color('#000000'),
      opacity: tetrahedron?.faceColors?.[faceName]
        ? 1.0
        : tetrahedron?.selectedFace === faceName
        ? SELECTED_OPACITY
        : DEFAULT_OPACITY,
    }),
    [tetrahedron?.faceColors, tetrahedron?.selectedFace]
  );

  // Event handlers
  const handleSceneClick = useCallback(() => {
    setTetrahedronShowObjectUI(id, true);
    setTetrahedronShowHeaderTextStyleUI(id, false);
    setTetrahedronActiveTextFace(id, null);
    setActiveTextStyleUI(null);
    onClick();
  }, [
    onClick,
    setActiveTextStyleUI,
    id,
    setTetrahedronShowObjectUI,
    setTetrahedronShowHeaderTextStyleUI,
    setTetrahedronActiveTextFace,
  ]);

  // Add useCallback for updating database
  const updateDatabase = useCallback(() => {
    if (!onUpdate || !id || !objectData) return;

    const { isInitialLoading } = useObjectsStore.getState();
    if (isInitialLoading) {
      return;
    }

    const currentScale = tetrahedron?.scale || objectData.scale || [1, 1, 1];

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
  }, [id, objectData, onUpdate, tetrahedron]);

  // Use unified debounced update instead of duplicate pattern
  useDebouncedUpdate(updateDatabase, objectData);

  const handleFaceClick = useCallback(
    (e, faceName) => {
      e.stopPropagation();
      const newSelectedFace =
        tetrahedron?.selectedFace === faceName ? null : faceName;
      setTetrahedronSelectedFace(id, newSelectedFace);
      setTetrahedronShowObjectUI(id, false);

      onFaceClick?.({
        cube: contentRef.current, // Changed from 'tetrahedron' to 'cube' for compatibility
        face: faceName,
        id: id,
      });
    },
    [
      id,
      onFaceClick,
      tetrahedron?.selectedFace,
      setTetrahedronSelectedFace,
      setTetrahedronShowObjectUI,
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

      setTetrahedronSelectedIndicator(
        id,
        tetrahedron?.selectedIndicator === faceName ? null : faceName
      );

      const { position: facePos } = getFaceIndicatorProps(faceName);

      // Create indicator data structure similar to cube
      const indicatorData = {
        type: 'tetrahedron',
        face: faceName,
        cube: {
          id,
          position: position,
          scale: tetrahedron?.scale || scale,
          userData: { objectId: id.toString() },
        },
        position: position, // This will be updated with world position
        faceCenter: facePos,
      };

      // Calculate world position with more robust error handling
      let worldPosition = position; // Fallback to object center

      try {
        const worldPos = new THREE.Vector3(facePos[0], facePos[1], facePos[2]);

        if (contentRef.current) {
          // Force matrix update to ensure we have the latest transform
          contentRef.current.updateMatrixWorld(true);

          if (contentRef.current.matrixWorld) {
            worldPos.applyMatrix4(contentRef.current.matrixWorld);
            worldPosition = [worldPos.x, worldPos.y, worldPos.z];

            console.log('🔺 Tetrahedron face click:', {
              face: faceName,
              localFacePos: facePos,
              worldPosition: worldPosition,
              objectPosition: position,
              scale: tetrahedron?.scale || scale,
            });
          } else {
            console.warn('⚠️ No matrixWorld available for tetrahedron:', id);
          }
        } else {
          console.warn('⚠️ No contentRef available for tetrahedron:', id);
        }
      } catch (error) {
        console.error(
          '❌ Error calculating tetrahedron face world position:',
          error
        );
      }

      // Update the indicator data with the calculated world position
      indicatorData.position = worldPosition;

      console.log('🔺 Final tetrahedron indicator data:', indicatorData);

      onFaceIndicatorClick?.(indicatorData);
    },
    [
      id,
      onFaceIndicatorClick,
      tetrahedron?.selectedIndicator,
      tetrahedron?.scale,
      scale,
      setTetrahedronSelectedIndicator,
      position,
    ]
  );

  const handleTransformToggle = useCallback(() => {
    const newShowTransform = !tetrahedron?.showTransform;
    setTetrahedronShowTransform(id, newShowTransform);
    if (newShowTransform) {
      setTetrahedronIsResizing(id, false);
    }
  }, [
    tetrahedron?.showTransform,
    id,
    setTetrahedronShowTransform,
    setTetrahedronIsResizing,
  ]);

  const handleResizeToggle = useCallback(() => {
    const newIsResizing = !tetrahedron?.isResizing;
    setTetrahedronIsResizing(id, newIsResizing);
    if (newIsResizing) {
      setTetrahedronShowTransform(id, false);
    }
  }, [
    tetrahedron?.isResizing,
    id,
    setTetrahedronIsResizing,
    setTetrahedronShowTransform,
  ]);

  const handleHeaderToggle = useCallback(() => {
    setTetrahedronShowHeader(id, !tetrahedron?.showHeader);
    if (!tetrahedron?.showHeader) {
      setTetrahedronShowObjectUI(id, false);
    }
  }, [
    tetrahedron?.showHeader,
    id,
    setTetrahedronShowHeader,
    setTetrahedronShowObjectUI,
  ]);

  const handleHeaderSubmit = useCallback(
    (text) => {
      updateTetrahedron(id, { headerText: text });
      if (onUpdate) {
        onUpdate(id, {
          color: tetrahedron?.color || color,
          headerText: text,
          scale: tetrahedron?.scale || scale,
          position: position,
          faceColors: tetrahedron?.faceColors || faceColors,
          faceTexts: tetrahedron?.faceTexts || faceTexts,
          faceTextStyles: tetrahedron?.faceTextStyles || faceTextStyles,
          textStyle: tetrahedron?.textStyle || textStyle,
          type: 'tetrahedron',
        });
      }
      setTetrahedronShowHeader(id, false);
      setTetrahedronShowObjectUI(id, false);
    },
    [
      id,
      onUpdate,
      tetrahedron,
      color,
      scale,
      faceColors,
      faceTexts,
      faceTextStyles,
      textStyle,
      updateTetrahedron,
      setTetrahedronShowHeader,
      setTetrahedronShowObjectUI,
      position,
    ]
  );

  const handleLineColorChange = useCallback(
    (newColor) => {
      updateTetrahedron(id, { color: newColor });

      // Use unified debounced update
      debouncedUpdate(id, {
        color: newColor,
        headerText: tetrahedron?.headerText || headerText,
        scale: tetrahedron?.scale || scale,
        position: position,
        faceColors: tetrahedron?.faceColors || faceColors,
        faceTexts: tetrahedron?.faceTexts || faceTexts,
        faceTextStyles: tetrahedron?.faceTextStyles || faceTextStyles,
        textStyle: tetrahedron?.textStyle || textStyle,
        type: 'tetrahedron',
      });
    },
    [
      id,
      debouncedUpdate,
      tetrahedron,
      headerText,
      scale,
      faceColors,
      faceTexts,
      faceTextStyles,
      textStyle,
      updateTetrahedron,
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

        updateTetrahedron(id, {
          showSnapLine: true,
          snapLinePoints: snapResult.linePoints,
          snapAxis: snapResult.snapAxis,
        });

        setTimeout(() => {
          updateTetrahedron(id, { showSnapLine: false });
        }, 2000);
      } else {
        updateTetrahedron(id, { showSnapLine: false });
      }

      const updatedObjects = currentObjects.map((obj) =>
        obj.id === id ? { ...obj, position: finalPosition } : obj
      );
      objectsStore.setObjects(updatedObjects);

      if (onMove) {
        onMove(finalPosition);
      }

      updateTetrahedron(id, { position: finalPosition });
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
      const currentScale = tetrahedron?.scale || scale;
      if (
        Math.abs(newScale[0] - currentScale[0]) < epsilon &&
        Math.abs(newScale[1] - currentScale[1]) < epsilon &&
        Math.abs(newScale[2] - currentScale[2]) < epsilon
      ) {
        return;
      }
      updateTetrahedron(id, { scale: newScale });
    },
    [id, tetrahedron?.scale, scale, updateTetrahedron]
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

      setTetrahedronActiveTextFace(id, faceName);
      setActiveTextStyleUI(contentRef.current);
      setTetrahedronShowHeaderTextStyleUI(id, false);
      setTetrahedronSelectedFace(id, null);
      setTetrahedronShowObjectUI(id, false);

      return false; // Prevent event bubbling
    },
    [
      id,
      setTetrahedronActiveTextFace,
      setActiveTextStyleUI,
      setTetrahedronShowHeaderTextStyleUI,
      setTetrahedronSelectedFace,
      setTetrahedronShowObjectUI,
    ]
  );

  const handleFaceTextStyleChange = useCallback(
    (newStyle) => {
      const activeFace = tetrahedron?.activeTextFace;
      if (!activeFace) return;

      const updatedFaceTextStyles = {
        ...(tetrahedron?.faceTextStyles || faceTextStyles),
        [activeFace]: {
          ...(tetrahedron?.faceTextStyles?.[activeFace] ||
            faceTextStyles?.[activeFace] ||
            {}),
          ...newStyle,
        },
      };

      updateTetrahedronFaceTextStyle(id, activeFace, {
        ...(tetrahedron?.faceTextStyles?.[activeFace] ||
          faceTextStyles?.[activeFace] ||
          {}),
        ...newStyle,
      });

      if (onUpdate) {
        // Use unified debounced update
        debouncedUpdate(id, {
          color: tetrahedron?.color || color,
          headerText: tetrahedron?.headerText || headerText,
          scale: tetrahedron?.scale || scale,
          position: position,
          faceColors: tetrahedron?.faceColors || faceColors,
          faceTexts: tetrahedron?.faceTexts || faceTexts,
          faceTextStyles: updatedFaceTextStyles,
          textStyle: tetrahedron?.textStyle || textStyle,
          type: 'tetrahedron',
        });
      }
    },
    [
      id,
      debouncedUpdate,
      tetrahedron,
      color,
      headerText,
      scale,
      position,
      faceColors,
      faceTexts,
      faceTextStyles,
      textStyle,
      updateTetrahedronFaceTextStyle,
      onUpdate,
    ]
  );

  // Render face texts
  const renderFaceTexts = useMemo(() => {
    return tetrahedronFaces.map(({ name, normal }) => {
      const faceText = tetrahedron?.faceTexts?.[name] || faceTexts?.[name];
      if (!faceText) return null;

      const { position: facePos, rotation } = getFaceIndicatorProps(name);
      const textStyle = tetrahedron?.faceTextStyles?.[name] ||
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
          : tetrahedron?.faceColors && tetrahedron.faceColors[name]
          ? 0.05
          : 0.03;

      // Calculate position with offset to prevent z-fighting
      const offsetPosition = [
        facePos[0] + normal[0] * offsetMultiplier,
        facePos[1] + normal[1] * offsetMultiplier,
        facePos[2] + normal[2] * offsetMultiplier,
      ];

      // Calculate inverse scale
      const currentScale = tetrahedron?.scale || scale;
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
          {tetrahedron?.activeTextFace === name && (
            <TextStyleUI
              position={[0, 6, 0]}
              onStyleChange={handleFaceTextStyleChange}
              onClose={() => {
                setTetrahedronActiveTextFace(id, null);
                setActiveTextStyleUI(null);
                setTetrahedronShowHeaderTextStyleUI(id, false);
              }}
              currentStyle={
                tetrahedron?.faceTextStyles?.[name] ||
                faceTextStyles?.[name] ||
                {}
              }
            />
          )}
        </group>
      );
    });
  }, [
    tetrahedron?.faceTexts,
    tetrahedron?.faceTextStyles,
    tetrahedron?.faceColors,
    tetrahedron?.activeTextFace,
    tetrahedron?.scale,
    faceTexts,
    faceTextStyles,
    scale,
    getFaceTextOffset,
    handleFaceTextStyleClick,
    handleFaceTextStyleChange,
    id,
    setTetrahedronActiveTextFace,
    setActiveTextStyleUI,
    setTetrahedronShowHeaderTextStyleUI,
  ]);

  // Render faces
  const renderFaces = useMemo(() => {
    return tetrahedronFaces.map(({ name, normal }, index) => {
      const isConnected = isIndicatorConnected(name);
      const isActive = isIndicatorActive(name);

      const displayIndicator = shouldShowIndicator(name);
      const displayFace =
        (tetrahedron?.faceColors && tetrahedron.faceColors[name]) ||
        (selected && (tetrahedron?.selectedFace === name || isActive));

      // Always make faces clickable when tetrahedron is selected
      const isClickable = selected;

      const shouldShowFaceUI =
        selected &&
        tetrahedron?.selectedFace === name &&
        !tetrahedron?.showFaceTextInput;

      // Calculate face-specific render order to prevent z-fighting
      const faceRenderOrder = displayFace
        ? 100 + index // Colored faces get higher priority
        : isClickable
        ? 50 + index
        : 10 + index; // Transparent faces get lower priority

      return (
        <mesh
          key={`face-${name}`}
          position={[0, 0, 0]} // Position at origin since geometry already has correct vertices
          onClick={(e) => handleColoredFaceClick(e, name)}
          renderOrder={faceRenderOrder} // Use face-specific render order
          frustumCulled={false} // Prevent premature frustum culling at edge angles
        >
          {/* Use custom triangle geometry for this face */}
          <primitive object={tetrahedronTriangleFaces[name]} />
          <meshBasicMaterial
            {...getFaceMaterial(name)}
            transparent={true}
            depthWrite={displayFace ? true : false} // Only opaque faces write to depth buffer
            depthTest={true} // Keep depth testing to maintain proper ordering
            side={THREE.DoubleSide} // Ensure both sides are rendered to prevent culling
            renderOrder={faceRenderOrder} // Use consistent render order
            visible={displayFace || isClickable}
            alphaTest={displayFace ? 0 : 0.005} // Very low alpha test for transparent faces
            opacity={
              displayFace
                ? getFaceMaterial(name).opacity
                : isClickable
                ? 0.02 // Slightly higher opacity for better visibility
                : 0.001
            }
          />

          {shouldShowFaceUI && (
            <FaceUI
              position={[0, 1, 0]}
              normal={normal}
              onColorChange={(color) => {
                console.log(
                  '🔺 FaceUI onColorChange called for face:',
                  name,
                  'color:',
                  color
                );
                const updatedFaceColors = {
                  ...(tetrahedron?.faceColors || faceColors),
                  [name]: color,
                };

                updateTetrahedronFaceColor(id, name, color);

                if (onUpdate) {
                  // Use unified debounced update
                  debouncedUpdate(id, {
                    color: tetrahedron?.color || color,
                    headerText: tetrahedron?.headerText || headerText,
                    scale: tetrahedron?.scale || scale,
                    position: position,
                    faceColors: updatedFaceColors,
                    faceTexts: tetrahedron?.faceTexts || faceTexts,
                    faceTextStyles:
                      tetrahedron?.faceTextStyles || faceTextStyles,
                    textStyle: tetrahedron?.textStyle || textStyle,
                    type: 'tetrahedron',
                  });
                }
              }}
              face={name}
              onTextClick={() => setTetrahedronShowFaceTextInput(id, true)}
            />
          )}

          {tetrahedron?.showFaceTextInput &&
            tetrahedron?.selectedFace === name && (
              <FaceTextInput
                position={[0, 6, 0]}
                onTextSubmit={(text) => {
                  const selectedFace = tetrahedron?.selectedFace;
                  if (!selectedFace) return;

                  const updatedTexts = {
                    ...(tetrahedron?.faceTexts || faceTexts),
                    [selectedFace]: text,
                  };

                  updateTetrahedronFaceText(id, selectedFace, text);

                  if (onUpdate) {
                    onUpdate(id, {
                      color: tetrahedron?.color || color,
                      headerText: tetrahedron?.headerText || headerText,
                      scale: tetrahedron?.scale || scale,
                      position: position,
                      faceColors: tetrahedron?.faceColors || faceColors,
                      faceTexts: updatedTexts,
                      faceTextStyles:
                        tetrahedron?.faceTextStyles || faceTextStyles,
                      textStyle: tetrahedron?.textStyle || textStyle,
                      type: 'tetrahedron',
                    });
                  }

                  setTetrahedronShowFaceTextInput(id, false);
                  setTetrahedronSelectedFace(id, null);
                }}
                inputId={`tetrahedron-${id}-face-${name}`}
              />
            )}

          {displayIndicator && (
            <FaceIndicator
              position={getFaceIndicatorProps(name).position}
              rotation={[0, 0, 0]}
              onClick={(e) => handleIndicatorClick(e, name)}
              isActive={isActive}
              isConnected={isConnected}
              objectId={id}
              face={name}
              showAllCubesIndicators={showAllCubesIndicators}
              selectedIndicatorsLength={selectedIndicators?.length || 0}
            />
          )}
        </mesh>
      );
    });
  }, [
    tetrahedron?.faceColors,
    tetrahedron?.selectedFace,
    tetrahedron?.showFaceTextInput,
    selected,
    isIndicatorConnected,
    isIndicatorActive,
    handleColoredFaceClick,
    getFaceMaterial,
    shouldShowIndicator,
    handleIndicatorClick,
    id,
    tetrahedron?.faceTexts,
    tetrahedron?.faceTextStyles,
    tetrahedron?.scale,
    tetrahedron?.color,
    tetrahedron?.headerText,
    tetrahedron?.textStyle,
    faceColors,
    faceTexts,
    faceTextStyles,
    color,
    headerText,
    scale,
    position,
    textStyle,
    updateTetrahedronFaceColor,
    updateTetrahedronFaceText,
    setTetrahedronShowFaceTextInput,
    setTetrahedronSelectedFace,
    onUpdate,
    tetrahedronTriangleFaces,
  ]);

  return (
    <>
      {/* Snap line indicator */}
      {tetrahedron?.showSnapLine && (
        <SnapLineIndicator
          points={tetrahedron.snapLinePoints}
          axis={tetrahedron.snapAxis}
          visible={tetrahedron.showSnapLine}
        />
      )}
      {/* Main tetrahedron group */}
      <group
        ref={contentRef}
        position={position}
        scale={tetrahedron?.scale || scale}
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
          color={tetrahedron?.color || color}
          lineWidth={2}
          dashed={false}
          enablePooling={true}
        />

        {/* Render faces */}
        {renderFaces}

        {/* Face text elements */}
        {renderFaceTexts}

        {/* Header text */}
        {(tetrahedron?.headerText || headerText) && (
          <group
            scale={(tetrahedron?.scale || scale).map(
              (s) => 1 / Math.max(0.0001, s)
            )}
            position={getUIPositions.headerText}
          >
            <TextSprite
              text={tetrahedron?.headerText || headerText}
              position={[0, 0, 0]}
              followTarget={null}
              onClick={(e) => {
                e.stopPropagation();
                e.nativeEvent?.stopPropagation?.();
                setTetrahedronShowHeaderTextStyleUI(id, true);
                setTetrahedronActiveTextFace(id, null);
                setActiveTextStyleUI(contentRef.current);
                setTetrahedronSelectedFace(id, null);
                setTetrahedronShowObjectUI(id, false);
              }}
              style={{
                ...(tetrahedron?.textStyle || textStyle),
                isHeaderText: true,
                fixedSize: false,
              }}
            />

            {tetrahedron?.showHeaderTextStyleUI && (
              <TextStyleUI
                position={[0, 2 / (tetrahedron?.scale || scale)[1], 0]}
                followTarget={null}
                onStyleChange={(newStyle) => {
                  const updatedTextStyle = {
                    ...(tetrahedron?.textStyle || textStyle),
                    ...newStyle,
                  };

                  updateTetrahedron(id, { textStyle: updatedTextStyle });

                  if (onUpdate) {
                    onUpdate(id, {
                      color: tetrahedron?.color || color,
                      headerText: tetrahedron?.headerText || headerText,
                      scale: tetrahedron?.scale || scale,
                      position: position,
                      faceColors: tetrahedron?.faceColors || faceColors,
                      faceTexts: tetrahedron?.faceTexts || faceTexts,
                      faceTextStyles:
                        tetrahedron?.faceTextStyles || faceTextStyles,
                      textStyle: updatedTextStyle,
                      type: 'tetrahedron',
                    });
                  }
                }}
                onClose={() => {
                  setTetrahedronShowHeaderTextStyleUI(id, false);
                  setActiveTextStyleUI(null);
                }}
                currentStyle={tetrahedron?.textStyle || textStyle}
              />
            )}
          </group>
        )}

        {/* Header input */}
        {selected && tetrahedron?.showHeader && (
          <HeaderInput
            position={getUIPositions.headerInput}
            onTextSubmit={handleHeaderSubmit}
            inputId={`tetrahedron-${id}-header`}
            followTarget={null}
            initialText={tetrahedron?.headerText || headerText}
          />
        )}
      </group>
      {/* Object UI */}
      {selected && !tetrahedron?.showHeader && tetrahedron?.showObjectUI && (
        <ObjectUI
          onTransformToggle={handleTransformToggle}
          onHeaderToggle={handleHeaderToggle}
          onResizeToggle={handleResizeToggle}
          onLineColorChange={handleLineColorChange}
          onDelete={() => onDelete?.(id)}
          showTransform={tetrahedron?.showTransform}
          showHeader={tetrahedron?.showHeader}
          followTarget={contentRef}
          objectId={id}
        />
      )}
      {/* Transform controls */}
      {selected && tetrahedron?.showTransform && contentRef.current && (
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
      {selected && tetrahedron?.isResizing && contentRef.current && (
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
                scale: tetrahedron?.scale || scale,
                color: tetrahedron?.color || color,
                headerText: tetrahedron?.headerText || headerText,
                faceColors: tetrahedron?.faceColors || faceColors,
                faceTexts: tetrahedron?.faceTexts || faceTexts,
                faceTextStyles: tetrahedron?.faceTextStyles || faceTextStyles,
                textStyle: tetrahedron?.textStyle || textStyle,
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

  if (!isEqual(prevProps.position, nextProps.position)) return false;
  if (!isEqual(prevProps.scale, nextProps.scale)) return false;
  if (prevProps.color !== nextProps.color) return false;

  if (prevProps.headerText !== nextProps.headerText) return false;
  if (!isEqual(prevProps.textStyle, nextProps.textStyle)) return false;
  if (!isEqual(prevProps.faceColors, nextProps.faceColors)) return false;
  if (!isEqual(prevProps.faceTexts, nextProps.faceTexts)) return false;
  if (!isEqual(prevProps.faceTextStyles, nextProps.faceTextStyles))
    return false;

  if (
    prevProps.selectedIndicators?.length !==
    nextProps.selectedIndicators?.length
  )
    return false;

  return true;
});
