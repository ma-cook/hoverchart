import React, {
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { Html, TransformControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
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
    onTransformStart,
    onTransformEnd,
    onResizeStart,
    onResizeEnd,
  }) => {
    // Access Three.js scene for orbit controls
    const { scene } = useThree();

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

    // --- Real-time visual scale state ---
    const [visualScale, setVisualScale] = useState(scale);
    // Sync visualScale with store scale when store changes (but not during drag)
    useEffect(() => {
      setVisualScale(scale);
    }, [scale]);

    // Local editing state to prevent database updates during typing
    const [localText, setLocalText] = useState(text);
    const [isLocallyEditing, setIsLocallyEditing] = useState(false);

    // Text highlighting state
    const [selectedText, setSelectedText] = useState({ start: 0, end: 0 });
    const [hasTextSelection, setHasTextSelection] = useState(false);
    const isSelectingTextRef = useRef(false);

    // Store scene reference to avoid dependency issues
    const sceneRef = useRef(scene);
    useEffect(() => {
      sceneRef.current = scene;
    }, [scene]);

    // Helper function to safely pause/resume orbit controls
    const setOrbitControlsEnabled = useCallback(
      (enabled) => {
        let controlsFound = false;

        // Try window.orbitControls first
        if (window.orbitControls) {
          window.orbitControls.enabled = enabled;
          controlsFound = true;
        }

        // Try scene.orbitControls if scene is available
        if (sceneRef.current?.orbitControls) {
          sceneRef.current.orbitControls.enabled = enabled;
          controlsFound = true;
        }

        // Try to find orbit controls in the scene
        if (!controlsFound && sceneRef.current?.children) {
          sceneRef.current.traverse((child) => {
            if (child.type === 'OrbitControls' || child.isOrbitControls) {
              child.enabled = enabled;
              controlsFound = true;
            }
          });
        }

        return controlsFound;
      },
      [] // No dependencies needed since we use ref
    );

    // Use text object store for UI state only - MOVED EARLIER to avoid dependency issues
    const getTextObject = useTextObjectStore((state) => state.getTextObject);
    const setTextObject = useTextObjectStore((state) => state.setTextObject);
    const updateTextObjectProperty = useTextObjectStore(
      (state) => state.updateTextObjectProperty
    );

    // Get store state for this object - MOVED EARLIER
    const textObject = getTextObject(id);

    // Debug: Log the actual textObject from store
    console.log('🔧 Raw textObject from store:', { id, textObject });

    // Use local state as backup and sync with store - like Cube component does
    const [localShowTransform, setLocalShowTransform] = useState(false);
    const [localShowResizeControls, setLocalShowResizeControls] =
      useState(false);

    const {
      isEditing = false,
      isActivelyEditing = false,
      indicatorSelected = false,
      contentHeight = 100,
      isMoving = false,
      showTransform: storeShowTransform = false,
      showResizeControls: storeShowResizeControls = false,
      bulletPointMode = false,
    } = textObject || {}; // Provide default empty object with proper boolean defaults

    // Use local state for immediate updates, but sync with store
    const showTransform = localShowTransform || storeShowTransform;
    const showResizeControls =
      localShowResizeControls || storeShowResizeControls;

    // Sync local state with store state
    useEffect(() => {
      if (storeShowTransform !== localShowTransform) {
        setLocalShowTransform(storeShowTransform);
      }
      if (storeShowResizeControls !== localShowResizeControls) {
        setLocalShowResizeControls(storeShowResizeControls);
      }
    }, [
      storeShowTransform,
      storeShowResizeControls,
      localShowTransform,
      localShowResizeControls,
    ]);

    // Debug: Log the final values being used
    console.log('🔧 Final state values:', {
      id,
      localShowTransform,
      storeShowTransform,
      finalShowTransform: showTransform,
      localShowResizeControls,
      storeShowResizeControls,
      finalShowResizeControls: showResizeControls,
      selected,
      textObject: textObject ? 'exists' : 'null',
    });

    // Effect to manage orbit controls based on text selection state
    useEffect(() => {
      if (isSelectingTextRef.current) {
        // Disable orbit controls when actively selecting text
        setOrbitControlsEnabled(false);
      } else if (hasTextSelection) {
        // Keep orbit controls disabled when there's an active text selection
        console.log(
          '📝 Keeping orbit controls disabled due to active text selection'
        );
        setOrbitControlsEnabled(false);
      } else if (isEditing) {
        // Keep orbit controls disabled when editing
        setOrbitControlsEnabled(false);
      } else {
        // Re-enable orbit controls when not selecting text and not editing
        setOrbitControlsEnabled(true);
      }
    }, [setOrbitControlsEnabled, hasTextSelection, isEditing]); // Now safe to include since useCallback is stable

    // Effect to handle clicks outside textarea to clear selection and re-enable orbit controls
    useEffect(() => {
      const handleGlobalClick = (event) => {
        if (
          textAreaRef.current &&
          !textAreaRef.current.contains(event.target)
        ) {
          // Clicked outside textarea
          if (hasTextSelection) {
            console.log(
              '📝 Clicked outside textarea - clearing selection and re-enabling orbit controls'
            );
            setHasTextSelection(false);
            setSelectedText({ start: 0, end: 0 });
            setTimeout(() => {
              setOrbitControlsEnabled(true);
            }, 50);
          }
        }
      };

      if (hasTextSelection) {
        document.addEventListener('click', handleGlobalClick);
        return () => {
          document.removeEventListener('click', handleGlobalClick);
        };
      }
    }, [hasTextSelection, setOrbitControlsEnabled]);

    // Debug logging for transform control states
    console.log('🔧 TextObject transform states:', {
      id,
      selected,
      textObject,
      showTransform,
      showResizeControls,
      showTransformAndSelected: showTransform && selected,
      showResizeControlsAndSelected: showResizeControls && selected,
    });

    // Additional debug for state changes
    useEffect(() => {
      console.log('🔧 State change detected:', {
        id,
        showTransform,
        showResizeControls,
        selected,
        textObjectFromStore: textObject,
      });
    }, [showTransform, showResizeControls, selected, textObject, id]);
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

    const setShowTransform = useCallback(
      (value) => {
        updateTextObjectProperty(id, 'showTransform', value);
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

    // Transform and resize handlers - matching Cube pattern with immediate local state updates
    const handleTransformToggle = useCallback(() => {
      console.log('🔧 Transform toggle - before:', {
        showTransform,
        showResizeControls,
        localShowTransform,
        localShowResizeControls,
      });
      const newShowTransform = !showTransform;

      // Update local state immediately for instant UI response
      setLocalShowTransform(newShowTransform);
      setLocalShowResizeControls(false); // Disable resize when enabling transform

      // Also update store
      setShowTransform(newShowTransform);
      if (newShowTransform) {
        setShowResizeControls(false);
      }

      console.log('🔧 Transform toggle - after:', {
        newShowTransform,
        willDisableResize: newShowTransform,
      });
    }, [
      showTransform,
      showResizeControls,
      localShowTransform,
      localShowResizeControls,
      setShowTransform,
      setShowResizeControls,
    ]);

    const handleResizeToggle = useCallback(() => {
      console.log('🔧 Resize toggle - before:', {
        showTransform,
        showResizeControls,
        localShowTransform,
        localShowResizeControls,
      });
      const newShowResizeControls = !showResizeControls;

      // Update local state immediately for instant UI response
      setLocalShowResizeControls(newShowResizeControls);
      setLocalShowTransform(false); // Disable transform when enabling resize

      // Also update store
      setShowResizeControls(newShowResizeControls);
      if (newShowResizeControls) {
        setShowTransform(false);
      }

      console.log('🔧 Resize toggle - after:', {
        newShowResizeControls,
        willDisableTransform: newShowResizeControls,
      });
    }, [
      showResizeControls,
      showTransform,
      localShowTransform,
      localShowResizeControls,
      setShowResizeControls,
      setShowTransform,
    ]);

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

    // Effect to handle clicks outside textarea to clear selection and re-enable orbit controls
    useEffect(() => {
      const handleGlobalClick = (event) => {
        if (
          textAreaRef.current &&
          !textAreaRef.current.contains(event.target)
        ) {
          // Clicked outside textarea
          if (hasTextSelection) {
            console.log(
              '📝 Clicked outside textarea - clearing selection and re-enabling orbit controls'
            );
            setHasTextSelection(false);
            setSelectedText({ start: 0, end: 0 });
            setTimeout(() => {
              if (!isEditing) {
                setOrbitControlsEnabled(true);
              }
            }, 50);
          }
        }
      };

      if (hasTextSelection) {
        document.addEventListener('click', handleGlobalClick);
        return () => {
          document.removeEventListener('click', handleGlobalClick);
        };
      }
    }, [hasTextSelection, isEditing, setOrbitControlsEnabled]);

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
    }, [text]);

    // Initialize local text on mount to ensure consistency
    useEffect(() => {
      // CRITICAL: Don't initialize during editing states to prevent interference
      if (
        isEditing ||
        isActivelyEditing ||
        isLocallyEditing ||
        justFinishedEditingRef.current
      ) {
        return;
      }

      // Only initialize if we don't have local text but we have store text
      if (!localText && text && text !== 'Click to edit text...') {
        console.log('🟦 TextObject initializing with store text:', {
          id,
          text,
        });
        setLocalText(text);
        textContentRef.current = text;
      }
      // Handle case where we have empty store text - show placeholder for display ONLY if we don't have content
      else if (
        (!text || text === '') &&
        (!textContentRef.current || textContentRef.current === '')
      ) {
        const placeholder = 'Click to edit text...';
        if (localText !== placeholder) {
          console.log('🟦 TextObject initializing with placeholder:', { id });
          setLocalText(placeholder);
          textContentRef.current = ''; // Keep ref empty for new objects
        }
      }
      // Handle case where store has placeholder text - this should not happen in new system
      else if (text === 'Click to edit text...' && !textContentRef.current) {
        console.log('🟦 TextObject initializing placeholder from store:', {
          id,
        });
        setLocalText(text);
        textContentRef.current = ''; // Ref stays empty
      }
    }, [text, localText, id, isEditing, isActivelyEditing, isLocallyEditing]); // Sync local text with store text when not editing - improved logic with better guards
    useEffect(() => {
      // CRITICAL: Don't sync if we're in any editing state or just finished editing
      if (
        isLocallyEditing ||
        isEditing ||
        justFinishedEditingRef.current ||
        isActivelyEditing
      ) {
        console.log('🔴 TextObject sync blocked - editing state:', {
          id,
          isLocallyEditing,
          isEditing,
          justFinishedEditing: justFinishedEditingRef.current,
          isActivelyEditing,
        });
        return;
      }

      // IMPORTANT: Only sync if store text is actually different AND we're not in a post-save state
      // This prevents overriding user changes that were just saved but haven't propagated yet
      if (text && text !== localText && text !== textContentRef.current) {
        // Extra safeguard: don't sync if we recently saved (textContentRef has more recent data)
        if (textContentRef.current && textContentRef.current !== text) {
          // If our ref has different content than store, it means we're ahead of the store
          // Don't sync from store to avoid overriding our more recent changes
          console.log('🟡 TextObject sync blocked - ref ahead of store:', {
            id,
            storeText: text,
            refText: textContentRef.current,
            localText,
          });
          return;
        }

        // Additional safeguard: if localText has actual content and store has placeholder/empty, don't sync
        if (
          localText &&
          localText !== 'Click to edit text...' &&
          (!text || text === 'Click to edit text...')
        ) {
          console.log(
            '🟡 TextObject sync blocked - localText has content, store has placeholder:',
            {
              id,
              localText,
              storeText: text,
            }
          );
          return;
        }

        // Extra check: don't overwrite user content with placeholder text
        // Also don't overwrite if we have content in ref that's more recent
        if (
          (text !== 'Click to edit text...' ||
            localText === 'Click to edit text...') &&
          (!textContentRef.current ||
            textContentRef.current === text ||
            textContentRef.current === 'Click to edit text...')
        ) {
          console.log('🟢 TextObject syncing from store:', {
            id,
            fromStore: text,
            previousLocal: localText,
            previousRef: textContentRef.current,
          });
          setLocalText(text);
          textContentRef.current = text;
        } else {
          console.log(
            '🟡 TextObject sync skipped - preserving local content:',
            {
              id,
              storeText: text,
              localText,
              refText: textContentRef.current,
            }
          );
        }
      }
    }, [text, isLocallyEditing, isEditing, isActivelyEditing, localText, id]);

    // Constants
    const conversionFactor = 30;
    const stringId = String(id);

    // Sync props to state

    // Calculate offset for indicator consistently
    const getIndicatorOffset = useCallback(() => {
      return [0, visualScale[1] * 0.65, 0];
    }, [visualScale]); // Memoized derived values
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
            scale: [...visualScale],
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
    }, [getIndicatorOffset, visualScale, stringId, isMoving]);

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
      setShowResizeControls(false);
      setIsEditing(false);
    }, [setIsEditing, setShowResizeControls, setShowTransform]);
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

    // Enhanced auto-resize function that also updates the text object's scale for 3D positioning
    const autoResizeTextArea = useCallback(() => {
      if (!textAreaRef.current) return;

      // First do the basic resize
      autoResizeTextAreaOnly();

      const scrollHeight = contentHeightRef.current;

      // Update the scale only if the content has grown significantly beyond the original container
      const currentWidth = scale[0];
      const conversionFactor = 30;
      const paddingAdjustment = 16; // Account for padding

      // Calculate new height based on text content
      const contentBasedHeight =
        (scrollHeight + paddingAdjustment) / (1.3 * conversionFactor);
      const newHeight = Math.max(scale[1], contentBasedHeight); // Only grow, don't shrink

      // Update scale only if height has grown significantly (to update 3D bounds for connections)
      if (newHeight > scale[1] + 0.5) {
        // Only update when there's significant growth
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

    // Auto-resize for typing - throttled to prevent interference with typing
    const autoResizeForTyping = useCallback(() => {
      if (!textAreaRef.current) return;

      // Throttle resize calls to avoid interfering with rapid typing
      if (textAreaRef.current._resizeThrottle) {
        clearTimeout(textAreaRef.current._resizeThrottle);
      }

      textAreaRef.current._resizeThrottle = setTimeout(() => {
        // Just do the basic textarea resize - container will expand naturally
        autoResizeTextAreaOnly();
      }, 100); // Throttle to avoid constant resizing during typing
    }, [autoResizeTextAreaOnly]);
    // Event handlers
    // Optimized text change handler - auto-resize container immediately, save to database on blur
    const handleTextChange = (e) => {
      const newText = e.target.value;

      // IMPORTANT: Always update both local state and ref immediately
      // Don't rely on conditions that might allow other effects to interfere
      setLocalText(newText);
      textContentRef.current = newText;

      // Debug logging for text changes
      console.log('🟠 TextObject handleTextChange:', {
        id,
        newText,
        previousLocal: localText,
        ref: textContentRef.current,
      });

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

      // Auto-resize with throttling to prevent interference with typing
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

      // Get final text from current textarea value as the primary source
      const textareaValue = textAreaRef.current?.value || '';

      // Priority order: textarea value > textContentRef > localText
      let finalText = textareaValue || textContentRef.current || localText;

      // Handle empty text case - if user leaves it empty, keep it empty (don't revert to placeholder)
      if (
        !finalText ||
        finalText.trim() === '' ||
        finalText === 'Click to edit text...'
      ) {
        finalText = ''; // Keep empty instead of placeholder
      }

      // Debug logging to track text saving
      console.log('🔵 TextObject handleBlur:', {
        id,
        textareaValue,
        textContentRef: textContentRef.current,
        localText,
        finalText,
        storeText: text,
      });

      // Set flag to prevent sync effect from overriding our changes - set early and keep longer
      justFinishedEditingRef.current = true;

      // Update refs and local state immediately
      textContentRef.current = finalText; // This is critical - update ref FIRST

      // Update local state for display
      if (finalText === '') {
        setLocalText('Click to edit text...');
      } else {
        setLocalText(finalText);
      }

      // Reset editing states
      setIsEditing(false);
      setIsActivelyEditing(false);

      if (groupRef.current) {
        groupRef.current.userData.isTextEditing = false;
      }

      // Save final state to database immediately with complete object
      // IMPORTANT: Always save the actual text (empty if user cleared it), not placeholder
      if (onUpdate) {
        const updatePayload = {
          type: 'text',
          id,
          position,
          scale,
          text: finalText, // This will be empty string if user cleared text
          textStyle,
          bulletPointMode,
          lastEditTime: Date.now(),
        };

        console.log('🟢 TextObject saving to database:', updatePayload);
        onUpdate(id, updatePayload);
      }

      // Update scale based on final content size
      setTimeout(() => {
        autoResizeTextArea();
      }, 50);

      // Clear pending changes
      pendingChangesRef.current = null;

      // Delay allowing sync from store to prevent race condition - much longer delay
      setTimeout(() => {
        setIsLocallyEditing(false);
      }, 2000); // Increased delay significantly to ensure database update completes

      // Clear the flag after an even longer delay to ensure complete store propagation
      setTimeout(() => {
        justFinishedEditingRef.current = false;
        console.log('🟡 TextObject: Cleared justFinishedEditingRef for', id);
      }, 3000); // Much longer delay to ensure complete propagation

      // Re-enable orbit controls when textarea loses focus
      console.log('📝 Textarea lost focus - enabling orbit controls');
      setOrbitControlsEnabled(true);
      isSelectingTextRef.current = false;
    }; // Improved click handler to set focus flags only during initial activation
    const handleDivClick = (e) => {
      e.stopPropagation();
      e.preventDefault();

      console.log('🔵 TextObject handleDivClick - starting edit:', {
        id,
        currentLocalText: localText,
        storeText: text,
        refText: textContentRef.current,
        isCurrentlyEditing: isEditing,
      });

      onClick();

      // Only set focus flags when transitioning from non-editing to editing
      if (!isEditing) {
        // Clear any lingering flags that might interfere
        justFinishedEditingRef.current = false;

        // Initialize local text and ref with current available text
        // Priority: textContentRef > localText > store text
        let editingText = textContentRef.current || localText || text || '';

        // Only treat as empty if ALL sources are empty or placeholder
        if (
          editingText === 'Click to edit text...' ||
          (!editingText && !textContentRef.current && !localText && !text)
        ) {
          editingText = '';
        }

        console.log('🟢 TextObject initializing edit with text:', {
          id,
          editingText,
          sources: {
            ref: textContentRef.current,
            local: localText,
            store: text,
          },
        });

        setLocalText(editingText);
        textContentRef.current = editingText;
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
    }; // Modified focus effect to properly handle placeholder clearing
    useEffect(() => {
      if (isEditing && needsFocusRef.current && !initialFocusDoneRef.current) {
        // Use a slightly longer timeout to ensure DOM is fully updated
        const focusTimeout = setTimeout(() => {
          if (textAreaRef.current) {
            // For uncontrolled component, set the value explicitly
            // This is crucial for clearing placeholder text
            const valueToSet =
              localText === 'Click to edit text...' ? '' : localText || '';
            textAreaRef.current.value = valueToSet;
            textAreaRef.current.focus();

            // Set cursor to end during initial focus
            const textLength = textAreaRef.current.value.length;
            textAreaRef.current.selectionStart = textLength;
            textAreaRef.current.selectionEnd = textLength;

            // Only auto-resize once during initial focus, not on every keystroke
            autoResizeTextAreaOnly();
            needsFocusRef.current = false;
            initialFocusDoneRef.current = true;
          }
        }, 50); // Slightly longer timeout for reliable focusing

        return () => clearTimeout(focusTimeout);
      }
    }, [isEditing, autoResizeTextAreaOnly, localText]); // Add localText back for initial setup
    // Keep the existing effect for auto-resizing - but only on initial edit
    useEffect(() => {
      if (isEditing && !isActivelyEditing) {
        autoResizeTextAreaOnly(); // Use the version that doesn't trigger database updates
      }
    }, [isEditing, isActivelyEditing, autoResizeTextAreaOnly]);

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

    // --- Update handleScale to update visualScale immediately ---
    const handleScale = (e) => {
      if (!e.target || !e.target.object) return;

      const newScale = [
        e.target.object.scale.x,
        e.target.object.scale.y,
        visualScale[2], // Keep Z scale unchanged
      ];

      // Update local visual scale immediately for real-time feedback
      setVisualScale(newScale);
      setScale(newScale); // Also update store (triggers DB update)
      if (groupRef.current) {
        // Set the group scale visually for immediate feedback
        groupRef.current.scale.set(1, 1, 1);
      }

      // Optionally update world matrix for connections, etc.
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
    };

    // Keyboard handling with shortcuts
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
      console.log('🎨 TextObject handleStyleChange called:', {
        id,
        newStyle,
        hasTextSelection,
        selectedText,
      });

      if ('bulletPointMode' in newStyle) {
        setBulletPointMode(newStyle.bulletPointMode);
        if (newStyle.bulletPointMode && !text.startsWith('• ')) {
          setText('• ' + text);
        }
      }

      // Filter out any 'type' field that shouldn't be in textStyle
      // eslint-disable-next-line no-unused-vars
      const { type, bulletPointMode: _, ...actualStyleChanges } = newStyle;

      // If there's selected text, apply styles to just that selection
      if (hasTextSelection && textAreaRef.current) {
        const start = selectedText.start;
        const end = selectedText.end;

        if (start !== end) {
          console.log('🎨 Applying style to selected text:', {
            start,
            end,
            style: actualStyleChanges,
          });
          // Apply style to selected portion only
          applyStyleToSelection(actualStyleChanges, start, end);
          return;
        }
      }

      console.log(
        '🎨 Applying style to entire text object:',
        actualStyleChanges
      );
      // Apply style changes to the entire text object (existing behavior)
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

    // Text selection handlers
    const handleTextSelection = () => {
      if (!textAreaRef.current) {
        console.log('📝 No textarea ref available for text selection');
        return;
      }

      // Only process if textarea is focused
      if (document.activeElement !== textAreaRef.current) {
        console.log('📝 Textarea not focused, skipping selection handling');
        return;
      }

      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      const hasSelection = start !== end;

      setSelectedText({ start, end });
      setHasTextSelection(hasSelection);

      console.log('📝 Text selection changed:', {
        id,
        start,
        end,
        hasSelection,
        selectedText: hasSelection
          ? textAreaRef.current.value.substring(start, end)
          : '',
        fullText: textAreaRef.current.value,
        textAreaFocused: document.activeElement === textAreaRef.current,
      });

      // If there's a selection, keep orbit controls disabled a bit longer
      if (hasSelection) {
        console.log('📝 Text selected - keeping orbit controls disabled');
        setOrbitControlsEnabled(false);
      } else if (!isSelectingTextRef.current && !isEditing) {
        // If no selection and not actively selecting, can re-enable orbit controls
        console.log('📝 No text selection - can re-enable orbit controls');
        setTimeout(() => {
          setOrbitControlsEnabled(true);
        }, 50);
      }
    };

    // Apply styles to selected text (simplified version for now)
    const applyStyleToSelection = (style, start, end) => {
      // For now, we'll apply the style to the entire text object
      // TODO: Implement rich text support with styled text segments
      console.log('🎨 Applying style to selection:', { style, start, end });

      // Temporarily apply to entire text until we implement rich text
      setTextStyle((prev) => ({ ...prev, ...style }));

      // Trigger auto-resize if font size changed
      if ('fontSize' in style) {
        setTimeout(() => {
          autoResizeTextArea();
        }, 10);
      }

      // Update database
      updateDatabase();
    };
    // Enhanced stylesheet to apply text styles
    const getTextAreaStyle = () => ({
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
      outline: 'none',
      overflow: 'hidden',
      lineHeight: '1.4', // Better line spacing
      transition: 'height 0.2s ease', // Smooth height transitions
      userSelect: 'text', // Ensure text is selectable
      WebkitUserSelect: 'text', // Safari support
      MozUserSelect: 'text', // Firefox support
    });

    // --- Use visualScale for rendering and calculations ---
    const getContainerStyle = () => ({
      width: `${visualScale[0] * 5.3 * conversionFactor}px`,
      minHeight: `${visualScale[1] * 1.3 * conversionFactor}px`,
      height: 'auto', // Allow container to expand with content
      position: 'relative',
      transform: 'scale(1)',
    });

    // Combined scale-related effects
    useEffect(() => {
      originalScaleRef.current = [...visualScale];

      if (showResizeControls && groupRef.current) {
        groupRef.current.scale.set(1, 1, 1);
      }
    }, [visualScale, showResizeControls]);

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
              onMouseDown={(e) => {
                // Only pause orbit controls if clicking on the text object itself
                if (e.target.closest('.text-object-container')) {
                  e.stopPropagation();
                  if (window.orbitControls) {
                    window.orbitControls.enabled = false;
                  }
                }
              }}
              onMouseUp={() => {
                // Re-enable orbit controls after any mouse interaction
                if (window.orbitControls) {
                  window.orbitControls.enabled = true;
                }
              }}
            >
              {' '}
              {isEditing ? (
                <textarea
                  ref={textAreaRef}
                  // Use defaultValue for uncontrolled component during editing to prevent resets
                  // Priority: textContentRef > localText > store text (same as handleDivClick)
                  defaultValue={(() => {
                    let value =
                      textContentRef.current || localText || text || '';

                    // Only treat as empty if it's placeholder text
                    if (value === 'Click to edit text...') {
                      value = '';
                    }

                    console.log('📝 Setting textarea defaultValue:', {
                      id,
                      value,
                      sources: {
                        ref: textContentRef.current,
                        local: localText,
                        store: text,
                      },
                    });
                    return value;
                  })()}
                  onChange={handleTextChange}
                  onBlur={handleBlur}
                  style={getTextAreaStyle()}
                  onKeyDown={handleKeyDown}
                  placeholder={bulletPointMode ? '• ' : 'Click to edit text...'}
                  onClick={(e) => {
                    // Just prevent the click from bubbling
                    e.stopPropagation();

                    // Ensure textarea is focused for text selection
                    if (textAreaRef.current) {
                      textAreaRef.current.focus();
                      console.log('📝 Textarea clicked and focused');

                      // Check selection after a brief delay to see if it changed
                      setTimeout(() => {
                        handleTextSelection();
                      }, 10);
                    }
                  }}
                  onDoubleClick={() => {
                    // Test if double-click selection works
                    if (textAreaRef.current) {
                      console.log(
                        '📝 Double-click detected, attempting word selection'
                      );
                      // Let browser handle double-click word selection naturally
                      setTimeout(() => {
                        handleTextSelection();
                      }, 10);
                    }
                  }}
                  // Text selection handlers - pause orbit controls but allow text selection
                  onMouseDown={(e) => {
                    e.stopPropagation();

                    // Clear auto-focus flags
                    needsFocusRef.current = false;
                    initialFocusDoneRef.current = true;

                    // Set selection flag and disable orbit controls
                    isSelectingTextRef.current = true;
                    console.log(
                      '🔴 Starting text selection - disabling orbit controls'
                    );

                    // Use helper function to safely disable orbit controls
                    setOrbitControlsEnabled(false);
                  }}
                  onMouseUp={(e) => {
                    e.stopPropagation();

                    // Clear selection flag but delay re-enabling orbit controls
                    // to allow text selection to complete
                    isSelectingTextRef.current = false;
                    console.log(
                      '🟢 Ending text selection - delaying orbit controls re-enable'
                    );

                    // Check for text selection immediately
                    handleTextSelection();

                    // Delay re-enabling orbit controls to allow text selection to finalize
                    setTimeout(() => {
                      setOrbitControlsEnabled(true);
                      console.log(
                        '✅ Orbit controls re-enabled after text selection'
                      );
                    }, 100); // 100ms delay to allow selection to complete
                  }}
                  onMouseMove={() => {
                    // Log mouse movement during text selection
                    if (
                      textAreaRef.current &&
                      document.activeElement === textAreaRef.current
                    ) {
                      const start = textAreaRef.current.selectionStart;
                      const end = textAreaRef.current.selectionEnd;
                      if (start !== end) {
                        console.log('📝 Text selection during mouse move:', {
                          start,
                          end,
                          selectedText: textAreaRef.current.value.substring(
                            start,
                            end
                          ),
                        });
                      }
                    }
                  }}
                  onSelect={() => {
                    console.log('📝 onSelect event fired');
                    // Give a small delay to ensure selection is stable
                    setTimeout(() => {
                      handleTextSelection();
                    }, 10);
                  }}
                  onFocus={() => {
                    console.log('📝 Textarea focused - pausing orbit controls');
                    setOrbitControlsEnabled(false);
                  }}
                  onKeyUp={() => {
                    // Handle text selection via keyboard (Shift+Arrow keys, Ctrl+A, etc.)
                    handleTextSelection();
                  }}
                />
              ) : (
                <div
                  ref={displayRef}
                  onClick={handleTextClick}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    // Briefly pause orbit controls when clicking to start editing
                    setOrbitControlsEnabled(false);
                  }}
                  onMouseUp={(e) => {
                    e.stopPropagation();
                    // Re-enable orbit controls after click
                    setOrbitControlsEnabled(true);
                  }}
                  style={{
                    ...getTextAreaStyle(),
                    userSelect: 'none',
                    cursor: 'text',
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)', // Slightly different for display mode
                  }}
                >
                  {localText || 'Click to edit text...'}
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
        {/* Transform controls - Fixed to match Cube pattern */}
        {console.log('🔧 Transform Controls Render Check:', {
          selected,
          showTransform,
          hasGroupRef: !!groupRef.current,
          shouldRender: selected && showTransform && groupRef.current,
        })}
        {selected && showTransform && groupRef.current && (
          <TransformControls
            ref={transformRef}
            object={groupRef.current}
            onObjectChange={handleDrag}
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
              onTransformEnd?.(id);
            }}
            mode="translate"
            space="world"
            size={0.5}
          />
        )}
        {/* Resize transform controls - Fixed to use showResizeControls like Cube */}
        {console.log('🔧 Resize Controls Render Check:', {
          selected,
          showResizeControls,
          hasGroupRef: !!groupRef.current,
          shouldRender: selected && showResizeControls && groupRef.current,
        })}
        {selected && showResizeControls && groupRef.current && (
          <TransformControls
            object={groupRef.current}
            mode="scale"
            size={0.5}
            onObjectChange={handleScale}
            onMouseDown={() => {
              if (window.orbitControls) {
                window.orbitControls.enabled = false;
              }
              onResizeStart?.(id);
            }}
            onMouseUp={() => {
              if (window.orbitControls) {
                window.orbitControls.enabled = true;
              }
              onResizeEnd?.(id);
            }}
            showX={true}
            showY={true}
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
            onTransformToggle={handleTransformToggle}
            onResizeToggle={handleResizeToggle}
            showTransform={showTransform}
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
