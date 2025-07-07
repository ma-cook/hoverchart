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
    // Access Three.js scene and camera for orbit controls and distance calculation
    const { scene, camera } = useThree();

    // Get object data from objects store
    const objects = useObjectsStore((state) => state.objects);
    const objectData = objects.find((obj) => obj.id === id);

    // Get connections from connection store instead of props
    const connectionsFromStore = useConnectionStore(
      (state) => state.connections
    );

    // Memoize derived values to prevent unnecessary re-renders
    const text = useMemo(() => objectData?.text || '', [objectData?.text]);
    // Debug: Log position data sources
    console.log('🔍 TextObject position debugging:', {
      id,
      positionProp: position,
      objectDataPosition: objectData?.position,
      positionsMatch:
        position && objectData?.position
          ? JSON.stringify(position) === JSON.stringify(objectData.position)
          : 'N/A',
    });
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
    const [contentEditableInitialized, setContentEditableInitialized] =
      useState(false);
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
    const resizeMeshRef = useRef(); // Invisible mesh for resize controls
    const uiMenuRef = useRef(null);
    const textAreaRef = useRef();
    const displayRef = useRef();

    // Technical refs
    const textUpdateTimeoutRef = useRef(null);
    const pendingChangesRef = useRef(null);
    const originalScaleRef = useRef(scale);
    const containerDimensionsRef = useRef({ width: 0, height: 0 });
    const resizeUpdateTimeoutRef = useRef(null);

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
      // CRITICAL: Don't update if we're actively transforming to prevent position conflicts
      if (groupRef.current && groupRef.current.userData._transformActive) {
        console.log('⚠️ Skipping position update during active transform:', id);
        return;
      }

      // Check if we have a finalPosition in userData that's more recent than the prop
      // This prevents reverting to old position after a transform operation completes
      if (
        groupRef.current &&
        groupRef.current.userData.finalPosition &&
        groupRef.current.userData.positionUpdated &&
        Date.now() - groupRef.current.userData.positionUpdated < 2000
      ) {
        const finalPos = groupRef.current.userData.finalPosition;
        console.log('🛡️ Using recent final position instead of prop:', {
          id,
          propPosition: position,
          finalPosition: finalPos,
          timeSinceUpdate:
            Date.now() - groupRef.current.userData.positionUpdated,
        });

        // Use the final position instead of prop position
        groupRef.current.position.set(finalPos[0], finalPos[1], finalPos[2]);
        updateWorldMatrix();
        return;
      }

      updateWorldMatrix();

      // Store connection-relevant data in userData for easy access
      if (groupRef.current) {
        groupRef.current.userData.indicatorOffset = getIndicatorOffset();
        groupRef.current.userData.worldPos = worldPosRef.current;
        groupRef.current.userData.objectType = 'text';
        groupRef.current.userData.lastPropPosition = position
          ? [...position]
          : null;

        // Only set position from prop if we don't have a recent final position
        if (!groupRef.current.userData.finalPosition && position) {
          groupRef.current.position.set(position[0], position[1], position[2]);
        }
      }
    }, [position, scale, updateWorldMatrix, getIndicatorOffset, id]);

    // CRITICAL: Additional position safety check effect
    // This runs on every render to ensure position consistency and prevent snapping
    useEffect(() => {
      // Skip if no group or we're actively transforming
      if (!groupRef.current || groupRef.current.userData._transformActive)
        return;

      // Check for position inconsistencies
      const currentPos = groupRef.current.position;
      const currentPosArray = [currentPos.x, currentPos.y, currentPos.z];

      // First check if we have a final position that should be preserved
      if (groupRef.current.userData.finalPosition) {
        const finalPos = groupRef.current.userData.finalPosition;
        const timeSinceUpdate =
          Date.now() - (groupRef.current.userData.positionUpdated || 0);

        // If we have a recent final position but current position doesn't match it
        if (timeSinceUpdate < 5000 && !isEqual(finalPos, currentPosArray)) {
          console.log(
            '🔄 Position inconsistency detected - restoring final position:',
            {
              id,
              currentPos: currentPosArray,
              finalPos,
              timeSinceUpdate,
            }
          );

          // Restore final position
          groupRef.current.position.set(finalPos[0], finalPos[1], finalPos[2]);

          // Update the effective position state
          setEffectivePosition([...finalPos]); // Force new array reference

          // Immediately update store as well to ensure consistency
          const objectsStore = useObjectsStore.getState();
          const updatedObjects = objectsStore.objects.map((obj) =>
            obj.id === id ? { ...obj, position: finalPos } : obj
          );
          objectsStore.setObjects(updatedObjects);

          // Force another update to parent
          if (onUpdate) {
            onUpdate(id, {
              type: 'text',
              position: finalPos,
              _finalPosition: true,
              _forceUpdate: true,
              scale: scale,
              text: textContentRef.current || text,
              textStyle: textStyle,
              bulletPointMode: bulletPointMode,
            });
          }
        }
      }
    }, [id, onUpdate, scale, text, textStyle, bulletPointMode]);
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

        console.log('💾 Updating database with state:', {
          id,
          text: currentState.text,
          textStyle: currentState.textStyle,
          hasChanged:
            !lastUpdateRef.current ||
            !isEqual(lastUpdateRef.current, currentState),
        });

        lastUpdateRef.current = currentState;
        onUpdate(id, currentState);
      } else {
        console.log('⏭️ Skipping database update - no changes detected:', {
          id,
          currentText: currentState.text,
          lastText: lastUpdateRef.current?.text,
        });
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

    // Event handlers
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

      // Get final text from current contentEditable innerHTML
      const contentEditableValue = textAreaRef.current?.innerHTML || '';

      // CRITICAL FIX: Don't use empty contentEditable value if we weren't actually editing
      // This prevents double-click events from clearing text when blur is triggered accidentally
      let finalText;

      // ENHANCED SAFEGUARD: If contentEditable is empty but we have content in ref/local,
      // it's likely a race condition - prefer the existing content
      const hasExistingContent = textContentRef.current || localText;
      const contentEditableIsEmpty =
        !contentEditableValue || contentEditableValue.trim() === '';

      if (
        contentEditableIsEmpty &&
        hasExistingContent &&
        hasExistingContent !== 'Click to edit text...'
      ) {
        // Race condition detected - contentEditable was cleared but we have existing content
        console.log(
          '🟡 TextObject: Detected race condition - preserving existing content over empty contentEditable:',
          {
            id,
            contentEditableValue,
            textContentRef: textContentRef.current,
            localText,
          }
        );
        finalText = textContentRef.current || localText;
      } else if (isActivelyEditing || isEditing) {
        // If we were actually editing, use the contentEditable value as primary source
        finalText = contentEditableValue || textContentRef.current || localText;
      } else {
        // If we weren't actively editing (e.g., accidental blur from double-click), preserve existing content
        finalText = textContentRef.current || contentEditableValue || localText;
      }

      // Handle empty text case - if user leaves it empty, keep it empty (don't revert to placeholder)
      if (
        !finalText ||
        finalText.trim() === '' ||
        finalText === 'Click to edit text...'
      ) {
        // Only allow clearing if we were actually editing
        if (isActivelyEditing || isEditing) {
          finalText = ''; // Keep empty instead of placeholder
        } else {
          // Preserve existing content if we weren't editing
          finalText = textContentRef.current || localText || '';
        }
      }

      // Debug logging to track text saving
      console.log('🔵 TextObject handleBlur:', {
        id,
        contentEditableValue,
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
      // CRITICAL FIX: Never show placeholder for objects that have been edited
      // If finalText is empty but we had content before, keep it empty rather than showing placeholder
      if (finalText === '') {
        // Only show placeholder for truly new objects that have never had content
        const hasHadContent = textContentRef.current || text || localText;
        const hadActualContent =
          hasHadContent && hasHadContent !== 'Click to edit text...';

        if (hadActualContent) {
          // This object has been edited before - keep empty rather than placeholder
          setLocalText('');
        } else {
          // This is a new object that was never edited - can show placeholder
          setLocalText('Click to edit text...');
        }
      } else {
        setLocalText(finalText);
      }

      // Reset editing states
      setIsEditing(false);
      setIsActivelyEditing(false);
      setContentEditableInitialized(false); // Reset for next edit session

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
        eventDetail: e.detail, // Track click count to detect double-clicks
      });

      onClick();

      // CRITICAL FIX: Prevent double-click from accidentally clearing text
      // If this is a double-click and we're not currently editing, be extra careful
      if (e.detail >= 2 && !isEditing) {
        console.log(
          '🟡 TextObject: Double-click detected on non-editing text, preserving content'
        );
        // Ensure we preserve existing content on double-click
        if (
          textContentRef.current &&
          textContentRef.current !== 'Click to edit text...'
        ) {
          setLocalText(textContentRef.current);
        } else if (text && text !== 'Click to edit text...') {
          setLocalText(text);
          textContentRef.current = text;
        }
      }

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
            // For contentEditable, set the innerHTML explicitly
            // This is crucial for clearing placeholder text
            const valueToSet =
              localText === 'Click to edit text...' ? '' : localText || '';

            // CRITICAL: Use innerHTML for contentEditable, not value
            textAreaRef.current.innerHTML = valueToSet;
            textAreaRef.current.focus();

            // Set cursor to end for contentEditable
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(textAreaRef.current);
            range.collapse(false); // Collapse to end
            selection.removeAllRanges();
            selection.addRange(range);

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
        console.log('🚀 handleDrag called in TextObject:', {
          id,
          event: e,
          hasGroupRef: !!groupRef.current,
          hasOnUpdate: !!onUpdate,
          newPosition: e?.target?.object?.position?.toArray(),
        });

        if (!groupRef.current || !onUpdate) return;

        // Get the new position directly like in Cube component
        const newPos = e.target.object.position;
        const newPosition = [newPos.x, newPos.y, newPos.z];

        console.log('🚀 TextObject drag - updating position:', {
          id,
          oldPosition: position,
          newPosition: newPosition,
          positionEqual: isEqual(position, newPosition),
        });

        // IMMEDIATE UPDATE: Update the objects store position immediately for real-time connection updates
        const objectsStore = useObjectsStore.getState();
        const currentObjects = objectsStore.objects;
        const updatedObjects = currentObjects.map((obj) =>
          obj.id === id ? { ...obj, position: newPosition } : obj
        );
        objectsStore.setObjects(updatedObjects);

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
        const updatePayload = {
          // Include type FIRST like in Cube.jsx
          type: 'text',

          // Simple position format with _finalPosition flag to ensure persistence
          position: [newPos.x, newPos.y, newPos.z],
          _finalPosition: false, // No filtering during active movement

          // Include ALL essential properties
          scale: scale,
          text: textContentRef.current || text, // Use most current text
          textStyle: textStyle,
          bulletPointMode: bulletPointMode,
        };

        console.log('🚀 TextObject calling onUpdate with payload:', {
          id,
          updatePayload,
          oldPositionProp: position,
          newPositionArray: [newPos.x, newPos.y, newPos.z],
          positionChanged:
            JSON.stringify(position) !==
            JSON.stringify([newPos.x, newPos.y, newPos.z]),
        });

        onUpdate(id, updatePayload);

        // Store the updated positions in userData for any component that needs it
        if (groupRef.current) {
          // Store current position in multiple places for redundancy and debugging
          const currentPosition = [newPos.x, newPos.y, newPos.z];
          groupRef.current.userData.position = currentPosition;
          groupRef.current.userData.lastPosition = currentPosition;
          groupRef.current.userData.indicatorPosition = indicatorPosArray;
          groupRef.current.userData._transformActive = true; // Mark as being transformed
          groupRef.current.userData.lastDragTime = Date.now(); // Track last update time

          // CRITICAL: Force position directly to handle any potential racing conditions
          groupRef.current.position.set(newPos.x, newPos.y, newPos.z);
        }
      },
      [
        id,
        text,
        scale,
        textStyle,
        bulletPointMode,
        position,
        onUpdate,
        getIndicatorOffset,
        connectionsFromStore,
        stringId,
      ]
    );

    // Add a separate handler for transform end to ensure position persistence
    const handleTransformEnd = useCallback(() => {
      console.log('🏁 TextObject handleTransformEnd called:', { id });

      if (!groupRef.current || !onUpdate) return;

      // Get the current position from the ref
      const currentPos = groupRef.current.position;
      const finalPosition = [currentPos.x, currentPos.y, currentPos.z];

      console.log('🏁 TextObject finalizing position:', {
        id,
        finalPosition,
        positionProp: position,
        positionEqual: isEqual(position, finalPosition),
      });

      // CRITICAL: Always update position at transform end, even if it seems unchanged
      // This ensures the position is properly saved and won't revert

      // Send final position update with flag to ensure persistence
      const finalUpdatePayload = {
        type: 'text',
        position: finalPosition,
        _finalPosition: true, // Flag to bypass filtering in App.jsx
        scale: scale,
        text: textContentRef.current || text,
        textStyle: textStyle,
        bulletPointMode: bulletPointMode,
      };

      // Update the store immediately with timestamp to track most recent position
      const objectsStore = useObjectsStore.getState();
      const currentObjects = objectsStore.objects;
      const updatedObjects = currentObjects.map((obj) =>
        obj.id === id
          ? {
              ...obj,
              position: finalPosition,
              _lastPositionUpdate: Date.now(),
              _finalPosition: true,
            }
          : obj
      );
      objectsStore.setObjects(updatedObjects);

      // Send the update to parent
      console.log(
        '🏁 TextObject sending final position update:',
        finalUpdatePayload
      );
      onUpdate(id, finalUpdatePayload);

      // CRITICAL: Store final position in userData and refs for immediate access
      // Also clear the transform active flag to allow normal updates to resume
      if (groupRef.current) {
        groupRef.current.userData.finalPosition = finalPosition;
        groupRef.current.userData.lastPosition = finalPosition;
        groupRef.current.userData.position = finalPosition;
        groupRef.current.userData.positionUpdated = Date.now();

        // Immediately update the effective position state to force a re-render
        console.log('🎯 Updating effective position from handleTransformEnd:', {
          id,
          finalPosition,
        });
        setEffectivePosition([...finalPosition]); // Force new array reference

        // Create a delay before clearing transform active to ensure position update completes
        setTimeout(() => {
          if (groupRef.current) {
            groupRef.current.userData._transformActive = false;
            console.log('🏁 TextObject transform active flag cleared:', {
              id,
              finalPosition,
            });
          }
        }, 100);

        // CRITICAL: Force position again to ensure it's set correctly
        groupRef.current.position.set(
          finalPosition[0],
          finalPosition[1],
          finalPosition[2]
        );
      }

      // Add a safety timeout to double-check position after a delay
      // This ensures the position is correct even if there are racing conditions
      setTimeout(() => {
        if (groupRef.current && onUpdate) {
          const currentPos = groupRef.current.position;
          const currentPosArray = [currentPos.x, currentPos.y, currentPos.z];

          console.log('🏁 TextObject delayed position check:', {
            id,
            finalPosition,
            currentPosArray,
            equal: isEqual(finalPosition, currentPosArray),
          });

          // If position somehow changed, force another update
          if (!isEqual(finalPosition, currentPosArray)) {
            console.log('⚠️ Position mismatch detected, forcing final update', {
              id,
            });

            // Update position again with force flag
            const forceUpdatePayload = {
              type: 'text',
              position: currentPosArray,
              _finalPosition: true,
              _forceUpdate: true,
              scale: scale,
              text: textContentRef.current || text,
              textStyle: textStyle,
              bulletPointMode: bulletPointMode,
            };

            onUpdate(id, forceUpdatePayload);
          }
        }
      }, 200);
    }, [id, text, scale, textStyle, bulletPointMode, position, onUpdate]);

    // --- Update handleScale to update visualScale immediately and adjust height dynamically ---
    const handleScale = (e) => {
      if (!e.target || !e.target.object) return;

      console.log('📏 TextObject handleScale called:', {
        id,
        currentVisualScale: visualScale,
        meshScale: e.target.object.scale.toArray(),
      });

      // Get scale values from the invisible mesh
      const newWidth = e.target.object.scale.x;
      const newHeight = e.target.object.scale.y;

      // Check if width changed significantly to trigger height recalculation
      const widthChanged = Math.abs(newWidth - visualScale[0]) > 0.1;

      let finalScale = [
        newWidth,
        newHeight,
        visualScale[2], // Keep Z scale unchanged
      ];

      console.log('📏 Scale calculation:', {
        id,
        newWidth,
        newHeight,
        oldWidth: visualScale[0],
        oldHeight: visualScale[1],
        widthChanged,
        finalScale,
      });

      // If width changed, recalculate height based on text content
      if (widthChanged && textAreaRef.current) {
        console.log(
          '📏 Width changed, recalculating height for text wrapping:',
          {
            id,
            oldWidth: visualScale[0],
            newWidth,
            oldHeight: visualScale[1],
          }
        );

        // Temporarily update the container width to measure text height
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.visibility = 'hidden';
        tempContainer.style.width = `${newWidth * 5.3 * 30}px`; // Match container calculation
        tempContainer.style.fontSize = textStyle.fontSize
          ? `${textStyle.fontSize}px`
          : '32px';
        tempContainer.style.fontFamily = 'Arial, sans-serif';
        tempContainer.style.fontWeight = textStyle.fontWeight || 'normal';
        tempContainer.style.fontStyle = textStyle.fontStyle || 'normal';
        tempContainer.style.padding = '8px';
        tempContainer.style.lineHeight = '1.4';
        tempContainer.style.whiteSpace = 'pre-wrap';
        tempContainer.style.wordWrap = 'break-word';
        tempContainer.innerHTML =
          textContentRef.current || localText || text || '';

        document.body.appendChild(tempContainer);
        const measuredHeight = tempContainer.scrollHeight;
        document.body.removeChild(tempContainer);

        // Convert pixel height back to 3D scale units
        const conversionFactor = 30;
        const paddingAdjustment = 16;
        const calculatedHeight =
          (measuredHeight + paddingAdjustment) / (1.3 * conversionFactor);
        const minHeight = 2; // Minimum height
        const dynamicHeight = Math.max(minHeight, calculatedHeight);

        console.log('📏 Calculated new height:', {
          id,
          measuredPixelHeight: measuredHeight,
          calculatedHeight,
          dynamicHeight,
          minHeight,
        });

        finalScale = [newWidth, dynamicHeight, visualScale[2]];
      }

      // Update local visual scale immediately for real-time feedback
      console.log('📏 Updating visualScale:', {
        id,
        oldVisualScale: visualScale,
        newVisualScale: finalScale,
      });

      setVisualScale(finalScale);
      setScale(finalScale); // Also update store (triggers DB update)
      
      // Store scale in userData for persistent tracking
      if (groupRef.current) {
        groupRef.current.userData.currentScale = finalScale;
        groupRef.current.userData.finalScale = finalScale;
        groupRef.current.userData.scaleUpdated = Date.now();
      }

      // Update world matrix for connections, etc.
      const worldInfo = updateWorldMatrix();

      // CRITICAL FIX: Use textContentRef.current for the most up-to-date text
      const currentText = textContentRef.current || localText || text || '';

      if (worldInfo && onUpdate) {
        // Clear any pending resize update timeout
        if (resizeUpdateTimeoutRef.current) {
          clearTimeout(resizeUpdateTimeoutRef.current);
        }

        const updatePayload = {
          type: 'text',
          id, // Include ID for safety
          position,
          scale: finalScale, // Use the final calculated scale
          text: currentText, // Use the most current text
          textStyle,
          bulletPointMode,
          worldPosition: worldInfo.worldPos,
          indicatorPosition: worldInfo.indicatorPos,
          planeData: {
            worldMatrix: worldInfo.matrix,
            position: [...position],
            scale: [...finalScale],
            offset: [0, finalScale[1] * 0.65, 0],
          },
          isResizing: true,
          lastResizeTime: Date.now(),
        };

        console.log('📏 Saving resized text object to database:', {
          id,
          newScale: finalScale,
          text: currentText.substring(0, 50) + '...',
          widthChanged,
        });

        // Throttle database updates during resize - update after 300ms of no changes
        resizeUpdateTimeoutRef.current = setTimeout(() => {
          console.log('📏 Executing deferred scale update to database:', {
            id,
            scale: finalScale
          });
          
          // Force scale update to local store
          const objectsStore = useObjectsStore.getState();
          const updatedObjects = objectsStore.objects.map((obj) =>
            obj.id === id
              ? { 
                  ...obj, 
                  scale: finalScale,
                  _lastScaleUpdate: Date.now()
                }
              : obj
          );
          objectsStore.setObjects(updatedObjects);
          
          // Send to parent/database with force flags to ensure it persists
          onUpdate(id, {
            ...updatePayload,
            _forceUpdate: true,
            _finalScale: true
          });
        }, 300);
      }
    };

    // Keyboard handling with shortcuts
    const handleKeyDown = (e) => {
      // Handle bullet points
      if (e.key === 'Enter' && bulletPointMode) {
        e.preventDefault();
        const el = e.target;
        
        // Get the current HTML content
        const currentHTML = el.innerHTML;
        
        // Find cursor position and surrounding content
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(el);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        const cursorPosition = preCaretRange.toString().length;
        
        // Split HTML content at cursor position
        // This is more complex with HTML, we'll use a simple approach
        let textBeforeCursor = currentHTML.substring(0, cursorPosition);
        let textAfterCursor = currentHTML.substring(cursorPosition);
        
        // Create new bullet point
        const newHTML = textBeforeCursor + '<br>• ' + textAfterCursor;
        
        // Update the HTML content
        el.innerHTML = newHTML;
        
        // Move cursor after the new bullet point
        // Need to find the new position in DOM
        setTimeout(() => {
          // Find the text node containing the bullet point
          const textNodes = [];
          const walker = document.createTreeWalker(
            el,
            NodeFilter.SHOW_TEXT,
            null,
            false
          );
          
          let node;
          while ((node = walker.nextNode())) {
            textNodes.push(node);
          }
          
          // Find node containing our new bullet point
          let bulletNode = null;
          let bulletOffset = 0;
          
          for (let i = 0; i < textNodes.length; i++) {
            if (textNodes[i].textContent.includes('• ')) {
              const bulletIndex = textNodes[i].textContent.indexOf('• ');
              if (bulletIndex !== -1) {
                bulletNode = textNodes[i];
                bulletOffset = bulletIndex + 2; // Position after the bullet and space
                break;
              }
            }
          }
          
          // Set cursor position after the last inserted bullet
          if (bulletNode) {
            const newRange = document.createRange();
            newRange.setStart(bulletNode, bulletOffset);
            newRange.setEnd(bulletNode, bulletOffset);
            
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }, 0);
        
        // Update local state and ref
        setLocalText(el.innerHTML);
        textContentRef.current = el.innerHTML;
        
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
    const handleStyleChange = useCallback(
      (newStyle) => {
        console.log('🎨 TextObject handleStyleChange called:', {
          id,
          newStyle,
          hasTextSelection,
          selectedText,
        });
        
        // Define applyStyleToSelection function inside useCallback
        const applyStyleToSelectionInternal = (style, start, end) => {
          console.log('🎨 Applying style to selection:', { style, start, end });
    
          if (!textAreaRef.current) {
            console.log('❌ No contentEditable ref available');
            return;
          }
    
          // Store the current selection state from our state
          const currentSelection = selectedText;
          if (
            !currentSelection ||
            !currentSelection.range ||
            !currentSelection.selection
          ) {
            console.log('❌ No stored selection available');
            return;
          }
    
          // Restore focus and selection to the contentEditable
          textAreaRef.current.focus();
    
          // Restore the selection
          try {
            currentSelection.selection.removeAllRanges();
            currentSelection.selection.addRange(currentSelection.range);
            console.log('✅ Restored selection focus');
          } catch (error) {
            console.log('❌ Could not restore selection:', error);
            return;
          }
    
          // Apply styles using document.execCommand
          // Implementation of style application would be here
          // This varies based on what styles are being applied
          if (style.fontWeight === 'bold') {
            document.execCommand('bold', false, null);
          } else if (style.fontStyle === 'italic') {
            document.execCommand('italic', false, null);
          }
          // Add other style applications as needed
          
          // Update the style state to reflect changes
          setTextStyle((prev) => ({ ...prev, ...style }));
        };

        if ('bulletPointMode' in newStyle) {
          setBulletPointMode(newStyle.bulletPointMode);
          
          // If turning bullet mode ON
          if (newStyle.bulletPointMode) {
            // If text is empty, just add a bullet point
            if (!text || text.trim() === '' || text === 'Click to edit text...') {
              setText('• ');
              
              // Focus the text area and place cursor after bullet point
              setTimeout(() => {
                if (textAreaRef.current) {
                  textAreaRef.current.focus();
                  
                  // Place cursor after the bullet point
                  const selection = window.getSelection();
                  const range = document.createRange();
                  
                  // Find the text node containing the bullet point
                  const textNodes = [];
                  const walker = document.createTreeWalker(
                    textAreaRef.current,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                  );
                  
                  let node;
                  while ((node = walker.nextNode())) {
                    textNodes.push(node);
                  }
                  
                  // Find node containing bullet point
                  for (let i = 0; i < textNodes.length; i++) {
                    if (textNodes[i].textContent.includes('• ')) {
                      range.setStart(textNodes[i], textNodes[i].textContent.indexOf('• ') + 2);
                      range.setEnd(textNodes[i], textNodes[i].textContent.indexOf('• ') + 2);
                      selection.removeAllRanges();
                      selection.addRange(range);
                      break;
                    }
                  }
                }
              }, 0);
            } 
            // If text already exists but doesn't start with a bullet
            else if (!text.trim().startsWith('• ')) {
              setText('• ' + text);
              
              // If currently editing, update the contentEditable element
              if (isEditing && textAreaRef.current) {
                textAreaRef.current.innerHTML = '• ' + textAreaRef.current.innerHTML;
              }
            }
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
            applyStyleToSelectionInternal(actualStyleChanges, start, end);
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
      },
      [id, updateDatabase, hasTextSelection, selectedText, 
       setText, setBulletPointMode, text, isEditing, 
       autoResizeTextArea, setTextStyle]
    );

    // Text selection handlers
    const handleTextSelection = () => {
      if (!textAreaRef.current) {
        console.log('📝 No contentEditable ref available for text selection');
        return;
      }

      // Only process if contentEditable is focused
      if (document.activeElement !== textAreaRef.current) {
        console.log(
          '📝 ContentEditable not focused, skipping selection handling'
        );
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        console.log('📝 No text selection available');
        setSelectedText({ start: 0, end: 0 });
        setHasTextSelection(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const selectedText = selection.toString();
      const hasSelection = selectedText.length > 0;

      // For contentEditable, we need to store the actual range and selection objects
      setSelectedText({
        start: range.startOffset,
        end: range.endOffset,
        range: range,
        selection: selection,
      });
      setHasTextSelection(hasSelection);

      console.log('📝 Text selection changed:', {
        id,
        selectedText,
        hasSelection,
        rangeStartOffset: range.startOffset,
        rangeEndOffset: range.endOffset,
        contentEditableFocused: document.activeElement === textAreaRef.current,
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

    // Text styling is now handled inside handleStyleChange useCallback

    // Enhanced stylesheet to apply text styles
    const getTextAreaStyle = () => ({
      width: '100%',
      height: contentHeight,
      minHeight: '2em', // Start with small height, will expand
      background: 'rgb(255, 255, 255)',
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
      opacity: showTransform || showResizeControls ? 0.5 : 1, // Add opacity when controls are active
      transition: 'opacity 0.2s ease', // Smooth opacity transition
    });

    // Effect to synchronize invisible mesh scale with visualScale
    useEffect(() => {
      if (resizeMeshRef.current) {
        console.log('🔧 Syncing resize mesh scale:', {
          id,
          visualScale,
          oldMeshScale: resizeMeshRef.current.scale.toArray(),
        });
        resizeMeshRef.current.scale.set(
          visualScale[0],
          visualScale[1],
          visualScale[2]
        );

        // Ensure the mesh is positioned at the center of the group
        resizeMeshRef.current.position.set(0, 0, 0);
      }
    }, [visualScale, id]);

    // Initialize resize mesh on mount
    useEffect(() => {
      if (resizeMeshRef.current) {
        console.log('🔧 Initializing resize mesh:', {
          id,
          initialScale: visualScale,
        });
        resizeMeshRef.current.scale.set(
          visualScale[0],
          visualScale[1],
          visualScale[2]
        );
        resizeMeshRef.current.position.set(0, 0, 0);
      }
    }, [id, visualScale]); // Include visualScale to fix lint

    // Combined scale-related effects
    useEffect(() => {
      originalScaleRef.current = [...visualScale];

      // CRITICAL: Always keep group scale at (1,1,1) to prevent text scaling
      if (groupRef.current) {
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

        // CRITICAL: Ensure group scale is always (1,1,1) to prevent text scaling
        if (!groupRef.current.scale.equals(new THREE.Vector3(1, 1, 1))) {
          groupRef.current.scale.set(1, 1, 1);
        }

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

    // Cleanup effect to save any pending changes on unmount
    useEffect(() => {
      // Store a reference to the current group ref inside the effect
      // to avoid the lint warning about refs in cleanup functions
      const currentGroupRef = groupRef.current;

      return () => {
        // Clear any pending timeouts
        if (textUpdateTimeoutRef.current) {
          clearTimeout(textUpdateTimeoutRef.current);
        }
        if (resizeUpdateTimeoutRef.current) {
          clearTimeout(resizeUpdateTimeoutRef.current);
        }

        // Get the most current position - either from userData or props
        let finalPosition = position;

        if (currentGroupRef?.userData?.finalPosition) {
          finalPosition = currentGroupRef.userData.finalPosition;
        } else if (currentGroupRef?.position) {
          const pos = currentGroupRef.position;
          finalPosition = [pos.x, pos.y, pos.z];
        }

        // Save final state if there are unsaved changes or position changed
        if (onUpdate) {
          console.log('🔄 Component unmounting - saving final state:', {
            id,
            text: textContentRef.current || text,
            finalPosition,
            propPosition: position,
            positionChanged: !isEqual(finalPosition, position),
          });

          onUpdate(id, {
            type: 'text',
            id,
            position: finalPosition,
            _finalPosition: true,
            _forceUpdate: true,
            scale,
            text: textContentRef.current || text,
            textStyle,
            bulletPointMode,
            lastEditTime: Date.now(),
          });

          // Also update the store directly as a safety measure
          const objectsStore = useObjectsStore.getState();
          const updatedObjects = objectsStore.objects.map((obj) =>
            obj.id === id
              ? {
                  ...obj,
                  position: finalPosition,
                  _lastPositionUpdate: Date.now(),
                }
              : obj
          );
          objectsStore.setObjects(updatedObjects);
        }
      };
    }, [id, onUpdate, position, scale, textStyle, bulletPointMode, text]);

    // Helper function to get the correct position to use for the group
    const getEffectivePosition = useCallback(() => {
      // If we have a recent finalPosition that should override the prop, use it
      if (
        groupRef.current?.userData?.finalPosition &&
        groupRef.current?.userData?.positionUpdated &&
        Date.now() - groupRef.current.userData.positionUpdated < 5000
      ) {
        const finalPos = groupRef.current.userData.finalPosition;
        console.log('🎯 Using finalPosition for group:', {
          id,
          finalPos,
          propPos: position,
          timeSince: Date.now() - groupRef.current.userData.positionUpdated,
        });
        return finalPos;
      }

      // Check if store has a more recent position than props
      const objectsStore = useObjectsStore.getState();
      const storeObject = objectsStore.objects.find((obj) => obj.id === id);
      if (
        storeObject?.position &&
        !isEqual(storeObject.position, position) &&
        storeObject._lastPositionUpdate &&
        Date.now() - storeObject._lastPositionUpdate < 5000
      ) {
        console.log('🎯 Using store position for group:', {
          id,
          storePos: storeObject.position,
          propPos: position,
          timeSince: Date.now() - storeObject._lastPositionUpdate,
        });
        return storeObject.position;
      }

      // Otherwise use the prop position
      return position || [0, 0, 0];
    }, [position, id]);

    // State to track the current effective position for the group
    const [effectivePosition, setEffectivePosition] = useState(
      () => position || [0, 0, 0]
    );

    // Effect to update effective position when needed
    useEffect(() => {
      // Skip position updates if transform is active to prevent snap-back
      if (groupRef.current?.userData?._transformActive) {
        console.log(
          '⚠️ Skipping effectivePosition update during active transform:',
          id
        );
        return;
      }

      const newPos = getEffectivePosition();

      // Only update if the position actually changed
      if (!isEqual(effectivePosition, newPos)) {
        console.log('🔄 Updating effective position:', {
          id,
          oldPos: effectivePosition,
          newPos,
          reason: groupRef.current?.userData?.finalPosition
            ? 'finalPosition'
            : groupRef.current?.userData?.position
            ? 'userData'
            : 'propPosition',
        });

        // Force directly setting the THREE.js object position to ensure consistency
        if (groupRef.current) {
          groupRef.current.position.set(newPos[0], newPos[1], newPos[2]);
        }

        setEffectivePosition(newPos);
      }
    }, [position, getEffectivePosition, effectivePosition, id]);

    // Enhanced render with _transformActive flag in userData
    return (
      <>
        <group
          ref={groupRef}
          position={effectivePosition} // Use state-managed position
          userData={{
            type: 'textObject',
            id: stringId,
            objectId: stringId,
            isTextEditing: isActivelyEditing,
            containerDimensions: containerDimensionsRef.current,
            indicatorOffset: getIndicatorOffset(),
            face: 'top',
            isMoving: isMoving,
            _transformActive: isMoving || showTransform,
            initialPosition: position ? [...position] : null,
          }}
        >
          {/* Invisible mesh for resize controls - positioned same as text container */}
          <mesh ref={resizeMeshRef} visible={false}>
            <boxGeometry args={[1, 1, 0.1]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>

          <Html
            transform
            position={[0, 0, 0.1]}
            center
            occlude={!showTransform && !showResizeControls}
          >
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
                <div
                  ref={(el) => {
                    textAreaRef.current = el;
                    // Only set innerHTML on first mount or when switching to edit mode
                    if (el && !contentEditableInitialized) {
                      let value =
                        textContentRef.current || localText || text || '';

                      // Only treat as empty if it's placeholder text
                      if (value === 'Click to edit text...') {
                        value = '';
                      }

                      console.log(
                        '📝 Setting initial contentEditable innerHTML:',
                        {
                          id,
                          value,
                          sources: {
                            ref: textContentRef.current,
                            local: localText,
                            store: text,
                          },
                        }
                      );

                      el.innerHTML = value;
                      setContentEditableInitialized(true);
                    }

                    // ADDITIONAL SAFEGUARD: If contentEditable is accidentally cleared but we have content,
                    // restore it immediately (this handles rapid clicking race conditions)
                    if (
                      el &&
                      contentEditableInitialized &&
                      (!el.innerHTML || el.innerHTML.trim() === '')
                    ) {
                      const savedContent = textContentRef.current || localText;
                      if (
                        savedContent &&
                        savedContent !== 'Click to edit text...'
                      ) {
                        console.log(
                          '🔧 Restoring accidentally cleared contentEditable:',
                          {
                            id,
                            savedContent: savedContent.substring(0, 50) + '...',
                          }
                        );
                        el.innerHTML = savedContent;
                      }
                    }
                  }}
                  contentEditable={true}
                  suppressContentEditableWarning={true}
                  className="content-editable-placeholder"
                  onInput={(e) => {
                    // Handle input changes for contentEditable
                    const newText = e.target.innerHTML;
                    console.log('📝 ContentEditable input changed:', {
                      id,
                      newText,
                      previousLocal: localText,
                      ref: textContentRef.current,
                    });

                    // Update local state and ref
                    setLocalText(newText);
                    textContentRef.current = newText;

                    // Clear any pending save timeout
                    if (textUpdateTimeoutRef.current) {
                      clearTimeout(textUpdateTimeoutRef.current);
                    }

                    // Debounced save to database (save after 1 second of no typing)
                    textUpdateTimeoutRef.current = setTimeout(() => {
                      console.log(
                        '💾 Auto-saving contentEditable changes to database'
                      );
                      updateDatabase();
                    }, 1000);

                    // Auto-resize
                    autoResizeTextArea();
                  }}
                  onBlur={handleBlur}
                  style={getTextAreaStyle()}
                  onKeyDown={handleKeyDown}
                  data-placeholder={
                    bulletPointMode ? '• ' : 'Click to edit text...'
                  }
                  onClick={(e) => {
                    // Just prevent the click from bubbling
                    e.stopPropagation();

                    // Ensure contentEditable is focused for text selection
                    if (textAreaRef.current) {
                      textAreaRef.current.focus();
                      console.log('📝 ContentEditable clicked and focused');

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
                      const selection = window.getSelection();
                      if (selection && selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        if (!range.collapsed) {
                          console.log('📝 Text selection during mouse move:', {
                            selectedText: selection.toString(),
                          });
                        }
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
                    console.log(
                      '📝 ContentEditable focused - pausing orbit controls'
                    );
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
                    background: 'white', // Slightly different for display mode
                  }}
                  dangerouslySetInnerHTML={{
                    __html: (() => {
                      // Priority: textContentRef > localText > store text
                      // Only show placeholder if ALL sources are empty or contain placeholder
                      const contentRef = textContentRef.current;
                      const storeText = text;
                      const currentLocal = localText;

                      if (
                        contentRef &&
                        contentRef !== 'Click to edit text...'
                      ) {
                        return contentRef;
                      }
                      if (
                        currentLocal &&
                        currentLocal !== 'Click to edit text...'
                      ) {
                        return currentLocal;
                      }
                      if (storeText && storeText !== 'Click to edit text...') {
                        return storeText;
                      }

                      // CRITICAL: Check if this object has ever been edited
                      // If any source indicates it was edited, show empty content instead of placeholder
                      const hasHadContent =
                        contentRef ||
                        storeText ||
                        (currentLocal &&
                          currentLocal !== 'Click to edit text...');
                      const wasEdited =
                        hasHadContent &&
                        hasHadContent !== 'Click to edit text...';

                      if (wasEdited) {
                        // Object was edited before - show empty content instead of placeholder
                        return '';
                      }

                      return 'Click to edit text...';
                    })(),
                  }}
                />
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
        {/* Camera distance calculation for dynamic transform control sizing */}
        {(() => {
          // Calculate distance from camera to object for dynamic control sizing
          const getTransformControlSize = () => {
            if (!groupRef.current || !camera) return 0.5; // Default size

            const objectPosition = new THREE.Vector3();
            groupRef.current.getWorldPosition(objectPosition);
            const cameraDistance = camera.position.distanceTo(objectPosition);

            // Scale transform controls based on camera distance
            // Closer = smaller controls, further = larger controls
            // Base size of 0.5, with scaling factor based on distance
            const baseSize = 0.5;
            const scaleFactor = Math.max(
              0.3,
              Math.min(2.0, cameraDistance / 20)
            );
            return baseSize * scaleFactor;
          };

          const transformControlSize = getTransformControlSize();

          return (
            <>
              {/* Transform controls - Fixed to match Cube pattern */}
              {console.log('🔧 Transform Controls Render Check:', {
                selected,
                showTransform,
                hasGroupRef: !!groupRef.current,
                shouldRender: selected && showTransform && groupRef.current,
                cameraDistance:
                  groupRef.current && camera
                    ? camera.position.distanceTo(
                        (() => {
                          const pos = new THREE.Vector3();
                          groupRef.current.getWorldPosition(pos);
                          return pos;
                        })()
                      )
                    : 'N/A',
                transformControlSize,
              })}
              {selected && showTransform && groupRef.current && (
                <TransformControls
                  ref={transformRef}
                  object={groupRef.current}
                  onObjectChange={handleDrag}
                  onStart={() => {
                    console.log(
                      '🔄 Transform controls started for TextObject:',
                      id
                    );

                    // Mark object as actively being transformed
                    if (groupRef.current) {
                      groupRef.current.userData._transformActive = true;

                      // Store current position as the start position to ensure consistency
                      const currentPos = groupRef.current.position;
                      const currentPosArray = [
                        currentPos.x,
                        currentPos.y,
                        currentPos.z,
                      ];
                      groupRef.current.userData.startTransformPosition =
                        currentPosArray;

                      console.log(
                        '🔄 Transform started - stored current position:',
                        {
                          id,
                          startPosition: currentPosArray,
                        }
                      );
                    }

                    // Get latest position from store as a fallback
                    const objectsStore = useObjectsStore.getState();
                    const storeObject = objectsStore.objects.find(
                      (obj) => obj.id === id
                    );

                    if (groupRef.current && storeObject?.position) {
                      const storePos = storeObject.position;
                      const currentPos = groupRef.current.position.toArray();

                      // Only update from store if significantly different
                      if (
                        !isEqual(storePos, currentPos) &&
                        !storePos.every(
                          (val, idx) => Math.abs(val - currentPos[idx]) < 0.1
                        )
                      ) {
                        console.log(
                          '🔄 Significant position difference detected, syncing with store:',
                          {
                            id,
                            storePos,
                            currentPos,
                          }
                        );
                        groupRef.current.position.set(
                          storePos[0],
                          storePos[1],
                          storePos[2]
                        );
                      }
                    }
                  }}
                  onMouseDown={() => {
                    if (window.orbitControls) {
                      window.orbitControls.enabled = false;
                    }
                    // Set transform flag on mouse down
                    if (groupRef.current) {
                      groupRef.current.userData._transformActive = true;

                      // Capture current position as starting position
                      const pos = groupRef.current.position;
                      groupRef.current.userData.startDragPosition = [
                        pos.x,
                        pos.y,
                        pos.z,
                      ];
                    }
                    onTransformStart?.(id);
                  }}
                  onMouseUp={() => {
                    if (window.orbitControls) {
                      window.orbitControls.enabled = true;
                    }

                    // Capture current position before any other operations
                    const currentPos = groupRef.current?.position;
                    const finalPos = currentPos
                      ? [currentPos.x, currentPos.y, currentPos.z]
                      : null;

                    console.log(
                      '🏁 Transform controls mouseUp - capturing final position:',
                      {
                        id,
                        finalPos,
                        propPos: position,
                      }
                    );

                    // Run transform end handler first to finalize position
                    handleTransformEnd();

                    // Then notify parent after our internal update completes
                    onTransformEnd?.(id);

                    // Double safety - check again after a delay to ensure position stuck
                    setTimeout(() => {
                      if (groupRef.current && finalPos) {
                        const newPos = groupRef.current.position;
                        const newPosArray = [newPos.x, newPos.y, newPos.z];

                        if (!isEqual(finalPos, newPosArray)) {
                          console.log(
                            '⚠️ Position changed after transform end, forcing correction:',
                            {
                              id,
                              finalPos,
                              currentPos: newPosArray,
                            }
                          );

                          // Force position back to final position
                          groupRef.current.position.set(
                            finalPos[0],
                            finalPos[1],
                            finalPos[2]
                          );

                          // Update store
                          const objectsStore = useObjectsStore.getState();
                          const updatedObjects = objectsStore.objects.map(
                            (obj) =>
                              obj.id === id
                                ? { ...obj, position: finalPos }
                                : obj
                          );
                          objectsStore.setObjects(updatedObjects);

                          // Send update to parent
                          if (onUpdate) {
                            onUpdate(id, {
                              type: 'text',
                              position: finalPos,
                              _finalPosition: true,
                              _forceUpdate: true,
                              text: textContentRef.current || text,
                              scale: scale,
                              textStyle: textStyle,
                              bulletPointMode: bulletPointMode,
                            });
                          }
                        }
                      }
                    }, 100);
                  }}
                  mode="translate"
                  space="world"
                  size={transformControlSize}
                />
              )}
              {/* Resize transform controls - using invisible mesh for scale operations */}
              {console.log('🔧 Resize Controls Render Check:', {
                id,
                selected,
                showResizeControls,
                hasGroupRef: !!groupRef.current,
                hasResizeMeshRef: !!resizeMeshRef.current,
                resizeMeshScale: resizeMeshRef.current
                  ? resizeMeshRef.current.scale.toArray()
                  : null,
                visualScale,
                shouldRender:
                  selected && showResizeControls && resizeMeshRef.current,
                transformControlSize,
              })}
              {selected && showResizeControls && resizeMeshRef.current && (
                <TransformControls
                  object={resizeMeshRef.current}
                  mode="scale"
                  size={transformControlSize}
                  onObjectChange={(e) => {
                    // Real-time updates during resize drag
                    if (e && e.target && e.target.object) {
                      console.log('📏 onObjectChange - real-time resize:', {
                        id,
                        meshScale: e.target.object.scale.toArray(),
                        currentVisualScale: visualScale,
                      });

                      const newScale = [
                        e.target.object.scale.x,
                        e.target.object.scale.y,
                        visualScale[2], // Keep Z scale unchanged
                      ];

                      // Update visual scale immediately for real-time feedback
                      setVisualScale(newScale);

                      console.log('📏 Updated visualScale during drag:', {
                        id,
                        oldScale: visualScale,
                        newScale,
                      });

                      // Store the updated scale in userData for immediate access
                      if (groupRef.current) {
                        groupRef.current.userData.currentScale = newScale;
                        groupRef.current.userData.finalScale = newScale;
                        groupRef.current.userData.scaleUpdated = Date.now();
                      }
                    }
                  }}
                  onChange={(e) => {
                    // Called on every frame during resize - this handles the final update
                    handleScale(e);
                  }}
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
                    
                    // Capture final scale values
                    const finalScale = [...visualScale]; // Use current visual scale
                    
                    console.log('📏 Resize complete - final scale:', {
                      id,
                      finalScale,
                      resizeMeshScale: resizeMeshRef.current?.scale.toArray()
                    });
                    
                    // Ensure the scale is saved to the store immediately
                    const objectsStore = useObjectsStore.getState();
                    const updatedObjects = objectsStore.objects.map((obj) =>
                      obj.id === id
                        ? { 
                            ...obj, 
                            scale: finalScale,
                            _lastScaleUpdate: Date.now(),
                            _finalScale: true
                          }
                        : obj
                    );
                    objectsStore.setObjects(updatedObjects);
                    
                    // Force an immediate update to the database to ensure persistence
                    if (onUpdate) {
                      const worldInfo = updateWorldMatrix();
                      const finalUpdatePayload = {
                        type: 'text',
                        position,
                        scale: finalScale,
                        _finalScale: true,
                        _forceUpdate: true,
                        text: textContentRef.current || text,
                        textStyle,
                        bulletPointMode,
                        worldPosition: worldInfo?.worldPos,
                        indicatorPosition: worldInfo?.indicatorPos,
                        lastResizeTime: Date.now()
                      };
                      
                      console.log('📏 Sending final scale update to database:', {
                        id,
                        scale: finalScale
                      });
                      
                      onUpdate(id, finalUpdatePayload);
                    }
                    
                    // Notify parent
                    onResizeEnd?.(id);
                    
                    // Double safety - check again after a delay to ensure scale stuck
                    setTimeout(() => {
                      // Update store once more to be certain
                      const objectsStore = useObjectsStore.getState();
                      const updatedObjects = objectsStore.objects.map((obj) =>
                        obj.id === id
                          ? { 
                              ...obj, 
                              scale: finalScale,
                              _lastScaleUpdate: Date.now()
                            }
                          : obj
                      );
                      objectsStore.setObjects(updatedObjects);
                    }, 100);
                  }}
                  showX={true}
                  showY={true}
                  showZ={false}
                  space="local"
                />
              )}
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
              )}
            </>
          );
        })()}
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Only re-render if critical props change

    // Deep compare positions to ensure we catch position array changes
    const positionsEqual =
      Array.isArray(prevProps.position) &&
      Array.isArray(nextProps.position) &&
      prevProps.position.length === nextProps.position.length &&
      prevProps.position.every(
        (val, idx) => Math.abs(val - nextProps.position[idx]) < 0.001
      );

    return (
      prevProps.id === nextProps.id &&
      positionsEqual &&
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
