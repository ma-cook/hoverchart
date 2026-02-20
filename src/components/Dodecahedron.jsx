import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import InstancedLine from './InstancedLine';
import * as THREE from 'three';
import { TransformControls as DreiTransformControls } from '@react-three/drei';
import ObjectUI from './ObjectUI';
import AtlasTextSprite from './AtlasTextSprite';
import HeaderInput from './HeaderInput';
import {
  useDodecahedronStore,
  useObjectsStore,
  useConnectionStore,
  useIndicatorsStore,
} from '../stores';
import useLODStore, { LOD_LEVELS } from '../stores/lodStore';
import { calculateAxisSnap } from '../utils/snappingUtils'; // Import snapping utility
import SnapLineIndicator from './SnapLineIndicator'; // Import snap line indicator
// Import unified utilities
import { useDebouncedUpdate } from '../hooks/useDebouncedUpdate';
import { useGlobalClickHandler } from '../hooks/useGlobalClickHandler';
// Import transform map for real-time edge sync
import { dodecahedronTransformMap } from './GlobalDodecahedronEdgesRenderer';

import TextStyleUI from './TextStyleUI';
import FaceUI from './FaceUI';
import isEqual from 'lodash/isEqual';
import DodecahedronFace from './DodecahedronFace';

// ============================================================================
// OPTIMIZATION: Module-level reusable THREE objects for face rotation calculations
// Avoids GC pressure by reusing these instead of creating new objects each call
// ============================================================================
const tempNormalVec = new THREE.Vector3();
const tempLookAtMatrix = new THREE.Matrix4();
const tempUpVec = new THREE.Vector3();
const tempRightVec = new THREE.Vector3();
const tempCorrectedUpVec = new THREE.Vector3();
const tempEuler = new THREE.Euler();

// ============================================================================
// OPTIMIZATION: Module-level constants for static geometry
// These calculations are the same for all dodecahedrons, so compute them once
// ============================================================================

const createDodecahedronGeometry = () => {
  const phi = (1 + Math.sqrt(5)) / 2;
  const scale = 5;

  // Vertices of a dodecahedron
  const vertices = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
    [0, -phi, -1 / phi],
    [0, phi, -1 / phi],
    [0, phi, 1 / phi],
    [0, -phi, 1 / phi],
    [-1 / phi, 0, -phi],
    [1 / phi, 0, -phi],
    [1 / phi, 0, phi],
    [-1 / phi, 0, phi],
    [-phi, -1 / phi, 0],
    [-phi, 1 / phi, 0],
    [phi, 1 / phi, 0],
    [phi, -1 / phi, 0],
  ].map((v) => v.map((coord) => coord * scale));

  // Define edges
  const edges = [
    [0, 8],
    [0, 12],
    [0, 16],
    [1, 8],
    [1, 13],
    [1, 19],
    [2, 9],
    [2, 13],
    [2, 18],
    [3, 9],
    [3, 12],
    [3, 17],
    [4, 11],
    [4, 15],
    [4, 16],
    [5, 11],
    [5, 14],
    [5, 19],
    [6, 10],
    [6, 14],
    [6, 18],
    [7, 10],
    [7, 15],
    [7, 17],
    [8, 11],
    [9, 10],
    [12, 13],
    [14, 15],
    [16, 17],
    [18, 19],
  ];

  // Define faces (pentagon vertex indices)
  const faces = [
    [0, 12, 13, 1, 8],
    [0, 16, 17, 3, 12],
    [0, 8, 11, 4, 16],
    [1, 19, 5, 11, 8],
    [1, 13, 2, 18, 19],
    [2, 13, 12, 3, 9],
    [2, 9, 10, 6, 18],
    [3, 17, 7, 10, 9],
    [4, 11, 5, 14, 15],
    [4, 15, 7, 17, 16],
    [5, 19, 18, 6, 14],
    [6, 10, 7, 15, 14],
  ];

  // Convert edges to flat array for InstancedLine
  // Format: [x1,y1,z1, x2,y2,z2, x3,y3,z3, ...] for edge pairs
  const edgePoints = edges.flatMap(([a, b]) => [
    ...vertices[a],
    ...vertices[b],
  ]);

  // Create geometries for each face
  const faceGeometries = faces.map((faceIndices) => {
    const faceGeometry = new THREE.BufferGeometry();
    const faceVertices = faceIndices.map((index) => vertices[index]);

    // Add center point of pentagon
    const center = faceVertices.reduce(
      (acc, v) => acc.map((coord, i) => coord + v[i] / 5),
      [0, 0, 0]
    );

    // Create triangles from center to each edge
    const triangleVertices = [];
    for (let i = 0; i < 5; i++) {
      triangleVertices.push(
        ...center,
        ...faceVertices[i],
        ...faceVertices[(i + 1) % 5]
      );
    }

    faceGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(triangleVertices, 3)
    );
    faceGeometry.computeVertexNormals();
    return faceGeometry;
  });

  return { edgePoints, faceGeometries, vertices };
};

// Create geometry once at module load
const DODECAHEDRON_GEOMETRY = createDodecahedronGeometry();

// ============================================================================

const Sphere = React.memo(
  ({
    id,
    selected,
    onClick,
    onMove,
    showAllIndicators, // Make sure this prop is passed
    onIndicatorDeselected,
    globalIndicatorSelected,
    onFaceIndicatorClick, // Add this prop
    onIndicatorSelected, // Add this prop
    selectedIndicators, // Add this prop
    indicatorMode,
    onUpdate, // Add this prop
    onDelete, // Add new prop
    registerTransformingObject, // Add this prop
    lineWidth, // Add lineWidth prop
    renderEdges = true, // When false, edges are rendered by GlobalDodecahedronEdgesRenderer
  }) => {
    // Mobile detection for scaling
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    // Get object data from objects store
    const objects = useObjectsStore((state) => state.objects);
    const setObjects = useObjectsStore((state) => state.setObjects);
    const objectData = objects.find((obj) => obj.id === id);

    // Get connections from connection store instead of props
    const connections = useConnectionStore((state) => state.connections);

    // Consolidate all derived dodecahedron data into single useMemo (like Cube optimization)
    // This ensures all properties update together and dependencies are explicit
    const dodecahedronData = useMemo(() => {
      const pos = objectData?.position;
      const validPosition =
        Array.isArray(pos) &&
        pos.length === 3 &&
        pos.every((val) => typeof val === 'number' && !isNaN(val))
          ? pos
          : [0, 0, 0];

      const data = {
        position: validPosition,
        scale: objectData?.scale || [1, 1, 1],
        headerText: objectData?.headerText || '',
        lineColor: objectData?.lineColor || 'black',
        faceColors: objectData?.faceColors || {},
        faceTexts: objectData?.faceTexts || {},
        faceTextStyles: objectData?.faceTextStyles || {},
        headerStyle: objectData?.headerStyle || {
          fontSize: 1.5,
          color: 'black',
          underline: false,
        },
      };

      return data;
    }, [
      objectData?.id,
      objectData?.position,
      objectData?.scale,
      objectData?.headerText,
      objectData?.lineColor,
      objectData?.faceColors,
      objectData?.faceTexts,
      objectData?.faceTextStyles,
      objectData?.headerStyle,
    ]);

    // Destructure for easier access
    const {
      position,
      scale,
      headerText,
      lineColor,
      faceColors,
      faceTexts,
      faceTextStyles,
      headerStyle,
    } = dodecahedronData;

    // Get LOD level for this dodecahedron
    const lodLevel = useLODStore(
      useCallback((state) => state.getLODLevel(id), [id])
    );
    const isChildOfContainer = useLODStore(
      useCallback((state) => state.isChildOfContainer(id), [id])
    );
    const isParentObject = useLODStore(
      useCallback((state) => state.isParent(id), [id])
    );

    // Store state and actions
    const dodecahedron = useDodecahedronStore((state) =>
      state.getDodecahedron(id)
    );

    // IMPORTANT: Use dodecahedron store values for rendering when available
    // This ensures UI updates immediately when changes are made
    const renderLineColor = dodecahedron?.lineColor || lineColor;
    const renderHeaderText = dodecahedron?.headerText || headerText;
    const renderHeaderStyle = dodecahedron?.headerStyle || headerStyle;

    const createDodecahedron = useDodecahedronStore(
      (state) => state.createDodecahedron
    );
    const updateDodecahedron = useDodecahedronStore(
      (state) => state.updateDodecahedron
    );
    const selectDodecahedron = useDodecahedronStore(
      (state) => state.selectDodecahedron
    );
    const deselectDodecahedron = useDodecahedronStore(
      (state) => state.deselectDodecahedron
    );
    const isDodecahedronSelected = useDodecahedronStore((state) =>
      state.isDodecahedronSelected(id)
    );
    const setDodecahedronShowTransform = useDodecahedronStore(
      (state) => state.setDodecahedronShowTransform
    );
    const setDodecahedronShowHeader = useDodecahedronStore(
      (state) => state.setDodecahedronShowHeader
    );
    const setDodecahedronIsResizing = useDodecahedronStore(
      (state) => state.setDodecahedronIsResizing
    );
    const setDodecahedronHighlightedFaces = useDodecahedronStore(
      (state) => state.setDodecahedronHighlightedFaces
    );
    const setDodecahedronShowStyleMenu = useDodecahedronStore(
      (state) => state.setDodecahedronShowStyleMenu
    );
    const setDodecahedronActiveFace = useDodecahedronStore(
      (state) => state.setDodecahedronActiveFace
    );
    const setDodecahedronShowFaceUI = useDodecahedronStore(
      (state) => state.setDodecahedronShowFaceUI
    );
    const setDodecahedronShowObjectUI = useDodecahedronStore(
      (state) => state.setDodecahedronShowObjectUI
    );
    const setDodecahedronShowFaceTextInput = useDodecahedronStore(
      (state) => state.setDodecahedronShowFaceTextInput
    );
    const setDodecahedronActiveFaceText = useDodecahedronStore(
      (state) => state.setDodecahedronActiveFaceText
    );
    const setDodecahedronShowFaceTextStyleMenu = useDodecahedronStore(
      (state) => state.setDodecahedronShowFaceTextStyleMenu
    );
    const setDodecahedronSelectedIndicator = useDodecahedronStore(
      (state) => state.setDodecahedronSelectedIndicator
    );
    const setDodecahedronIsConnected = useDodecahedronStore(
      (state) => state.setDodecahedronIsConnected
    );
    const setDodecahedronConnectedFaces = useDodecahedronStore(
      (state) => state.setDodecahedronConnectedFaces
    );
    const setDodecahedronIsScaleModified = useDodecahedronStore(
      (state) => state.setDodecahedronIsScaleModified
    );
    const updateDodecahedronFaceColor = useDodecahedronStore(
      (state) => state.updateDodecahedronFaceColor
    );
    const updateDodecahedronFaceText = useDodecahedronStore(
      (state) => state.updateDodecahedronFaceText
    );
    const updateDodecahedronFaceTextStyle = useDodecahedronStore(
      (state) => state.updateDodecahedronFaceTextStyle
    );

    // Get hover state from indicators store

    const { hoveredObjectId, setHoveredObjectId } = useIndicatorsStore(
      (state) => ({
        hoveredObjectId: state.hoveredObjectId,
        setHoveredObjectId: state.setHoveredObjectId,
      })
    );

    // Helper function to update both stores and database
    const updateObjectAndStores = useCallback(
      (updates) => {
        console.log('updateObjectAndStores called with updates:', updates);

        // Update UI store
        updateDodecahedron(id, updates);

        // Update objects store immediately for instant visual feedback
        setObjects((prevObjects) =>
          prevObjects.map((obj) => {
            if (obj.id === id) {
              console.log('Updating object in objects store:', {
                ...obj,
                ...updates,
              });
              return { ...obj, ...updates };
            }
            return obj;
          })
        );

        // Save to database
        if (onUpdate && objectData) {
          onUpdate(id, {
            ...objectData,
            ...updates,
          });
        }
      },
      [id, updateDodecahedron, setObjects, onUpdate, objectData]
    );

    // Helper function to update face-specific properties
    const updateFaceProperty = useCallback(
      (propertyName, faceIndex, value) => {
        // Update UI store
        if (propertyName === 'faceColors') {
          updateDodecahedronFaceColor(id, faceIndex, value);
        } else if (propertyName === 'faceTexts') {
          updateDodecahedronFaceText(id, faceIndex, value);
        } else if (propertyName === 'faceTextStyles') {
          updateDodecahedronFaceTextStyle(id, faceIndex, value);
        }

        // Update objects store
        setObjects((prevObjects) =>
          prevObjects.map((obj) =>
            obj.id === id
              ? {
                  ...obj,
                  [propertyName]: {
                    ...obj[propertyName],
                    [faceIndex]: value,
                  },
                }
              : obj
          )
        );

        // Save to database
        if (onUpdate && objectData) {
          onUpdate(id, {
            ...objectData,
            [propertyName]: {
              ...objectData[propertyName],
              [faceIndex]: value,
            },
          });
        }
      },
      [
        id,
        updateDodecahedronFaceColor,
        updateDodecahedronFaceText,
        updateDodecahedronFaceTextStyle,
        setObjects,
        onUpdate,
        objectData,
      ]
    );

    // Initialize dodecahedron UI state in store if it doesn't exist
    useEffect(() => {
      if (!dodecahedron) {
        // Create new dodecahedron with data from objects store
        createDodecahedron(id, {
          // Initialize with object data from persistent storage
          position,
          scale,
          lineColor,
          headerText,
          headerStyle,
          faceColors,
          faceTexts,
          faceTextStyles,
          // UI state
          selectedFace: null,
          selectedIndicator: null,
          showTransform: false,
          showHeader: false,
          showFaceTextInput: false,
          showObjectUI: true,
          showHeaderTextStyleUI: false,
          activeTextFace: null,
        });
      }
      // NOTE: We do NOT sync from objectData to dodecahedron store here!
      // The dodecahedron store is updated directly when changes are made.
      // This prevents circular update loops.
    }, [
      id,
      dodecahedron,
      createDodecahedron,
      position,
      scale,
      lineColor,
      headerText,
      headerStyle,
      faceColors,
      faceTexts,
      faceTextStyles,
    ]);
    // Handle selection changes
    useEffect(() => {
      if (selected && !isDodecahedronSelected) {
        selectDodecahedron(id);
      } else if (!selected && isDodecahedronSelected) {
        deselectDodecahedron(id);
      }
    }, [
      selected,
      isDodecahedronSelected,
      selectDodecahedron,
      deselectDodecahedron,
      id,
    ]);

    // Reset selection states when dodecahedron is deselected
    useEffect(() => {
      if (!selected) {
        setDodecahedronActiveFace(id, null);
        setDodecahedronSelectedIndicator(id, null);
        setDodecahedronShowTransform(id, false);
        setDodecahedronShowFaceTextStyleMenu(id, false);
        setDodecahedronActiveFaceText(id, null);
      }
    }, [
      selected,
      id,
      setDodecahedronActiveFace,
      setDodecahedronSelectedIndicator,
      setDodecahedronShowTransform,
      setDodecahedronShowFaceTextStyleMenu,
      setDodecahedronActiveFaceText,
    ]);

    // Initialize state with props instead of defaults
    const contentRef = useRef();
    const faceUIGroupRef = useRef(); // Add this new ref for FaceUI container

    // OPTIMIZATION: Use pre-computed module-level geometry instead of recalculating
    const edgePoints = DODECAHEDRON_GEOMETRY.edgePoints;
    const geometry = DODECAHEDRON_GEOMETRY.faceGeometries;

    // Update isIndicatorConnected function to be more robust
    const isIndicatorConnected = useCallback(
      (faceIndex) => {
        return connections?.some(
          (conn) =>
            (conn.start.objectId === id.toString() &&
              parseInt(conn.start.face) === faceIndex) ||
            (conn.end.objectId === id.toString() &&
              parseInt(conn.end.face) === faceIndex)
        );
      },
      [connections, id]
    );
    // Now the effects can use isIndicatorConnected
    useEffect(() => {
      if (!selected) {
        setDodecahedronShowTransform(id, false);
        setDodecahedronHighlightedFaces(id, new Set()); // Clear highlighted faces when deselected
        setDodecahedronShowFaceTextStyleMenu(id, false); // Add this line
        setDodecahedronActiveFaceText(id, null); // Add this line
        // Don't reset selectedIndicator here
      }
    }, [
      selected,
      id,
      setDodecahedronShowTransform,
      setDodecahedronHighlightedFaces,
      setDodecahedronShowFaceTextStyleMenu,
      setDodecahedronActiveFaceText,
    ]);

    // Store orbitControls when mounted
    useEffect(() => {
      if (contentRef.current && window.orbitControls) {
        contentRef.current.orbitControls = window.orbitControls;
      }
    }, []);

    // Use unified global click handler instead of duplicate pattern
    const onClickOutside = useCallback(() => {
      if (dodecahedron?.showFaceTextStyleMenu) {
        setDodecahedronShowFaceTextStyleMenu(id, false);
        setDodecahedronActiveFaceText(id, null);
      }
    }, [
      dodecahedron?.showFaceTextStyleMenu,
      id,
      setDodecahedronActiveFaceText,
      setDodecahedronShowFaceTextStyleMenu,
    ]);

    useGlobalClickHandler(
      [], // No additional selectors needed, using defaults
      onClickOutside,
      'click', // Dodecahedron uses 'click' instead of 'mousedown'
      [dodecahedron?.showFaceTextStyleMenu]
    );

    // Update effect for connection tracking to be more thorough
    useEffect(() => {
      const connected = new Set();
      connections?.forEach((conn) => {
        if (conn.start.objectId === id.toString()) {
          connected.add(parseInt(conn.start.face));
        }
        if (conn.end.objectId === id.toString()) {
          connected.add(parseInt(conn.end.face));
        }
      });
      setDodecahedronConnectedFaces(id, connected);
      setDodecahedronIsConnected(id, connected.size > 0);
    }, [
      connections,
      id,
      setDodecahedronConnectedFaces,
      setDodecahedronIsConnected,
    ]);

    // Add an effect to reset selectedIndicator when connections change
    useEffect(() => {
      if (connections?.length > 0) {
        // If this dodecahedron's selected indicator is part of a connection, reset it
        if (
          dodecahedron?.selectedIndicator !== null &&
          isIndicatorConnected(dodecahedron?.selectedIndicator)
        ) {
          setDodecahedronSelectedIndicator(id, null);
        }
      }
    }, [
      connections,
      dodecahedron?.selectedIndicator,
      isIndicatorConnected,
      id,
      setDodecahedronSelectedIndicator,
    ]);

    // Add useCallback for updating database
    const updateDatabase = useCallback(() => {
      if (!onUpdate || !id || !objectData) return;

      // Skip if we're still in initial loading phase - no saves during app startup
      const { isInitialLoading } = useObjectsStore.getState();
      if (isInitialLoading) {
        return;
      } // Use current scale from dodecahedron store if available, fallback to objectData
      const currentScale = dodecahedron?.scale || objectData.scale || [1, 1, 1];

      // Ensure position has valid numbers, not undefined/null values
      const currentPosition = objectData.position;
      const validPosition =
        Array.isArray(currentPosition) &&
        currentPosition.length === 3 &&
        currentPosition.every((val) => typeof val === 'number' && !isNaN(val))
          ? currentPosition
          : [0, 0, 0];

      const currentState = {
        type: 'dodecahedron',
        position: validPosition,
        scale: currentScale, // Use current scale from store
        lineColor: objectData.lineColor || 'black',
        headerText: objectData.headerText || '',
        headerStyle: objectData.headerStyle || {
          fontSize: 1.5,
          color: 'black',
          underline: false,
        },
        // Map numeric indices for 12 faces
        faceColors: Object.fromEntries(
          Array(12)
            .fill(null)
            .map((_, idx) => [
              idx,
              (objectData.faceColors && objectData.faceColors[idx]) || null,
            ])
        ),
        faceTexts: Object.fromEntries(
          Array(12)
            .fill('')
            .map((_, idx) => [
              idx,
              (objectData.faceTexts && objectData.faceTexts[idx]) || '',
            ])
        ),
        faceTextStyles: Object.fromEntries(
          Array(12)
            .fill(null)
            .map((_, idx) => [
              idx,
              (objectData.faceTextStyles && objectData.faceTextStyles[idx]) || {
                fontSize: 0.5,
                color: 'black',
                underline: false,
              },
            ])
        ),
      }; // Only update if something has changed
      const lastUpdate = contentRef.current?.lastUpdate;
      if (!lastUpdate || !isEqual(lastUpdate, currentState)) {
        if (contentRef.current) {
          contentRef.current.lastUpdate = currentState;
        }
        onUpdate(id, currentState);
      }
    }, [id, objectData, onUpdate, dodecahedron]);

    // Use unified debounced update instead of duplicate pattern
    useDebouncedUpdate(updateDatabase, objectData);
    const handleTransformToggle = () => {
      // When enabling transform mode, we should disable resize mode
      const newShowTransform = !dodecahedron?.showTransform;
      setDodecahedronShowTransform(id, newShowTransform);
      if (newShowTransform) {
        setDodecahedronIsResizing(id, false);
      }
    };
    const handleHeaderToggle = () => {
      setDodecahedronShowHeader(id, !dodecahedron?.showHeader);
      // Close ObjectUI when showing header input
      if (!dodecahedron?.showHeader) {
        setDodecahedronShowObjectUI(id, false);
      }
    };
    const handleHeaderSubmit = (text) => {
      updateObjectAndStores({ headerText: text });
      setDodecahedronShowHeader(id, false);
    };

    const handleResizeToggle = () => {
      // When enabling resize mode, we should disable transform mode
      const newIsResizing = !dodecahedron?.isResizing;
      setDodecahedronIsResizing(id, newIsResizing);
      if (newIsResizing) {
        setDodecahedronShowTransform(id, false);
      }
    };
    const handleDrag = useCallback(
      (e) => {
        // Get new position from the transform controls event
        if (!e.target || !e.target.object || !e.target.object.position) {
          return;
        }

        const newPos = e.target.object.position;
        // Ensure we have valid numerical values for position
        if (
          typeof newPos.x !== 'number' ||
          typeof newPos.y !== 'number' ||
          typeof newPos.z !== 'number'
        ) {
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
          const snapResult = calculateAxisSnap(
            currentPosition,
            currentObjects,
            id
          );

          // Use snapped position if available, otherwise use current position
          const finalPosition = snapResult?.position || currentPosition;

          // If snapping occurred, update the object's position in the scene and show indicator
          if (snapResult) {
            e.target.object.position.set(
              snapResult.position[0],
              snapResult.position[1],
              snapResult.position[2]
            );

            // Update dodecahedron store with snap info for the visual indicator
            updateDodecahedron(id, {
              showSnapLine: true,
              snapLinePoints: snapResult.linePoints,
              snapAxis: snapResult.snapAxis,
            });

            // Auto-hide the snap line after 2 seconds
            setTimeout(() => {
              updateDodecahedron(id, { showSnapLine: false });
            }, 2000);
          } else {
            // No snapping, ensure indicator is hidden
            updateDodecahedron(id, { showSnapLine: false });
          }

          // Update real-time transform map for GlobalDodecahedronEdgesRenderer
          dodecahedronTransformMap.set(id, { 
            position: finalPosition, 
            scale: dodecahedron?.scale || scale 
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
        } catch {
          // Error handling without logging
        }
      },
      [id, onMove, updateDodecahedron, dodecahedron?.scale, scale]
    ); // Add handler for scale changes from TransformControls
    const handleScale = (e) => {
      if (!e.target || !e.target.object) return;

      // Get new scale from the transform controls event
      const newScale = [
        e.target.object.scale.x,
        e.target.object.scale.y,
        e.target.object.scale.z,
      ];

      // Only update if the scale change is significant to avoid unnecessary updates
      const epsilon = 0.0001;
      const currentScale = dodecahedron?.scale || scale;
      if (
        Math.abs(newScale[0] - currentScale[0]) < epsilon &&
        Math.abs(newScale[1] - currentScale[1]) < epsilon &&
        Math.abs(newScale[2] - currentScale[2]) < epsilon
      ) {
        return;
      }

      // Update real-time transform map for GlobalDodecahedronEdgesRenderer
      dodecahedronTransformMap.set(id, { 
        position: dodecahedron?.position || position, 
        scale: newScale 
      });

      // Update objects store for instant visual feedback and persistence
      setObjects((prevObjects) =>
        prevObjects.map((obj) =>
          obj.id === id ? { ...obj, scale: newScale } : obj
        )
      );

      // Also update the dodecahedron UI store to prevent double scaling
      updateDodecahedron(id, { scale: newScale });

      // Mark that scale has been modified (for onMouseUp to detect)
      setDodecahedronIsScaleModified(id, true);
    };

    // Split face click into two separate handlers
    const handleFaceClick = (faceIndex, e) => {
      e.stopPropagation();
      if (!selected) {
        handleBackgroundClick(e); // Select dodecahedron first
        return;
      }
      setDodecahedronHighlightedFaces(id, new Set([faceIndex]));
      setDodecahedronActiveFace(id, faceIndex);
      setDodecahedronShowFaceUI(id, true);
      setDodecahedronShowObjectUI(id, false); // Hide ObjectUI when face is clicked
      setDodecahedronShowFaceTextStyleMenu(id, false); // Close text style menu when clicking a different face
      setDodecahedronActiveFaceText(id, null); // Clear active face text

      // Don't select the indicator when clicking on the face
      // Remove any code that would set selectedIndicator here
    };

    // Add a handler to receive connection state from parent
    const handleIndicatorClick = (faceIndex, e) => {
      if (e) e.stopPropagation();
      const { center } = getFaceInfo(faceIndex);

      // Toggle indicator selection
      if (dodecahedron?.selectedIndicator === faceIndex) {
        // Deselect if already selected
        setDodecahedronSelectedIndicator(id, null);
      } else {
        // Select this indicator
        setDodecahedronSelectedIndicator(id, faceIndex);
      }

      // Create the indicator data with consistent ID format
      const stringId = String(id);
      const indicator = {
        type: 'dodecahedron',
        face: faceIndex,
        cube: {
          id: stringId,
          position: position,
          scale: scale,
          userData: {
            objectId: stringId,
          },
        },
        position: center,
        faceCenter: center,
        id: stringId,
        objectId: stringId,
      };

      // Notify parent component
      onIndicatorSelected?.();
      onFaceIndicatorClick?.(indicator);
    };
    const handleHeaderClick = (e) => {
      e.stopPropagation();
      setDodecahedronShowStyleMenu(id, !dodecahedron?.showStyleMenu);
      // Close ObjectUI when header text is clicked
      setDodecahedronShowObjectUI(id, false);
    };
    const handleStyleChange = (newStyle) => {
      // Use dodecahedron store value if available, fallback to objectData
      const currentHeaderStyle = dodecahedron?.headerStyle || headerStyle || {};
      const newHeaderStyle = { ...currentHeaderStyle, ...newStyle };
      console.log('handleStyleChange - Header style update:', {
        currentHeaderStyle,
        newStyle,
        newHeaderStyle,
      });
      updateObjectAndStores({ headerStyle: newHeaderStyle });
    };
    const handleLineColorChange = (color) => {
      console.log(
        'Dodecahedron handleLineColorChange called with color:',
        color
      );
      updateObjectAndStores({ lineColor: color });
    };
    const handleBackgroundClick = (e) => {
      e.stopPropagation();
      e.nativeEvent?.stopPropagation?.();
      onClick(); // Select the dodecahedron first
      setDodecahedronHighlightedFaces(id, new Set());
      setDodecahedronActiveFace(id, null);
      setDodecahedronShowFaceUI(id, false);
      setDodecahedronShowObjectUI(id, true);
      setDodecahedronShowFaceTextStyleMenu(id, false); // Add this line
      setDodecahedronActiveFaceText(id, null); // Add this line
      // Clear indicator state if connected
      if (dodecahedron?.isConnected) {
        setDodecahedronSelectedIndicator(id, null);
        onIndicatorDeselected();
      }
    };
    const handleFaceTextSubmit = (text) => {
      if (dodecahedron?.activeFace !== null) {
        updateFaceProperty('faceTexts', dodecahedron.activeFace, text);
        setDodecahedronShowFaceTextInput(id, false);
      }
    };

    const handleFaceTextButtonClick = () => {
      setDodecahedronShowFaceTextInput(id, true);
      setDodecahedronShowFaceTextStyleMenu(id, false); // Hide style menu when adding new text
    }; // Update text click handler to distinguish between clicking text vs button
    const handleFaceTextClick = (faceIndex, e) => {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation(); // Add this line to prevent global click
      setDodecahedronActiveFaceText(id, faceIndex);
      setDodecahedronShowFaceTextStyleMenu(id, true);
      setDodecahedronShowFaceTextInput(id, false);
      // Close ObjectUI when face text is clicked
      setDodecahedronShowObjectUI(id, false);
    };
    const handleFaceTextStyleChange = (newStyle) => {
      if (dodecahedron?.activeFaceText !== null) {
        // Use dodecahedron store value if available, fallback to objectData
        const currentFaceTextStyles =
          dodecahedron?.faceTextStyles || faceTextStyles || {};
        const currentStyle = currentFaceTextStyles[
          dodecahedron.activeFaceText
        ] || {
          fontSize: 0.5,
          color: 'black',
          underline: false,
        };

        // Merge the new style with the existing style
        const mergedStyle = { ...currentStyle, ...newStyle };

        console.log('handleFaceTextStyleChange - Face text style update:', {
          faceIndex: dodecahedron.activeFaceText,
          currentStyle,
          newStyle,
          mergedStyle,
        });

        updateFaceProperty(
          'faceTextStyles',
          dodecahedron.activeFaceText,
          mergedStyle
        );
      }
    }; // Calculate positions relative to sphere's scale
    const getUIPosition = () => {
      const sphereHeight = 10 * scale[1];
      const topEdgeOffset = sphereHeight / 2;
      return [position[0], position[1] + topEdgeOffset + 20, position[2]];
    };

    const getHeaderPosition = () => {
      // For Three.js dodecahedronGeometry, the actual "height" from center to top face
      // is different from the circumradius. Let's use a more empirical approach.

      // Through testing, a dodecahedron with radius 5.1 has approximately 8-9 units
      // from center to the topmost point when considering face orientation
      const dodecahedronEffectiveHeight = 8.5; // More accurate height estimate

      // Apply Y-scale to get the actual scaled height
      const scaledHeight = dodecahedronEffectiveHeight * scale[1];

      // Use a generous margin to ensure clearance
      const clearanceMargin = 5; // Additional clearance above the top
      const headerPosition = [
        position[0],
        position[1] + scaledHeight + clearanceMargin,
        position[2],
      ];

      return headerPosition;
    };

    const getFaceUIPosition = (faceIndex, offset = 3) => {
      const { center, normal } = getFaceInfo(faceIndex);

      // Use the normal vector to offset the UI position from the face center
      return [
        center[0] + normal[0] + offset,
        center[1] + normal[1] + offset,
        center[2] + normal[2] + offset,
      ];
    };

    // OPTIMIZATION: Memoize getFaceTextPosition since it depends on static geometry
    const getFaceTextPosition = useCallback(
      (faceIndex) => {
        const faceGeometry = geometry[faceIndex];
        const positions = faceGeometry.attributes.position.array;
        const normals = faceGeometry.attributes.normal.array;

        // Calculate center of the face
        let centerX = 0,
          centerY = 0,
          centerZ = 0;
        for (let i = 0; i < positions.length; i += 3) {
          centerX += positions[i];
          centerY += positions[i + 1];
          centerZ += positions[i + 2];
        }
        const vertexCount = positions.length / 3;

        // Get face normal (using first normal from geometry)
        const normalX = normals[0];
        const normalY = normals[1];
        const normalZ = normals[2];

        // Create offset vector from normal
        const OFFSET_DISTANCE = 0.2; // Adjust this value to control how far text floats
        const offsetX = normalX * OFFSET_DISTANCE;
        const offsetY = normalY * OFFSET_DISTANCE;
        const offsetZ = normalZ * OFFSET_DISTANCE;

        return {
          position: [
            centerX / vertexCount + offsetX,
            centerY / vertexCount + offsetY,
            centerZ / vertexCount + offsetZ,
          ],
          normal: [normalX, normalY, normalZ],
        };
      },
      [geometry]
    ); // geometry is static

    // Add function to calculate face center and normal
    // OPTIMIZATION: Memoize face info calculations since geometry is static
    // These are called frequently during rendering and for DodecahedronFace components
    const getFaceInfo = useCallback(
      (faceIndex) => {
        const faceGeometry = geometry[faceIndex];
        const positions = faceGeometry.attributes.position.array;
        const normals = faceGeometry.attributes.normal.array;

        let centerX = 0,
          centerY = 0,
          centerZ = 0;
        for (let i = 0; i < positions.length; i += 3) {
          centerX += positions[i];
          centerY += positions[i + 1];
          centerZ += positions[i + 2];
        }
        const vertexCount = positions.length / 3;

        return {
          center: [
            centerX / vertexCount,
            centerY / vertexCount,
            centerZ / vertexCount,
          ],
          normal: [normals[0], normals[1], normals[2]],
        };
      },
      [geometry]
    ); // geometry is static, so this never changes

    // Add getFaceRotation function - memoized since it depends on static geometry
    // OPTIMIZATION: Uses module-level reusable THREE objects to avoid GC pressure
    const getFaceRotation = useCallback(
      (faceIndex) => {
        const { normal } = getFaceInfo(faceIndex);

        // Use reusable normal vector
        tempNormalVec.set(normal[0], normal[1], normal[2]).normalize();

        // Reset look-at matrix
        tempLookAtMatrix.identity();

        // The "up" direction affects text orientation
        // Use a consistent up vector (world Y) as a starting point
        tempUpVec.set(0, 1, 0);

        // Calculate a right vector that's perpendicular to normal and up
        tempRightVec.crossVectors(tempUpVec, tempNormalVec).normalize();

        // If right vector is too small (normal is parallel to up), use another axis
        if (tempRightVec.length() < 0.1) {
          tempUpVec.set(0, 0, 1); // Use Z as up instead
          tempRightVec.crossVectors(tempUpVec, tempNormalVec).normalize();
        }

        // Calculate a corrected up vector perpendicular to both normal and right
        tempCorrectedUpVec.crossVectors(tempNormalVec, tempRightVec).normalize();

        // Set up the lookAt matrix
        tempLookAtMatrix.makeBasis(tempRightVec, tempCorrectedUpVec, tempNormalVec);

        // Get Euler rotation from matrix - return a copy since caller may store it
        tempEuler.setFromRotationMatrix(tempLookAtMatrix);
        return new THREE.Euler(tempEuler.x, tempEuler.y, tempEuler.z, tempEuler.order);
      },
      [getFaceInfo]
    ); // Only depends on getFaceInfo which is stable
    // Update shouldShowFaceIndicator logic to keep indicators visible when connected
    const shouldShowFaceIndicator = (faceIndex) => {
      // Always show indicators that are part of connections
      if (isIndicatorConnected(faceIndex)) return true;

      // Show indicators during connection creation on ALL dodecahedrons
      if (selectedIndicators?.length > 0) return true;

      // Show indicator for the active face when dodecahedron is selected
      if (dodecahedron?.activeFace === faceIndex && selected) return true;

      // Show all indicators when explicitly requested
      if (showAllIndicators || globalIndicatorSelected) return true;

      // Show ALL indicators when ANY indicator is selected on this dodecahedron
      if (
        dodecahedron?.selectedIndicator !== null &&
        dodecahedron?.selectedIndicator !== undefined
      ) {
        return true;
      }

      // Show indicators based on mode
      switch (indicatorMode) {
        case 'all':
          return true; // Show on all dodecahedrons always in 'all' mode
        case 'indicators':
          // In indicators mode, ONLY show for the currently hovered object
          return hoveredObjectId === id;
        case 'single':
          return (
            dodecahedron?.selectedIndicator === faceIndex ||
            (selected && faceIndex === dodecahedron?.activeFace)
          );
        default:
          // In default mode (no indicator clicked yet), show for connected faces
          if (dodecahedron?.connectedFaces?.has(faceIndex)) return true;
          return false;
      }
    };

    const getHeaderInputPosition = () => {
      // Use absolute positioning with fixed distance from top of dodecahedron
      // This matches the approach used in the Cube component
      return [0, 5 + 5, 0]; // 5 (radius) + 5 (fixed offset) units up
    };

    // LOD-based rendering decisions
    // Grouping containers are excluded from LOD system - always render at full detail
    const isGroupingContainer = objectData?.merfolkData?.isContainer === true;
    
    // If LOD level is LOW (2), don't render for children or parents (but not grouping containers)
    if (!isGroupingContainer && (isChildOfContainer || isParentObject) && lodLevel === LOD_LEVELS.LOW) {
      return null;
    }
    
    // Determine what to render based on LOD level
    // Grouping containers always render at full detail
    const isLODRestricted = !isGroupingContainer && (isChildOfContainer || isParentObject);
    const shouldRenderFullDetail = !isLODRestricted || lodLevel === LOD_LEVELS.FULL;

    return (
      <>
        {/* Snap line indicator - only visible during snapping */}
        {dodecahedron?.showSnapLine && (
          <SnapLineIndicator
            points={dodecahedron.snapLinePoints}
            axis={dodecahedron.snapAxis}
            visible={dodecahedron.showSnapLine}
          />
        )}
        {/* Remove the outer position group and apply position directly to content group */}{' '}
        <group
          ref={contentRef}
          position={position}
          scale={scale}
          onPointerEnter={(e) => {
            e.stopPropagation();
            setHoveredObjectId(id);
          }}
          onPointerLeave={(e) => {
            e.stopPropagation();
            setHoveredObjectId(null);
          }}
        >
          {/* Add invisible helper mesh for better click detection - only when not selected */}
          {!selected && (
            <mesh
              onClick={handleBackgroundClick}
              visible={false}
              userData={{ isHelper: true, isClickHelper: true }}
            >
              <sphereGeometry args={[isMobile ? 10 : 6, 32, 32]} />{' '}
              {/* Slightly larger than dodecahedron */}
              <meshBasicMaterial
                transparent
                opacity={0}
                side={THREE.DoubleSide} // Allow interaction from both sides
              />
            </mesh>
          )}
          {/* Original background mesh - only when not selected to avoid blocking nested interactions */}
          {!selected && (
            <mesh
              onClick={handleBackgroundClick}
              onPointerDown={(e) => e.stopPropagation()}
              userData={{ isHelper: true, isBackgroundHelper: true }}
            >
              <dodecahedronGeometry args={[5.1]} />{' '}
              {/* Slightly larger than face geometries */}
              <meshBasicMaterial
                visible={false}
                transparent={false}
                opacity={1}
                side={THREE.DoubleSide} // Allow interaction from both sides
              />
            </mesh>
          )}
          {/* LOD MEDIUM: Render simple grey sphere mesh for parent objects */}
          {/* Using sphere with radius ~8 to match edge renderer bounds (PHI * 5) */}
          {isParentObject && lodLevel === LOD_LEVELS.MEDIUM && (
            <mesh>
              <sphereGeometry args={[8, 8, 6]} />
              <meshBasicMaterial color="#888888" transparent opacity={0.6} />
            </mesh>
          )}
          {/* LOD MEDIUM: Render simple colored sphere mesh for child objects */}
          {isChildOfContainer && lodLevel === LOD_LEVELS.MEDIUM && (
            <mesh>
              <sphereGeometry args={[8, 8, 6]} />
              <meshBasicMaterial color="#888888" transparent opacity={0.8} />
            </mesh>
          )}
          {/* Render faces using DodecahedronFace component (consistent with Cube architecture) */}
          {shouldRenderFullDetail && geometry.map((faceGeometry, idx) => {
            const faceInfo = getFaceInfo(idx);
            const faceRotation = getFaceRotation(idx);
            const faceData = {
              center: faceInfo.center,
              normal: faceInfo.normal,
              rotation: faceRotation,
            };

            return (
              <DodecahedronFace
                key={`face-${idx}`}
                dodecahedronId={id}
                faceIndex={idx}
                faceGeometry={faceGeometry}
                faceData={faceData}
                selected={selected}
                scale={scale}
                onFaceClick={handleFaceClick}
                onIndicatorClick={handleIndicatorClick}
                onFaceTextClick={handleFaceTextClick}
                onBackgroundClick={handleBackgroundClick}
                shouldShowIndicator={shouldShowFaceIndicator(idx)}
                isIndicatorActive={dodecahedron?.selectedIndicator === idx}
                isIndicatorConnected={isIndicatorConnected(idx)}
                showAllIndicators={showAllIndicators}
                selectedIndicatorsLength={selectedIndicators?.length || 0}
                onFaceTextSubmit={handleFaceTextSubmit}
                inputId={`dodecahedron-${id}-face-${idx}`}
              />
            );
          })}
          {/* Wireframe lines - conditionally rendered when not using global renderer and at full detail */}
          {shouldRenderFullDetail && renderEdges && (
            <InstancedLine
              points={edgePoints}
              color={renderLineColor}
              lineWidth={lineWidth !== undefined ? lineWidth : isMobile ? 3 : 1}
            />
          )}{' '}
        </group>
        {/* Move UI elements outside main group but keep them following contentRef */}
        {selected &&
          dodecahedron?.showObjectUI &&
          !dodecahedron?.showHeader && (
            <ObjectUI
              position={[getUIPosition()]}
              onTransformToggle={handleTransformToggle}
              onHeaderToggle={handleHeaderToggle}
              onResizeToggle={handleResizeToggle}
              onLineColorChange={handleLineColorChange}
              onDelete={() => onDelete?.(id)} // Pass the delete handler with this object's ID          showTransform={dodecahedron?.showTransform}
              showHeader={dodecahedron?.showHeader}
              followTarget={contentRef}
            />
          )}{' '}
        {shouldRenderFullDetail && selected &&
          dodecahedron?.showFaceUI &&
          dodecahedron?.activeFace !== null && (
            <group ref={faceUIGroupRef} position={position} scale={scale}>
              <FaceUI
                position={getFaceUIPosition(dodecahedron.activeFace)}
                onColorChange={(color) => {
                  updateFaceProperty(
                    'faceColors',
                    dodecahedron.activeFace,
                    color
                  );
                }}
                face={dodecahedron.activeFace}
                onTextClick={handleFaceTextButtonClick}
                followTarget={contentRef}
              />
            </group>
          )}{' '}
        {shouldRenderFullDetail && selected && dodecahedron?.showHeader && (
          <group position={position}>
            {' '}
            <group scale={scale}>
              <group scale={scale.map((s) => 1 / Math.max(s, 0.0001))}>
                {' '}
                <HeaderInput
                  position={getHeaderInputPosition()}
                  onTextSubmit={handleHeaderSubmit}
                  inputId={`dodecahedron-${id}-header`}
                  followTarget={null} // Remove followTarget as it's handled by the parent group positioning
                />
              </group>
            </group>
          </group>
        )}{' '}
        {shouldRenderFullDetail && renderHeaderText && (
          <AtlasTextSprite
            key={`header-${renderHeaderText}-${JSON.stringify(
              renderHeaderStyle
            )}`}
            text={renderHeaderText}
            position={getHeaderPosition()}
            followTarget={contentRef}
            onClick={handleHeaderClick}
            style={{
              ...renderHeaderStyle,
              isHeaderText: true,
              isDodecahedronHeader: true,
            }}
            billboard={true}
            scale={1}
          />
        )}
        {dodecahedron?.showStyleMenu && renderHeaderText && (
          <TextStyleUI
            position={getHeaderPosition()}
            followTarget={contentRef}
            onStyleChange={handleStyleChange}
            onClose={() => setDodecahedronShowStyleMenu(id, false)}
          />
        )}{' '}
        {selected && dodecahedron?.isResizing && contentRef.current && (
          <DreiTransformControls
            object={contentRef.current}
            onChange={handleScale}
            onMouseDown={() => {
              if (contentRef.current?.orbitControls) {
                contentRef.current.orbitControls.enabled = false;
              }
              registerTransformingObject?.(id, true, position);
            }}
            onMouseUp={() => {
              if (contentRef.current?.orbitControls) {
                contentRef.current.orbitControls.enabled = true;
              }
              registerTransformingObject?.(id, false);
              // Clear real-time transform data - scale is now in store
              dodecahedronTransformMap.delete(id);

              // Save scale changes immediately on mouse up
              if (dodecahedron?.isScaleModified && onUpdate && objectData) {
                const currentScale = dodecahedron?.scale ||
                  objectData.scale || [1, 1, 1];

                onUpdate(id, {
                  type: 'dodecahedron',
                  position: objectData.position || [0, 0, 0],
                  scale: currentScale,
                  lineColor: objectData.lineColor || 'black',
                  headerText: objectData.headerText || '',
                  headerStyle: objectData.headerStyle || {
                    fontSize: 1.5,
                    color: 'black',
                    underline: false,
                  },
                  faceColors: objectData.faceColors || {},
                  faceTexts: objectData.faceTexts || {},
                  faceTextStyles: objectData.faceTextStyles || {},
                });

                // Reset flag after saving
                setDodecahedronIsScaleModified(id, false);
              }
            }}
            mode="scale"
            space="local"
            size={1}
            matrixAutoUpdate={false} // Add this to prevent matrix recursion
          />
        )}{' '}
        {/* Add TextStyleUI for face text */}{' '}
        {dodecahedron?.showFaceTextStyleMenu &&
          dodecahedron?.activeFaceText !== null && (
            <TextStyleUI
              position={(() => {
                const { position } = getFaceTextPosition(
                  dodecahedron.activeFaceText
                );
                // Apply offset in world space, not in scaled space
                return [
                  position[0],
                  position[1] + 2 * (1 / (dodecahedron?.scale?.[1] || 1)),
                  position[2],
                ];
              })()}
              followTarget={contentRef}
              onStyleChange={handleFaceTextStyleChange}
              onClose={() => setDodecahedronShowFaceTextStyleMenu(id, false)}
              uiType="faceText" // Add this prop to show limited options
            />
          )}
        {/* Update TransformControls to use contentRef */}{' '}
        {selected && dodecahedron?.showTransform && contentRef.current && (
          <DreiTransformControls
            object={contentRef.current}
            onObjectChange={handleDrag}
            onMouseDown={() => {
              if (contentRef.current?.orbitControls) {
                contentRef.current.orbitControls.enabled = false;
              }
              registerTransformingObject?.(id, true, position);
            }}
            onMouseUp={() => {
              if (contentRef.current?.orbitControls) {
                contentRef.current.orbitControls.enabled = true;
              }
              registerTransformingObject?.(id, false);
              // Sync objectsStore with the exact final position from TransformControls
              // before removing from the transform map, so both the hit mesh (via R3F
              // reconciliation from objectsStore) and the edges (via the buffered draw)
              // converge on the same position.
              if (contentRef.current) {
                const p = contentRef.current.position;
                const finalPos = [p.x, p.y, p.z];
                const store = useObjectsStore.getState();
                const objs = Array.isArray(store.objects) ? store.objects : [];
                store.setObjects(objs.map((o) => o.id === id ? { ...o, position: finalPos } : o));
              }
              // Delay the map deletion by one animation frame so React can flush
              // the final position reconciliation before the global renderer falls
              // back to reading from the store.
              requestAnimationFrame(() => dodecahedronTransformMap.delete(id));
            }}
            mode="translate"
            space="world"
            size={1}
          />
        )}{' '}
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Only re-render if critical props change
    return (
      prevProps.id === nextProps.id &&
      prevProps.selected === nextProps.selected &&
      prevProps.showAllIndicators === nextProps.showAllIndicators &&
      prevProps.globalIndicatorSelected === nextProps.globalIndicatorSelected &&
      prevProps.indicatorMode === nextProps.indicatorMode &&
      prevProps.selectedIndicators?.length ===
        nextProps.selectedIndicators?.length
    );
  }
);

Sphere.displayName = 'Sphere';

export default Sphere;
