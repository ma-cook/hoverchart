import {
  Line,
  TransformControls as DreiTransformControls,
  Html,
} from '@react-three/drei';
import { Vector3 } from 'three';
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import FaceUI from './FaceUI';
import TextSprite from './TextSprite';
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

const Plane = ({
  position = [0, 0, 0],
  selected,
  onClick,
  onIndicatorSelected,
  onIndicatorDeselected,
  onFaceIndicatorClick,
  showAllIndicators,
  globalIndicatorSelected,
  connections,
  selectedIndicators,
  indicatorMode,
  id,
  onUpdate,
  onDelete,
  scale: initialScale = [1, 1, 1],
  color: initialColor = null,
  headerText: initialHeaderText = '',
  borderStyle: initialBorderStyle = 'solid',
  borderColor: initialBorderColor = 'black',
  lineThickness: initialLineThickness = 1,
  headerStyle: initialHeaderStyle = {
    fontSize: 1.5,
    color: 'black',
    underline: false,
  },
  faceText: initialFaceText = '',
  faceTextStyle: initialFaceTextStyle = {
    fontSize: 0.5,
    color: 'black',
    underline: false,
  },
  imageUrl: initialImageUrl = null,
  onTransformStart,
  onTransformEnd,
  webcamActive: initialWebcamActive = false,
  user,
  currentSpaceId,
}) => {
  const groupRef = useRef();
  const meshRef = useRef();
  const contentRef = useRef();
  const { camera } = useThree();
  const size = 5;
  const [webcamActive, setWebcamActive] = useState(initialWebcamActive);
  const [webcamInitialized, setWebcamInitialized] = useState(false);
  const [screenShareActive, setScreenShareActive] = useState(false);
  const [screenShareInitialized, setScreenShareInitialized] = useState(false);
  const [showUI, setShowUI] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [showTextStyleUI, setShowTextStyleUI] = useState(false);
  const [showTransform, setShowTransform] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [showHeaderStyleUI, setShowHeaderStyleUI] = useState(false);
  const [indicatorSelected, setIndicatorSelected] = useState(false);

  const [currentScale, setCurrentScale] = useState(initialScale);
  const [currentColor, setCurrentColor] = useState(initialColor);
  const [currentHeaderText, setCurrentHeaderText] = useState(initialHeaderText);
  const [currentHeaderStyle, setCurrentHeaderStyle] =
    useState(initialHeaderStyle);
  const [currentBorderStyle, setCurrentBorderStyle] =
    useState(initialBorderStyle);
  const [currentBorderColor, setCurrentBorderColor] =
    useState(initialBorderColor);
  const [currentLineThickness, setCurrentLineThickness] =
    useState(initialLineThickness);
  const [currentFaceText, setCurrentFaceText] = useState(initialFaceText);
  const [currentFaceTextStyle, setCurrentFaceTextStyle] =
    useState(initialFaceTextStyle);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isViewingBroadcast, setIsViewingBroadcast] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [broadcastInfo, setBroadcastInfo] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [imageTexture, setImageTexture] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Add logging for critical state changes
  const lastWebcamStateRef = useRef(initialWebcamActive);
  const lastWorldPosRef = useRef(null);
  const lastBroadcastSeenRef = useRef(Date.now());
  const broadcastInfoRef = useRef(null); // Track current broadcast info to avoid reactive loops
  const scaleTimeoutRef = useRef(null);
  const pendingScaleRef = useRef(null);
  const isTransformingRef = useRef(false);
  const isMountedRef = useRef(true);
  const userJustToggledWebcamRef = useRef(false); // Track user actions

  // Define closeAllUIs before it's used in useEffect
  const closeAllUIs = useCallback(() => {
    setShowTextStyleUI(false);
    setShowUI(false);
    setShowTextInput(false);
    setShowTransform(false);
    setIsResizing(false);
    setShowHeader(false);
    setShowHeaderStyleUI(false);
  }, []);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  // Effect to load existing image texture
  useEffect(() => {
    if (initialImageUrl && !imageTexture) {
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
          texture.flipY = false;

          if (meshRef.current && isMountedRef.current) {
            // Dispose of the previous material if it exists
            if (meshRef.current.material && meshRef.current.material.map) {
              meshRef.current.material.map.dispose();
            }
            if (meshRef.current.material) {
              meshRef.current.material.dispose();
            }

            const material = new THREE.MeshBasicMaterial({
              map: texture,
              transparent: true,
              opacity: 1,
              side: THREE.DoubleSide,
            });

            meshRef.current.material = material;
            setImageTexture(texture);
            console.log('Existing image texture loaded successfully');
          }
        } catch (error) {
          console.error('Error creating texture from existing image:', error);
        }
      };

      img.onerror = (error) => {
        console.error('Error loading existing image texture:', error);
      };

      img.src = initialImageUrl;
    }
  }, [initialImageUrl, imageTexture]);

  useEffect(() => {
    setCurrentScale(initialScale);
    setCurrentColor(initialColor);
    setCurrentHeaderText(initialHeaderText);
    setCurrentBorderStyle(initialBorderStyle);
    setCurrentBorderColor(initialBorderColor);
    setCurrentLineThickness(initialLineThickness);
    setCurrentHeaderStyle(initialHeaderStyle);
    setCurrentFaceText(initialFaceText);
    setCurrentFaceTextStyle(initialFaceTextStyle);

    if (initialWebcamActive !== lastWebcamStateRef.current) {
      // Don't force sync if user just toggled webcam - wait for prop to catch up
      if (!userJustToggledWebcamRef.current) {
        setWebcamActive(initialWebcamActive);
        lastWebcamStateRef.current = initialWebcamActive;
        if (initialWebcamActive && !webcamInitialized) {
          setWebcamInitialized(true);
        }
      }
    } else if (initialWebcamActive && !webcamInitialized) {
      setWebcamInitialized(true);
      setWebcamActive(true);
      lastWebcamStateRef.current = true;
    }

    // Reset the flag after effect runs
    if (userJustToggledWebcamRef.current) {
      // Check if props have caught up
      if (initialWebcamActive === lastWebcamStateRef.current) {
        userJustToggledWebcamRef.current = false;
      }
    }
  }, [
    id,
    initialScale,
    initialColor,
    initialHeaderText,
    initialBorderStyle,
    initialBorderColor,
    initialLineThickness,
    initialHeaderStyle,
    initialFaceText,
    initialFaceTextStyle,
    initialWebcamActive,
    // Removed webcamInitialized to prevent infinite loop when effect calls setWebcamInitialized
  ]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
    }
  });

  useEffect(() => {
    if (!selected) {
      closeAllUIs();
      setIndicatorSelected(false);
      onIndicatorDeselected?.();
    } else if (!indicatorSelected) {
      setShowUI(true);
    }
  }, [selected, indicatorSelected, onIndicatorDeselected, closeAllUIs]);

  useEffect(() => {
    if (groupRef.current && contentRef.current) {
      const worldPos = new THREE.Vector3();
      const offset = new THREE.Vector3(0, -5 * currentScale[1], 0);

      groupRef.current.updateWorldMatrix(true, false);
      groupRef.current.getWorldPosition(worldPos);

      offset.applyQuaternion(groupRef.current.quaternion);
      worldPos.add(offset);

      lastWorldPosRef.current = [worldPos.x, worldPos.y, worldPos.z];
    }
  }, [position, currentScale]);
  const directUpdate = useMemo(
    () => (updates) => {
      if (onUpdate && id && isMountedRef.current) {
        onUpdate(id, { type: 'plane', ...updates });
      }
    },
    [onUpdate, id]
  );

  // Add debounced update to prevent excessive database calls
  const debouncedUpdateTimeoutRef = useRef(null);
  const isInitialRenderRef = useRef(true);

  useEffect(() => {
    if (!isMountedRef.current) return;

    // Skip updates during initial render to prevent thousands of simultaneous calls
    // when camera moves between cells and loads many objects at once
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      return;
    }

    // Clear any pending update
    if (debouncedUpdateTimeoutRef.current) {
      clearTimeout(debouncedUpdateTimeoutRef.current);
    }

    // Debounce property updates to prevent excessive calls
    debouncedUpdateTimeoutRef.current = setTimeout(() => {
      const updates = {
        scale: currentScale,
        color: currentColor,
        headerText: currentHeaderText,
        headerStyle: currentHeaderStyle,
        borderStyle: currentBorderStyle,
        borderColor: currentBorderColor,
        lineThickness: currentLineThickness,
        faceText: currentFaceText,
        faceTextStyle: currentFaceTextStyle,
        webcamActive,
        screenShareActive,
        broadcasting: webcamActive && isBroadcasting,
        screenSharing: screenShareActive && isScreenSharing,
      };
      directUpdate(updates);
    }, 100); // 100ms debounce delay

    // Cleanup timeout on unmount
    return () => {
      if (debouncedUpdateTimeoutRef.current) {
        clearTimeout(debouncedUpdateTimeoutRef.current);
      }
    };
  }, [
    currentScale,
    currentColor,
    currentHeaderText,
    currentHeaderStyle,
    currentBorderStyle,
    currentBorderColor,
    currentLineThickness,
    currentFaceText,
    currentFaceTextStyle,
    webcamActive,
    screenShareActive,
    isBroadcasting,
    isScreenSharing,
    directUpdate,
  ]);

  const handleScale = useCallback(
    (e) => {
      if (!e.target || !e.target.object) return;
      pendingScaleRef.current = [
        e.target.object.scale.x,
        e.target.object.scale.y,
        currentScale[2],
      ];
      isTransformingRef.current = true;
      if (scaleTimeoutRef.current) clearTimeout(scaleTimeoutRef.current);
      scaleTimeoutRef.current = setTimeout(() => {
        if (pendingScaleRef.current && isMountedRef.current) {
          setCurrentScale(pendingScaleRef.current);
          pendingScaleRef.current = null;
        }
      }, 50);
    },
    [currentScale]
  );

  useEffect(() => {
    if (isTransformingRef.current && !pendingScaleRef.current) {
      isTransformingRef.current = false;
      if (onTransformEnd) {
        onTransformEnd(id);
      }
    }
    return () => {
      if (scaleTimeoutRef.current) clearTimeout(scaleTimeoutRef.current);
    };
  }, [currentScale, onTransformEnd, id]);

  const handleDrag = useCallback(
    (e) => {
      if (!groupRef.current || !onUpdate) return;

      const newPos = e.target.object.position;
      groupRef.current.position.copy(newPos);

      const worldPos = new THREE.Vector3();
      const offset = new THREE.Vector3(0, -5 * currentScale[1], 0);
      groupRef.current.updateWorldMatrix(true, false);
      groupRef.current.getWorldPosition(worldPos);
      offset.applyQuaternion(groupRef.current.quaternion);
      worldPos.add(offset);
      const worldPosArray = [worldPos.x, worldPos.y, worldPos.z];
      lastWorldPosRef.current = worldPosArray;
      const worldMatrix = Array.from(groupRef.current.matrixWorld.elements);

      groupRef.current.userData = {
        ...groupRef.current.userData,
        isPlane: true,
        objectId: String(id),
        id: String(id),
        indicatorOffset: [0, -5 * currentScale[1], 0],
        indicatorWorldPosition: worldPosArray,
        worldPosition: worldPosArray,
        facePosition: worldPosArray,
        isMoving: true,
        _lastUpdateTime: Date.now(),
        _isDragging: true,
      };

      onUpdate(id, {
        type: 'plane',
        position: [newPos.x, newPos.y, newPos.z],
        worldPosition: worldPosArray,
        planeData: {
          worldMatrix,
          position: [newPos.x, newPos.y, newPos.z],
          scale: currentScale,
          offset: [0, -5 * currentScale[1], 0],
        },
        _isDragging: true,
        _indicatorWorldPosition: worldPosArray,
      });
    },
    [onUpdate, id, currentScale]
  );

  const handleTransformStart = useCallback(() => {
    if (window.orbitControls) window.orbitControls.enabled = false;
    if (onTransformStart) onTransformStart(id);
  }, [onTransformStart, id]);

  const handleTransformEnd = useCallback(() => {
    if (window.orbitControls) window.orbitControls.enabled = true;

    if (groupRef.current && onUpdate) {
      const newPos = groupRef.current.position;
      const worldPos = new THREE.Vector3();
      const offset = new THREE.Vector3(0, -5 * currentScale[1], 0);
      groupRef.current.updateWorldMatrix(true, false);
      groupRef.current.getWorldPosition(worldPos);
      offset.applyQuaternion(groupRef.current.quaternion);
      worldPos.add(offset);
      const worldPosArray = [worldPos.x, worldPos.y, worldPos.z];
      const worldMatrix = Array.from(groupRef.current.matrixWorld.elements);

      // Direct update - no need to flush
      onUpdate(id, {
        type: 'plane',
        position: [newPos.x, newPos.y, newPos.z],
        worldPosition: worldPosArray,
        planeData: {
          worldMatrix,
          position: [newPos.x, newPos.y, newPos.z],
          scale: currentScale,
          offset: [0, -5 * currentScale[1], 0],
        },
        scale: currentScale,
        color: currentColor,
        headerText: currentHeaderText,
        headerStyle: currentHeaderStyle,
        borderStyle: currentBorderStyle,
        borderColor: currentBorderColor,
        lineThickness: currentLineThickness,
        faceText: currentFaceText,
        faceTextStyle: currentFaceTextStyle,
        webcamActive,
        screenShareActive,
        broadcasting: webcamActive && isBroadcasting,
        screenSharing: screenShareActive && isScreenSharing,
        _finalPosition: true,
        _indicatorWorldPosition: worldPosArray,
      });
    }

    if (onTransformEnd) onTransformEnd(id);
  }, [
    onUpdate,
    id,
    currentScale,
    currentColor,
    currentHeaderText,
    currentHeaderStyle,
    currentBorderStyle,
    currentBorderColor,
    currentLineThickness,
    currentFaceText,
    currentFaceTextStyle,
    webcamActive,
    screenShareActive,
    isBroadcasting,
    isScreenSharing,
    onTransformEnd,
    directUpdate,
  ]);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      onClick();
      if (!selected) {
        closeAllUIs();
      }
      setShowUI(true);
    },
    [onClick, selected, closeAllUIs]
  );

  const handleTextClick = useCallback(() => {
    closeAllUIs();
    setShowTextInput(true);
  }, [closeAllUIs]);

  const handleTextSubmit = useCallback(
    (newText) => {
      setCurrentFaceText(newText);
      closeAllUIs();
    },
    [closeAllUIs]
  );

  const handleTextStyleChange = useCallback((newStyle) => {
    setCurrentFaceTextStyle((prev) => ({ ...prev, ...newStyle }));
  }, []);

  const handleTextSpriteClick = useCallback(
    (e) => {
      e.stopPropagation();
      closeAllUIs();
      setShowTextStyleUI(true);
    },
    [closeAllUIs]
  );

  const handleTransformToggle = useCallback(() => {
    setShowTransform((prev) => !prev);
    setShowUI(false);
  }, []);

  const handleResizeToggle = useCallback(() => {
    setIsResizing((prev) => {
      if (!prev) setShowTransform(false);
      return !prev;
    });
    setShowUI(false);
  }, []);
  const handleColorChange = useCallback(
    (newColor) => {
      setCurrentColor(newColor);

      // Clear image texture when color is applied
      if (imageTexture) {
        imageTexture.dispose();
        setImageTexture(null);

        // Reset mesh material to color-based material
        if (meshRef.current) {
          if (meshRef.current.material) {
            meshRef.current.material.dispose();
          }

          const material = new THREE.MeshBasicMaterial({
            color: newColor,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
          });

          meshRef.current.material = material;
        }

        // Update database to clear image URL
        onUpdate?.(id, {
          type: 'plane',
          color: newColor,
          imageUrl: null,
        });
      }
    },
    [imageTexture, onUpdate, id]
  );

  const handleHeaderToggle = useCallback(() => {
    closeAllUIs();
    setShowHeader(true);
  }, [closeAllUIs]);

  const handleHeaderSubmit = useCallback((text) => {
    setCurrentHeaderText(text);
    setShowHeader(false);
  }, []);

  const handleHeaderTextClick = useCallback(
    (e) => {
      e.stopPropagation();
      closeAllUIs();
      setShowHeaderStyleUI(true);
      setShowUI(false);
    },
    [closeAllUIs]
  );

  const handleHeaderStyleChange = useCallback((newStyle) => {
    setCurrentHeaderStyle((prev) => ({ ...prev, ...newStyle }));
  }, []);

  const handleBorderToggle = useCallback((option) => {
    if (option.type === 'style') {
      setCurrentBorderStyle(option.value);
    } else if (option.type === 'color') {
      setCurrentBorderColor(option.value);
    } else if (option.type === 'thickness') {
      setCurrentLineThickness((prev) => (prev >= 6 ? 1 : prev + 2));
    }
  }, []);

  const handleIndicatorClick = useCallback(
    (e) => {
      e.stopPropagation();
      try {
        const planeRef = contentRef.current || groupRef.current;
        if (!planeRef) return;
        planeRef.updateWorldMatrix(true, false);
        const worldMatrix = planeRef.matrixWorld.clone();
        const offset = new THREE.Vector3(0, -5 * currentScale[1], 0);
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
          scale: [...currentScale],
          planeData: {
            position: [...position],
            scale: [...currentScale],
            worldMatrix: Array.from(worldMatrix.elements),
            offset: [0, -5 * currentScale[1], 0],
          },
          cube: {
            id: stringId,
            position,
            scale: currentScale,
            userData: {
              objectId: stringId,
              planeRef: planeRef,
              indicatorPosition: positionArray,
            },
          },
          id: stringId,
          objectId: stringId,
        };
        setIndicatorSelected(true);
        onIndicatorSelected?.();
        onFaceIndicatorClick?.(indicator);
      } catch (error) {
        console.error('Error in handleIndicatorClick:', error);
      }
    },
    [id, currentScale, position, onIndicatorSelected, onFaceIndicatorClick]
  );

  const isIndicatorConnected = useMemo(() => {
    return connections?.some(
      (conn) =>
        conn.start.plane === groupRef.current ||
        conn.end.plane === groupRef.current
    );
  }, [connections]);

  const shouldShowIndicator = useMemo(() => {
    if (selectedIndicators?.length > 0) return true;
    if (indicatorMode === 'indicators') return true;
    if (showAllIndicators || globalIndicatorSelected) return true;
    if (isIndicatorConnected) return true;
    if (indicatorSelected) return true;
    if (selected) return true;
    return false;
  }, [
    selectedIndicators,
    indicatorMode,
    showAllIndicators,
    globalIndicatorSelected,
    isIndicatorConnected,
    indicatorSelected,
    selected,
  ]);  useEffect(() => {
    if (!currentSpaceId || !id || !user || !window.currentSpaceOwner) return;

    if (webcamActive || isViewingBroadcast) {
      if (isViewingBroadcast && webcamActive) {
        setIsViewingBroadcast(false);
        setBroadcastInfo(null);
      }
      return;    }

    // console.log(`[Plane ${id}] Setting up broadcast listener`);

    // Use centralized broadcast manager with fallback to individual listening
    const unsubscribe = subscribePlaneToBroadcasts(
      window.currentSpaceOwner,
      currentSpaceId,
      id,
      (objectData) => {
        if (!isMountedRef.current || webcamActive) return;

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
          };          if (!isEqual(broadcastInfoRef.current, newBroadcastInfo)) {
            setBroadcastInfo(newBroadcastInfo);
            broadcastInfoRef.current = newBroadcastInfo;
            if (!isViewingBroadcast) {
              setIsViewingBroadcast(true);
            }
          }
        } else {
          if (isViewingBroadcast) {
            const now = Date.now();
            if (now - lastBroadcastSeenRef.current > 5000) {
              setBroadcastInfo(null);
              broadcastInfoRef.current = null;
              setIsViewingBroadcast(false);
            }
          } else if (broadcastInfoRef.current !== null) {
            setBroadcastInfo(null);
            broadcastInfoRef.current = null;
          }
        }
      }
    );    return () => {
      console.log(`[Plane ${id}] Cleaning up broadcast listener`);
      unsubscribe();
    };  }, [
    currentSpaceId,
    id,
    user,
    webcamActive,
    isViewingBroadcast,
  ]); // Removed broadcastInfo to prevent reactive loop
  
  const handleBroadcastStopped = useCallback(async () => {
    if (!isMountedRef.current) return;
    if (isBroadcasting) {
      setIsBroadcasting(false);
      setViewerCount(0);

      onUpdate?.(id, {
        type: 'plane',
        broadcasting: false,
        broadcastId: null,
        webcamActive: false,
      });
    }
  }, [onUpdate, id, isBroadcasting]);
  const handleWebcamToggle = useCallback(async () => {
    // Set flag to prevent immediate sync interference
    userJustToggledWebcamRef.current = true;

    const currentWebcamState = webcamActive;
    const newWebcamState = !currentWebcamState;

    if (newWebcamState) {
      setWebcamInitialized(true);
      if (
        confirm(
          'Do you want to broadcast this webcam to other users in this space?'
        )
      ) {
        setWebcamActive(true);
        setIsBroadcasting(true);
        lastWebcamStateRef.current = true;
        // Update object data to reflect webcam being enabled

        onUpdate?.(id, {
          type: 'plane',
          webcamActive: true,
        });
      } else {
        setWebcamActive(true);
        setIsBroadcasting(false);
        lastWebcamStateRef.current = true;
        // Update object data to reflect webcam being enabled (local only)

        onUpdate?.(id, {
          type: 'plane',
          webcamActive: true,
        });
      }    } else {
      if (isBroadcasting) {
        setViewerCount(0);
        onUpdate?.(id, {
          type: 'plane',
          broadcasting: false,
          broadcastId: null,
          webcamActive: false,
        });
      }
      setWebcamActive(false);
      setIsBroadcasting(false);
      setIsViewingBroadcast(false);
      setBroadcastInfo(null);
      lastWebcamStateRef.current = false;
    }
    setShowUI(false);
  }, [webcamActive, isBroadcasting, onUpdate, id]);
  const handleScreenShareToggle = useCallback(() => {
    // Set flag to prevent immediate sync interference
    userJustToggledWebcamRef.current = true;

    const currentScreenShareState = screenShareActive;
    const newScreenShareState = !currentScreenShareState;

    if (newScreenShareState) {
      setScreenShareInitialized(true);
      if (
        confirm(
          'Do you want to share your screen to other users in this space?'
        )
      ) {
        setScreenShareActive(true);
        setIsScreenSharing(true);
        // Update object data to reflect screen share being enabled

        onUpdate?.(id, {
          type: 'plane',
          screenShareActive: true,
        });
      } else {
        setScreenShareActive(true);
        setIsScreenSharing(false);
        // Update object data to reflect screen share being enabled (local only)

        onUpdate?.(id, {
          type: 'plane',
          screenShareActive: true,
        });
      }
    } else {
      if (isScreenSharing) {
        // Stop screen sharing
        onUpdate?.(id, {
          type: 'plane',
          screenSharing: false,
          screenShareActive: false,
        });
      }
      setScreenShareActive(false);
      setIsScreenSharing(false);
    }
    setShowUI(false);
  }, [screenShareActive, isScreenSharing, onUpdate, id]);
  const handleImageUpload = useCallback(
    async (file) => {
      if (!user?.uid || !currentSpaceId) {
        alert('You must be logged in to upload images');
        return;
      }

      setIsUploadingImage(true);

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
            texture.flipY = false; // Important for proper orientation

            // Apply the texture to the mesh
            if (meshRef.current) {
              // Dispose of the previous material if it exists
              if (meshRef.current.material && meshRef.current.material.map) {
                meshRef.current.material.map.dispose();
              }
              if (meshRef.current.material) {
                meshRef.current.material.dispose();
              }

              // Create new material with the texture
              const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 1,
                side: THREE.DoubleSide,
              });

              meshRef.current.material = material;
              setImageTexture(texture);

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
            setIsUploadingImage(false);
          }
        };

        img.onerror = (error) => {
          console.error('Error loading image:', error);
          alert('Failed to load the uploaded image');
          setIsUploadingImage(false);
        };

        // Load the image
        img.src = imageUrl;
      } catch (error) {
        console.error('Image upload failed:', error);
        alert(`Image upload failed: ${error.message}`);
        setIsUploadingImage(false);
      }
    },
    [user, currentSpaceId, onUpdate, id]
  );

  const isBroadcastingRef = useRef(false);  const handleBroadcastStarted = useCallback(
    async (info) => {
      if (!info || !info.broadcastId || !isMountedRef.current) return;
      if (!isBroadcastingRef.current) setIsBroadcasting(true);

      onUpdate?.(id, {
        type: 'plane',
        broadcasting: true,
        broadcasterId: user?.uid,
        broadcastId: info.broadcastId,
        broadcastStarting: false,
        webcamActive: true,
      });
    },
    [onUpdate, id, user?.uid]
  );
  const handleViewerCountChange = useCallback((count) => {
    if (isMountedRef.current) {
      setViewerCount(count);
    }
  }, []);

  // Update the ref whenever isBroadcasting changes
  useEffect(() => {
    isBroadcastingRef.current = isBroadcasting;
  }, [isBroadcasting]);  useEffect(() => {
    return () => {
      // Use ref to get current broadcasting state without dependencies
      if (isBroadcastingRef.current) {
        setIsBroadcasting(false);
        setViewerCount(0);

        onUpdate?.(id, {
          type: 'plane',
          broadcasting: false,
          broadcastId: null,
          webcamActive: false,
        });
      }
    };
  }, [onUpdate, id]); // Removed unused dependencies

  const uiPositions = useMemo(() => {
    const planeHeight = 10 * currentScale[1];
    const verticalOffset = planeHeight / 2;
    const zOffset = 0.1;
    return {
      faceUI: [0, verticalOffset + 2, zOffset + 0.1],
      headerInput: [0, verticalOffset + 4, zOffset],
      headerText: [0, verticalOffset + 4, zOffset],
      textSprite: [0, 0, zOffset],
      textStyleUI: [0, 6, zOffset + 2],
      headerStyleUI: [0, verticalOffset + 6, zOffset + 2],
      textInput: [0, 3, zOffset + 2],
    };
  }, [currentScale]);

  const indicatorPosition = useMemo(() => [0, -size - 1, 0], []);
  const meshMaterial = useMemo(() => {
    // If we have an image texture, use it
    if (imageTexture) {
      return (
        <meshBasicMaterial
          map={imageTexture}
          transparent
          opacity={1}
          side={THREE.DoubleSide}
          needsUpdate={true}
        />
      );
    }

    // Otherwise use the color-based material
    return (
      <meshBasicMaterial
        color={currentColor || (selected ? '#99ccff' : 'black')}
        transparent
        opacity={currentColor ? 1 : selected ? 0.1 : 0}
        depthWrite={!!currentColor}
        side={THREE.DoubleSide}
        needsUpdate={true}
      />
    );
  }, [currentColor, selected, imageTexture]);

  const lineMaterialProps = useMemo(
    () => ({
      color: selected ? 'blue' : currentBorderColor,
      lineWidth: currentLineThickness,
      dashed: currentBorderStyle !== 'solid',
      dashScale: currentBorderStyle === 'dotted' ? 1 : 2,
      dashSize: currentBorderStyle === 'dotted' ? 0.1 : 1,
      gapSize: currentBorderStyle === 'dotted' ? 0.1 : 0.5,
    }),
    [selected, currentBorderColor, currentLineThickness, currentBorderStyle]
  );

  const points = useMemo(
    () => [
      new Vector3(-size, -size, 0),
      new Vector3(size, -size, 0),
      new Vector3(size, size, 0),
      new Vector3(-size, size, 0),
      new Vector3(-size, -size, 0),
    ],
    []
  );

  return (
    <>
      <group ref={groupRef} position={position}>
        <group ref={contentRef} scale={currentScale}>
          <mesh ref={meshRef} onClick={handleClick}>
            <planeGeometry args={[size * 2, size * 2]} />
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
          <Line points={points} {...lineMaterialProps} />
          {shouldShowIndicator && (
            <FaceIndicator
              position={indicatorPosition}
              onClick={handleIndicatorClick}
              isActive={indicatorSelected || isIndicatorConnected}
            />
          )}
          {currentFaceText && (
            <TextSprite
              text={currentFaceText}
              position={uiPositions.textSprite}
              style={currentFaceTextStyle}
              onClick={handleTextSpriteClick}
              billboard={false}
            />
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
          />
        )}
        {showTextInput && (
          <FaceTextInput
            position={uiPositions.textInput}
            onTextSubmit={handleTextSubmit}
            followTarget={groupRef}
          />
        )}
        {showTextStyleUI && (
          <TextStyleUI
            position={uiPositions.textStyleUI}
            onStyleChange={handleTextStyleChange}
            onClose={closeAllUIs}
            followTarget={groupRef}
          />
        )}
        {showHeader && (
          <HeaderInput
            position={uiPositions.headerInput}
            onTextSubmit={handleHeaderSubmit}
            followTarget={groupRef}
          />
        )}
        {showHeaderStyleUI && (
          <TextStyleUI
            position={uiPositions.headerStyleUI}
            onStyleChange={handleHeaderStyleChange}
            onClose={() => {
              setShowHeaderStyleUI(false);
              setShowUI(true);
            }}
            followTarget={groupRef}
            uiType="header"
          />
        )}
      </group>

      {currentHeaderText && (
        <TextSprite
          text={currentHeaderText}
          position={position}
          offset={uiPositions.headerText}
          followTarget={groupRef}
          onClick={handleHeaderTextClick}
          style={currentHeaderStyle}
          billboard={true}
        />
      )}

      {selected && isResizing && contentRef.current && (
        <DreiTransformControls
          key={`scale-${id}`}
          object={contentRef.current}
          onObjectChange={handleScale}
          onMouseDown={handleTransformStart}
          onMouseUp={handleTransformEnd}
          mode="scale"
          space="local"
          showZ={false}
        />
      )}
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

export default Plane;
