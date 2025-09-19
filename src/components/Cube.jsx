import React, {
  useRef,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from 'react';

import { TransformControls as DreiTransformControls } from '@react-three/drei';
import PooledLine from './PooledLine';
import * as THREE from 'three';
import FaceIndicator from './FaceIndicator';
import TextSprite from './TextSprite';
import ObjectUI from './ObjectUI';
import FaceUI from './FaceUI';
import HeaderInput from './HeaderInput';
import TextStyleUI from './TextStyleUI';
import FaceTextInput from './FaceTextInput';
import isEqual from 'lodash/isEqual';
import { faces, getFaceIndicatorProps, faceMaterialProps } from './cubeHelpers';
import { useCubeStore, useObjectsStore, useConnectionStore } from '../stores';
// Import snapping utilities
import { calculateAxisSnap } from '../utils/snappingUtils';
// Import snap line indicator
import SnapLineIndicator from './SnapLineIndicator';
// Import unified utilities
import { useDebouncedUpdate } from '../hooks/useDebouncedUpdate';
import { useGlobalClickHandler } from '../hooks/useGlobalClickHandler';
import { debounce } from '../utils/unifiedPerformanceUtils';

// Constants to avoid recreation
const DEFAULT_COLOR = '#000000';
const DEFAULT_OPACITY = 0.1;
const SELECTED_OPACITY = 0.3;

// Mobile-aware sizing
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
const CUBE_SIZE = isMobile ? 8 : 5; // Larger cubes on mobile
const FACE_SIZE = isMobile ? 15.6 : 9.8; // Larger faces on mobile
const FACE_THICKNESS = 0.05; // Thickness of face overlay

// Cube edges - following dodecahedron pattern for PooledLine
const cubeEdges = [
  // Bottom face edges (4 edges)
  [
    [-CUBE_SIZE, -CUBE_SIZE, -CUBE_SIZE],
    [-CUBE_SIZE, -CUBE_SIZE, CUBE_SIZE],
  ],
  [
    [-CUBE_SIZE, -CUBE_SIZE, CUBE_SIZE],
    [CUBE_SIZE, -CUBE_SIZE, CUBE_SIZE],
  ],
  [
    [CUBE_SIZE, -CUBE_SIZE, CUBE_SIZE],
    [CUBE_SIZE, -CUBE_SIZE, -CUBE_SIZE],
  ],
  [
    [CUBE_SIZE, -CUBE_SIZE, -CUBE_SIZE],
    [-CUBE_SIZE, -CUBE_SIZE, -CUBE_SIZE],
  ],

  // Top face edges (4 edges)
  [
    [-CUBE_SIZE, CUBE_SIZE, -CUBE_SIZE],
    [-CUBE_SIZE, CUBE_SIZE, CUBE_SIZE],
  ],
  [
    [-CUBE_SIZE, CUBE_SIZE, CUBE_SIZE],
    [CUBE_SIZE, CUBE_SIZE, CUBE_SIZE],
  ],
  [
    [CUBE_SIZE, CUBE_SIZE, CUBE_SIZE],
    [CUBE_SIZE, CUBE_SIZE, -CUBE_SIZE],
  ],
  [
    [CUBE_SIZE, CUBE_SIZE, -CUBE_SIZE],
    [-CUBE_SIZE, CUBE_SIZE, -CUBE_SIZE],
  ],

  // Vertical edges (4 edges)
  [
    [-CUBE_SIZE, -CUBE_SIZE, -CUBE_SIZE],
    [-CUBE_SIZE, CUBE_SIZE, -CUBE_SIZE],
  ],
  [
    [CUBE_SIZE, -CUBE_SIZE, -CUBE_SIZE],
    [CUBE_SIZE, CUBE_SIZE, -CUBE_SIZE],
  ],
  [
    [-CUBE_SIZE, -CUBE_SIZE, CUBE_SIZE],
    [-CUBE_SIZE, CUBE_SIZE, CUBE_SIZE],
  ],
  [
    [CUBE_SIZE, -CUBE_SIZE, CUBE_SIZE],
    [CUBE_SIZE, CUBE_SIZE, CUBE_SIZE],
  ],
];

/**
 * Optimized Cube component - Gets object data from store
 */
const Cube = ({
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
  // Add these new props for spatial routing
  onMove, // Add onMove prop like Sphere
}) => {
  // Get object data from objects store
  const objects = useObjectsStore((state) => state.objects);
  const objectData = objects.find((obj) => obj.id === id);

  // Get connections from connection store instead of props
  const connectionsFromStore = useConnectionStore((state) => state.connections);

  // Refs - declare early so they can be used in memoized values
  const meshRef = useRef();
  const contentRef = useRef(); // Add contentRef like in Dodecahedron
  // Memoize derived values to prevent unnecessary re-renders
  const position = useMemo(() => {
    const pos = objectData?.position;
    // Ensure position has valid numbers, not undefined/null values
    if (
      Array.isArray(pos) &&
      pos.length === 3 &&
      pos.every((val) => typeof val === 'number' && !isNaN(val))
    ) {
      return pos;
    }
    return [0, 0, 0];
  }, [objectData?.position]);
  // Debug: Watch for position changes
  useEffect(() => {
    if (objectData?.position) {
      // Position tracking for debugging - removed for production
    }
  }, [objectData?.position, id]);
  const scale = useMemo(
    () => objectData?.scale || [1, 1, 1],
    [objectData?.scale]
  );
  const color = useMemo(
    () => objectData?.color || DEFAULT_COLOR,
    [objectData?.color]
  );
  const faceColors = useMemo(
    () => objectData?.faceColors || {},
    [objectData?.faceColors]
  );
  const faceTexts = useMemo(
    () => objectData?.faceTexts || {},
    [objectData?.faceTexts]
  );
  const headerText = useMemo(() => {
    const headerTextValue = objectData?.headerText || '';
    return headerTextValue;
  }, [objectData?.headerText, id, objectData]);
  const textStyle = useMemo(
    () =>
      objectData?.textStyle || {
        fontSize: 1.5,
        color: 'black',
        underline: false,
      },
    [objectData?.textStyle]
  );
  const faceTextStyles = useMemo(
    () => objectData?.faceTextStyles || {},
    [objectData?.faceTextStyles]
  );

  // Store state and actions
  const cube = useCubeStore((state) => state.getCube(id));
  const createCube = useCubeStore((state) => state.createCube);
  const updateCube = useCubeStore((state) => state.updateCube);
  const selectCube = useCubeStore((state) => state.selectCube);
  const deselectCube = useCubeStore((state) => state.deselectCube);
  const isCubeSelected = useCubeStore((state) => state.isCubeSelected(id));
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

  // Initialize cube in store if it doesn't exist
  useEffect(() => {
    if (!cube) {
      createCube(id, {
        position,
        scale,
        color,
        faceColors,
        faceTexts,
        headerText,
        textStyle,
        faceTextStyles: {
          front: { fontSize: 0.5, color: 'black', underline: false },
          back: { fontSize: 0.5, color: 'black', underline: false },
          top: { fontSize: 0.5, color: 'black', underline: false },
          bottom: { fontSize: 0.5, color: 'black', underline: false },
          right: { fontSize: 0.5, color: 'black', underline: false },
          left: { fontSize: 0.5, color: 'black', underline: false },
          ...faceTextStyles,
        },
      });
    }
  }, [
    id,
    cube,
    createCube,
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
    if (selected && !isCubeSelected) {
      selectCube(id);
    } else if (!selected && isCubeSelected) {
      deselectCube(id);
    }
  }, [selected, isCubeSelected, selectCube, deselectCube, id]);
  // Reset selection states when cube is deselected
  useEffect(() => {
    if (!selected) {
      setCubeSelectedFace(id, null);
      setCubeSelectedIndicator(id, null);
      setCubeShowTransform(id, false);
      setActiveTextStyleUI(null);
      setCubeShowHeaderTextStyleUI(id, false);
      setCubeActiveTextFace(id, null);
    }
  }, [
    selected,
    id,
    setCubeSelectedFace,
    setCubeSelectedIndicator,
    setCubeShowTransform,
    setActiveTextStyleUI,
    setCubeShowHeaderTextStyleUI,
    setCubeActiveTextFace,
  ]);
  // Check if a face is connected via a connection
  const isIndicatorConnected = useCallback(
    (faceName) => {
      return connectionsFromStore.some(
        (conn) =>
          (conn.start?.objectId === id.toString() &&
            conn.start?.face === faceName) ||
          (conn.end?.objectId === id.toString() && conn.end?.face === faceName)
      );
    },
    [connectionsFromStore, id]
  );

  // Check if an indicator should be shown as active
  const isIndicatorActive = useCallback(
    (faceName) => {
      return (
        cube?.selectedIndicator === faceName && !isIndicatorConnected(faceName)
      );
    },
    [cube?.selectedIndicator, isIndicatorConnected]
  );

  // Calculate UI positions based on cube scale
  const getUIPositions = useMemo(() => {
    const uiOffset = 0.01; // Small z-offset to avoid z-fighting
    const currentScale = cube?.scale || scale;

    return {
      objectUI: [0, CUBE_SIZE + 20 / currentScale[1], uiOffset],
      headerInput: [0, CUBE_SIZE + 5 / currentScale[1], uiOffset],
      headerText: [0, CUBE_SIZE + 5 / currentScale[1], uiOffset],
      textStyleUI: [0, CUBE_SIZE + 7 / currentScale[1], uiOffset],
    };
  }, [cube?.scale, scale]);
  // Determine if an indicator should be shown
  const shouldShowIndicator = useCallback(
    (faceName) => {
      // Always show indicators that are connected
      if (isIndicatorConnected(faceName)) {
        return true;
      }

      // Show indicators during connection creation on ALL cubes
      if (selectedIndicators.length > 0) {
        return true;
      }

      // Show indicators for selected faces
      if (cube?.selectedFace === faceName && selected) {
        return true;
      }

      // Show all indicators when explicitly requested - already fixed this part
      if (showAllCubesIndicators) {
        return true;
      }

      // Show indicators based on mode - FIX THIS PART:
      switch (indicatorMode) {
        case 'all':
          return true; // Show on all cubes always in 'all' mode
        case 'indicators':
          return true; // Show on all cubes in 'indicators' mode as well
        case 'single':
          return (
            (activeIndicator?.cube?.id === id &&
              activeIndicator?.face === faceName) ||
            (selected && faceName === cube?.selectedFace)
          );
        default:
          return false;
      }
    },
    [
      isIndicatorConnected,
      selectedIndicators.length,
      cube?.selectedFace,
      selected,
      showAllCubesIndicators,
      indicatorMode,
      activeIndicator,
      id,
    ]
  );

  // Calculate face text offset based on font size
  const getFaceTextOffset = useCallback((fontSize, faceName) => {
    const baseOffset =
      faceName === 'top' ? 0 : faceName === 'bottom' ? 0.2 : 0.5;
    const fontSizeMultiplier = typeof fontSize === 'number' ? fontSize : 0.5;
    const textHeight = fontSizeMultiplier * 0.7;
    const zSafetyMargin = faceName === 'top' ? 0.1 : 0.3;

    return baseOffset + textHeight / 2 + zSafetyMargin;
  }, []);
  // Get material for a face
  const getFaceMaterial = useCallback(
    (faceName) => ({
      ...faceMaterialProps,
      color: cube?.faceColors?.[faceName]
        ? new THREE.Color(cube.faceColors[faceName])
        : cube?.selectedFace === faceName
        ? new THREE.Color('#99ccff')
        : new THREE.Color('#000000'),
      opacity: cube?.faceColors?.[faceName]
        ? 1.0
        : cube?.selectedFace === faceName
        ? SELECTED_OPACITY
        : DEFAULT_OPACITY,
    }),
    [cube?.faceColors, cube?.selectedFace]
  );

  // Event handlers
  const handleSceneClick = useCallback(() => {
    setCubeShowObjectUI(id, true);
    setCubeShowHeaderTextStyleUI(id, false); // Close header text style UI
    setCubeActiveTextFace(id, null); // Reset active text face for face text UI
    setActiveTextStyleUI(null); // Reset active text style UI reference
    onClick();
  }, [
    onClick,
    setActiveTextStyleUI,
    id,
    setCubeShowObjectUI,
    setCubeShowHeaderTextStyleUI,
    setCubeActiveTextFace,
  ]); // Add useCallback for updating database (same pattern as Dodecahedron)
  const updateDatabase = useCallback(() => {
    if (!onUpdate || !id || !objectData) return;

    // Skip if we're still in initial loading phase - no saves during app startup
    const { isInitialLoading } = useObjectsStore.getState();
    if (isInitialLoading) {
      return;
    }

    // Use current scale from cube store if available, fallback to objectData
    const currentScale = cube?.scale || objectData.scale || [1, 1, 1];

    // Ensure position has valid numbers, not undefined/null values
    const currentPosition = objectData.position;
    const validPosition =
      Array.isArray(currentPosition) &&
      currentPosition.length === 3 &&
      currentPosition.every((val) => typeof val === 'number' && !isNaN(val))
        ? currentPosition
        : [0, 0, 0];

    const currentState = {
      type: 'cube',
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

    // Only update if something has changed
    const lastUpdate = contentRef.current?.lastUpdate;
    if (!lastUpdate || !isEqual(lastUpdate, currentState)) {
      if (contentRef.current) {
        contentRef.current.lastUpdate = currentState;
        onUpdate(id, currentState);
      }
    }
  }, [id, objectData, onUpdate, cube]);

  // Use unified debounced update instead of duplicate pattern
  useDebouncedUpdate(updateDatabase, objectData);

  // Use unified global click handler instead of duplicate pattern
  const onClickOutside = useCallback(() => {
    if (cube?.showHeaderTextStyleUI || cube?.activeTextFace) {
      setCubeShowHeaderTextStyleUI(id, false);
      setCubeActiveTextFace(id, null);
      setActiveTextStyleUI(null);
    }
  }, [
    cube?.showHeaderTextStyleUI,
    cube?.activeTextFace,
    id,
    setCubeShowHeaderTextStyleUI,
    setCubeActiveTextFace,
    setActiveTextStyleUI,
  ]);

  useGlobalClickHandler(
    [], // No additional selectors needed, using defaults
    onClickOutside,
    'mousedown',
    [cube?.showHeaderTextStyleUI, cube?.activeTextFace]
  );

  const handleFaceClick = useCallback(
    (e, faceName) => {
      e.stopPropagation();
      setCubeSelectedFace(
        id,
        cube?.selectedFace === faceName ? null : faceName
      );
      setCubeShowObjectUI(id, false);

      onFaceClick?.({
        cube: contentRef.current,
        face: faceName,
        id: id,
      });
    },
    [
      id,
      onFaceClick,
      cube?.selectedFace,
      setCubeSelectedFace,
      setCubeShowObjectUI,
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

      setCubeSelectedIndicator(
        id,
        cube?.selectedIndicator === faceName ? null : faceName
      );

      const { position: facePos } = getFaceIndicatorProps(faceName); // Create complete indicator data
      const indicatorData = {
        type: 'cube',
        face: faceName,
        cube: {
          id,
          position: position,
          scale: cube?.scale || scale,
          userData: { objectId: id.toString() },
        },
        position: position,
        faceCenter: facePos,
      };

      // Calculate world position
      const worldPos = new THREE.Vector3(facePos[0], facePos[1], facePos[2]);
      if (contentRef.current?.matrixWorld) {
        worldPos.applyMatrix4(contentRef.current.matrixWorld);
        indicatorData.position = [worldPos.x, worldPos.y, worldPos.z];
      }

      onFaceIndicatorClick?.(indicatorData);
    },
    [
      id,
      onFaceIndicatorClick,
      cube?.selectedIndicator,
      cube?.scale,
      scale,
      setCubeSelectedIndicator,
      position,
    ]
  );
  const handleTransformToggle = useCallback(() => {
    const newShowTransform = !cube?.showTransform;
    setCubeShowTransform(id, newShowTransform);
    if (newShowTransform) {
      setCubeIsResizing(id, false);
    }
  }, [cube?.showTransform, id, setCubeShowTransform, setCubeIsResizing]);

  const handleResizeToggle = useCallback(() => {
    const newIsResizing = !cube?.isResizing;
    setCubeIsResizing(id, newIsResizing);
    if (newIsResizing) {
      setCubeShowTransform(id, false);
    }
  }, [cube?.isResizing, id, setCubeIsResizing, setCubeShowTransform]);
  const handleHeaderToggle = useCallback(() => {
    setCubeShowHeader(id, !cube?.showHeader);
    // Close ObjectUI when showing header input
    if (!cube?.showHeader) {
      setCubeShowObjectUI(id, false);
    }
  }, [cube?.showHeader, id, setCubeShowHeader, setCubeShowObjectUI]);

  const handleHeaderSubmit = useCallback(
    (text) => {
      updateCube(id, { headerText: text });
      if (onUpdate) {
        onUpdate(id, {
          color: cube?.color || color,
          headerText: text,
          scale: cube?.scale || scale,
          position: position,
          faceColors: cube?.faceColors || faceColors,
          faceTexts: cube?.faceTexts || faceTexts,
          faceTextStyles: cube?.faceTextStyles || faceTextStyles,
          textStyle: cube?.textStyle || textStyle,
          type: 'cube',
        });
      }
      setCubeShowHeader(id, false);
      setCubeShowObjectUI(id, false);
    },
    [
      id,
      onUpdate,
      cube,
      color,
      scale,
      faceColors,
      faceTexts,
      faceTextStyles,
      textStyle,
      updateCube,
      setCubeShowHeader,
      setCubeShowObjectUI,
      position,
    ]
  );

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

  const handleLineColorChange = useCallback(
    (newColor) => {
      updateCube(id, { color: newColor });

      // Use unified debounced update
      debouncedUpdate(id, {
        color: newColor,
        headerText: cube?.headerText || headerText,
        scale: cube?.scale || scale,
        position: position,
        faceColors: cube?.faceColors || faceColors,
        faceTexts: cube?.faceTexts || faceTexts,
        faceTextStyles: cube?.faceTextStyles || faceTextStyles,
        textStyle: cube?.textStyle || textStyle,
        type: 'cube',
      });
    },
    [
      id,
      debouncedUpdate,
      cube,
      headerText,
      scale,
      faceColors,
      faceTexts,
      faceTextStyles,
      textStyle,
      updateCube,
      position,
    ]
  );
  const handleFaceColorChange = useCallback(
    (color, face) => {
      const updatedFaceColors = {
        ...(cube?.faceColors || faceColors),
        [face]: color,
      };

      updateCubeFaceColor(id, face, color);

      // Use unified debounced update
      debouncedUpdate(id, {
        color: cube?.color || color,
        headerText: cube?.headerText || headerText,
        scale: cube?.scale || scale,
        position: position,
        faceColors: updatedFaceColors,
        faceTexts: cube?.faceTexts || faceTexts,
        faceTextStyles: cube?.faceTextStyles || faceTextStyles,
        textStyle: cube?.textStyle || textStyle,
        type: 'cube',
      });
    },
    [
      id,
      debouncedUpdate,
      cube,
      headerText,
      scale,
      faceColors,
      faceTexts,
      faceTextStyles,
      textStyle,
      updateCubeFaceColor,
      position,
    ]
  );
  const handleTextClick = useCallback(
    (e) => {
      e.stopPropagation();
      e.nativeEvent?.stopPropagation?.();
      setCubeShowHeaderTextStyleUI(id, true);
      setCubeActiveTextFace(id, null);
      setActiveTextStyleUI(contentRef.current);
      setCubeSelectedFace(id, null);
      // Close ObjectUI when header text is clicked
      setCubeShowObjectUI(id, false);
    },
    [
      id,
      setActiveTextStyleUI,
      setCubeShowHeaderTextStyleUI,
      setCubeActiveTextFace,
      setCubeSelectedFace,
      setCubeShowObjectUI,
    ]
  );
  const handleFaceTextClick = useCallback(() => {
    setCubeShowFaceTextInput(id, true);
  }, [id, setCubeShowFaceTextInput]);
  const handleFaceTextSubmit = useCallback(
    (text) => {
      const selectedFace = cube?.selectedFace;
      if (!selectedFace) return;

      const updatedTexts = {
        ...(cube?.faceTexts || faceTexts),
        [selectedFace]: text,
      };

      updateCubeFaceText(id, selectedFace, text);

      if (onUpdate) {
        onUpdate(id, {
          color: cube?.color || color,
          headerText: cube?.headerText || headerText,
          scale: cube?.scale || scale,
          position: position,
          faceColors: cube?.faceColors || faceColors,
          faceTexts: updatedTexts,
          faceTextStyles: cube?.faceTextStyles || faceTextStyles,
          textStyle: cube?.textStyle || textStyle,
          type: 'cube',
        });
      }

      setCubeShowFaceTextInput(id, false);
      setCubeSelectedFace(id, null);
    },
    [
      id,
      onUpdate,
      cube,
      color,
      headerText,
      scale,
      faceColors,
      faceTexts,
      faceTextStyles,
      textStyle,
      updateCubeFaceText,
      setCubeShowFaceTextInput,
      setCubeSelectedFace,
      position,
    ]
  );
  const handleFaceTextStyleClick = useCallback(
    (e, faceName) => {
      if (e) {
        e.stopPropagation();
        e.nativeEvent?.stopPropagation?.();
      }
      setActiveTextStyleUI(contentRef.current);
      setCubeActiveTextFace(id, faceName);
      setCubeSelectedFace(id, null);
      setCubeShowFaceTextInput(id, false);
      // Add this line to trigger the UI
      setCubeShowHeaderTextStyleUI(id, false);
      // Close ObjectUI when face text is clicked
      setCubeShowObjectUI(id, false);
    },
    [
      id,
      setActiveTextStyleUI,
      setCubeActiveTextFace,
      setCubeSelectedFace,
      setCubeShowFaceTextInput,
      setCubeShowHeaderTextStyleUI,
      setCubeShowObjectUI,
    ]
  );
  const handleStyleChange = useCallback(
    (newStyle) => {
      const activeTextFace = cube?.activeTextFace;
      if (activeTextFace) {
        const currentFaceTextStyles =
          cube?.faceTextStyles || faceTextStyles || {};
        const updatedFaceTextStyles = {
          ...currentFaceTextStyles,
          [activeTextFace]: {
            ...currentFaceTextStyles[activeTextFace],
            ...newStyle,
          },
        };

        updateCubeFaceTextStyle(id, activeTextFace, newStyle);

        if (onUpdate) {
          onUpdate(id, {
            color: cube?.color || color,
            headerText: cube?.headerText || headerText,
            scale: cube?.scale || scale,
            position: position,
            faceColors: cube?.faceColors || faceColors,
            faceTexts: cube?.faceTexts || faceTexts,
            faceTextStyles: updatedFaceTextStyles,
            textStyle: cube?.textStyle || textStyle,
            type: 'cube',
          });
        }
      } else {
        const updatedTextStyle = {
          ...(cube?.textStyle || textStyle),
          ...newStyle,
        };

        updateCube(id, { textStyle: updatedTextStyle });

        if (onUpdate) {
          onUpdate(id, {
            color: cube?.color || color,
            headerText: cube?.headerText || headerText,
            scale: cube?.scale || scale,
            position: position,
            faceColors: cube?.faceColors || faceColors,
            faceTexts: cube?.faceTexts || faceTexts,
            faceTextStyles: cube?.faceTextStyles || faceTextStyles,
            textStyle: updatedTextStyle,
            type: 'cube',
          });
        }
      }
    },
    [
      id,
      onUpdate,
      cube,
      color,
      headerText,
      scale,
      faceColors,
      faceTexts,
      faceTextStyles,
      textStyle,
      updateCube,
      updateCubeFaceTextStyle,
      position,
    ]
  );
  const handleDrag = (e) => {
    // Get new position from the transform controls event
    if (!e.target || !e.target.object || !e.target.object.position) {
      console.error('Invalid transform event in handleDrag');
      return;
    }

    const newPos = e.target.object.position;
    // Ensure we have valid numerical values for position
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
      // Get all objects for axis snapping calculation
      const objectsStore = useObjectsStore.getState();
      const currentObjects = Array.isArray(objectsStore.objects)
        ? objectsStore.objects
        : [];

      // Calculate any axis snapping using our utility
      const snapResult = calculateAxisSnap(currentPosition, currentObjects, id);

      // Use snapped position if available, otherwise use current position
      const finalPosition = snapResult?.position || currentPosition;

      // If snapping occurred, update the object's position in the scene and show indicator
      if (snapResult) {
        e.target.object.position.set(
          snapResult.position[0],
          snapResult.position[1],
          snapResult.position[2]
        );

        // Update cube store with snap info for the visual indicator
        updateCube(id, {
          showSnapLine: true,
          snapLinePoints: snapResult.linePoints,
          snapAxis: snapResult.snapAxis,
        });

        // Auto-hide the snap line after 2 seconds
        setTimeout(() => {
          updateCube(id, { showSnapLine: false });
        }, 2000);
      } else {
        // No snapping, ensure indicator is hidden
        updateCube(id, { showSnapLine: false });
      }

      // Update the objects store position immediately for real-time connection updates
      const updatedObjects = currentObjects.map((obj) =>
        obj.id === id ? { ...obj, position: finalPosition } : obj
      );
      objectsStore.setObjects(updatedObjects);

      // Use the spatial system via onMove instead of direct onUpdate
      if (onMove) {
        onMove(finalPosition);
      }

      // Update cube state with the final position
      updateCube(id, { position: finalPosition });
    } catch (error) {
      console.error('Error in cube handleDrag:', error);
    }
  };
  // Store actions for scale modification
  const setCubeIsScaleModified = useCubeStore(
    (state) => state.setCubeIsScaleModified
  );

  const handleScale = useCallback(
    (e) => {
      if (!e.target || !e.target.object) return;

      const newScale = [
        e.target.object.scale.x,
        e.target.object.scale.y,
        e.target.object.scale.z,
      ];

      // Only update if the scale change is significant
      const epsilon = 0.0001;
      const currentScale = cube?.scale || scale;
      if (
        Math.abs(newScale[0] - currentScale[0]) < epsilon &&
        Math.abs(newScale[1] - currentScale[1]) < epsilon &&
        Math.abs(newScale[2] - currentScale[2]) < epsilon
      ) {
        return;
      }
      updateCube(id, { scale: newScale });
      setCubeIsScaleModified(id, true);
    },
    [id, cube?.scale, scale, updateCube, setCubeIsScaleModified]
  );

  // Render colored faces and indicators
  const renderFaces = useMemo(() => {
    return faces.map(({ name, normal }) => {
      // Get indicator properties for this face
      const { position: facePos, rotation } = getFaceIndicatorProps(name);
      const isConnected = isIndicatorConnected(name);
      const isActive = isIndicatorActive(name);

      // First, check if this indicator should be shown based on our logic
      const displayIndicator = shouldShowIndicator(name); // Then, determine if the face itself should be visible (separate from indicator visibility)
      const displayFace =
        (cube?.faceColors && cube.faceColors[name]) ||
        (selected && (cube?.selectedFace === name || isActive));

      // FIXED: Always render faces (remove the conditional return null),
      // even if not displayed - this ensures they're always clickable

      return (
        <mesh
          key={`face-${name}`}
          position={[facePos[0], facePos[1], facePos[2]]}
          rotation={rotation}
          onClick={(e) => handleColoredFaceClick(e, name)}
          renderOrder={-1}
        >
          {/* Always render the geometry for click detection */}
          <boxGeometry args={[FACE_SIZE, FACE_SIZE, FACE_THICKNESS]} />
          <meshBasicMaterial
            {...getFaceMaterial(name)}
            transparent={true}
            depthWrite={false}
            side={THREE.FrontSide}
            renderOrder={-1}
            // Only make the material visible when displayFace is true
            visible={displayFace}
            opacity={displayFace ? getFaceMaterial(name).opacity : 0.001}
          />{' '}
          {/* UI elements for selected face */}
          {selected &&
            cube?.selectedFace === name &&
            !cube?.showFaceTextInput && (
              <FaceUI
                position={[0, 1, 0]}
                normal={normal}
                onColorChange={handleFaceColorChange}
                face={name}
                onTextClick={handleFaceTextClick}
              />
            )}{' '}
          {cube?.showFaceTextInput && cube?.selectedFace === name && (
            <FaceTextInput
              position={[0, 6, 0]}
              onTextSubmit={handleFaceTextSubmit}
              inputId={`cube-${id}-face-${name}`}
            />
          )}
          {/* Always render indicator if needed, independent of face visibility */}
          {displayIndicator && (
            <FaceIndicator
              position={[
                0,
                0,
                FACE_THICKNESS *
                  (cube?.faceColors && cube.faceColors[name] ? 1 : 0.5),
              ]}
              rotation={[0, 0, 0]}
              onClick={(e) => handleIndicatorClick(e, name)}
              isActive={isActive}
              isConnected={isConnected}
              objectId={id}
              face={name}
              showAllCubesIndicators={showAllCubesIndicators}
              selectedIndicatorsLength={selectedIndicators.length}
            />
          )}
        </mesh>
      );
    });
  }, [
    cube?.faceColors,
    cube?.selectedFace,
    cube?.showFaceTextInput,
    selected,
    showAllCubesIndicators,
    isIndicatorConnected,
    isIndicatorActive,
    handleColoredFaceClick,
    getFaceMaterial,
    shouldShowIndicator,
    handleIndicatorClick,
    handleFaceColorChange,
    handleFaceTextClick,
    handleFaceTextSubmit,
    id,
    selectedIndicators.length,
  ]);

  // Render face texts
  const renderFaceTexts = useMemo(() => {
    return faces.map(({ name, normal }) => {
      const faceText = cube?.faceTexts?.[name] || faceTexts?.[name];
      if (!faceText) return null;

      const { position: facePos, rotation } = getFaceIndicatorProps(name);
      const textStyle = cube?.faceTextStyles?.[name] ||
        faceTextStyles?.[name] || {
          fontSize: 0.5,
          color: 'black',
          underline: false,
        };
      const yOffset = getFaceTextOffset(textStyle.fontSize, name);

      // Adjust offset multiplier for colored faces
      const offsetMultiplier =
        name === 'bottom'
          ? 0.8
          : cube?.faceColors && cube.faceColors[name]
          ? 0.1
          : 0.05;

      // Calculate position with offset to prevent z-fighting
      const offsetPosition = [
        facePos[0] + normal[0] * offsetMultiplier,
        facePos[1] + normal[1] * offsetMultiplier,
        facePos[2] + normal[2] * offsetMultiplier,
      ];

      // Calculate inverse scale
      const currentScale = cube?.scale || scale;
      const inverseScale = currentScale.map((s) => 1 / Math.max(0.0001, s));

      // Special rotation adjustment
      let adjustedRotation;
      if (name === 'left') {
        adjustedRotation = [
          rotation[0],
          rotation[1] + Math.PI / 2,
          rotation[2],
        ];
      } else if (name === 'right') {
        adjustedRotation = [
          rotation[0],
          rotation[1] - Math.PI / 2,
          rotation[2],
        ];
      } else if (name === 'top') {
        adjustedRotation = [
          rotation[0] + Math.PI / 2,
          rotation[1],
          rotation[2],
        ];
      } else if (name === 'bottom') {
        adjustedRotation = [
          rotation[0] - Math.PI / 2,
          rotation[1],
          rotation[2],
        ];
      } else {
        adjustedRotation = rotation;
      }

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

          {/* Update condition to show TextStyleUI */}
          {cube?.activeTextFace === name && (
            <TextStyleUI
              position={[0, 6, 0]}
              onStyleChange={handleStyleChange}
              onClose={() => {
                setCubeActiveTextFace(id, null);
                setActiveTextStyleUI(null);
                setCubeShowHeaderTextStyleUI(id, false);
              }}
              currentStyle={
                cube?.faceTextStyles?.[name] || faceTextStyles?.[name] || {}
              }
            />
          )}
        </group>
      );
    });
  }, [
    cube,
    faceTexts,
    faceTextStyles,
    scale,
    getFaceTextOffset,
    handleFaceTextStyleClick,
    handleStyleChange,
    id,
    setCubeActiveTextFace,
    setActiveTextStyleUI,
    setCubeShowHeaderTextStyleUI,
  ]);

  return (
    <>
      {/* Snap line indicator - only visible during snapping */}
      {cube?.showSnapLine && (
        <SnapLineIndicator
          points={cube.snapLinePoints}
          axis={cube.snapAxis}
          visible={cube.showSnapLine}
        />
      )}
      {/* Main cube group */}{' '}
      <group
        ref={contentRef}
        position={position}
        scale={cube?.scale || scale}
        userData={{
          isCube: true,
          objectId: id.toString(),
        }}
      >
        {/* Invisible hit box */}
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation();
            handleSceneClick();
          }}
        >
          <boxGeometry
            args={[isMobile ? 16 : 10, isMobile ? 16 : 10, isMobile ? 16 : 10]}
          />
          <meshBasicMaterial visible={false} />
        </mesh>{' '}
        {/* Cube edges using PooledLine - following dodecahedron pattern */}
        {cubeEdges.map((edgePoints, idx) => (
          <PooledLine
            key={idx}
            points={edgePoints}
            color={cube?.color || color}
            lineWidth={isMobile ? 3 : 2}
            enablePooling={true}
          />
        ))}
        {/* Colored faces and indicators */}
        {renderFaces}
        {/* Face text elements */}
        {renderFaceTexts}
        {/* Header text */}
        {headerText && (
          <group
            scale={(cube?.scale || scale).map((s) => 1 / Math.max(0.0001, s))}
            position={getUIPositions.headerText}
          >
            <TextSprite
              text={headerText}
              position={[0, 0, 0]}
              followTarget={null}
              onClick={(e) => {
                e.stopPropagation();
                e.nativeEvent?.stopPropagation?.();
                handleTextClick(e);
                return false; // Prevent event bubbling
              }}
              style={{
                ...(cube?.textStyle || textStyle),
                isHeaderText: true,
                fixedSize: false,
              }}
            />
            {/* Remove the activeTextStyleUI condition */}
            {cube?.showHeaderTextStyleUI && (
              <TextStyleUI
                position={[0, 2 / (cube?.scale || scale)[1], 0]}
                followTarget={null}
                onStyleChange={handleStyleChange}
                onClose={() => {
                  setCubeShowHeaderTextStyleUI(id, false);
                  setActiveTextStyleUI(null);
                }}
                currentStyle={cube?.textStyle || textStyle}
              />
            )}
          </group>
        )}{' '}
        {/* Header input */}
        {selected && cube?.showHeader && (
          <HeaderInput
            position={getUIPositions.headerInput}
            onTextSubmit={handleHeaderSubmit}
            inputId={`cube-${id}-header`}
            followTarget={null}
            initialText={cube?.headerText || headerText}
          />
        )}
      </group>{' '}
      {/* Object UI - moved outside the cube group to avoid scale transformation */}
      {selected && !cube?.showHeader && cube?.showObjectUI && (
        <ObjectUI
          onTransformToggle={handleTransformToggle}
          onHeaderToggle={handleHeaderToggle}
          onResizeToggle={handleResizeToggle}
          onLineColorChange={handleLineColorChange}
          onDelete={() => onDelete?.(id)}
          showTransform={cube?.showTransform}
          showHeader={cube?.showHeader}
          followTarget={contentRef}
          objectId={id}
        />
      )}{' '}
      {/* Transform controls */}{' '}
      {selected && cube?.showTransform && contentRef.current && (
        <DreiTransformControls
          object={contentRef.current}
          onObjectChange={handleDrag}
          onMouseDown={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = false;
            }
            // Don't use registerTransformingObject - let it work like dodecahedron
          }}
          onMouseUp={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = true;
            }
            // No immediate save - let the debounced effect handle it like Dodecahedron
          }}
          mode="translate"
          space="world"
          size={0.5}
        />
      )}
      {/* Scale transform controls */}{' '}
      {selected && cube?.isResizing && contentRef.current && (
        <DreiTransformControls
          object={contentRef.current}
          onChange={handleScale}
          onMouseDown={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = false;
            }
            // Don't use registerTransformingObject - let it work like dodecahedron
            onTransformStart?.(id);
          }}
          onMouseUp={() => {
            if (window.orbitControls) {
              window.orbitControls.enabled = true;
            }
            // Don't use registerTransformingObject - let it work like dodecahedron

            // Save scale changes immediately on mouse up as backup
            if (cube?.isScaleModified && onUpdate) {
              onUpdate(id, {
                type: 'cube',
                position: position,
                scale: cube.scale,
                color: cube.color,
                headerText: cube.headerText,
                faceColors: cube.faceColors,
                faceTexts: cube.faceTexts,
                faceTextStyles: cube.faceTextStyles,
                textStyle: cube.textStyle,
              });

              // Reset flag after saving
              setCubeIsScaleModified(id, false);

              // Call callback
              if (onTransformEnd) {
                onTransformEnd(id);
              }
            }
          }}
          mode="scale"
          size={0.5}
        />
      )}
    </>
  );
};

// Apply memo with custom comparison to optimize renders
export default React.memo(Cube, (prevProps, nextProps) => {
  // Always re-render when selection changes
  if (prevProps.selected !== nextProps.selected) return false;

  // Re-render when indicator mode or visibility changes
  if (prevProps.showAllCubesIndicators !== nextProps.showAllCubesIndicators)
    return false;
  if (prevProps.indicatorMode !== nextProps.indicatorMode) return false;
  if (prevProps.globalIndicatorSelected !== nextProps.globalIndicatorSelected)
    return false;

  // Re-render when position, scale, or color changes
  if (!isEqual(prevProps.position, nextProps.position)) return false;
  if (!isEqual(prevProps.scale, nextProps.scale)) return false;
  if (prevProps.color !== nextProps.color) return false;

  // Re-render when text or styles change
  if (prevProps.headerText !== nextProps.headerText) return false;
  if (!isEqual(prevProps.textStyle, nextProps.textStyle)) return false;
  if (!isEqual(prevProps.faceColors, nextProps.faceColors)) return false;
  if (!isEqual(prevProps.faceTexts, nextProps.faceTexts)) return false;
  if (!isEqual(prevProps.faceTextStyles, nextProps.faceTextStyles))
    return false;
  // Re-render when selected indicators change
  if (
    prevProps.selectedIndicators?.length !==
    nextProps.selectedIndicators?.length
  )
    return false;

  // Default to not re-rendering if no significant changes
  return true;
});
