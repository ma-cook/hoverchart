import {
  Line,
  TransformControls as DreiTransformControls,
  Html,
} from '@react-three/drei';
import { Vector3 } from 'three';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import FaceUI from './FaceUI';
import TextSprite from './TextSprite';
import FaceTextInput from './FaceTextInput';
import TextStyleUI from './TextStyleUI';
import HeaderInput from './HeaderInput';
import FaceIndicator from './FaceIndicator';
import WebcamStream from './WebcamStream';
import * as THREE from 'three';
import isEqual from 'lodash/isEqual';

// Add imports for WebRTC functionality
import {
  findAvailableBroadcasts,
  isPlaneBeingBroadcast,
} from '../services/webrtcService';

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
  borderColor: initialBorderColor = 'white',
  lineThickness: initialLineThickness = 1,
  headerStyle: initialHeaderStyle = {
    fontSize: 1.5,
    color: 'white',
    underline: false,
  },
  faceText: initialFaceText = '',
  faceTextStyle: initialFaceTextStyle = {
    fontSize: 0.5,
    color: 'white',
    underline: false,
  },
  onTransformStart,
  onTransformEnd,
  webcamActive: initialWebcamActive = false,
  // Add user and space ID props for WebRTC
  user,
  currentSpaceId,
}) => {
  const groupRef = useRef();
  const meshRef = useRef();
  const contentRef = useRef();
  const { camera } = useThree();
  const size = 5;

  const lastWebcamStateRef = useRef(initialWebcamActive);
  const [webcamActive, setWebcamActive] = useState(initialWebcamActive);
  const [webcamInitialized, setWebcamInitialized] = useState(false);

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

  // Last update ref to avoid redundant database updates
  const lastUpdateRef = useRef(null);
  // Last world position ref for connection calculations
  const lastWorldPosRef = useRef(null);

  // Add WebRTC state
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isViewingBroadcast, setIsViewingBroadcast] = useState(false);
  const [broadcastInfo, setBroadcastInfo] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const broadcastCheckIntervalRef = useRef(null);

  // Sync props to state
  useEffect(() => {
    if (initialScale !== undefined) setCurrentScale(initialScale);
  }, [initialScale]);
  useEffect(() => {
    if (initialColor !== undefined) setCurrentColor(initialColor);
  }, [initialColor]);
  useEffect(() => {
    if (initialHeaderText !== undefined)
      setCurrentHeaderText(initialHeaderText);
  }, [initialHeaderText]);
  useEffect(() => {
    if (initialBorderStyle !== undefined)
      setCurrentBorderStyle(initialBorderStyle);
  }, [initialBorderStyle]);
  useEffect(() => {
    if (initialBorderColor !== undefined)
      setCurrentBorderColor(initialBorderColor);
  }, [initialBorderColor]);
  useEffect(() => {
    if (initialLineThickness !== undefined)
      setCurrentLineThickness(initialLineThickness);
  }, [initialLineThickness]);
  useEffect(() => {
    if (initialHeaderStyle !== undefined)
      setCurrentHeaderStyle(initialHeaderStyle);
  }, [initialHeaderStyle]);
  useEffect(() => {
    if (initialFaceText !== undefined) setCurrentFaceText(initialFaceText);
  }, [initialFaceText]);
  useEffect(() => {
    if (initialFaceTextStyle !== undefined)
      setCurrentFaceTextStyle(initialFaceTextStyle);
  }, [initialFaceTextStyle]);
  useEffect(() => {
    if (initialWebcamActive !== undefined) setWebcamActive(initialWebcamActive);
  }, [initialWebcamActive]);

  const closeAllUIs = useCallback(() => {
    setShowTextStyleUI(false);
    setShowUI(false);
    setShowTextInput(false);
    setShowTransform(false);
    setIsResizing(false);
    setShowHeader(false);
    setShowHeaderStyleUI(false);
  }, []);

  const points = [
    new Vector3(-size, -size, 0),
    new Vector3(size, -size, 0),
    new Vector3(size, size, 0),
    new Vector3(-size, size, 0),
    new Vector3(-size, -size, 0),
  ];

  // Keep plane facing camera
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
    }
  });

  // Handle selection/deselection
  useEffect(() => {
    if (!selected) {
      closeAllUIs();
      setIndicatorSelected(false);
      onIndicatorDeselected?.();
    } else if (!indicatorSelected) {
      setShowUI(true);
    }
  }, [selected, closeAllUIs, onIndicatorDeselected, indicatorSelected]);

  // Handle global clicks for UI elements
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const isTextStyleUIClick = e.target.closest('.text-style-ui');
      const isTextClick = e.target.closest('.text-sprite');
      if (!isTextStyleUIClick && !isTextClick) {
        setShowTextStyleUI(false);
      }
    };

    if (showTextStyleUI) {
      window.addEventListener('click', handleGlobalClick);
    }
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [showTextStyleUI]);

  // Update world position when transform changes
  useEffect(() => {
    if (groupRef.current && contentRef.current) {
      const worldPos = new THREE.Vector3();
      const offset = new THREE.Vector3(0, -5 * currentScale[1], 0);

      groupRef.current.updateWorldMatrix(true, false);
      groupRef.current.getWorldPosition(worldPos);

      offset.applyQuaternion(groupRef.current.quaternion);
      worldPos.add(offset);

      lastWorldPosRef.current = [worldPos.x, worldPos.y, worldPos.z];
      groupRef.current._worldMatrix = groupRef.current.matrixWorld.clone();
    }
  }, [position, currentScale]);

  // Update database with state changes
  useEffect(() => {
    if (!onUpdate || !id) return;

    const currentState = {
      type: 'plane',
      position,
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
    };

    // Only update if state has changed
    if (
      !lastUpdateRef.current ||
      !isEqual(lastUpdateRef.current, currentState)
    ) {
      lastUpdateRef.current = currentState;
      onUpdate(id, currentState);
    }
  }, [
    id,
    onUpdate,
    position,
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
  ]);

  // Add a timeout ref to properly manage debounce
  const scaleTimeoutRef = useRef(null);

  // Replace the scale handling mechanism with a ref-based approach
  const pendingScaleRef = useRef(null);
  const isTransformingRef = useRef(false);

  // Completely rewrite the handleScale function to avoid state update cycles
  const handleScale = (e) => {
    if (!e.target || !e.target.object) return;

    // Store scale values in the ref instead of setting state immediately
    pendingScaleRef.current = [
      e.target.object.scale.x,
      e.target.object.scale.y,
      currentScale[2], // Keep Z scale unchanged
    ];

    // Flag that we're in a transform operation
    isTransformingRef.current = true;

    // Set a timeout to apply the scale change after the current render cycle
    if (scaleTimeoutRef.current) clearTimeout(scaleTimeoutRef.current);

    scaleTimeoutRef.current = setTimeout(() => {
      if (pendingScaleRef.current) {
        // Apply the pending scale and reset the flag
        setCurrentScale(pendingScaleRef.current);
        pendingScaleRef.current = null;
      }
    }, 50); // Very short timeout to break the render cycle
  };

  // Add effect to handle the transform end event separately from scale changes
  useEffect(() => {
    if (isTransformingRef.current && !pendingScaleRef.current) {
      isTransformingRef.current = false;

      // Now that we've applied the scale and we're not transforming, update the database
      if (onUpdate) {
        onUpdate(id, {
          type: 'plane',
          position,
          scale: currentScale,
          color: currentColor,
          headerText: currentHeaderText,
          headerStyle: currentHeaderStyle,
          borderStyle: currentBorderStyle,
          borderColor: currentBorderColor,
          lineThickness: currentLineThickness,
          faceText: currentFaceText,
          faceTextStyle: currentFaceTextStyle,
        });
      }

      // Call transform end callback
      if (onTransformEnd) {
        onTransformEnd(id);
      }
    }
  }, [currentScale, isTransformingRef.current]);

  // Add an extra cleanup step to prevent any lingering updates
  useEffect(() => {
    return () => {
      if (scaleTimeoutRef.current) clearTimeout(scaleTimeoutRef.current);
      isTransformingRef.current = false;
      pendingScaleRef.current = null;
    };
  }, []);

  // Handle dragging for position updates - improve this to save to database
  const handleDrag = (e) => {
    if (groupRef.current) {
      const newPos = e.target.object.position;
      groupRef.current.position.copy(newPos);

      // Calculate the new world position with offset
      const worldPos = new THREE.Vector3();
      const offset = new THREE.Vector3(0, -5 * currentScale[1], 0);

      groupRef.current.updateWorldMatrix(true, false);
      groupRef.current.getWorldPosition(worldPos);

      offset.applyQuaternion(groupRef.current.quaternion);
      worldPos.add(offset);

      const worldPosArray = [worldPos.x, worldPos.y, worldPos.z];
      lastWorldPosRef.current = worldPosArray;

      const worldMatrix = Array.from(groupRef.current.matrixWorld.elements);

      // Update any connected connection points in real-time
      if (connections) {
        connections.forEach((conn) => {
          // Update start position if this plane is the start object
          if (
            conn.start?.objectId === String(id) ||
            conn.start?.plane === groupRef.current
          ) {
            conn.start.position = [...worldPosArray];
            conn.start.worldPosition = [...worldPosArray];
            conn.start.facePosition = [...worldPosArray];
            conn.start.faceCenter = [...worldPosArray];
          }

          // Update end position if this plane is the end object
          if (
            conn.end?.objectId === String(id) ||
            conn.end?.plane === groupRef.current
          ) {
            conn.end.position = [...worldPosArray];
            conn.end.worldPosition = [...worldPosArray];
            conn.end.facePosition = [...worldPosArray];
            conn.end.faceCenter = [...worldPosArray];
          }
        });
      }

      // Add these critical properties to userData to help ConnectionUpdater
      if (groupRef.current) {
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
      }

      // Always update position in database during drag with all connection data
      if (onUpdate) {
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
      }
    }
  };

  // Add transform start/end handlers
  const handleTransformStart = () => {
    if (window.orbitControls) {
      window.orbitControls.enabled = false;
    }
    if (onTransformStart) {
      onTransformStart(id);
    }
  };

  const handleTransformEnd = () => {
    if (window.orbitControls) {
      window.orbitControls.enabled = true;
    }

    // Final position update at transform end - crucial for database saving
    if (groupRef.current && onUpdate) {
      const newPos = groupRef.current.position;

      // Calculate world data for connections
      const worldPos = new THREE.Vector3();
      const offset = new THREE.Vector3(0, -5 * currentScale[1], 0);

      groupRef.current.updateWorldMatrix(true, false);
      groupRef.current.getWorldPosition(worldPos);

      offset.applyQuaternion(groupRef.current.quaternion);
      worldPos.add(offset);

      const worldPosArray = [worldPos.x, worldPos.y, worldPos.z];
      const worldMatrix = Array.from(groupRef.current.matrixWorld.elements);

      // Update any connected connection points one final time
      if (connections) {
        connections.forEach((conn) => {
          // Update start position if this plane is the start object
          if (
            conn.start?.objectId === String(id) ||
            conn.start?.plane === groupRef.current
          ) {
            conn.start.position = [...worldPosArray];
            conn.start.worldPosition = [...worldPosArray];
            conn.start.facePosition = [...worldPosArray];
            conn.start.faceCenter = [...worldPosArray];
          }

          // Update end position if this plane is the end object
          if (
            conn.end?.objectId === String(id) ||
            conn.end?.plane === groupRef.current
          ) {
            conn.end.position = [...worldPosArray];
            conn.end.worldPosition = [...worldPosArray];
            conn.end.facePosition = [...worldPosArray];
            conn.end.faceCenter = [...worldPosArray];
          }
        });
      }

      // Save the final position to the database with all necessary data
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
        color: currentColor,
        headerText: currentHeaderText,
        headerStyle: currentHeaderStyle,
        borderStyle: currentBorderStyle,
        borderColor: currentBorderColor,
        lineThickness: currentLineThickness,
        faceText: currentFaceText,
        faceTextStyle: currentFaceTextStyle,
        webcamActive,
        _finalPosition: true,
        _indicatorWorldPosition: worldPosArray,
      });
    }

    if (onTransformEnd) {
      onTransformEnd(id);
    }
  };

  // UI event handlers
  const handleClick = (e) => {
    e.stopPropagation();
    onClick();
    if (!selected) {
      closeAllUIs();
      setShowUI(true);
    } else {
      setShowUI(true);
    }
  };

  const handleTextClick = () => {
    closeAllUIs();
    setShowTextInput(true);
  };

  const handleTextSubmit = (newText) => {
    setCurrentFaceText(newText);
    closeAllUIs();
    if (onUpdate) {
      onUpdate(id, {
        type: 'plane',
        position,
        scale: currentScale,
        color: currentColor,
        headerText: currentHeaderText,
        headerStyle: currentHeaderStyle,
        borderStyle: currentBorderStyle,
        borderColor: currentBorderColor,
        lineThickness: currentLineThickness,
        faceText: newText,
        faceTextStyle: currentFaceTextStyle,
      });
    }
  };

  const handleTextStyleChange = (newStyle) => {
    const updatedStyle = { ...currentFaceTextStyle, ...newStyle };
    setCurrentFaceTextStyle(updatedStyle);
    if (onUpdate) {
      onUpdate(id, {
        type: 'plane',
        position,
        scale: currentScale,
        color: currentColor,
        headerText: currentHeaderText,
        headerStyle: currentHeaderStyle,
        borderStyle: currentBorderStyle,
        borderColor: currentBorderColor,
        lineThickness: currentLineThickness,
        faceText: currentFaceText,
        faceTextStyle: updatedStyle,
      });
    }
  };

  const handleTextSpriteClick = (e) => {
    e.stopPropagation();
    closeAllUIs();
    setShowTextStyleUI(true);
  };

  const handleTransformToggle = () => {
    setShowTransform((prev) => !prev);
    setShowUI(false);
  };

  const handleResizeToggle = () => {
    setIsResizing((prev) => {
      if (!prev) setShowTransform(false);
      return !prev;
    });
    setShowUI(false);
  };

  const handleColorChange = (newColor) => {
    setCurrentColor(newColor);
    if (onUpdate) {
      onUpdate(id, {
        type: 'plane',
        position,
        scale: currentScale,
        color: newColor,
        headerText: currentHeaderText,
        headerStyle: currentHeaderStyle,
        borderStyle: currentBorderStyle,
        borderColor: currentBorderColor,
        lineThickness: currentLineThickness,
        faceText: currentFaceText,
        faceTextStyle: currentFaceTextStyle,
      });
    }
  };

  const handleHeaderToggle = () => {
    closeAllUIs();
    setShowHeader(true);
  };

  const handleHeaderSubmit = (text) => {
    setCurrentHeaderText(text);
    setShowHeader(false);
    if (onUpdate) {
      onUpdate(id, {
        type: 'plane',
        position,
        scale: currentScale,
        color: currentColor,
        headerText: text,
        headerStyle: currentHeaderStyle,
        borderStyle: currentBorderStyle,
        borderColor: currentBorderColor,
        lineThickness: currentLineThickness,
        faceText: currentFaceText,
        faceTextStyle: currentFaceTextStyle,
      });
    }
  };

  const handleHeaderTextClick = (e) => {
    e.stopPropagation();
    closeAllUIs();
    setShowHeaderStyleUI(true);
    setShowUI(false);
  };

  const handleHeaderStyleChange = (newStyle) => {
    const updatedStyle = { ...currentHeaderStyle, ...newStyle };
    setCurrentHeaderStyle(updatedStyle);
    if (onUpdate) {
      onUpdate(id, {
        type: 'plane',
        position,
        scale: currentScale,
        color: currentColor,
        headerText: currentHeaderText,
        headerStyle: updatedStyle,
        borderStyle: currentBorderStyle,
        borderColor: currentBorderColor,
        lineThickness: currentLineThickness,
        faceText: currentFaceText,
        faceTextStyle: currentFaceTextStyle,
      });
    }
  };

  const handleBorderToggle = (option) => {
    if (!onUpdate || !id) return;

    const updates = {
      type: 'plane',
      position,
      scale: currentScale,
      color: currentColor,
      headerText: currentHeaderText,
      headerStyle: currentHeaderStyle,
      borderStyle: currentBorderStyle,
      borderColor: currentBorderColor,
      lineThickness: currentLineThickness,
      faceText: currentFaceText,
      faceTextStyle: currentFaceTextStyle,
    };

    if (option.type === 'style') {
      updates.borderStyle = option.value;
      setCurrentBorderStyle(option.value);
    } else if (option.type === 'color') {
      updates.borderColor = option.value;
      setCurrentBorderColor(option.value);
    } else if (option.type === 'thickness') {
      const newThickness =
        currentLineThickness >= 6 ? 1 : currentLineThickness + 2;
      updates.lineThickness = newThickness;
      setCurrentLineThickness(newThickness);
    }

    onUpdate(id, updates);
  };

  // Position calculation helpers
  const getUIPositions = () => {
    const planeHeight = 10 * currentScale[1];
    const verticalOffset = planeHeight / 2;
    const zOffset = 5;

    return {
      faceUI: [0, verticalOffset + 2, zOffset],
      headerInput: [position[0], position[1] + verticalOffset + 4, position[2]],
      headerText: [position[0], position[1] + verticalOffset + 4, position[2]],
    };
  };

  const getIndicatorPositions = () => ({
    bottom: [0, -5 - 1, 0], // 5 is half the plane height, -1 is offset
  });

  // Connection indicator handling
  const handleIndicatorClick = (e) => {
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
        facePosition: positionArray, // Add explicit facePosition
        faceCenter: positionArray, // Add explicit faceCenter
        face: 'bottom',
        plane: planeRef, // Store direct reference to the plane object
        scale: [...currentScale],
        planeData: {
          position: [...position],
          scale: [...currentScale],
          worldMatrix: Array.from(worldMatrix.elements),
          offset: [0, -5 * currentScale[1], 0],
        },
        // Include standardized data for compatibility
        cube: {
          id: stringId,
          position,
          scale: currentScale,
          userData: {
            objectId: stringId,
            planeRef: planeRef, // Store reference in userData as well
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
  };

  const isIndicatorConnected = () => {
    return connections?.some(
      (conn) =>
        conn.start.plane === groupRef.current ||
        conn.end.plane === groupRef.current
    );
  };

  const shouldShowIndicator = () => {
    if (selectedIndicators?.length > 0) return true;
    if (indicatorMode === 'indicators') return true;
    if (showAllIndicators || globalIndicatorSelected) return true;
    if (isIndicatorConnected()) return true;
    if (indicatorSelected) return true;
    if (selected) return true;
    return false;
  };

  // Check for broadcasts on component mount and when webcam active changes
  useEffect(() => {
    if (!currentSpaceId || !id || !user) return;

    // Track if component is still mounted
    let isMounted = true;

    // Check if this plane is currently broadcasting
    const checkBroadcastingStatus = async () => {
      try {
        const isCurrentlyBroadcasting = await isPlaneBeingBroadcast(
          currentSpaceId,
          id
        );

        // Only update state if component is still mounted
        if (isMounted) {
          setIsBroadcasting(isCurrentlyBroadcasting);
        }
      } catch (err) {
        console.error('Error checking broadcasting status:', err);
      }
    };

    checkBroadcastingStatus();

    // Only check for other broadcasts if webcam is active but we're not broadcasting
    if (webcamActive && !isBroadcasting) {
      const checkForBroadcasts = async () => {
        if (!isMounted) return;

        try {
          const broadcasts = await findAvailableBroadcasts(currentSpaceId);

          // Find broadcast for this plane by another user
          const broadcast = broadcasts.find(
            (b) => b.planeId === id && b.broadcasterId !== user.uid
          );

          if (broadcast && isMounted) {
            console.log('Found broadcast by another user:', broadcast);
            setBroadcastInfo({
              broadcastId: broadcast.id,
              broadcasterId: broadcast.broadcasterId,
              planeId: broadcast.planeId,
            });
            setIsViewingBroadcast(true);
          } else if (isMounted) {
            setBroadcastInfo(null);
            setIsViewingBroadcast(false);
          }
        } catch (error) {
          console.error('Error checking broadcasts:', error);
        }
      };

      // Check immediately and set up interval
      checkForBroadcasts();

      // Set up periodic checks
      broadcastCheckIntervalRef.current = setInterval(checkForBroadcasts, 5000);
    }

    return () => {
      isMounted = false;
      if (broadcastCheckIntervalRef.current) {
        clearInterval(broadcastCheckIntervalRef.current);
        broadcastCheckIntervalRef.current = null;
      }
    };
  }, [currentSpaceId, id, user, webcamActive, isBroadcasting]);

  // Modified webcam toggle handler to ensure broadcasting state is correctly set
  const handleWebcamToggle = () => {
    const newWebcamState = !webcamActive;

    if (newWebcamState) {
      setWebcamInitialized(true);

      // If turning on webcam, ask if they want to broadcast
      if (
        confirm(
          'Do you want to broadcast this webcam to other users in this space?'
        )
      ) {
        console.log('Setting broadcasting mode to true');

        // Update both states together to ensure synchronization
        setWebcamActive(true);
        setIsBroadcasting(true);
        lastWebcamStateRef.current = true;

        // Update DB immediately to indicate we're starting a broadcast
        if (onUpdate) {
          console.log(
            'Updating database with broadcasting=true and broadcastStarting=true'
          );
          onUpdate(id, {
            type: 'plane',
            webcamActive: true,
            broadcasting: true,
            broadcastStarting: true, // Flag that we're in the process of starting
            broadcasterId: user?.uid,
            broadcastId: 'pending', // Use 'pending' instead of 'initializing'
            broadcastStartTime: Date.now(), // Track when we started
            position,
            scale: currentScale,
            color: currentColor,
            headerText: currentHeaderText,
            headerStyle: currentHeaderStyle,
            borderStyle: currentBorderStyle,
            borderColor: currentBorderColor,
            lineThickness: currentLineThickness,
            faceText: currentFaceText,
            faceTextStyle: currentFaceTextStyle,
          });
        }

        console.log(`Webcam toggled to ON with broadcasting: true`);
      } else {
        console.log('Local webcam only - no broadcasting');
        setWebcamActive(true);
        setIsBroadcasting(false);
        lastWebcamStateRef.current = true;

        if (onUpdate) {
          onUpdate(id, {
            type: 'plane',
            webcamActive: true,
            broadcasting: false,
            position,
            scale: currentScale,
            color: currentColor,
            headerText: currentHeaderText,
            headerStyle: currentHeaderStyle,
            borderStyle: currentBorderStyle,
            borderColor: currentBorderColor,
            lineThickness: currentLineThickness,
            faceText: currentFaceText,
            faceTextStyle: currentFaceTextStyle,
          });
        }
      }
    } else {
      // If turning off webcam, stop broadcasting
      if (isBroadcasting) {
        console.log('Broadcasting active, stopping before turning off webcam');
        handleBroadcastStopped();
      }

      setWebcamActive(false);
      lastWebcamStateRef.current = false;
      setIsViewingBroadcast(false);
      setBroadcastInfo(null);

      // Update database
      if (onUpdate) {
        onUpdate(id, {
          type: 'plane',
          webcamActive: false,
          broadcasting: false,
          broadcastId: null,
          position,
          scale: currentScale,
          color: currentColor,
          headerText: currentHeaderText,
          headerStyle: currentHeaderStyle,
          borderStyle: currentBorderStyle,
          borderColor: currentBorderColor,
          lineThickness: currentLineThickness,
          faceText: currentFaceText,
          faceTextStyle: currentFaceTextStyle,
        });
      }
    }

    setShowUI(false);
  };

  // Handle broadcast start event
  const handleBroadcastStarted = (info) => {
    console.log('Broadcast started:', info);

    if (!info || !info.broadcastId) {
      console.error('Error: No broadcastId provided to handleBroadcastStarted');
      return;
    }

    // Ensure we maintain the broadcasting state flag
    setIsBroadcasting(true);

    // Update database with broadcast status and EXPLICIT broadcastId
    if (onUpdate) {
      console.log(`Updating plane ${id} with broadcastId ${info.broadcastId}`);

      // CRITICAL - Force direct update with the broadcastId
      // This ensures the broadcastId is properly set in the database
      const updates = {
        type: 'plane',
        broadcasting: true,
        broadcasterId: user?.uid,
        broadcastId: info.broadcastId, // THIS IS CRITICAL
        broadcastStarting: false, // Changed from pending to active
        broadcastInfo: {
          started: new Date().toISOString(),
          broadcasterId: user?.uid,
        },
        position,
        scale: currentScale,
        color: currentColor,
        headerText: currentHeaderText,
        headerStyle: currentHeaderStyle,
        borderStyle: currentBorderStyle,
        borderColor: currentBorderColor,
        lineThickness: currentLineThickness,
        faceText: currentFaceText,
        faceTextStyle: currentFaceTextStyle,
        webcamActive: true,
      };

      // Force multiple updates with slight delays to ensure the database is updated
      onUpdate(id, updates);

      // First follow-up
      setTimeout(() => {
        console.log('First follow-up broadcast ID check');
        if (isBroadcasting) {
          // Only update if we're still broadcasting
          onUpdate(id, {
            ...updates,
            _updateTime: Date.now(),
          });
        }
      }, 1000);

      // Second follow-up with just the critical fields
      setTimeout(() => {
        console.log('Second follow-up broadcast ID check - minimal update');
        if (isBroadcasting) {
          // Only update if we're still broadcasting
          onUpdate(id, {
            broadcastId: info.broadcastId,
            broadcasting: true,
            _finalCheck: true,
          });
        }
      }, 3000);
    }
  };

  // Add debugging to identify unwanted broadcast stops
  const handleBroadcastStopped = () => {
    console.log('📍 Broadcast stopped called. Stack trace:');
    console.trace();

    // Only take action if we were actually broadcasting
    if (isBroadcasting) {
      setIsBroadcasting(false);
      setViewerCount(0);

      // Update database
      if (onUpdate) {
        onUpdate(id, {
          type: 'plane',
          broadcasting: false,
          broadcastId: null,
          position,
          scale: currentScale,
          color: currentColor,
          headerText: currentHeaderText,
          headerStyle: currentHeaderStyle,
          borderStyle: currentBorderStyle,
          borderColor: currentBorderColor,
          lineThickness: currentLineThickness,
          faceText: currentFaceText,
          faceTextStyle: currentFaceTextStyle,
        });
      }
    } else {
      console.log(
        '⚠️ Broadcast stop called but isBroadcasting was already false'
      );
    }
  };

  // Handle viewer count updates
  const handleViewerCountChange = (count) => {
    setViewerCount(count);
  };

  // Add cleanup effect to ensure all WebRTC resources are properly disposed
  useEffect(() => {
    return () => {
      // Clear any broadcasting when component unmounts
      if (isBroadcasting) {
        handleBroadcastStopped();
      }

      // Clear all intervals
      if (broadcastCheckIntervalRef.current) {
        clearInterval(broadcastCheckIntervalRef.current);
      }
    };
  }, [isBroadcasting]);

  // Separate effect to handle webcam initialization on component mount
  useEffect(() => {
    if (initialWebcamActive && !webcamInitialized) {
      console.log('Initializing webcam from props:', initialWebcamActive);
      setWebcamInitialized(true);
      setWebcamActive(true);
      lastWebcamStateRef.current = true;
    }
  }, []);

  // Sync webcam state with potential external updates
  useEffect(() => {
    if (initialWebcamActive !== lastWebcamStateRef.current) {
      console.log('Syncing webcam state from props:', initialWebcamActive);
      setWebcamActive(initialWebcamActive);
      lastWebcamStateRef.current = initialWebcamActive;
      if (initialWebcamActive) {
        setWebcamInitialized(true);
      }
    }
  }, [initialWebcamActive]);

  // Reset mesh material when webcam is deactivated
  useEffect(() => {
    if (!webcamActive && meshRef.current) {
      const material = meshRef.current.material;
      if (material.map) {
        console.log('Removing webcam texture from material');
        material.map = null;
        material.needsUpdate = true;
      }
    }
  }, [webcamActive]);

  // Save webcam state to material userData to persist through material updates
  useEffect(() => {
    if (meshRef.current) {
      // Store webcam state on the material's userData
      meshRef.current.userData.webcamActive = webcamActive;

      // If we have a material already, make sure it has the right properties
      if (meshRef.current.material) {
        // Ensure the material is set to be transparent if webcam is active
        if (webcamActive) {
          meshRef.current.material.transparent = true;
          meshRef.current.material.opacity = 1;
          meshRef.current.material.needsUpdate = true;
        }
      }
    }
  }, [webcamActive]);

  // Add a new effect to respond to material changes
  // This helps maintain webcam visibility after material/mesh changes
  useEffect(() => {
    // This will run when the mesh is re-created or updated
    if (meshRef.current && meshRef.current.material) {
      const material = meshRef.current.material;

      // Store current webcam state in userData so it persists
      meshRef.current.userData.webcamActive = webcamActive;

      // Set appropriate material properties based on webcam state
      if (webcamActive) {
        material.transparent = true;
        material.opacity = 1;
      }
      material.needsUpdate = true;
    }
  }, [
    meshRef.current,
    currentColor,
    currentBorderStyle,
    currentLineThickness,
    currentScale,
  ]);

  // Add debug log at the start of component
  useEffect(() => {
    if (webcamActive) {
      console.log('Plane component props check:', {
        userId: user?.uid,
        spaceId: currentSpaceId,
        planeId: id,
        isBroadcasting,
      });
    }
  }, [webcamActive, user, currentSpaceId, id, isBroadcasting]);

  return (
    <>
      <group ref={groupRef} position={position}>
        <group ref={contentRef} scale={currentScale}>
          <mesh ref={meshRef} onClick={handleClick}>
            <planeGeometry args={[10, 10]} />
            <meshBasicMaterial
              color={currentColor || (selected ? '#99ccff' : 'white')}
              transparent
              opacity={currentColor ? 1 : selected ? 0.1 : 0}
              depthWrite={!!currentColor}
            />
          </mesh>

          {/* Fixed WebcamStream implementation with explicit broadcasting state */}
          {webcamActive && webcamInitialized && (
            <WebcamStream
              key={`webcam-${id}-${isBroadcasting ? 'broadcasting' : 'local'}-${
                isViewingBroadcast ? 'viewing' : 'notviewing'
              }`}
              meshRef={meshRef}
              active={webcamActive}
              userId={user?.uid}
              spaceId={currentSpaceId}
              planeId={id}
              isBroadcasting={isBroadcasting}
              isReceiving={isViewingBroadcast}
              broadcastData={isViewingBroadcast ? broadcastInfo : null}
              onBroadcastStarted={handleBroadcastStarted}
              onBroadcastStopped={handleBroadcastStopped}
              onViewerCountChange={handleViewerCountChange}
            />
          )}

          {/* Add a loading indicator when webcam is being initialized */}
          {webcamActive && !webcamInitialized && (
            <Html center>
              <div
                style={{
                  color: 'white',
                  background: 'rgba(0,0,0,0.5)',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                Initializing camera...
              </div>
            </Html>
          )}

          <Line
            points={points}
            color={selected ? 'blue' : currentBorderColor}
            lineWidth={currentLineThickness}
            dashed={currentBorderStyle !== 'solid'}
            dashScale={currentBorderStyle === 'dotted' ? 1 : 2}
            dashSize={currentBorderStyle === 'dotted' ? 0.1 : 1}
            gapSize={currentBorderStyle === 'dotted' ? 0.1 : 0.5}
          />
          {shouldShowIndicator() && (
            <FaceIndicator
              position={getIndicatorPositions().bottom}
              rotation={[0, 0, 0]}
              onClick={handleIndicatorClick}
              isActive={indicatorSelected || isIndicatorConnected()}
            />
          )}
        </group>

        {selected && showUI && (
          <FaceUI
            position={getUIPositions().faceUI}
            onColorChange={handleColorChange}
            face="front"
            onTextClick={handleTextClick}
            isPlane={true}
            onTransformToggle={handleTransformToggle}
            onResizeToggle={handleResizeToggle}
            onHeaderToggle={handleHeaderToggle}
            onBorderToggle={handleBorderToggle}
            followTarget={groupRef}
            onDelete={() => onDelete?.(id)}
            onWebcamToggle={handleWebcamToggle}
            webcamActive={webcamActive}
            isBroadcasting={isBroadcasting}
            viewerCount={viewerCount}
          />
        )}

        {showTextInput && (
          <FaceTextInput position={[0, 6, 0]} onTextSubmit={handleTextSubmit} />
        )}

        {currentFaceText && (
          <TextSprite
            text={currentFaceText}
            position={[0, 0, 0.1]}
            style={{
              ...currentFaceTextStyle,
              fixedSize: true,
            }}
            onClick={handleTextSpriteClick}
            billboard={false}
          />
        )}

        {showTextStyleUI && (
          <TextStyleUI
            position={[0, 10, 0]}
            onStyleChange={handleTextStyleChange}
            onClose={() => closeAllUIs()}
          />
        )}
      </group>

      {selected && isResizing && contentRef.current && (
        <DreiTransformControls
          key={`scale-controls-${id}`}
          object={contentRef.current}
          onObjectChange={handleScale}
          onDragStart={() => {
            if (contentRef.current?.orbitControls) {
              contentRef.current.orbitControls.enabled = false;
            }
            if (onTransformStart) {
              onTransformStart(id);
            }
          }}
          onDragEnd={() => {
            if (contentRef.current?.orbitControls) {
              contentRef.current.orbitControls.enabled = true;
            }
            // Force final update on drag end
            if (pendingScaleRef.current) {
              setCurrentScale(pendingScaleRef.current);
              pendingScaleRef.current = null;
            }
          }}
          mode="scale"
          space="local"
          size={1}
          matrixAutoUpdate={false}
          showX={true}
          showY={true}
          showZ={false}
        />
      )}

      {showHeader && (
        <HeaderInput
          position={getUIPositions().headerInput}
          onTextSubmit={handleHeaderSubmit}
          followTarget={groupRef}
        />
      )}

      {currentHeaderText && (
        <TextSprite
          text={currentHeaderText}
          position={getUIPositions().headerText}
          followTarget={groupRef}
          onClick={handleHeaderTextClick}
          style={{
            ...currentHeaderStyle,
            isHeaderText: true,
            isPlaneHeader: true,
            fixedSize: true,
            fixedPosition: true,
          }}
          billboard={true}
        />
      )}

      {showHeaderStyleUI && (
        <TextStyleUI
          position={[0, 12, 0]}
          onStyleChange={handleHeaderStyleChange}
          onClose={() => {
            setShowHeaderStyleUI(false);
            setShowUI(true);
          }}
          followTarget={groupRef}
          uiType="header"
        />
      )}

      {selected && showTransform && groupRef.current && (
        <DreiTransformControls
          object={groupRef.current}
          mode="translate"
          onObjectChange={handleDrag}
          onDragStart={handleTransformStart}
          onDragEnd={handleTransformEnd}
          onMouseDown={handleTransformStart}
          onMouseUp={handleTransformEnd}
        />
      )}
    </>
  );
};

export default Plane;
