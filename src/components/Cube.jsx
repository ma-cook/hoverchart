import React, { useRef, useMemo, useEffect, useCallback, useState } from 'react';

import { TransformControls as DreiTransformControls, Html } from '@react-three/drei';
import InstancedLine from './InstancedLine';
import * as THREE from 'three';
import { useFaceIndicatorStore } from '../stores';
import CubeFace from './CubeFace';
import AtlasTextSprite from './AtlasTextSprite';
import ObjectUI from './ObjectUI';
import FaceUI from './FaceUI';
import HeaderInput from './HeaderInput';
import TextStyleUI from './TextStyleUI';
import FaceTextInput from './FaceTextInput';
import isEqual from 'lodash/isEqual';
import { faces, getFaceIndicatorProps } from './cubeHelpers';
import {
  useCubeStore,
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
import { useGlobalClickHandler } from '../hooks/useGlobalClickHandler';
import { debounce } from '../utils/unifiedPerformanceUtils';
import { shallow } from 'zustand/shallow';
// Import cube transform map for real-time edge sync
import { cubeTransformMap } from './GlobalCubeEdgesRenderer';
// Import LOD store for level of detail rendering
import useLODStore, { LOD_LEVELS } from '../stores/lodStore';
import usePipelineStore from '../stores/pipelineStore';
import { startPipeline, stopPipeline } from '../services/pipelineOrchestrator';
import { getPipelineTasksForRepo, getPipelineTasks } from '../services/pipelineTaskService';
import { clearRepoTasks, assignRepoSlugToOrphanTasks, repositionIncomingTasks } from '../services/repoContainerService';

const EMPTY_CONNECTIONS = [];

// Constants to avoid recreation
const DEFAULT_COLOR = '#000000';

// Reusable Vector3 for world position calculations (avoids GC pressure)
const tempWorldPosVec = new THREE.Vector3();

// Module-level cached hitbox material (avoids per-render allocation)
const HITBOX_MATERIAL = new THREE.MeshBasicMaterial({ visible: false });

// Default text style constant
const DEFAULT_TEXT_STYLE = {
  fontSize: 1.5,
  color: 'black',
  underline: false,
};

// Default face text styles constant
const DEFAULT_FACE_TEXT_STYLES = {
  front: { fontSize: 0.5, color: 'black', underline: false },
  back: { fontSize: 0.5, color: 'black', underline: false },
  top: { fontSize: 0.5, color: 'black', underline: false },
  bottom: { fontSize: 0.5, color: 'black', underline: false },
  right: { fontSize: 0.5, color: 'black', underline: false },
  left: { fontSize: 0.5, color: 'black', underline: false },
};

const CUBE_SIZE = 5;

// Cube edges - flattened array for InstancedLine
// Format: [x1,y1,z1, x2,y2,z2, x3,y3,z3, ...] for edge pairs
// 12 edges × 2 points × 3 coords = 72 values
const cubeEdges = [
  // Bottom face edges (4 edges)
  -CUBE_SIZE,
  -CUBE_SIZE,
  -CUBE_SIZE,
  -CUBE_SIZE,
  -CUBE_SIZE,
  CUBE_SIZE,
  -CUBE_SIZE,
  -CUBE_SIZE,
  CUBE_SIZE,
  CUBE_SIZE,
  -CUBE_SIZE,
  CUBE_SIZE,
  CUBE_SIZE,
  -CUBE_SIZE,
  CUBE_SIZE,
  CUBE_SIZE,
  -CUBE_SIZE,
  -CUBE_SIZE,
  CUBE_SIZE,
  -CUBE_SIZE,
  -CUBE_SIZE,
  -CUBE_SIZE,
  -CUBE_SIZE,
  -CUBE_SIZE,

  // Top face edges (4 edges)
  -CUBE_SIZE,
  CUBE_SIZE,
  -CUBE_SIZE,
  -CUBE_SIZE,
  CUBE_SIZE,
  CUBE_SIZE,
  -CUBE_SIZE,
  CUBE_SIZE,
  CUBE_SIZE,
  CUBE_SIZE,
  CUBE_SIZE,
  CUBE_SIZE,
  CUBE_SIZE,
  CUBE_SIZE,
  CUBE_SIZE,
  CUBE_SIZE,
  CUBE_SIZE,
  -CUBE_SIZE,
  CUBE_SIZE,
  CUBE_SIZE,
  -CUBE_SIZE,
  -CUBE_SIZE,
  CUBE_SIZE,
  -CUBE_SIZE,

  // Vertical edges (4 edges)
  -CUBE_SIZE,
  -CUBE_SIZE,
  -CUBE_SIZE,
  -CUBE_SIZE,
  CUBE_SIZE,
  -CUBE_SIZE,
  CUBE_SIZE,
  -CUBE_SIZE,
  -CUBE_SIZE,
  CUBE_SIZE,
  CUBE_SIZE,
  -CUBE_SIZE,
  -CUBE_SIZE,
  -CUBE_SIZE,
  CUBE_SIZE,
  -CUBE_SIZE,
  CUBE_SIZE,
  CUBE_SIZE,
  CUBE_SIZE,
  -CUBE_SIZE,
  CUBE_SIZE,
  CUBE_SIZE,
  CUBE_SIZE,
  CUBE_SIZE,
];

/**
 * Optimized Cube component - Gets object data from store
 * 
 * Supports LOD (Level of Detail) rendering for cubes inside parent containers:
 * - LOD 0 (FULL): Full detail - edges, faces, text, indicators
 * - LOD 1 (MEDIUM): Medium detail - colored box only, no edges
 * - LOD 2 (LOW): Low detail - don't render (handled by parent)
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
  lineWidth, // Line width for cube edges
  renderEdges = false, // When false, edges are rendered by GlobalCubeEdgesRenderer for better performance
}) => {
  // Get LOD level for this cube from LOD store
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
  
  // Get object data from objects store - use selector to avoid subscribing to all objects
  const objectData = useObjectsStore(
    useCallback((state) => state.objects.find((obj) => obj.id === id), [id])
  );
  const setIndicatorActive = useFaceIndicatorStore(
    (state) => state.setIndicatorActive
  );

  // Repo container state — must be declared before handleSceneClick
  const isRepoContainer = objectData?.merfolkData?.isRepoContainer === true;
  const [showRepoMenu, setShowRepoMenu] = useState(false);
  const pipelineIsRunning = usePipelineStore((state) => state.isRunning);
  const repoSlug = objectData?.merfolkData?.repoSlug;

  // Count pipeline tasks for this repo container
  const repoTaskCount = useObjectsStore(
    useCallback(
      (state) => {
        if (!isRepoContainer || !repoSlug) return 0;
        return (state.objects || []).filter(
          (obj) => obj.merfolkData?.planTaskIndex != null &&
            (obj.merfolkData?.repoSlug === repoSlug || !obj.merfolkData?.repoSlug)
        ).length;
      },
      [isRepoContainer, repoSlug]
    )
  );
  // const setIndicatorConnected = useFaceIndicatorStore(
  //   (state) => state.setIndicatorConnected
  // );
  // PERFORMANCE: O(1) index lookup instead of O(C) filter. Shallow equality prevents
  // re-renders when this cube's connections haven't changed.
  const connectionsFromStore = useConnectionStore(
    useCallback(
      (state) => state.connectionsByObjectId.get(id?.toString()) || EMPTY_CONNECTIONS,
      [id]
    ),
    shallow
  );

  // Refs - declare early so they can be used in memoized values
  const meshRef = useRef();
  const contentRef = useRef(); // Add contentRef like in Dodecahedron

  // Refs for stable event handlers (Optimization #4)
  const cubeStateRef = useRef();
  const cubeDataRef = useRef();
  const onUpdateRef = useRef();
  const onFaceClickRef = useRef();
  const onFaceIndicatorClickRef = useRef();

  // Consolidate all derived cube data into single useMemo (Optimization #5)
  const cubeData = useMemo(() => {
    const pos = objectData?.position;
    const validPosition =
      Array.isArray(pos) &&
      pos.length === 3 &&
      pos.every((val) => typeof val === 'number' && !isNaN(val))
        ? pos
        : [0, 0, 0];

    return {
      position: validPosition,
      scale: objectData?.scale || [1, 1, 1],
      color: objectData?.color || DEFAULT_COLOR,
      faceColors: objectData?.faceColors || {},
      faceTexts: objectData?.faceTexts || {},
      headerText: objectData?.headerText || '',
      textStyle: objectData?.textStyle || DEFAULT_TEXT_STYLE,
      faceTextStyles: objectData?.faceTextStyles || DEFAULT_FACE_TEXT_STYLES,
    };
  }, [
    objectData?.position,
    objectData?.scale,
    objectData?.color,
    objectData?.faceColors,
    objectData?.faceTexts,
    objectData?.headerText,
    objectData?.textStyle,
    objectData?.faceTextStyles,
  ]);

  // Destructure for easier access
  const {
    position,
    scale,
    color,
    faceColors,
    faceTexts,
    headerText,
    textStyle,
    faceTextStyles,
  } = cubeData;

  // Consolidate store selectors (Optimization #2)
  // Single selector for cube state
  const cube = useCubeStore(useCallback((state) => state.getCube(id), [id]));

  // Single selector for all cube actions (prevents 20+ subscriptions)
  const cubeActions = useCubeStore(
    (state) => ({
      createCube: state.createCube,
      updateCube: state.updateCube,
      selectCube: state.selectCube,
      deselectCube: state.deselectCube,
      isCubeSelected: state.isCubeSelected(id),
      setCubeSelectedFace: state.setCubeSelectedFace,
      setCubeSelectedIndicator: state.setCubeSelectedIndicator,
      setCubeShowTransform: state.setCubeShowTransform,
      setCubeShowHeader: state.setCubeShowHeader,
      setCubeShowFaceTextInput: state.setCubeShowFaceTextInput,
      setCubeIsResizing: state.setCubeIsResizing,
      setCubeShowObjectUI: state.setCubeShowObjectUI,
      setCubeShowHeaderTextStyleUI: state.setCubeShowHeaderTextStyleUI,
      setCubeActiveTextFace: state.setCubeActiveTextFace,
      updateCubeFaceColor: state.updateCubeFaceColor,
      updateCubeFaceText: state.updateCubeFaceText,
      updateCubeFaceTextStyle: state.updateCubeFaceTextStyle,
      setCubeIsScaleModified: state.setCubeIsScaleModified,
    }),
    shallow
  );

  // Destructure actions for easier access
  const {
    createCube,
    updateCube,
    selectCube,
    deselectCube,
    isCubeSelected,
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
    setCubeIsScaleModified,
  } = cubeActions;

  // Get hover state from indicators store
  const { hoveredObjectId, setHoveredObjectId } = useIndicatorsStore(
    (state) => ({
      hoveredObjectId: state.hoveredObjectId,
      setHoveredObjectId: state.setHoveredObjectId,
    }),
    shallow
  );

  // Update refs when values change (doesn't cause re-renders)
  // These refs are used to keep callbacks stable (Optimization #4)
  cubeStateRef.current = cube;
  cubeDataRef.current = cubeData;
  onUpdateRef.current = onUpdate;
  onFaceClickRef.current = onFaceClick;
  onFaceIndicatorClickRef.current = onFaceIndicatorClick;

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
          ...DEFAULT_FACE_TEXT_STYLES,
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

      // NEW: Clear all active indicators for this cube
      const cubeIndicators = faces.map((face) => `${id}-${face.name}`);
      cubeIndicators.forEach((indicatorId) =>
        setIndicatorActive(indicatorId, false)
      );
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
    setIndicatorActive, // Add setIndicatorActive
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

      // Show indicators based on mode
      switch (indicatorMode) {
        case 'all':
          return true; // Show on all cubes always in 'all' mode
        case 'indicators':
          // In indicators mode, ONLY show for the currently hovered object
          return hoveredObjectId === id;
        case 'single':
          return (
            (activeIndicator?.cube?.id === id &&
              activeIndicator?.face === faceName) ||
            (selected && faceName === cube?.selectedFace)
          );
        default:
          // In default mode (no indicator clicked yet), don't show any indicators
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
      hoveredObjectId,
    ]
  );

  // Check if any face has a connected indicator (for lazy face mounting)
  const hasConnectedIndicators = useMemo(() =>
    faces.some(({ name }) => isIndicatorConnected(name)),
    [isIndicatorConnected]
  );

  // Lazy face mounting: skip CubeFace components when not needed.
  // GlobalCubeFaceRenderer handles colored face visuals for non-selected cubes.
  const shouldMountFaces = selected ||
    showAllCubesIndicators ||
    selectedIndicators.length > 0 ||
    indicatorMode === 'all' ||
    indicatorMode === 'indicators' ||
    hasConnectedIndicators;

  // Calculate face text offset based on font size
  const getFaceTextOffset = useCallback((fontSize, faceName) => {
    // Face text should remain level with the face, not offset based on size
    // Only apply a small base offset to prevent z-fighting
    const baseOffset =
      faceName === 'top' ? 0 : faceName === 'bottom' ? 0.2 : 0.5;

    // Don't add textHeight offset - this causes text to move away as size increases
    // The text should stay at a consistent distance from the face
    return baseOffset;
  }, []);
  // Event handlers
  const handleSceneClick = useCallback(() => {
    if (isRepoContainer) {
      // Toggle repo menu instead of normal UI
      setShowRepoMenu((prev) => !prev);
      return;
    }
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
    isRepoContainer,
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
        fontSize: 1.5,
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
    const currentCube = cubeStateRef.current;
    if (currentCube?.showHeaderTextStyleUI || currentCube?.activeTextFace) {
      setCubeShowHeaderTextStyleUI(id, false);
      setCubeActiveTextFace(id, null);
      setActiveTextStyleUI(null);
    }
  }, [
    id,
    setCubeShowHeaderTextStyleUI,
    setCubeActiveTextFace,
    setActiveTextStyleUI,
  ]);

  useGlobalClickHandler(
    [], // No additional selectors needed, using defaults
    onClickOutside,
    'mousedown',
    [] // Empty deps since we use refs
  );

  const handleFaceClick = useCallback(
    (e, faceName) => {
      e.stopPropagation();
      const currentSelectedFace = cubeStateRef.current?.selectedFace;
      const newSelectedFace =
        currentSelectedFace === faceName ? null : faceName;

      setCubeSelectedFace(id, newSelectedFace);
      setCubeShowObjectUI(id, false);

      // NEW: Update global faceIndicatorStore
      const indicatorId = `${id}-${faceName}`;
      if (newSelectedFace) {
        setIndicatorActive(indicatorId, true);
      } else {
        setIndicatorActive(indicatorId, false);
      }

      onFaceClickRef.current?.({
        cube: contentRef.current,
        face: faceName,
        id: id,
      });
    },
    [id, setCubeSelectedFace, setCubeShowObjectUI, setIndicatorActive] // Add setIndicatorActive
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

      const currentSelectedIndicator = cubeStateRef.current?.selectedIndicator;
      const currentScale = cubeStateRef.current?.scale || scale;

      setCubeSelectedIndicator(
        id,
        currentSelectedIndicator === faceName ? null : faceName
      );

      const { position: facePos } = getFaceIndicatorProps(faceName);
      const indicatorData = {
        type: 'cube',
        face: faceName,
        cube: {
          id,
          position: position,
          scale: currentScale,
          userData: { objectId: id.toString() },
        },
        position: position,
        faceCenter: facePos,
      };

      // Calculate world position using reusable vector
      tempWorldPosVec.set(facePos[0], facePos[1], facePos[2]);
      if (contentRef.current?.matrixWorld) {
        tempWorldPosVec.applyMatrix4(contentRef.current.matrixWorld);
        indicatorData.position = [tempWorldPosVec.x, tempWorldPosVec.y, tempWorldPosVec.z];
      }

      // Call onFaceIndicatorClick first for connection logic
      onFaceIndicatorClickRef.current?.(indicatorData);

      // NEW: Update global faceIndicatorStore to activate this indicator AFTER connection logic
      const indicatorId = `${id}-${faceName}`;
      setIndicatorActive(indicatorId, true); // Always activate globally
    },
    [
      id,
      scale,
      setCubeSelectedIndicator,
      setIndicatorActive, // Add to deps
      position,
    ]
  );
  const handleTransformToggle = useCallback(() => {
    const newShowTransform = !cubeStateRef.current?.showTransform;
    setCubeShowTransform(id, newShowTransform);
    if (newShowTransform) {
      setCubeIsResizing(id, false);
    }
  }, [id, setCubeShowTransform, setCubeIsResizing]);

  const handleResizeToggle = useCallback(() => {
    const newIsResizing = !cubeStateRef.current?.isResizing;
    setCubeIsResizing(id, newIsResizing);
    if (newIsResizing) {
      setCubeShowTransform(id, false);
    }
  }, [id, setCubeIsResizing, setCubeShowTransform]);
  const handleHeaderToggle = useCallback(() => {
    const currentShowHeader = cubeStateRef.current?.showHeader;
    setCubeShowHeader(id, !currentShowHeader);
    // Close ObjectUI when showing header input
    if (!currentShowHeader) {
      setCubeShowObjectUI(id, false);
    }
  }, [id, setCubeShowHeader, setCubeShowObjectUI]);

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

      // Update cubeTransformMap for real-time edge sync with GlobalCubeEdgesRenderer
      const currentScale = cube?.scale || scale;
      cubeTransformMap.set(id.toString(), {
        position: finalPosition,
        scale: currentScale,
      });

      // Update the objects store position immediately for real-time connection updates
      const updatedObjects = currentObjects.map((obj) =>
        obj.id === id ? { ...obj, position: finalPosition } : obj
      );
      objectsStore.setObjects(updatedObjects);

      // Use the spatial system via onMove instead of direct onUpdate
      if (onMove) {
        onMove(finalPosition);
      }

      // NOTE: Do NOT call updateCube({ position }) here.
      // Doing so triggers a React re-render that causes R3F to reconcile
      // contentRef.current.position from the prop, fighting TransformControls
      // and potentially snapping the hit mesh to a stale position on mouse-up.
      // The final position is committed to the store in onMouseUp instead.
    } catch (error) {
      console.error('Error in cube handleDrag:', error);
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

      // Update cubeTransformMap for real-time edge sync with GlobalCubeEdgesRenderer
      cubeTransformMap.set(id.toString(), {
        position: position,
        scale: newScale,
      });

      // Update the objects store scale immediately for real-time connection updates
      const objectsStore = useObjectsStore.getState();
      const currentObjects = Array.isArray(objectsStore.objects)
        ? objectsStore.objects
        : [];
      const updatedObjects = currentObjects.map((obj) =>
        obj.id === id ? { ...obj, scale: newScale } : obj
      );
      objectsStore.setObjects(updatedObjects);

      // Update cube store
      updateCube(id, { scale: newScale });
      setCubeIsScaleModified(id, true);

      // Sync to database (debounced)
      if (onUpdate) {
        onUpdate(id, {
          ...objectData,
          scale: newScale,
          type: 'cube',
        });
      }
    },
    [
      id,
      cube?.scale,
      scale,
      position,
      updateCube,
      setCubeIsScaleModified,
      onUpdate,
      objectData,
    ]
  );

  // Render colored faces and indicators
  // Optimized face rendering using CubeFace component (Optimization #3)
  // Each face re-renders independently, reducing re-renders by ~85%
  const renderFaces = useMemo(() => {
    return faces.map(({ name, normal }) => {
      // Get face properties
      const { position: facePos, rotation } = getFaceIndicatorProps(name);
      const isConnected = isIndicatorConnected(name);
      const isActive = isIndicatorActive(name);
      const displayIndicator = shouldShowIndicator(name);

      const faceData = {
        position: facePos,
        rotation,
        normal,
      };

      return (
        <React.Fragment key={`face-${name}`}>
          {/* Optimized CubeFace component */}
          <CubeFace
            cubeId={id}
            faceName={name}
            faceData={faceData}
            selected={selected}
            onFaceClick={handleColoredFaceClick}
            onIndicatorClick={handleIndicatorClick}
            shouldShowIndicator={displayIndicator}
            isIndicatorActive={isActive}
            isIndicatorConnected={isConnected}
            selectedIndicatorsLength={selectedIndicators.length} // Add this
            showAllCubesIndicators={showAllCubesIndicators}
            skipColoredRendering={!selected}
          />

          {/* UI elements for selected face */}
          {selected &&
            cube?.selectedFace === name &&
            !cube?.showFaceTextInput && (
              <mesh position={facePos} rotation={rotation}>
                <FaceUI
                  position={[0, 1, 0]}
                  normal={normal}
                  onColorChange={handleFaceColorChange}
                  face={name}
                  onTextClick={handleFaceTextClick}
                />
              </mesh>
            )}

          {cube?.showFaceTextInput && cube?.selectedFace === name && (
            <mesh position={facePos} rotation={rotation}>
              <FaceTextInput
                position={[0, 6, 0]}
                onTextSubmit={handleFaceTextSubmit}
                inputId={`cube-${id}-face-${name}`}
              />
            </mesh>
          )}
        </React.Fragment>
      );
    });
  }, [
    cube?.selectedFace,
    cube?.showFaceTextInput,
    cube?.scale,
    selected,
    isIndicatorConnected,
    isIndicatorActive,
    handleColoredFaceClick,
    shouldShowIndicator,
    handleIndicatorClick,
    handleFaceColorChange,
    handleFaceTextClick,
    handleFaceTextSubmit,
    id,
    selectedIndicators.length,
    showAllCubesIndicators,
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

  // LOD-based rendering decisions
  // Grouping containers are excluded from LOD system - always render at full detail
  const isGroupingContainer = objectData?.merfolkData?.isContainer === true;

  // If LOD level is LOW (2), don't render (except grouping containers and repo containers)
  if (!isGroupingContainer && !isRepoContainer && lodLevel === LOD_LEVELS.LOW) {
    return null; // Don't render at long distance
  }

  // Determine what to render based on LOD level
  // Grouping containers and repo containers always render at full detail
  // All other objects: full detail at FULL LOD, basic mesh at MEDIUM, hidden at LOW
  const isLODRestricted = !isGroupingContainer && !isRepoContainer;
  const shouldRenderEdges = renderEdges && (!isLODRestricted || lodLevel === LOD_LEVELS.FULL);
  const shouldRenderFaces = !isLODRestricted || lodLevel === LOD_LEVELS.FULL;
  const shouldRenderText = !isLODRestricted || lodLevel === LOD_LEVELS.FULL;
  const shouldRenderFaceText = shouldRenderText && showFaceText;
  const shouldRenderIndicators = !isLODRestricted || lodLevel === LOD_LEVELS.FULL;
  const shouldRenderUI = !isLODRestricted || lodLevel === LOD_LEVELS.FULL;

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
          lodLevel: lodLevel, // Add LOD level to userData for debugging
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
        {/* Invisible hit box - always render for interaction */}
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation();
            handleSceneClick();
          }}
        >
          <boxGeometry
            args={[CUBE_SIZE * 2, CUBE_SIZE * 2, CUBE_SIZE * 2]}
          />
          <primitive object={HITBOX_MATERIAL} attach="material" />
        </mesh>
        
        {/* LOD MEDIUM: Simple boxes now rendered by GlobalCubeMediumLODRenderer (1 draw call for all) */}
        
        {/* Cube edges - only render per-cube if renderEdges=true and LOD allows, otherwise GlobalCubeEdgesRenderer handles all cubes */}
        {shouldRenderEdges && (
          <InstancedLine
            points={cubeEdges}
            color={cube?.color || color}
            lineWidth={lineWidth !== undefined ? lineWidth : 1}
          />
        )}
        {/* Colored faces and indicators - only at full LOD and when needed */}
        {shouldRenderFaces && shouldMountFaces && renderFaces}
        
        {/* Face text elements - only at full LOD and close enough */}
        {shouldRenderFaceText && renderFaceTexts}
        
        {/* Header text - only at full LOD */}
        {shouldRenderText && (cube?.headerText || headerText) && (
          <group
            scale={(cube?.scale || scale).map((s) => 1 / Math.max(0.0001, s))}
            position={getUIPositions.headerText}
          >
            <AtlasTextSprite
              text={
                isRepoContainer && repoTaskCount > 0
                  ? `${cube?.headerText || headerText}  (${repoTaskCount} tasks)`
                  : (cube?.headerText || headerText)
              }
              position={[0, 0, 0]}
              followTarget={meshRef}
              onClick={(e) => {
                e.stopPropagation();
                e.nativeEvent?.stopPropagation?.();
                handleTextClick(e);
                return false; // Prevent event bubbling
              }}
              style={{
                ...(cube?.textStyle || textStyle),
                isHeaderText: true,
              }}
              billboard={true}
              scale={1}
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
        {/* Header input - only at full LOD */}
        {shouldRenderUI && selected && cube?.showHeader && (
          <HeaderInput
            position={getUIPositions.headerInput}
            onTextSubmit={handleHeaderSubmit}
            inputId={`cube-${id}-header`}
            followTarget={null}
            initialText={cube?.headerText || headerText}
          />
        )}
      </group>{' '}
      {/* Object UI - moved outside the cube group to avoid scale transformation - only at full LOD */}
      {shouldRenderUI && selected && !cube?.showHeader && cube?.showObjectUI && (
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
      {/* Transform controls - only at full LOD */}{' '}
      {shouldRenderUI && selected && cube?.showTransform && contentRef.current && (
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
            // Commit the final drag position to the cube store NOW, reading directly
            // from the Three.js object so we get exactly where TransformControls left it.
            // This must happen BEFORE deleting from cubeTransformMap so the GlobalCubeEdgesRenderer
            // and R3F reconciliation both converge on the same position.
            if (contentRef.current) {
              const p = contentRef.current.position;
              const finalPos = [p.x, p.y, p.z];
              updateCube(id, { position: finalPos });
              // Also sync objectsStore so connection lines are up to date
              const store = useObjectsStore.getState();
              const objs = Array.isArray(store.objects) ? store.objects : [];
              store.setObjects(objs.map((o) => o.id === id ? { ...o, position: finalPos } : o));
            }
            // Clear real-time transform data - position is now committed to the store
            cubeTransformMap.delete(id);
          }}
          mode="translate"
          space="world"
          size={0.5}
        />
      )}
      {/* Scale transform controls - only at full LOD */}{' '}
      {shouldRenderUI && selected && cube?.isResizing && contentRef.current && (
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
            // Clear real-time transform data - position/scale is now in store
            cubeTransformMap.delete(id);
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
      {/* Repo container click menu */}
      {isRepoContainer && showRepoMenu && (
        <group position={position}>
          <Html
            center
            style={{
              pointerEvents: 'auto',
              transform: 'translate3d(0, -120%, 0)',
              zIndex: 100000,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'flex',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(30, 30, 40, 0.95)',
                border: '1px solid rgba(74, 158, 255, 0.4)',
                backdropFilter: 'blur(8px)',
                whiteSpace: 'nowrap',
              }}
            >
              {/* Play / Stop toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (pipelineIsRunning) {
                    stopPipeline();
                  } else {
                    // Assign repoSlug to orphan tasks and reposition into container
                    assignRepoSlugToOrphanTasks();
                    repositionIncomingTasks(repoSlug);
                    const allObjs = useObjectsStore.getState().objects || [];
                    // Try repo-scoped tasks first, fall back to all tasks
                    let repoTasks = getPipelineTasksForRepo(allObjs, repoSlug);
                    if (repoTasks.length === 0) {
                      repoTasks = getPipelineTasks(allObjs);
                    }
                    const spaceOwnerId = window.currentSpaceOwner;
                    const spaceId = window.currentSpaceId;
                    if (repoTasks.length > 0 && spaceOwnerId && spaceId) {
                      // Ensure repo is in connectedRepos (may be lost on refresh)
                      if (repoSlug && !usePipelineStore.getState().getRepo(repoSlug)) {
                        const [rOwner, rRepo] = repoSlug.split('/');
                        if (rOwner && rRepo) {
                          usePipelineStore.getState().addRepo(rOwner, rRepo);
                          usePipelineStore.getState().persistState(spaceId);
                        }
                      }
                      startPipeline(spaceOwnerId, spaceId, repoTasks, repoSlug);
                    }
                  }
                }}
                style={{
                  padding: '6px 14px',
                  fontSize: '13px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: pipelineIsRunning ? '#f44336' : '#4caf50',
                  color: '#fff',
                  fontWeight: 600,
                }}
              >
                {pipelineIsRunning ? '■ Stop' : '▶ Play'}
              </button>
              {/* Clear tasks */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (repoSlug) {
                    const user = window.currentUser;
                    const spaceId = window.currentSpaceId;
                    clearRepoTasks(repoSlug, user, spaceId);
                  }
                }}
                style={{
                  padding: '6px 14px',
                  fontSize: '13px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: '#ff9800',
                  color: '#fff',
                  fontWeight: 600,
                }}
              >
                Clear Tasks
              </button>
              {/* Close menu */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRepoMenu(false);
                }}
                style={{
                  padding: '6px 10px',
                  fontSize: '13px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#aaa',
                }}
              >
                ✕
              </button>
            </div>
          </Html>
        </group>
      )}
    </>
  );
};

// Apply memo with custom comparison to optimize renders
// Fast array equality for position/scale [x,y,z]
const arraysEqual = (a, b) =>
  a === b || (a && b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2]);

// Fast shallow object equality (one level deep, handles null/undefined)
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
  if (!arraysEqual(prevProps.position, nextProps.position)) return false;
  if (!arraysEqual(prevProps.scale, nextProps.scale)) return false;
  if (prevProps.color !== nextProps.color) return false;

  // Re-render when text or styles change
  if (prevProps.headerText !== nextProps.headerText) return false;
  if (!shallowObjEqual(prevProps.textStyle, nextProps.textStyle)) return false;
  if (!shallowObjEqual(prevProps.faceColors, nextProps.faceColors)) return false;
  if (!shallowObjEqual(prevProps.faceTexts, nextProps.faceTexts)) return false;
  if (!shallowObjEqual(prevProps.faceTextStyles, nextProps.faceTextStyles))
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
