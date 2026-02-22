import {
  TransformControls as DreiTransformControls,
  Html,
} from '@react-three/drei';
import InstancedLine from './InstancedLine';
import { useRef, useEffect, useCallback, useMemo } from 'react';
import React from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import FaceUI from './FaceUI';
import AtlasTextSprite from './AtlasTextSprite';
import FaceTextInput from './FaceTextInput';
import TextStyleUI from './TextStyleUI';
import HeaderInput from './HeaderInput';
import FaceIndicator from './FaceIndicator';
import WebcamStream from './WebcamStream';
import ScreenShareStream from './ScreenShareStream';
import * as THREE from 'three';
import isEqual from 'lodash/isEqual';
import { uploadImageToStorage } from '../services/storageService';
import { subscribePlaneToBroadcasts } from '../services/centralizedBroadcastManager';
import {
  usePlaneStore,
  useObjectsStore,
  useConnectionStore,
  useIndicatorsStore,
} from '../stores';
import { shallow } from 'zustand/shallow';
import { calculateAxisSnap } from '../utils/snappingUtils'; // Import snapping utility
import SnapLineIndicator from './SnapLineIndicator'; // Import snap line indicator
// Import unified utilities
import { useDebouncedUpdate } from '../hooks/useDebouncedUpdate';
import { resourceCleanupService } from '../services/resourceCleanupService';
import { frameCounter } from '../utils/frameCounter';

// Mobile detection constant
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

const Plane = ({
  id,
  selected,
  onClick,
  onIndicatorSelected,
  onIndicatorDeselected,
  onFaceIndicatorClick,
  showAllIndicators,
  globalIndicatorSelected,
  selectedIndicators,
  indicatorMode,
  onUpdate,
  onMove,
  onDelete,
  onTransformStart,
  onTransformEnd,
  user,
  currentSpaceId,
}) => {
  // PERFORMANCE: Use targeted selector — only re-renders when THIS object's data changes.
  const objectData = useObjectsStore(
    useCallback((state) => state.objects.find((obj) => obj.id === id), [id])
  );

  // PERFORMANCE: Subscribe only to connections involving THIS plane.
  const connectionsFromStore = useConnectionStore(
    useCallback(
      (state) => state.connections.filter(
        (c) => c.start?.objectId === id?.toString() || c.end?.objectId === id?.toString()
      ),
      [id]
    )
  );

  // Store state and actions - moved before memoized values to avoid initialization order issues
  const plane = usePlaneStore((state) => state.getPlane(id));

  // Single selector for all plane actions (prevents 20+ subscriptions)
  const planeActions = usePlaneStore(
    (state) => ({
      createPlane: state.createPlane,
      updatePlane: state.updatePlane,
      selectPlane: state.selectPlane,
      deselectPlane: state.deselectPlane,
      isPlaneSelected: state.isPlaneSelected(id),
      setPlaneShowUI: state.setPlaneShowUI,
      setPlaneShowTextInput: state.setPlaneShowTextInput,
      setPlaneShowTextStyleUI: state.setPlaneShowTextStyleUI,
      setPlaneShowTransform: state.setPlaneShowTransform,
      setPlaneIsResizing: state.setPlaneIsResizing,
      setPlaneShowHeader: state.setPlaneShowHeader,
      setPlaneShowHeaderStyleUI: state.setPlaneShowHeaderStyleUI,
      setPlaneIndicatorSelected: state.setPlaneIndicatorSelected,
      setPlaneWebcamActive: state.setPlaneWebcamActive,
      setPlaneWebcamInitialized: state.setPlaneWebcamInitialized,
      setPlaneScreenShareActive: state.setPlaneScreenShareActive,
      setPlaneScreenShareInitialized: state.setPlaneScreenShareInitialized,
      setPlaneIsBroadcasting: state.setPlaneIsBroadcasting,
      setPlaneIsViewingBroadcast: state.setPlaneIsViewingBroadcast,
      setPlaneIsScreenSharing: state.setPlaneIsScreenSharing,
      setPlaneBroadcastInfo: state.setPlaneBroadcastInfo,
      setPlaneViewerCount: state.setPlaneViewerCount,
      setPlaneImageTexture: state.setPlaneImageTexture,
      setPlaneIsUploadingImage: state.setPlaneIsUploadingImage,
    }),
    shallow
  );

  // Destructure actions for easier access
  const {
    createPlane,
    updatePlane,
    selectPlane,
    deselectPlane,
    isPlaneSelected,
    setPlaneShowUI,
    setPlaneShowTextInput,
    setPlaneShowTextStyleUI,
    setPlaneShowTransform,
    setPlaneIsResizing,
    setPlaneShowHeader,
    setPlaneShowHeaderStyleUI,
    setPlaneIndicatorSelected,
    setPlaneWebcamActive,
    setPlaneWebcamInitialized,
    setPlaneScreenShareActive,
    setPlaneScreenShareInitialized,
    setPlaneIsBroadcasting,
    setPlaneIsViewingBroadcast,
    setPlaneIsScreenSharing,
    setPlaneBroadcastInfo,
    setPlaneViewerCount,
    setPlaneImageTexture,
    setPlaneIsUploadingImage,
  } = planeActions;

  // Get hover state from indicators store
  const hoveredObjectId = useIndicatorsStore((state) => state.hoveredObjectId);
  const setHoveredObjectId = useIndicatorsStore(
    (state) => state.setHoveredObjectId
  );

  // Consolidated derived values — single memo replacing ~20 trivial individual useMemos
  const planeData = useMemo(() => {
    const baseThickness = plane?.lineThickness || objectData?.lineThickness || 2;
    return {
      position: objectData?.position || [0, 0, 0],
      scale: objectData?.scale || [1, 1, 1],
      color: plane?.color || objectData?.color || 'white',
      headerText: plane?.headerText || objectData?.headerText || '',
      borderStyle: plane?.borderStyle || objectData?.borderStyle || 'solid',
      borderColor: plane?.borderColor || objectData?.borderColor || 'black',
      lineThickness: isMobile ? Math.max(baseThickness * 2, 3) : baseThickness,
      headerStyle: plane?.headerStyle || objectData?.headerStyle || { fontSize: 1.5, color: 'black', underline: false },
      faceText: plane?.faceText || objectData?.faceText || '',
      faceTextStyle: plane?.faceTextStyle || objectData?.faceTextStyle || { fontSize: 0.5, color: 'black', underline: false },
      imageUrl: objectData?.imageUrl || null,
      webcamActive: plane?.webcamActive ?? objectData?.webcamActive ?? false,
      webcamInitialized: plane?.webcamInitialized || false,
      screenShareActive: plane?.screenShareActive || false,
      screenShareInitialized: plane?.screenShareInitialized || false,
      isBroadcasting: plane?.isBroadcasting || false,
      isScreenSharing: plane?.isScreenSharing || false,
      isViewingBroadcast: plane?.isViewingBroadcast || false,
      broadcastInfo: plane?.broadcastInfo,
      showUI: plane?.showUI || false,
      showTextInput: plane?.showTextInput || false,
      showTextStyleUI: plane?.showTextStyleUI || false,
      showTransform: plane?.showTransform || false,
      isResizing: plane?.isResizing || false,
      showHeader: plane?.showHeader || false,
      showHeaderStyleUI: plane?.showHeaderStyleUI || false,
      isUploadingImage: plane?.isUploadingImage || false,
      indicatorSelected: plane?.indicatorSelected || false,
      viewerCount: plane?.viewerCount || 0,
    };
  }, [plane, objectData]);

  // Destructure for convenient access
  const {
    position,
    scale,
    color,
    headerText,
    borderStyle,
    borderColor,
    lineThickness,
    headerStyle,
    faceText,
    faceTextStyle,
    imageUrl,
    webcamActive,
    webcamInitialized,
    screenShareActive,
    screenShareInitialized,
    isBroadcasting,
    isScreenSharing,
    isViewingBroadcast,
    broadcastInfo,
    showUI,
    showTextInput,
    showTextStyleUI,
    showTransform,
    isResizing,
    showHeader,
    showHeaderStyleUI,
    isUploadingImage,
    indicatorSelected,
    viewerCount,
  } = planeData;

  const groupRef = useRef();
  const meshRef = useRef();
  const contentRef = useRef();
  const { camera } = useThree();
  // Mobile-aware sizing
  const size = isMobile ? 8 : 5; // Initialize plane UI state in store if it doesn't exist
  useEffect(() => {
    if (!plane) {
      createPlane(id, {
        // Initialize core properties
        scale: scale,
        // Initialize UI state
        showUI: true,
        showTextInput: false,
        showTextStyleUI: false,
        showTransform: false,
        isResizing: false,
        showHeader: false,
        showHeaderStyleUI: false,
        indicatorSelected: false,
        webcamInitialized: false,
        screenShareActive: false,
        screenShareInitialized: false,
        isBroadcasting: false,
        isScreenSharing: false,
        isViewingBroadcast: false,
        // Include border properties from objectData to prevent defaults from overriding
        borderStyle: objectData?.borderStyle,
        borderColor: objectData?.borderColor,
        lineThickness: objectData?.lineThickness,
        color: objectData?.color || 'white', // Ensure we always have a color
        headerText: objectData?.headerText,
        faceText: objectData?.faceText,
        headerStyle: objectData?.headerStyle,
        faceTextStyle: objectData?.faceTextStyle,
      });
    }
  }, [id, plane, createPlane, objectData, scale]);
  // Handle selection changes
  useEffect(() => {
    if (selected && !isPlaneSelected) {
      selectPlane(id);
    } else if (!selected && isPlaneSelected) {
      deselectPlane(id);
    }
  }, [selected, isPlaneSelected, selectPlane, deselectPlane, id]);

  // Add logging for critical state changes
  const lastWebcamStateRef = useRef(webcamActive);
  const lastWorldPosRef = useRef(null);
  const lastBroadcastSeenRef = useRef(Date.now());
  const broadcastInfoRef = useRef(null); // Track current broadcast info to avoid reactive loops
  const isTransformingRef = useRef(false);
  const isBroadcastingRef = useRef(false);
  const isMountedRef = useRef(true);
  const userJustToggledWebcamRef = useRef(false); // Track user actions
  // Define closeAllUIs before it's used in useEffect
  const closeAllUIs = useCallback(() => {
    setPlaneShowTextStyleUI(id, false);
    setPlaneShowUI(id, false);
    setPlaneShowTextInput(id, false);
    setPlaneShowTransform(id, false);
    setPlaneIsResizing(id, false);
    setPlaneShowHeader(id, false);
    setPlaneShowHeaderStyleUI(id, false);
  }, [
    id,
    setPlaneShowTextStyleUI,
    setPlaneShowUI,
    setPlaneShowTextInput,
    setPlaneShowTransform,
    setPlaneIsResizing,
    setPlaneShowHeader,
    setPlaneShowHeaderStyleUI,
  ]);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []); // Effect to load existing image texture
  useEffect(() => {
    if (imageUrl && !plane?.imageTexture) {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Enable CORS

      img.onload = () => {
        try {
          const texture = new THREE.Texture(img);
          texture.needsUpdate = true;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.format = THREE.RGBAFormat;
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.flipY = true;

          if (meshRef.current && isMountedRef.current) {
            // Use unified resource cleanup service
            if (meshRef.current.material) {
              resourceCleanupService.disposeMaterial(
                meshRef.current.material,
                `plane-${id}-material`
              );
            }

            const material = new THREE.MeshBasicMaterial({
              map: texture,
              transparent: true,
              opacity: 1,
              side: THREE.DoubleSide,
              depthTest: true,
              depthWrite: true,
              renderOrder: -2,
            });
            meshRef.current.material = material;
            setPlaneImageTexture(id, texture);
            console.log('Existing image texture loaded successfully');
          }
        } catch (error) {
          console.error('Error creating texture from existing image:', error);
        }
      };

      img.onerror = (error) => {
        console.error('Error loading existing image texture:', error);
      };

      img.src = imageUrl;
    }
  }, [id, imageUrl, plane?.imageTexture, setPlaneImageTexture]);
  useEffect(() => {
    // Handle webcam initialization from store state
    if (webcamActive !== lastWebcamStateRef.current) {
      // Don't force sync if user just toggled webcam - wait for prop to catch up
      if (!userJustToggledWebcamRef.current) {
        setPlaneWebcamActive(id, webcamActive);
        lastWebcamStateRef.current = webcamActive;
        if (webcamActive && !plane?.webcamInitialized) {
          setPlaneWebcamInitialized(id, true);
        }
      }
    } else if (webcamActive && !plane?.webcamInitialized) {
      setPlaneWebcamInitialized(id, true);
      setPlaneWebcamActive(id, true);
      lastWebcamStateRef.current = true;
    }

    // Reset the flag after effect runs
    if (userJustToggledWebcamRef.current) {
      // Check if props have caught up
      if (webcamActive === lastWebcamStateRef.current) {
        userJustToggledWebcamRef.current = false;
      }
    }
  }, [
    id,
    webcamActive,
    plane?.webcamInitialized,
    setPlaneWebcamActive,
    setPlaneWebcamInitialized,
  ]);
  useFrame(() => {
    if (groupRef.current) {
      // PERFORMANCE FIX: Reduce frequency of lookAt updates (10fps throttle)
      // Only update lookAt if selected OR if significant time has passed
      if (
        selected ||
        frameCounter.shouldUpdate(groupRef.current._lastCameraUpdate, 100)
      ) {
        groupRef.current.lookAt(camera.position);
        groupRef.current._lastCameraUpdate = frameCounter.getTime();
      }
    }
  });
  useEffect(() => {
    if (!selected) {
      closeAllUIs();
      setPlaneIndicatorSelected(id, false);
      onIndicatorDeselected?.();
    } else if (!plane?.indicatorSelected) {
      setPlaneShowUI(id, true);
    }
  }, [
    selected,
    plane?.indicatorSelected,
    onIndicatorDeselected,
    closeAllUIs,
    id,
    setPlaneIndicatorSelected,
    setPlaneShowUI,
  ]);
  useEffect(() => {
    if (groupRef.current && contentRef.current) {
      const worldPos = new THREE.Vector3();
      const currentScale = plane?.scale || [1, 1, 1];
      const offset = new THREE.Vector3(0, -5 * currentScale[1], 0);

      groupRef.current.updateWorldMatrix(true, false);
      groupRef.current.getWorldPosition(worldPos);

      offset.applyQuaternion(groupRef.current.quaternion);
      worldPos.add(offset);

      lastWorldPosRef.current = [worldPos.x, worldPos.y, worldPos.z];
    }
  }, [position, plane?.scale]);

  // Create unified update function
  const updateDatabase = useCallback(() => {
    if (!isMountedRef.current || !objectData || !onUpdate || !id) return;

    // Ensure position has valid numbers, not undefined/null values
    const currentPosition = objectData.position;
    const validPosition =
      Array.isArray(currentPosition) &&
      currentPosition.length === 3 &&
      currentPosition.every((val) => typeof val === 'number' && !isNaN(val))
        ? currentPosition
        : [0, 0, 0];

    const updates = {
      type: 'plane',
      position: validPosition,
      scale: objectData?.scale || plane?.scale || [1, 1, 1], // Use objectData as primary source
      color: plane?.color || objectData?.color || '#000000',
      headerText: plane?.headerText || objectData?.headerText || '',
      headerStyle: plane?.headerStyle || objectData?.headerStyle || {},
      borderStyle: plane?.borderStyle || objectData?.borderStyle || 'solid',
      borderColor: plane?.borderColor || objectData?.borderColor || '#000000',
      lineThickness: plane?.lineThickness || objectData?.lineThickness || 2,
      faceText: plane?.faceText || objectData?.faceText || '',
      faceTextStyle: plane?.faceTextStyle || objectData?.faceTextStyle || {},
      webcamActive: plane?.webcamActive || objectData?.webcamActive || false,
      screenShareActive:
        plane?.screenShareActive || objectData?.screenShareActive || false,
      broadcasting:
        (plane?.webcamActive || objectData?.webcamActive || false) &&
        (plane?.isBroadcasting || false),
      screenSharing:
        (plane?.screenShareActive || objectData?.screenShareActive || false) &&
        (plane?.isScreenSharing || false),
      imageUrl: plane?.imageUrl || objectData?.imageUrl || '',
    };

    onUpdate(id, updates);
  }, [
    objectData,
    plane?.scale,
    plane?.color,
    plane?.headerText,
    plane?.headerStyle,
    plane?.borderStyle,
    plane?.borderColor,
    plane?.lineThickness,
    plane?.faceText,
    plane?.faceTextStyle,
    plane?.webcamActive,
    plane?.screenShareActive,
    plane?.isBroadcasting,
    plane?.isScreenSharing,
    plane?.imageUrl,
    onUpdate,
    id,
  ]);

  // Use unified debounced update instead of duplicate pattern
  useDebouncedUpdate(updateDatabase, objectData);
  const handleScale = useCallback(
    (e) => {
      if (!e.target || !e.target.object) return;
      const currentScale = plane?.scale || [1, 1, 1];
      const newScale = [
        e.target.object.scale.x,
        e.target.object.scale.y,
        currentScale[2],
      ];

      // Only update if the scale change is significant to avoid unnecessary updates
      const epsilon = 0.0001;
      if (
        Math.abs(newScale[0] - currentScale[0]) < epsilon &&
        Math.abs(newScale[1] - currentScale[1]) < epsilon
      ) {
        return;
      }

      // Update the plane store first for UI feedback
      updatePlane(id, { scale: newScale });

      // Update objects store immediately for instant visual feedback (like Dodecahedron)
      const objectsStore = useObjectsStore.getState();
      const currentObjects = objectsStore.objects;
      const updatedObjects = currentObjects.map((obj) =>
        obj.id === id ? { ...obj, scale: newScale } : obj
      );
      objectsStore.setObjects(updatedObjects);

      // Mark that scale has been modified (for onMouseUp to detect)
      isTransformingRef.current = true;
    },
    [id, plane?.scale, updatePlane]
  );

  // Separate handler for resize end to save scale changes immediately
  const handleResizeEnd = useCallback(() => {
    if (window.orbitControls) window.orbitControls.enabled = true;

    // No immediate save - let the debounced effect handle it like Cube/Dodecahedron
    // Reset transform flag
    isTransformingRef.current = false;

    if (onTransformEnd) onTransformEnd(id);
  }, [onTransformEnd, id]);
  const handleDrag = useCallback(
    (e) => {
      // Get new position from the transform controls event
      if (!e.target || !e.target.object || !e.target.object.position) {
        console.error('Invalid transform event in Plane handleDrag');
        return;
      }

      const newPos = e.target.object.position;
      // Ensure we have valid numerical values for position
      if (
        typeof newPos.x !== 'number' ||
        typeof newPos.y !== 'number' ||
        typeof newPos.z !== 'number'
      ) {
        console.error('Invalid position values in Plane handleDrag', newPos);
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

          // Update plane store with snap info for the visual indicator
          updatePlane(id, {
            showSnapLine: true,
            snapLinePoints: snapResult.linePoints,
            snapAxis: snapResult.snapAxis,
          });

          // Auto-hide the snap line after 2 seconds
          setTimeout(() => {
            updatePlane(id, { showSnapLine: false });
          }, 2000);
        } else {
          // No snapping, ensure indicator is hidden
          updatePlane(id, { showSnapLine: false });
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
      } catch (error) {
        console.error('Error in Plane handleDrag:', error);
      }
    },
    [id, onMove, updatePlane]
  );

  const handleTransformStart = useCallback(() => {
    if (window.orbitControls) window.orbitControls.enabled = false;
    if (onTransformStart) onTransformStart(id);
  }, [onTransformStart, id]);
  const handleTransformEnd = useCallback(() => {
    if (window.orbitControls) window.orbitControls.enabled = true;

    // No immediate save - let the debounced effect handle it like Cube/Dodecahedron
    // Reset transform flag
    isTransformingRef.current = false;

    if (onTransformEnd) onTransformEnd(id);
  }, [onTransformEnd, id]);
  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      onClick();

      // Always close TextStyleUI when clicking on the plane mesh
      setPlaneShowTextStyleUI(id, false);

      if (!selected) {
        closeAllUIs();
      } else {
        // If already selected, just show the main UI
        setPlaneShowUI(id, true);
      }
    },
    [
      onClick,
      selected,
      closeAllUIs,
      id,
      setPlaneShowUI,
      setPlaneShowTextStyleUI,
    ]
  );
  const handleTextClick = useCallback(() => {
    closeAllUIs();
    setPlaneShowTextInput(id, true);
  }, [closeAllUIs, id, setPlaneShowTextInput]);
  const handleTextSubmit = useCallback(
    (newText) => {
      updatePlane(id, { faceText: newText });
      closeAllUIs();
    },
    [id, updatePlane, closeAllUIs]
  );

  const handleTextStyleChange = useCallback(
    (newStyle) => {
      updatePlane(id, {
        faceTextStyle: { ...(plane?.faceTextStyle || {}), ...newStyle },
      });
    },
    [id, updatePlane, plane?.faceTextStyle]
  );

  const handleTextSpriteClick = useCallback(
    (e) => {
      e.stopPropagation();
      closeAllUIs();
      setPlaneShowTextStyleUI(id, true);
    },
    [closeAllUIs, id, setPlaneShowTextStyleUI]
  );

  const handleTransformToggle = useCallback(() => {
    setPlaneShowTransform(id, !plane?.showTransform);
    setPlaneShowUI(id, false);
  }, [id, plane?.showTransform, setPlaneShowTransform, setPlaneShowUI]);
  const handleResizeToggle = useCallback(() => {
    setPlaneIsResizing(id, (prev) => {
      if (!prev) setPlaneShowTransform(id, false);
      return !prev;
    });
    setPlaneShowUI(id, false);
  }, [id, setPlaneIsResizing, setPlaneShowTransform, setPlaneShowUI]);
  const handleColorChange = useCallback(
    (newColor) => {
      updatePlane(id, { color: newColor });

      // Clear image texture when color is applied using unified service
      if (plane?.imageTexture) {
        resourceCleanupService.disposeTexture(
          plane.imageTexture,
          `plane-${id}-texture`
        );
        setPlaneImageTexture(id, null);

        // Reset mesh material to color-based material
        if (meshRef.current) {
          if (meshRef.current.material) {
            resourceCleanupService.disposeMaterial(
              meshRef.current.material,
              `plane-${id}-material`
            );
          }
          const material = new THREE.MeshBasicMaterial({
            color: newColor,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
            depthTest: true,
            depthWrite: true,
            renderOrder: -2,
          });

          meshRef.current.material = material;
        }
      }

      // Save color changes to database immediately (aligned with Cube pattern)
      if (onUpdate) {
        onUpdate(id, {
          type: 'plane',
          position: position,
          scale: plane?.scale || scale,
          color: newColor,
          borderStyle: borderStyle,
          borderColor: borderColor,
          lineThickness: lineThickness,
          headerText: headerText,
          headerStyle: headerStyle,
          faceText: faceText,
          faceTextStyle: faceTextStyle,
          imageUrl: imageUrl,
          webcamActive: webcamActive,
        });
      }
    },
    [
      id,
      plane?.imageTexture,
      setPlaneImageTexture,
      updatePlane,
      onUpdate,
      position,
      plane?.scale,
      scale,
      borderStyle,
      borderColor,
      lineThickness,
      headerText,
      headerStyle,
      faceText,
      faceTextStyle,
      imageUrl,
      webcamActive,
    ]
  );
  const handleHeaderToggle = useCallback(() => {
    closeAllUIs();
    setPlaneShowHeader(id, true);
  }, [closeAllUIs, id, setPlaneShowHeader]);

  const handleHeaderSubmit = useCallback(
    (text) => {
      updatePlane(id, { headerText: text });
      setPlaneShowHeader(id, false);
    },
    [id, updatePlane, setPlaneShowHeader]
  );
  const handleHeaderTextClick = useCallback(
    (e) => {
      e.stopPropagation();
      closeAllUIs();
      setPlaneShowHeaderStyleUI(id, true);
      setPlaneShowUI(id, false);
    },
    [closeAllUIs, id, setPlaneShowHeaderStyleUI, setPlaneShowUI]
  );

  const handleHeaderStyleChange = useCallback(
    (newStyle) => {
      updatePlane(id, {
        headerStyle: { ...(plane?.headerStyle || {}), ...newStyle },
      });
    },
    [id, updatePlane, plane?.headerStyle]
  );
  const handleBorderToggle = useCallback(
    (option) => {
      let updates = {};

      if (option.type === 'style') {
        updates.borderStyle = option.value;
        updatePlane(id, { borderStyle: option.value });
      } else if (option.type === 'color') {
        updates.borderColor = option.value;
        updatePlane(id, { borderColor: option.value });
      } else if (option.type === 'thickness') {
        const newThickness =
          (plane?.lineThickness || 1) >= 6
            ? 2
            : (plane?.lineThickness || 1) + 2;
        updates.lineThickness = newThickness;
        updatePlane(id, { lineThickness: newThickness });
      }

      // Save border changes to database immediately (aligned with Cube pattern)
      if (onUpdate && Object.keys(updates).length > 0) {
        onUpdate(id, {
          type: 'plane',
          position: position,
          scale: plane?.scale || scale,
          color: color,
          borderStyle: updates.borderStyle || borderStyle,
          borderColor: updates.borderColor || borderColor,
          lineThickness: updates.lineThickness || lineThickness,
          headerText: headerText,
          headerStyle: headerStyle,
          faceText: faceText,
          faceTextStyle: faceTextStyle,
          imageUrl: imageUrl,
          webcamActive: webcamActive,
        });
      }
    },
    [
      id,
      updatePlane,
      plane?.lineThickness,
      onUpdate,
      position,
      plane?.scale,
      scale,
      color,
      borderStyle,
      borderColor,
      lineThickness,
      headerText,
      headerStyle,
      faceText,
      faceTextStyle,
      imageUrl,
      webcamActive,
    ]
  );

  const handleIndicatorClick = useCallback(
    (e) => {
      e.stopPropagation();
      try {
        const planeRef = contentRef.current || groupRef.current;
        if (!planeRef) return;
        planeRef.updateWorldMatrix(true, false);
        const worldMatrix = planeRef.matrixWorld.clone();
        const offset = new THREE.Vector3(0, -5 * (plane?.scale?.[1] || 1), 0);
        const worldPos = new THREE.Vector3();
        planeRef.getWorldPosition(worldPos);
        offset.applyQuaternion(planeRef.quaternion);
        worldPos.add(offset);
        const positionArray = [worldPos.x, worldPos.y, worldPos.z];
        const stringId = String(id);
        const indicator = {
          type: 'plane',
          position: positionArray,
          worldPosition: positionArray,
          facePosition: positionArray,
          faceCenter: positionArray,
          face: 'bottom',
          plane: planeRef,
          scale: [...(plane?.scale || [1, 1, 1])],
          planeData: {
            position: [...position],
            scale: [...(plane?.scale || [1, 1, 1])],
            worldMatrix: Array.from(worldMatrix.elements),
            offset: [0, -5 * (plane?.scale?.[1] || 1), 0],
          },
          cube: {
            id: stringId,
            position,
            scale: plane?.scale || [1, 1, 1],
            userData: {
              objectId: stringId,
              planeRef: planeRef,
              indicatorPosition: positionArray,
            },
          },
          id: stringId,
          objectId: stringId,
        };
        setPlaneIndicatorSelected(id, true);
        onIndicatorSelected?.();
        onFaceIndicatorClick?.(indicator);
      } catch (error) {
        console.error('Error in handleIndicatorClick:', error);
      }
    },
    [
      id,
      plane?.scale,
      position,
      onIndicatorSelected,
      onFaceIndicatorClick,
      setPlaneIndicatorSelected,
    ]
  );
  const isIndicatorConnected = useMemo(() => {
    return connectionsFromStore?.some(
      (conn) =>
        conn.start.plane === groupRef.current ||
        conn.end.plane === groupRef.current
    );
  }, [connectionsFromStore]);
  const shouldShowIndicator = useMemo(() => {
    if (selectedIndicators?.length > 0) return true;
    if (showAllIndicators || globalIndicatorSelected) return true;
    if (isIndicatorConnected) return true;
    if (plane?.indicatorSelected) return true;
    if (selected) return true;

    // In indicators mode, ONLY show for the currently hovered object
    if (indicatorMode === 'indicators') {
      return hoveredObjectId === id;
    }

    // In default mode, don't show indicators
    return false;
  }, [
    selectedIndicators,
    indicatorMode,
    showAllIndicators,
    globalIndicatorSelected,
    isIndicatorConnected,
    plane?.indicatorSelected,
    selected,
    hoveredObjectId,
    id,
  ]);
  useEffect(() => {
    if (!currentSpaceId || !id || !user || !window.currentSpaceOwner) return;
    if (plane?.webcamActive || plane?.isViewingBroadcast) {
      if (plane?.isViewingBroadcast && plane?.webcamActive) {
        setPlaneIsViewingBroadcast(id, false);
        setPlaneBroadcastInfo(id, null);
      }
      return;
    }

    // console.log(`[Plane ${id}] Setting up broadcast listener`);

    // Use centralized broadcast manager with fallback to individual listening
    const unsubscribe = subscribePlaneToBroadcasts(
      window.currentSpaceOwner,
      currentSpaceId,
      id,
      (objectData) => {
        if (!isMountedRef.current || plane?.webcamActive) return;

        const isRemoteBroadcastingNow =
          objectData?.broadcasting === true &&
          objectData?.broadcasterId !== user.uid;
        const newBroadcastId = objectData?.broadcastId || null;
        const newBroadcasterId = objectData?.broadcasterId || null;

        if (isRemoteBroadcastingNow && newBroadcastId && newBroadcasterId) {
          lastBroadcastSeenRef.current = Date.now();

          const newBroadcastInfo = {
            broadcastId: newBroadcastId,
            broadcasterId: newBroadcasterId,
            planeId: id,
          };
          if (!isEqual(broadcastInfoRef.current, newBroadcastInfo)) {
            setPlaneBroadcastInfo(id, newBroadcastInfo);
            broadcastInfoRef.current = newBroadcastInfo;
            if (!plane?.isViewingBroadcast) {
              setPlaneIsViewingBroadcast(id, true);
            }
          }
        } else {
          if (plane?.isViewingBroadcast) {
            const now = Date.now();
            if (now - lastBroadcastSeenRef.current > 5000) {
              setPlaneBroadcastInfo(id, null);
              broadcastInfoRef.current = null;
              setPlaneIsViewingBroadcast(id, false);
            }
          } else if (broadcastInfoRef.current !== null) {
            setPlaneBroadcastInfo(id, null);
            broadcastInfoRef.current = null;
          }
        }
      }
    );
    return () => {
      console.log(`[Plane ${id}] Cleaning up broadcast listener`);
      unsubscribe();
    };
  }, [
    currentSpaceId,
    id,
    user,
    plane?.webcamActive,
    plane?.isViewingBroadcast,
    setPlaneBroadcastInfo,
    setPlaneIsViewingBroadcast,
  ]); // Removed broadcastInfo to prevent reactive loop
  const handleBroadcastStopped = useCallback(async () => {
    if (!isMountedRef.current) return;
    if (plane?.isBroadcasting) {
      setPlaneIsBroadcasting(id, false);
      setPlaneViewerCount(id, 0);

      onUpdate?.(id, {
        type: 'plane',
        broadcasting: false,
        broadcastId: null,
        webcamActive: false,
      });
    }
  }, [
    onUpdate,
    id,
    plane?.isBroadcasting,
    setPlaneIsBroadcasting,
    setPlaneViewerCount,
  ]);
  const handleWebcamToggle = useCallback(async () => {
    // Set flag to prevent immediate sync interference
    userJustToggledWebcamRef.current = true;

    const currentWebcamState = plane?.webcamActive;
    const newWebcamState = !currentWebcamState;

    if (newWebcamState) {
      setPlaneWebcamInitialized(id, true);
      if (
        confirm(
          'Do you want to broadcast this webcam to other users in this space?'
        )
      ) {
        setPlaneWebcamActive(id, true);
        setPlaneIsBroadcasting(id, true);
        lastWebcamStateRef.current = true;
        // Update object data to reflect webcam being enabled

        onUpdate?.(id, {
          type: 'plane',
          webcamActive: true,
        });
      } else {
        setPlaneWebcamActive(id, true);
        setPlaneIsBroadcasting(id, false);
        lastWebcamStateRef.current = true;
        // Update object data to reflect webcam being enabled (local only)

        onUpdate?.(id, {
          type: 'plane',
          webcamActive: true,
        });
      }
    } else {
      if (plane?.isBroadcasting) {
        setPlaneViewerCount(id, 0);
        onUpdate?.(id, {
          type: 'plane',
          broadcasting: false,
          broadcastId: null,
          webcamActive: false,
        });
      }
      setPlaneWebcamActive(id, false);
      setPlaneIsBroadcasting(id, false);
      setPlaneIsViewingBroadcast(id, false);
      setPlaneBroadcastInfo(id, null);
      lastWebcamStateRef.current = false;
    }
    setPlaneShowUI(id, false);
  }, [
    id,
    plane?.webcamActive,
    plane?.isBroadcasting,
    onUpdate,
    setPlaneWebcamInitialized,
    setPlaneWebcamActive,
    setPlaneIsBroadcasting,
    setPlaneViewerCount,
    setPlaneIsViewingBroadcast,
    setPlaneBroadcastInfo,
    setPlaneShowUI,
  ]);
  const handleScreenShareToggle = useCallback(() => {
    // Set flag to prevent immediate sync interference
    userJustToggledWebcamRef.current = true;
    const currentScreenShareState = plane?.screenShareActive;
    const newScreenShareState = !currentScreenShareState;

    if (newScreenShareState) {
      setPlaneScreenShareInitialized(id, true);
      if (
        confirm(
          'Do you want to share your screen to other users in this space?'
        )
      ) {
        setPlaneScreenShareActive(id, true);
        setPlaneIsScreenSharing(id, true);
        // Update object data to reflect screen share being enabled

        onUpdate?.(id, {
          type: 'plane',
          screenShareActive: true,
        });
      } else {
        setPlaneScreenShareActive(id, true);
        setPlaneIsScreenSharing(id, false);
        // Update object data to reflect screen share being enabled (local only)

        onUpdate?.(id, {
          type: 'plane',
          screenShareActive: true,
        });
      }
    } else {
      if (plane?.isScreenSharing) {
        // Stop screen sharing
        onUpdate?.(id, {
          type: 'plane',
          screenSharing: false,
          screenShareActive: false,
        });
      }
      setPlaneScreenShareActive(id, false);
      setPlaneIsScreenSharing(id, false);
    }
    setPlaneShowUI(id, false);
  }, [
    id,
    plane?.screenShareActive,
    plane?.isScreenSharing,
    onUpdate,
    setPlaneScreenShareInitialized,
    setPlaneScreenShareActive,
    setPlaneIsScreenSharing,
    setPlaneShowUI,
  ]);
  const handleImageUpload = useCallback(
    async (file) => {
      if (!user?.uid || !currentSpaceId) {
        alert('You must be logged in to upload images');
        return;
      }

      setPlaneIsUploadingImage(id, true);

      try {
        console.log('Uploading image:', file.name);
        const imageUrl = await uploadImageToStorage(
          file,
          user.uid,
          currentSpaceId
        );
        console.log('Image uploaded successfully:', imageUrl);

        // Create an Image object to load the texture properly
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Enable CORS

        img.onload = () => {
          try {
            // Create texture from the loaded image
            const texture = new THREE.Texture(img);
            texture.needsUpdate = true;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.format = THREE.RGBAFormat;
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.flipY = true; // Important for proper orientation

            // Apply the texture to the mesh
            if (meshRef.current) {
              // Use unified resource cleanup service
              if (meshRef.current.material) {
                resourceCleanupService.disposeMaterial(
                  meshRef.current.material,
                  `plane-${id}-material`
                );
              } // Create new material with the texture
              const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 1,
                side: THREE.DoubleSide,
                depthTest: true,
                depthWrite: true,
                renderOrder: -2,
              });

              meshRef.current.material = material;
              setPlaneImageTexture(id, texture);

              // Update the object in the database with the image URL
              onUpdate?.(id, {
                type: 'plane',
                imageUrl: imageUrl,
                color: null, // Clear color when image is applied
              });

              console.log('Texture applied to plane successfully');
            }
          } catch (error) {
            console.error('Error creating texture:', error);
            alert('Failed to create texture from uploaded image');
          } finally {
            setPlaneIsUploadingImage(id, false);
          }
        };

        img.onerror = (error) => {
          console.error('Error loading image:', error);
          alert('Failed to load the uploaded image');
          setPlaneIsUploadingImage(id, false);
        };

        // Load the image
        img.src = imageUrl;
      } catch (error) {
        console.error('Image upload failed:', error);
        alert(`Image upload failed: ${error.message}`);
        setPlaneIsUploadingImage(id, false);
      }
    },
    [
      user,
      currentSpaceId,
      onUpdate,
      id,
      setPlaneImageTexture,
      setPlaneIsUploadingImage,
    ]
  );
  const handleBroadcastStarted = useCallback(
    async (info) => {
      if (!info || !info.broadcastId || !isMountedRef.current) return;
      if (!isBroadcastingRef.current) setPlaneIsBroadcasting(id, true);

      onUpdate?.(id, {
        type: 'plane',
        broadcasting: true,
        broadcasterId: user?.uid,
        broadcastId: info.broadcastId,
        broadcastStarting: false,
        webcamActive: true,
      });
    },
    [onUpdate, id, user?.uid, setPlaneIsBroadcasting]
  );
  const handleViewerCountChange = useCallback(
    (count) => {
      if (isMountedRef.current) {
        setPlaneViewerCount(id, count);
      }
    },
    [id, setPlaneViewerCount]
  );

  // Update the ref whenever isBroadcasting changes
  useEffect(() => {
    isBroadcastingRef.current = plane?.isBroadcasting;
  }, [plane?.isBroadcasting]);
  useEffect(() => {
    return () => {
      // Use ref to get current broadcasting state without dependencies
      if (isBroadcastingRef.current) {
        setPlaneIsBroadcasting(id, false);
        setPlaneViewerCount(id, 0);
        onUpdate?.(id, {
          type: 'plane',
          broadcasting: false,
          broadcastId: null,
          webcamActive: false,
        });
      }
    };
  }, [onUpdate, id, setPlaneIsBroadcasting, setPlaneViewerCount]); // Removed unused dependencies

  const uiPositions = useMemo(() => {
    const currentScale = plane?.scale || scale || [1, 1, 1];
    const baseHeight = 5; // Base height like CUBE_SIZE in cube
    const zOffset = 0.1;

    return {
      faceUI: [0, baseHeight + 2 / currentScale[1], zOffset + 0.1],
      textSprite: [0, 0, zOffset],
      textInput: [0, 3 / currentScale[1], zOffset + 2],
      headerText: [0, baseHeight + 4 / currentScale[1], zOffset], // Use division like cube - inside scaled group
    };
  }, [plane?.scale, scale]);

  const indicatorPosition = useMemo(() => [0, -size - 1, 0], [size]);
  const meshMaterial = useMemo(() => {
    // If we have an image texture, use it
    if (plane?.imageTexture) {
      return (
        <meshBasicMaterial
          map={plane.imageTexture}
          transparent
          opacity={1}
          side={THREE.DoubleSide}
          needsUpdate={true}
          depthTest={true}
          depthWrite={true}
          renderOrder={-2}
        />
      );
    } // Otherwise use the color-based material
    // Ensure we always have a valid color (never null/undefined which defaults to black)
    const materialColor = color || 'white';

    return (
      <meshBasicMaterial
        color={materialColor}
        transparent
        opacity={1}
        side={THREE.DoubleSide}
        needsUpdate={true}
        depthTest={true}
        depthWrite={true}
        renderOrder={-2}
      />
    );
  }, [color, plane?.imageTexture]);

  const lineMaterialProps = useMemo(
    () => ({
      color: selected ? 'blue' : borderColor,
      lineWidth: lineThickness,
      dashed: borderStyle !== 'solid',
      dashScale: borderStyle === 'dotted' ? 1 : 2,
      dashSize: borderStyle === 'dotted' ? 0.1 : 1,
      gapSize: borderStyle === 'dotted' ? 0.1 : 0.5,
    }),
    [selected, borderColor, lineThickness, borderStyle]
  );

  // Convert border points to flat array for InstancedLine (4 edges in a rectangle)
  const borderEdgePoints = useMemo(
    () => [
      // Bottom edge
      -size,
      -size,
      0.1,
      size,
      -size,
      0.1,
      // Right edge
      size,
      -size,
      0.1,
      size,
      size,
      0.1,
      // Top edge
      size,
      size,
      0.1,
      -size,
      size,
      0.1,
      // Left edge
      -size,
      size,
      0.1,
      -size,
      -size,
      0.1,
    ],
    [size]
  );

  return (
    <>
      {/* Snap line indicator - only visible during snapping */}
      {plane?.showSnapLine && (
        <SnapLineIndicator
          points={plane.snapLinePoints}
          axis={plane.snapAxis}
          visible={plane.showSnapLine}
        />
      )}
      <group
        ref={groupRef}
        position={position}
        onPointerEnter={(e) => {
          e.stopPropagation();
          setHoveredObjectId(id);
        }}
        onPointerLeave={(e) => {
          e.stopPropagation();
          setHoveredObjectId(null);
        }}
      >
        {' '}
        <group ref={contentRef} scale={scale}>
          {' '}
          <mesh ref={meshRef} onClick={handleClick} renderOrder={-2}>
            <planeGeometry args={[size * 2 - 0.2, size * 2 - 0.2]} />
            {meshMaterial}
          </mesh>{' '}
          {(webcamActive || isViewingBroadcast) &&
            (webcamInitialized || isViewingBroadcast) && (
              <>
                <WebcamStream
                  key={`${id}-webcam`}
                  meshRef={meshRef}
                  active={webcamActive || isViewingBroadcast}
                  userId={user?.uid}
                  spaceId={currentSpaceId}
                  planeId={id}
                  isBroadcasting={webcamActive && isBroadcasting}
                  isReceiving={isViewingBroadcast}
                  broadcastData={broadcastInfo}
                  onBroadcastStarted={handleBroadcastStarted}
                  onBroadcastStopped={handleBroadcastStopped}
                  onViewerCountChange={handleViewerCountChange}
                />
              </>
            )}
          {(screenShareActive || isViewingBroadcast) &&
            (screenShareInitialized || isViewingBroadcast) && (
              <>
                <ScreenShareStream
                  key={`${id}-screenshare`}
                  meshRef={meshRef}
                  active={screenShareActive || isViewingBroadcast}
                  userId={user?.uid}
                  spaceId={currentSpaceId}
                  planeId={id}
                  isScreenSharing={screenShareActive && isScreenSharing}
                  isReceiving={isViewingBroadcast}
                  broadcastData={broadcastInfo}
                  onBroadcastStarted={handleBroadcastStarted}
                  onBroadcastStopped={handleBroadcastStopped}
                  onViewerCountChange={handleViewerCountChange}
                />
              </>
            )}
          {webcamActive && !webcamInitialized && (
            <Html center position={[0, 0, 0.1]}>
              <div className="initializing-cam">Initializing...</div>
            </Html>
          )}
          {screenShareActive && !screenShareInitialized && (
            <Html center position={[0, 0, 0.1]}>
              <div className="initializing-cam">
                Initializing Screen Share...
              </div>
            </Html>
          )}
          {isUploadingImage && (
            <Html center position={[0, 0, 0.1]}>
              <div
                style={{
                  color: 'white',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '10px',
                  borderRadius: '5px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                Uploading Image...
              </div>
            </Html>
          )}
          <InstancedLine
            points={borderEdgePoints}
            color={lineMaterialProps.color}
            lineWidth={lineMaterialProps.lineWidth}
            dashed={lineMaterialProps.dashed}
            dashScale={lineMaterialProps.dashScale}
            dashSize={lineMaterialProps.dashSize}
            gapSize={lineMaterialProps.gapSize}
          />
          {shouldShowIndicator && (
            <FaceIndicator
              position={indicatorPosition}
              onClick={handleIndicatorClick}
              isActive={indicatorSelected || isIndicatorConnected}
              showAllCubesIndicators={showAllIndicators}
              selectedIndicatorsLength={selectedIndicators?.length || 0}
            />
          )}{' '}
          {faceText && (
            <group
              scale={scale.map((s) => 1 / Math.max(0.0001, s))}
              position={uiPositions.textSprite}
            >
              <AtlasTextSprite
                text={faceText}
                position={[0, 0, 0]}
                style={faceTextStyle}
                onClick={handleTextSpriteClick}
                billboard={false}
                scale={1}
              />
            </group>
          )}
          {/* Header text inside the scaled group like cube */}
          {headerText && (
            <group
              scale={scale.map((s) => 1 / Math.max(0.0001, s))}
              position={uiPositions.headerText}
            >
              {' '}
              <AtlasTextSprite
                text={headerText}
                position={[0, 0, 0]}
                followTarget={groupRef}
                onClick={handleHeaderTextClick}
                style={{
                  ...headerStyle,
                  isHeaderText: true,
                  isPlaneHeader: true,
                }}
                billboard={true}
                scale={1}
              />
              {/* Header TextStyleUI inside the group like cube */}
              {showHeaderStyleUI && (
                <TextStyleUI
                  position={[0, 2, 0]} // 2 units above header text
                  onStyleChange={handleHeaderStyleChange}
                  onClose={() => {
                    setPlaneShowHeaderStyleUI(id, false);
                    setPlaneShowUI(id, true);
                  }}
                  followTarget={null}
                  uiType="header"
                />
              )}
            </group>
          )}
        </group>{' '}
        {selected && showUI && (
          <FaceUI
            position={uiPositions.faceUI}
            onColorChange={handleColorChange}
            onTextClick={handleTextClick}
            isPlane={true}
            onTransformToggle={handleTransformToggle}
            onResizeToggle={handleResizeToggle}
            onHeaderToggle={handleHeaderToggle}
            onBorderToggle={handleBorderToggle}
            followTarget={groupRef}
            onDelete={() => onDelete?.(id)}
            onWebcamToggle={handleWebcamToggle}
            onScreenShareToggle={handleScreenShareToggle}
            onImageUpload={handleImageUpload}
            webcamActive={webcamActive}
            screenShareActive={screenShareActive}
            isBroadcasting={isBroadcasting}
            isScreenSharing={isScreenSharing}
            viewerCount={viewerCount}
            face={{ id: `plane-${id}` }}
          />
        )}{' '}
        {showTextInput && (
          <FaceTextInput
            position={uiPositions.textInput}
            onTextSubmit={handleTextSubmit}
            inputId={`plane-${id}-face`}
            followTarget={groupRef}
          />
        )}{' '}
        {showTextStyleUI && (
          <TextStyleUI
            position={[0, 2, 1]} // Static position like cube, just above face text
            followTarget={null} // Disable follow target for planes
            onStyleChange={handleTextStyleChange}
            onClose={closeAllUIs}
          />
        )}
      </group>
      {/* Header input positioned outside the main group */}
      {showHeader && (
        <HeaderInput
          position={[
            position[0],
            position[1] + (10 * (plane?.scale?.[1] || 1)) / 2 + 4,
            position[2],
          ]}
          onTextSubmit={handleHeaderSubmit}
          inputId={`plane-${id}-header`}
          followTarget={contentRef}
        />
      )}
      {selected && isResizing && contentRef.current && (
        <DreiTransformControls
          key={`scale-${id}`}
          object={contentRef.current}
          onChange={handleScale}
          onMouseDown={handleTransformStart}
          onMouseUp={handleResizeEnd}
          mode="scale"
          space="local"
          showZ={false}
        />
      )}{' '}
      {selected && showTransform && groupRef.current && (
        <DreiTransformControls
          key={`translate-${id}`}
          object={groupRef.current}
          mode="translate"
          onObjectChange={handleDrag}
          onMouseDown={handleTransformStart}
          onMouseUp={handleTransformEnd}
        />
      )}
    </>
  );
};

export default React.memo(Plane, (prevProps, nextProps) => {
  // Custom comparison for Plane component
  return (
    prevProps.id === nextProps.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.position === nextProps.position &&
    prevProps.scale === nextProps.scale &&
    prevProps.color === nextProps.color &&
    prevProps.headerText === nextProps.headerText &&
    prevProps.faceText === nextProps.faceText &&
    prevProps.imageUrl === nextProps.imageUrl &&
    prevProps.webcamActive === nextProps.webcamActive &&
    prevProps.showAllIndicators === nextProps.showAllIndicators &&
    prevProps.globalIndicatorSelected === nextProps.globalIndicatorSelected &&
    prevProps.activeTextStyleUI === nextProps.activeTextStyleUI &&
    prevProps.selectedIndicators.length === nextProps.selectedIndicators.length
  );
});
