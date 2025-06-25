import React, {
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { Html, TransformControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import FaceIndicator from './FaceIndicator';
import TextObjectUI from './TextObjectUI';
import * as THREE from 'three';
import isEqual from 'lodash/isEqual';
import {
  useTextObjectStore,
  useObjectsStore,
  useConnectionStore,
} from '../stores';

const TextObject = React.memo(
  ({
    id,
    position,
    selected,
    onClick,
    showAllIndicators,
    onIndicatorSelected,
    onIndicatorDeselected,
    globalIndicatorSelected,
    onFaceIndicatorClick,
    selectedIndicators,
    indicatorMode,
    onUpdate,
    onDelete,
    registerTransformingObject,
    onTransformStart,
    onTransformEnd,
    onResizeStart,
    onResizeEnd,
  }) => {
    // Get object data from objects store
    const objects = useObjectsStore((state) => state.objects);
    const objectData = objects.find((obj) => obj.id === id);

    // Get connections from connection store instead of props
    const connectionsFromStore = useConnectionStore(
      (state) => state.connections
    );

    // Memoize derived values to prevent unnecessary re-renders
    const text = useMemo(() => objectData?.text || '', [objectData?.text]);
    // Mobile-aware text style with larger default font size
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    const textStyle = useMemo(() => {
      const baseStyle = objectData?.textStyle || {
        fontSize: 32,
        color: 'black',
      };
      if (isMobile && baseStyle.fontSize <= 32) {
        // Increase font size on mobile for better readability
        return {
          ...baseStyle,
          fontSize: Math.max(baseStyle.fontSize * 1.5, 48),
        };
      }
      return baseStyle;
    }, [objectData?.textStyle, isMobile]);
    const scale = useMemo(
      () => objectData?.scale || [15, 10, 1],
      [objectData?.scale]
    );

    // Local editing state to prevent database updates during typing
    const [localText, setLocalText] = useState(text);
    const [isLocallyEditing, setIsLocallyEditing] = useState(false);

    // Use text object store for UI state only
    const getTextObject = useTextObjectStore((state) => state.getTextObject);
    const setTextObject = useTextObjectStore((state) => state.setTextObject);
    const updateTextObjectProperty = useTextObjectStore(
      (state) => state.updateTextObjectProperty
    );

    // Get store state for this object
    const textObject = getTextObject(id);
    const {
      isEditing,
      isActivelyEditing,
      indicatorSelected,
      contentHeight,
      isMoving,
      showTransform,
      showResizeArrow,
      showResizeControls,
      bulletPointMode,
    } = textObject;
    // Initialize text object UI state in store if it doesn't exist
    useEffect(() => {
      if (!textObject) {
        setTextObject(id, {
          // Only initialize UI state, not object data
          isEditing: false,
          isActivelyEditing: false,
          indicatorSelected: false,
          contentHeight: 100,
          isMoving: false,
          showTransform: false,
          showResizeArrow: false,
          showResizeControls: false,
          bulletPointMode: false,
        });
      }
    }, [id, textObject, setTextObject]);
    // Store setters for persistent data (use onUpdate)
    const setText = useCallback(
      (value) => {
        if (onUpdate) {
          onUpdate(id, { text: value });
        }
      },
      [id, onUpdate]
    );

    const setTextStyle = useCallback(
      (value) => {
        if (onUpdate) {
          onUpdate(id, { textStyle: value });
        }
      },
      [id, onUpdate]
    );

    const setScale = useCallback(
      (value) => {
        if (onUpdate) {
          onUpdate(id, { scale: value });
        }
      },
      [id, onUpdate]
    );

    // Store setters for UI state (use textObject store)
    const setIsEditing = useCallback(
      (value) => {
        updateTextObjectProperty(id, 'isEditing', value);
      },
      [id, updateTextObjectProperty]
    );

    const setIsActivelyEditing = useCallback(
      (value) => {
        updateTextObjectProperty(id, 'isActivelyEditing', value);
      },
      [id, updateTextObjectProperty]
    );

    const setIndicatorSelected = useCallback(
      (value) => {
        updateTextObjectProperty(id, 'indicatorSelected', value);
      },
      [id, updateTextObjectProperty]
    );

    const setContentHeight = useCallback(
      (value) => {
        updateTextObjectProperty(id, 'contentHeight', value);
      },
      [id, updateTextObjectProperty]
    );

    const setIsMoving = useCallback(
      (value) => {
        updateTextObjectProperty(id, 'isMoving', value);
      },
      [id, updateTextObjectProperty]
    );

    const setShowTransform = useCallback(
      (value) => {
        updateTextObjectProperty(id, 'showTransform', value);
      },
      [id, updateTextObjectProperty]
    );

    const setShowResizeArrow = useCallback(
      (value) => {
        updateTextObjectProperty(id, 'showResizeArrow', value);
      },
      [id, updateTextObjectProperty]
    );

    const setShowResizeControls = useCallback(
      (value) => {
        updateTextObjectProperty(id, 'showResizeControls', value);
      },
      [id, updateTextObjectProperty]
    );

    const setBulletPointMode = useCallback(
      (value) => {
        updateTextObjectProperty(id, 'bulletPointMode', value);
      },
      [id, updateTextObjectProperty]
    );

    // DOM Refs
    const groupRef = useRef();
    const transformRef = useRef();
    const uiMenuRef = useRef(null);
    const textAreaRef = useRef();
    const displayRef = useRef();

    // Technical refs
    const textUpdateTimeoutRef = useRef(null);
    const pendingChangesRef = useRef(null);
    const originalScaleRef = useRef(scale);
    const containerDimensionsRef = useRef({ width: 0, height: 0 });
    const startXRef = useRef(0);
    const startWidthRef = useRef(scale[0]);
    const lastUpdateRef = useRef(null);
    const worldMatrixRef = useRef(null);
    const worldPosRef = useRef(null);
    const contentHeightRef = useRef(0);
    const needsFocusRef = useRef(false);
    const initialFocusDoneRef = useRef(false);
    const textContentRef = useRef(text);
    const connectedLineIdsRef = useRef(new Set());
    const justFinishedEditingRef = useRef(false);
    // Sync textContentRef with text prop when it changes
    useEffect(() => {
      textContentRef.current = text;
    }, [text]); // Sync local text with store text when not editing
    useEffect(() => {
      if (!isLocallyEditing && !isEditing && !justFinishedEditingRef.current) {
        // Only sync if the store text is different and we're not in an editing session
        if (text !== localText && text !== textContentRef.current) {
          setLocalText(text);
          textContentRef.current = text;
        }
      }
    }, [text, isLocallyEditing, isEditing, localText]);

    // Constants
    const conversionFactor = 30;
    const stringId = String(id);

    // Sync props to state

    // Calculate offset for indicator consistently
    const getIndicatorOffset = useCallback(() => {
      return [0, scale[1] * 0.65, 0];
    }, [scale]); // Memoized derived values
    const isIndicatorConnected = useCallback(() => {
      if (!connectionsFromStore || !id) return false;

      return connectionsFromStore.some((conn) => {
        const startId = String(conn.start?.objectId || conn.start?.id);
        const endId = String(conn.end?.objectId || conn.end?.id);
        return stringId === startId || stringId === endId;
      });
    }, [connectionsFromStore, stringId, id]);

    const shouldShowIndicator = useMemo(() => {
      if (selectedIndicators?.length > 0) return true;
      if (indicatorMode === 'indicators') return true;
      if (showAllIndicators || globalIndicatorSelected) return true;
      if (isIndicatorConnected()) return true;
      if (indicatorSelected) return true;
      if (selected) return true;
      return false;
    }, [
      selectedIndicators,
      indicatorMode,
      showAllIndicators,
      globalIndicatorSelected,
      selected,
      isIndicatorConnected,
      indicatorSelected,
    ]);

    // Improved getIndicatorPositions with memoization
    const getIndicatorPositions = useCallback(() => {
      const offset = getIndicatorOffset();
      return { top: offset };
    }, [getIndicatorOffset]); // Enhanced: Get connected connection IDs
    useEffect(() => {
      if (!connectionsFromStore || !id) return;

      // Validate connections is an array
      if (!Array.isArray(connectionsFromStore)) {
        console.error(
          '❌ connectionsFromStore is not an array in TextObject useEffect:',
          typeof connectionsFromStore,
          connectionsFromStore
        );
        return;
      }
      const connectedIds = new Set();
      connectionsFromStore.forEach((conn) => {
        const startId = String(conn.start?.objectId || conn.start?.id);
        const endId = String(conn.end?.objectId || conn.end?.id);
        if (stringId === startId || stringId === endId) {
          connectedIds.add(conn.id);
        }
      });
      connectedLineIdsRef.current = connectedIds;
    }, [connectionsFromStore, stringId, id]);

    // Enhanced updateWorldMatrix function to better handle connections
    const updateWorldMatrix = useCallback(() => {
      if (!groupRef.current) return null;

      groupRef.current.updateWorldMatrix(true, false);
      const worldMatrix = groupRef.current.matrixWorld.clone();
      worldMatrixRef.current = worldMatrix;

      const worldPos = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPos);

      // Apply indicator offset
      const offset = new THREE.Vector3(...getIndicatorOffset());
      offset.applyQuaternion(groupRef.current.quaternion);
      const indicatorWorldPos = worldPos.clone().add(offset);

      const worldPosArray = [worldPos.x, worldPos.y, worldPos.z];
      const indicatorPosArray = [
        indicatorWorldPos.x,
        indicatorWorldPos.y,
        indicatorWorldPos.z,
      ];

      // Store enhanced connection data in userData for real-time updates
      if (groupRef.current) {
        // Store more precise indicator data directly for connection system to use
        groupRef.current.userData = {
          ...groupRef.current.userData,
          isTextObject: true,
          objectId: stringId,
          type: 'textObject',
          id: stringId,
          indicatorOffset: getIndicatorOffset(),
          indicatorWorldPosition: indicatorPosArray, // More clear naming
          worldPosition: worldPosArray,
          face: 'top',
          isMoving: isMoving,
          _lastUpdateTime: Date.now(), // Add timestamp to track freshness
          connectedLineIds: Array.from(connectedLineIdsRef.current),
          planeData: {
            worldMatrix: Array.from(worldMatrix.elements),
            position: [...worldPosArray],
            scale: [...scale],
            offset: getIndicatorOffset(),
          },
        };
      }

      worldPosRef.current = {
        worldPos: worldPosArray,
        indicatorPos: indicatorPosArray,
        matrix: Array.from(worldMatrix.elements),
      };

      return {
        worldPos: worldPosArray,
        indicatorPos: indicatorPosArray,
        matrix: Array.from(worldMatrix.elements),
      };
    }, [getIndicatorOffset, scale, stringId, isMoving]);

    // Update world position when transform changes
    useEffect(() => {
      updateWorldMatrix();

      // Store connection-relevant data in userData for easy access
      if (groupRef.current) {
        groupRef.current.userData.indicatorOffset = getIndicatorOffset();
        groupRef.current.userData.worldPos = worldPosRef.current;
        groupRef.current.userData.objectType = 'text';
      }
    }, [position, scale, updateWorldMatrix, getIndicatorOffset]);
    const closeAllUIs = useCallback(() => {
      setShowTransform(false);
      setShowResizeArrow(false);
      setShowResizeControls(false);
      setIsEditing(false);
    }, [
      setIsEditing,
      setShowResizeArrow,
      setShowResizeControls,
      setShowTransform,
    ]);
    // Handle selection/deselection
    useEffect(() => {
      if (!selected) {
        closeAllUIs();
        setIndicatorSelected(false);
        onIndicatorDeselected?.();

        // Save pending changes when deselected - but ensure it's a complete object
        if (pendingChangesRef.current && onUpdate) {
          // FIXED: Create a complete object instead of partial update
          const completeUpdate = {
            type: 'text', // ALWAYS include type
            id,
            position,
            scale,
            text: textContentRef.current,
            textStyle,
            ...pendingChangesRef.current, // Apply pending changes on top
          };
          onUpdate(id, completeUpdate);
          pendingChangesRef.current = null;
        }
      }
    }, [
      selected,
      closeAllUIs,
      onIndicatorDeselected,
      id,
      onUpdate,
      position,
      scale,
      textStyle,
      setIndicatorSelected,
    ]); // Optimized database update to reduce unnecessary saves
    const updateDatabase = useCallback(() => {
      if (!onUpdate || !id) return; // CRITICAL: Always ensure type is included in every update
      const currentState = {
        type: 'text', // ALWAYS include type field first
        id, // Include ID for safety
        position,
        scale,
        text: textContentRef.current, // Use ref value for real-time text
        textStyle,
        ...(isActivelyEditing && { lastEditTime: Date.now() }),
      }; // Only update if state has changed
      if (
        !lastUpdateRef.current ||
        !isEqual(lastUpdateRef.current, currentState)
      ) {
        const worldInfo = updateWorldMatrix();

        if (worldInfo) {
          currentState.worldPosition = worldInfo.worldPos;
          currentState.indicatorPosition = worldInfo.indicatorPos;
          currentState.planeData = {
            worldMatrix: worldInfo.matrix,
            position: [...position],
            scale: [...scale],
            offset: getIndicatorOffset(),
          };
        }

        lastUpdateRef.current = currentState;
        onUpdate(id, currentState);
      }
    }, [
      id,
      onUpdate,
      position,
      scale,
      textStyle,
      isActivelyEditing,
      updateWorldMatrix,
      getIndicatorOffset,
    ]); // Auto-resize function that only updates the textarea height, no database updates
    const autoResizeTextAreaOnly = useCallback(() => {
      if (!textAreaRef.current) return;

      // Reset height to calculate the actual height required
      textAreaRef.current.style.height = 'auto';

      // Get the scrollHeight (actual content height)
      const scrollHeight = textAreaRef.current.scrollHeight;

      // Store height in ref and state
      contentHeightRef.current = scrollHeight;
      setContentHeight(`${scrollHeight}px`);

      // Set the textarea height based on content
      textAreaRef.current.style.height = `${scrollHeight}px`;

      // Update container dimensions for connections
      containerDimensionsRef.current = {
        width: textAreaRef.current.offsetWidth,
        height: scrollHeight,
      };
    }, [setContentHeight]);

    // Enhanced auto-resize function that also resizes the text object container
    const autoResizeTextArea = useCallback(() => {
      if (!textAreaRef.current) return;

      // First do the basic resize
      autoResizeTextAreaOnly();

      const scrollHeight = contentHeightRef.current;

      // Calculate the new scale for the text object container to fit content
      const currentWidth = scale[0];
      const conversionFactor = 30;
      const baseHeight = 10; // Base height unit
      const paddingAdjustment = 16; // Account for padding

      // Calculate new height based on text content
      const newHeight = Math.max(
        baseHeight,
        (scrollHeight + paddingAdjustment) / (1.3 * conversionFactor)
      );

      // Update scale if height has changed significantly (use smaller threshold for better responsiveness)
      if (Math.abs(newHeight - scale[1]) > 0.1) {
        const newScale = [currentWidth, newHeight, scale[2]];
        setScale(newScale);

        // Update the database with new scale (debounced)
        if (onUpdate) {
          onUpdate(id, {
            type: 'text',
            scale: newScale,
            text: textContentRef.current, // Use ref to get latest text
            textStyle: textStyle,
            autoResized: true,
          });
        }
      }
    }, [autoResizeTextAreaOnly, scale, setScale, onUpdate, id, textStyle]);

    // Auto-resize for typing - updates visual scale immediately but debounces database calls
    const autoResizeForTyping = useCallback(() => {
      if (!textAreaRef.current) return;

      // First do the basic textarea resize
      autoResizeTextAreaOnly();

      const scrollHeight = contentHeightRef.current;

      // Calculate the new scale for the text object container to fit content
      const currentWidth = scale[0];
      const conversionFactor = 30;
      const baseHeight = 10; // Base height unit
      const paddingAdjustment = 16; // Account for padding

      // Calculate new height based on text content
      const newHeight = Math.max(
        baseHeight,
        (scrollHeight + paddingAdjustment) / (1.3 * conversionFactor)
      );

      // Update scale immediately for visual feedback (use smaller threshold for better responsiveness)
      if (Math.abs(newHeight - scale[1]) > 0.1) {
        const newScale = [currentWidth, newHeight, scale[2]];
        setScale(newScale);

        // No database update here - will be saved on blur
      }
    }, [autoResizeTextAreaOnly, scale, setScale]);
    // Event handlers    // Optimized text change handler - auto-resize container immediately, save to database on blur
    const handleTextChange = (e) => {
      const newText = e.target.value;

      // Update local state for immediate UI feedback
      setLocalText(newText);
      textContentRef.current = newText;
      setIsActivelyEditing(true);

      // Mark as locally editing to prevent sync from store
      if (!isLocallyEditing) {
        setIsLocallyEditing(true);
      }

      // Clear any pending timeout
      if (textUpdateTimeoutRef.current) {
        clearTimeout(textUpdateTimeoutRef.current);
      }

      // Mark as editing in userData for connections
      if (groupRef.current) {
        groupRef.current.userData.isTextEditing = true;
        textUpdateTimeoutRef.current = setTimeout(() => {
          if (groupRef.current) {
            groupRef.current.userData.isTextEditing = false;
          }
        }, 1000);
      }

      // Auto-resize with immediate visual feedback (no database calls during typing)
      autoResizeForTyping();

      // Note: Database calls for final state will happen on blur
    };
    const handleBlur = (e) => {
      if (
        uiMenuRef.current &&
        e.relatedTarget &&
        uiMenuRef.current.contains(e.relatedTarget)
      ) {
        return;
      }

      // Clear any pending text update timeout
      if (textUpdateTimeoutRef.current) {
        clearTimeout(textUpdateTimeoutRef.current);
      }

      // Get final text from current textarea value as backup
      const textareaValue = textAreaRef.current?.value || '';
      const finalText = textContentRef.current || textareaValue; // Set flag to prevent sync effect from overriding our changes
      justFinishedEditingRef.current = true;

      // Update local state immediately for instant display
      setLocalText(finalText);
      textContentRef.current = finalText;

      // Reset editing states
      setIsEditing(false);
      setIsActivelyEditing(false);

      // Update store text state (this will sync to database)
      setText(finalText);

      if (groupRef.current) {
        groupRef.current.userData.isTextEditing = false;
      }

      // Save final state to database immediately
      if (onUpdate) {
        onUpdate(id, {
          type: 'text',
          id,
          position,
          scale,
          text: finalText,
          textStyle,
          bulletPointMode,
          lastEditTime: Date.now(),
        });
      }

      // Clear pending changes
      pendingChangesRef.current = null; // Delay allowing sync from store to prevent race condition and ensure local text persists
      setTimeout(() => {
        setIsLocallyEditing(false);
        justFinishedEditingRef.current = false; // Clear the flag after delay
      }, 500); // Longer delay to ensure store propagation
    }; // Improved click handler to set focus flags only during initial activation
    const handleDivClick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      onClick();

      // Only set focus flags when transitioning from non-editing to editing
      if (!isEditing) {
        // Initialize local text and ref with current store text before starting edit
        setLocalText(text);
        textContentRef.current = text;
        setIsLocallyEditing(true); // Start local editing immediately
        needsFocusRef.current = true;
        initialFocusDoneRef.current = false;
      }

      // Activate editing mode
      setIsEditing(true);
    };

    // Simplify handleTextClick to use the same logic
    const handleTextClick = (e) => {
      handleDivClick(e);
    }; // Modified focus effect to use localText
    useEffect(() => {
      if (isEditing && needsFocusRef.current && !initialFocusDoneRef.current) {
        // Use a slightly longer timeout to ensure DOM is fully updated
        const focusTimeout = setTimeout(() => {
          if (textAreaRef.current) {
            textAreaRef.current.focus();

            // Only set cursor to end during initial focus
            const textLength = localText.length;
            textAreaRef.current.selectionStart = textLength;
            textAreaRef.current.selectionEnd = textLength;

            autoResizeTextAreaOnly();
            needsFocusRef.current = false;
            initialFocusDoneRef.current = true;
          }
        }, 50); // Slightly longer timeout for reliable focusing

        return () => clearTimeout(focusTimeout);
      }
    }, [isEditing, localText, autoResizeTextAreaOnly]);
    // Keep the existing effect for auto-resizing
    useEffect(() => {
      if (isEditing) {
        autoResizeTextAreaOnly(); // Use the version that doesn't trigger database updates
      }
    }, [isEditing, autoResizeTextAreaOnly]);

    // Connection indicator click - critical for connection handling
    // Update your existing handleIndicatorClick function
    const handleIndicatorClick = (e) => {
      e.stopPropagation();

      try {
        // Get the actual world position first
        const worldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPos);

        // Apply indicator offset
        const offset = new THREE.Vector3(...getIndicatorOffset());
        offset.applyQuaternion(groupRef.current.quaternion);
        const indicatorWorldPos = worldPos.clone().add(offset);
        const indicatorPosArray = [
          indicatorWorldPos.x,
          indicatorWorldPos.y,
          indicatorWorldPos.z,
        ];

        // Create indicator data in the format expected by ConnectionManager
        const indicator = {
          type: 'text',
          objectId: stringId,
          id: stringId,
          position: indicatorPosArray,
          worldPosition: indicatorPosArray,
          face: 'top',
          plane: groupRef.current, // CRITICAL: Direct reference to component
          faceCenter: indicatorPosArray,
          facePosition: indicatorPosArray,
          scale: [...scale],
          planeData: {
            worldMatrix: Array.from(groupRef.current.matrixWorld.elements),
            position: [...position],
            scale: [...scale],
            offset: getIndicatorOffset(),
          },
          // Include cube data for compatibility
          cube: {
            id: stringId,
            position,
            scale,
            userData: {
              objectId: stringId,
              indicatorPosition: indicatorPosArray,
            },
          },
        };

        setIndicatorSelected(true);
        onIndicatorSelected?.();
        onFaceIndicatorClick?.(indicator);
      } catch (error) {
        console.error('Error in handleIndicatorClick:', error);
      }
    };

    // Resizing handlers
    const handlePointerDown = (e) => {
      e.stopPropagation();
      startXRef.current = e.clientX;
      startWidthRef.current = scale[0];
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      onResizeStart?.(id);
    };

    const handlePointerMove = (e) => {
      const dx = e.clientX - startXRef.current;
      const scalingFactor = 0.1;
      const newWidth = startWidthRef.current + dx * scalingFactor;

      // Apply constraints
      const minWidth = 5,
        maxWidth = 200;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setScale([newWidth, scale[1], scale[2]]);

        // Update connections right away on resize
        if (onUpdate && groupRef.current) {
          const worldInfo = updateWorldMatrix();
          if (worldInfo) {
            onUpdate(id, {
              type: 'text',
              scale: [newWidth, scale[1], scale[2]],
              worldPosition: worldInfo.worldPos,
              indicatorPosition: worldInfo.indicatorPos,
              planeData: {
                worldMatrix: worldInfo.matrix,
                position: [...position],
                scale: [newWidth, scale[1], scale[2]],
                offset: getIndicatorOffset(),
              },
              isResizing: true,
            });
          }
        }
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      onResizeEnd?.(id);
      updateDatabase();
    };

    // Enhanced transform handlers for better connection management
    const handleTransformStart = () => {
      registerTransformingObject?.(id, true, position);
      if (window.orbitControls) {
        window.orbitControls.enabled = false;
      }
      setIsMoving(true);
      onTransformStart?.(id);

      // Mark connections as being transformed to prevent jitter
      if (groupRef.current) {
        groupRef.current.userData._transformActive = true;
        groupRef.current.userData._isDragging = true;
      }
    };

    const handleTransformEnd = () => {
      // Step 1: Unregister from transform system FIRST
      registerTransformingObject?.(id, false);

      if (window.orbitControls) {
        window.orbitControls.enabled = true;
      }

      // Step 2: Get the final position
      if (groupRef.current && onUpdate) {
        const newPos = groupRef.current.position;

        // Send a MINIMAL update like Cube does
        onUpdate(id, {
          type: 'text',
          position: [newPos.x, newPos.y, newPos.z], // Array format is critical
          _finalPosition: true, // This flag tells objectUpdateHandlers to save it
          _moveComplete: true, // Additional flag used by database handler
        });

        // Clear any transform-related flags
        if (groupRef.current.userData) {
          groupRef.current.userData._transformActive = false;
          groupRef.current.userData._isDragging = false;
          groupRef.current.userData.isMoving = false;
        }

        setIsMoving(false);
      }

      // Cleanup
      pendingChangesRef.current = null;
      onTransformEnd?.(id);
    };

    // Enhanced handleDrag to update connection points in real-time
    // Enhanced handleDrag to use the simpler Cube approach
    const handleDrag = useCallback(
      (e) => {
        if (!groupRef.current || !onUpdate) return;

        // Get the new position directly like in Cube component
        const newPos = e.target.object.position;

        // Calculate indicator position for connections
        const offset = new THREE.Vector3(...getIndicatorOffset());
        offset.applyQuaternion(groupRef.current.quaternion);
        const indicatorWorldPos = new THREE.Vector3(
          newPos.x,
          newPos.y,
          newPos.z
        ).add(offset);
        const indicatorPosArray = [
          indicatorWorldPos.x,
          indicatorWorldPos.y,
          indicatorWorldPos.z,
        ]; // Update all connections in real-time if needed
        if (connectionsFromStore && Array.isArray(connectionsFromStore)) {
          connectionsFromStore.forEach((conn) => {
            if (conn.start?.objectId === stringId) {
              conn.start.position = [...indicatorPosArray];
              conn.start.worldPosition = [...indicatorPosArray];
              if (conn.start.plane === groupRef.current) {
                conn.start.facePosition = [...indicatorPosArray];
                conn.start.faceCenter = [...indicatorPosArray];
              }
            }
            if (conn.end?.objectId === stringId) {
              conn.end.position = [...indicatorPosArray];
              conn.end.worldPosition = [...indicatorPosArray];
              if (conn.end.plane === groupRef.current) {
                conn.end.facePosition = [...indicatorPosArray];
                conn.end.faceCenter = [...indicatorPosArray];
              }
            }
          });
        }

        // Use the same simple update approach as handleTransformEnd and Cube
        onUpdate(id, {
          // Include type FIRST like in Cube.jsx
          type: 'text',

          // Simple position format
          position: [newPos.x, newPos.y, newPos.z],

          // Include ALL essential properties
          scale: scale,
          text: text,
          textStyle: textStyle,
          bulletPointMode: bulletPointMode,

          // CRITICAL: Don't add _transformActive flag which causes filtering!
        });

        // Store the updated positions in userData for any component that needs it
        if (groupRef.current) {
          groupRef.current.userData.position = [newPos.x, newPos.y, newPos.z];
          groupRef.current.userData.indicatorPosition = indicatorPosArray;
        }
      },
      [
        id,
        connectionsFromStore,
        stringId,
        onUpdate,
        scale,
        text,
        textStyle,
        bulletPointMode,
        getIndicatorOffset,
      ]
    );

    const handleScale = (e) => {
      if (!e.target || !e.target.object) return;

      const newScale = [
        e.target.object.scale.x,
        e.target.object.scale.y,
        scale[2], // Keep Z scale unchanged
      ];

      setScale(newScale);

      if (groupRef.current) {
        // Reset actual scale to prevent font scaling
        groupRef.current.scale.set(1, 1, 1);

        const worldInfo = updateWorldMatrix();
        if (worldInfo && onUpdate) {
          onUpdate(id, {
            type: 'text',
            position,
            scale: newScale,
            text,
            textStyle,
            bulletPointMode,
            worldPosition: worldInfo.worldPos,
            indicatorPosition: worldInfo.indicatorPos,
            planeData: {
              worldMatrix: worldInfo.matrix,
              position: [...position],
              scale: [...newScale],
              offset: [0, newScale[1] * 0.65, 0],
            },
            isResizing: true,
          });
        }
      }
    }; // Enhanced keyboard handling with shortcuts
    const handleKeyDown = (e) => {
      // Handle bullet points
      if (e.key === 'Enter' && bulletPointMode) {
        e.preventDefault();
        const cursorPosition = e.target.selectionStart;
        const currentText = localText; // Use local text
        const textBeforeCursor = currentText.slice(0, cursorPosition);
        const textAfterCursor = currentText.slice(cursorPosition);
        const newText = textBeforeCursor + '\n• ' + textAfterCursor;

        // Update local state and ref immediately
        setLocalText(newText);
        textContentRef.current = newText;

        setTimeout(() => {
          e.target.selectionStart = cursorPosition + 3;
          e.target.selectionEnd = cursorPosition + 3;
        }, 0);
        return;
      } // Handle keyboard shortcuts with Ctrl/Cmd
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            handleStyleChange({
              fontWeight: textStyle.fontWeight === 'bold' ? 'normal' : 'bold',
            });
            break;
          case 'i':
            e.preventDefault();
            handleStyleChange({
              fontStyle: textStyle.fontStyle === 'italic' ? 'normal' : 'italic',
            });
            break;
          case 'u':
            e.preventDefault();
            handleStyleChange({
              textDecoration:
                textStyle.textDecoration === 'underline' ? 'none' : 'underline',
            });
            break;
          case '=':
          case '+': {
            e.preventDefault();
            const currentSize = textStyle.fontSize || 32;
            handleStyleChange({ fontSize: Math.min(200, currentSize + 2) });
            break;
          }
          case '-': {
            e.preventDefault();
            const currentSizeDown = textStyle.fontSize || 32;
            handleStyleChange({ fontSize: Math.max(8, currentSizeDown - 2) });
            break;
          }
          default:
            break;
        }
      }

      // ESC to exit editing
      if (e.key === 'Escape') {
        textAreaRef.current?.blur();
      }
    };
    const handleStyleChange = (newStyle) => {
      if ('bulletPointMode' in newStyle) {
        setBulletPointMode(newStyle.bulletPointMode);
        if (newStyle.bulletPointMode && !text.startsWith('• ')) {
          setText('• ' + text);
        }
      }

      // Filter out any 'type' field that shouldn't be in textStyle
      // eslint-disable-next-line no-unused-vars
      const { type, bulletPointMode: _, ...actualStyleChanges } = newStyle;

      // Apply style changes immediately for responsive feedback
      setTextStyle((prev) => ({ ...prev, ...actualStyleChanges }));

      // Trigger auto-resize if font size changed
      if ('fontSize' in actualStyleChanges) {
        setTimeout(() => {
          autoResizeTextArea();
        }, 10);
      }

      // Update database
      updateDatabase();
    };
    // Enhanced stylesheet to apply text styles
    const getTextAreaStyle = () => ({
      autoWrap: 'wrap',
      width: '100%',
      height: contentHeight,
      minHeight: '2em', // Start with small height, will expand
      background: 'rgba(0,0,0,0.5)',
      color: textStyle.color || 'black',
      border: 'none',
      padding: '8px',
      margin: '0',
      resize: 'none',
      fontSize: textStyle.fontSize ? `${textStyle.fontSize}px` : '32px',
      fontFamily: 'Arial, sans-serif',
      fontWeight: textStyle.fontWeight || 'normal',
      fontStyle: textStyle.fontStyle || 'normal',
      textDecoration: textStyle.textDecoration || 'none',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      overflowWrap: 'break-word',
      boxSizing: 'border-box',
      outline: selected ? '1px solid #99ccff' : 'none',
      overflow: 'hidden',
      lineHeight: '1.4', // Better line spacing
      transition: 'all 0.2s ease', // Smooth transitions for style changes
    });

    const getContainerStyle = () => ({
      width: `${scale[0] * 5.3 * conversionFactor}px`,
      height: `${scale[1] * 1.3 * conversionFactor}px`,
      position: 'relative',
      transform: 'scale(1)',
    });

    // Combined scale-related effects
    useEffect(() => {
      originalScaleRef.current = [...scale];

      if ((showResizeControls || showResizeArrow) && groupRef.current) {
        groupRef.current.scale.set(1, 1, 1);
      }
    }, [scale, showResizeControls, showResizeArrow]);

    // Combined orbit controls and transform mode effects
    useEffect(() => {
      if (transformRef.current) {
        transformRef.current.setMode('translate');
      }

      return () => {
        if (window.orbitControls) {
          window.orbitControls.enabled = true;
        }
      };
    }, []);
    // Update rotation to always face camera - optimized to only run when needed
    useFrame(({ camera }) => {
      if (groupRef.current) {
        groupRef.current.quaternion.copy(camera.quaternion);

        // Only update world matrix if this object has connections AND is not being transformed
        // This is expensive so we minimize it
        if (
          !isMoving &&
          !isActivelyEditing &&
          connectionsFromStore?.some(
            (conn) =>
              conn.start.objectId === stringId || conn.end.objectId === stringId
          )
        ) {
          // Throttle matrix updates - only update every few frames
          if (
            !groupRef.current._lastMatrixUpdate ||
            Date.now() - groupRef.current._lastMatrixUpdate > 16
          ) {
            // ~60fps throttle
            updateWorldMatrix();
            groupRef.current._lastMatrixUpdate = Date.now();
          }
        }
      }
    });

    // Simplified effect that syncs heights on mode switch
    useEffect(() => {
      if (isEditing && textAreaRef.current) {
        autoResizeTextArea();
      }
    }, [isEditing, autoResizeTextArea]);

    // Add effect to update height when text changes in either mode
    useEffect(() => {
      if (isEditing) {
        autoResizeTextArea();
      } else if (displayRef.current && contentHeight !== 'auto') {
        displayRef.current.style.height = contentHeight;
      }
    }, [text, isEditing, autoResizeTextArea, contentHeight]);

    // Initialize content height on component mount
    useEffect(() => {
      // Set initial height based on content or a minimum value
      if (text) {
        // Delay to ensure DOM is ready
        setTimeout(() => {
          if (displayRef.current) {
            const initialHeight = Math.max(displayRef.current.scrollHeight, 32);
            setContentHeight(`${initialHeight}px`);
          }
        }, 100);
      }
    }, [text, setContentHeight]);

    // Enhanced render with _transformActive flag in userData
    return (
      <>
        <group
          ref={groupRef}
          position={position}
          userData={{
            type: 'textObject',
            id: stringId,
            objectId: stringId,
            isTextEditing: isActivelyEditing,
            containerDimensions: containerDimensionsRef.current,
            indicatorOffset: getIndicatorOffset(),
            face: 'top',
            isMoving: isMoving,
            _transformActive: isMoving,
          }}
        >
          <Html transform position={[0, 0, 0.1]} center>
            <div
              style={getContainerStyle()}
              className="text-object-container"
              onClick={handleDivClick}
            >
              {' '}
              {isEditing ? (
                <textarea
                  ref={textAreaRef}
                  // Use local text state for immediate UI feedback without re-renders
                  value={localText}
                  onChange={handleTextChange}
                  onBlur={handleBlur}
                  style={getTextAreaStyle()}
                  onKeyDown={handleKeyDown}
                  placeholder={bulletPointMode ? '• ' : 'Click to edit text...'}
                  onClick={(e) => {
                    // Just prevent the click from bubbling
                    e.stopPropagation();
                  }}
                  // Added onMouseDown to clear auto-focus flags
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    needsFocusRef.current = false;
                    initialFocusDoneRef.current = true;
                  }}
                />
              ) : (
                <div
                  ref={displayRef}
                  onClick={handleTextClick}
                  style={{
                    ...getTextAreaStyle(),
                    userSelect: 'none',
                    cursor: 'text',
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)', // Slightly different for display mode
                    border: selected
                      ? '1px dashed #99ccff'
                      : '1px dashed transparent',
                  }}
                >
                  {localText || 'Click to edit text...'}
                </div>
              )}
              {showResizeArrow && (
                <div
                  className="resize-arrow"
                  onPointerDown={handlePointerDown}
                  style={{ cursor: 'ew-resize' }}
                >
                  →
                </div>
              )}
            </div>
          </Html>

          {shouldShowIndicator && (
            <FaceIndicator
              position={getIndicatorPositions().top}
              rotation={[0, 0, 0]}
              onClick={handleIndicatorClick}
              isActive={indicatorSelected || isIndicatorConnected()}
              objectId={stringId}
              face="top"
            />
          )}
        </group>
        {/* Transform controls */}
        {showTransform && selected && (
          <TransformControls
            ref={transformRef}
            object={groupRef}
            onMouseDown={handleTransformStart}
            onMouseUp={handleTransformEnd}
            size={0.5}
            mode="translate"
            onObjectChange={handleDrag}
            onDragStart={handleTransformStart}
            onDragEnd={handleTransformEnd}
          />
        )}
        {/* Scale transform controls */}
        {showResizeArrow && selected && (
          <TransformControls
            object={groupRef.current}
            mode="scale"
            size={0.5}
            onObjectChange={handleScale}
            onDragStart={() => {
              if (window.orbitControls) window.orbitControls.enabled = false;
              onResizeStart?.(id);
            }}
            onDragEnd={() => {
              if (window.orbitControls) window.orbitControls.enabled = true;
              onResizeEnd?.(id);
            }}
            showX={true}
            showY={true}
            showZ={false}
            space="local"
            onUpdate={() => {
              if (groupRef.current) {
                groupRef.current.scale.set(1, 1, 1);
              }
            }}
          />
        )}
        {/* Resize transform controls */}
        {showResizeControls && selected && (
          <TransformControls
            object={groupRef.current}
            mode="scale"
            size={0.5}
            scale={scale}
            onObjectChange={handleScale}
            onDragStart={() => {
              if (window.orbitControls) {
                window.orbitControls.enabled = false;
              }
              registerTransformingObject?.(id, true);
              onResizeStart?.(id);
            }}
            onDragEnd={() => {
              if (window.orbitControls) {
                window.orbitControls.enabled = true;
              }
              registerTransformingObject?.(id, false);
              onResizeEnd?.(id);

              if (groupRef.current) {
                groupRef.current.scale.set(1, 1, 1);
              }
            }}
            showX={true}
            showY={false}
            showZ={false}
            space="local"
          />
        )}{' '}
        {/* Text style UI */}
        {selected && (
          <TextObjectUI
            ref={uiMenuRef}
            id={id}
            textStyle={textStyle}
            onStyleChange={handleStyleChange}
            onDelete={onDelete ? () => onDelete(id) : undefined}
            onTransformToggle={() => setShowTransform((prev) => !prev)}
            onResizeToggle={() => setShowResizeControls((prev) => !prev)}
            showTransform={showTransform}
            showResizeArrow={showResizeArrow}
            setShowResizeArrow={setShowResizeArrow}
            followTarget={groupRef}
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
      prevProps.position === nextProps.position &&
      prevProps.selected === nextProps.selected &&
      prevProps.showAllIndicators === nextProps.showAllIndicators &&
      prevProps.globalIndicatorSelected === nextProps.globalIndicatorSelected &&
      prevProps.indicatorMode === nextProps.indicatorMode &&
      prevProps.selectedIndicators?.length ===
        nextProps.selectedIndicators?.length
    );
  }
);

TextObject.displayName = 'TextObject';

export default TextObject;
