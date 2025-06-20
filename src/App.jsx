import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, SMAA } from '@react-three/postprocessing';
import './App.css';

// Component imports
import CustomCamera from './components/CustomCamera';
import UIOverlay from './components/UIOverlay';
import RealTimeConnectionUpdater from './components/RealTimeConnectionUpdater';
import ObjectRenderer from './components/ObjectRenderer';
import ConnectionsRenderer from './components/ConnectionsRenderer';
import CellBoundaryRenderer from './components/CellBoundaryRenderer';

// Hook imports
import { useAuthState } from './hooks/useAuthState';
import { useSpaceManager } from './hooks/useSpaceManager';
import { useObjects } from './hooks/useObjects';
import { useIndicators } from './hooks/useIndicators';
import { useSpatialManager } from './hooks/useSpatialManager';
import { useCentralizedBroadcastManager } from './hooks/useCentralizedBroadcastManager';
import { useConnections } from './hooks/useConnections';
import {
  useObjectsStore,
  useConnectionStore,
  usePlaneStore,
  useCubeStore,
  useDodecahedronStore,
} from './stores';

// Utility imports
import {
  handleObjectMove,
  handleObjectUpdate,
} from './utils/objectUpdateHandlers';
import { handleFaceIndicatorClick } from './utils/faceIndicatorUtils';

import { signInUser } from './services/authService';
import { subscribeToSpatialObjects } from './services/spatialObjectsService';
import { CELL_SIZE } from './services/spatialPartitioning'; // Import CELL_SIZE constant
import { setIsInitialLoading as setGlobalInitialLoading } from './utils/loadingState';
import { db } from './firebase';
import isEqual from 'lodash/isEqual';
import { initWebRTC } from './services/webRservice';
import { initAnimationSystem } from './utils/animationUtils';

/**
 * Main application component
 */
const App = () => {
  // Base state
  const [backgroundColor] = useState('white');
  const [publicSpaceReady, setPublicSpaceReady] = useState(false);
  const [isLookingUpPublicSpace, setIsLookingUpPublicSpace] = useState(false);
  const [currentSpaceOwner, setCurrentSpaceOwner] = useState(null);
  const cameraRef = useRef();
  const intentionalSpaceChangeRef = useRef(false); // Get objects from store with safety check
  const objectsFromStore = useObjectsStore((state) => state.objects);
  const objects = useMemo(() => {
    return Array.isArray(objectsFromStore) ? objectsFromStore : [];
  }, [objectsFromStore]);
  const setObjects = useObjectsStore((state) => state.setObjects);
  const isRecentlyDeleted = useObjectsStore((state) => state.isRecentlyDeleted);
  const setIsInitialLoading = useObjectsStore(
    (state) => state.setIsInitialLoading
  ); // Plane store
  const setPlaneShowTextStyleUI = usePlaneStore(
    (state) => state.setPlaneShowTextStyleUI
  );
  const setPlaneShowHeaderStyleUI = usePlaneStore(
    (state) => state.setPlaneShowHeaderStyleUI
  );
  // Cube store
  const setCubeShowHeaderTextStyleUI = useCubeStore(
    (state) => state.setCubeShowHeaderTextStyleUI
  );

  // Dodecahedron store
  const setDodecahedronShowStyleMenu = useDodecahedronStore(
    (state) => state.setDodecahedronShowStyleMenu
  );
  const setDodecahedronShowFaceTextStyleMenu = useDodecahedronStore(
    (state) => state.setDodecahedronShowFaceTextStyleMenu
  );
  // Auth and space hooks
  const { user, isAuthReady, isCheckingUrlAuth } = useAuthState();
  const { currentSpaceId } = useSpaceManager({
    user,
    intentionalSpaceChangeRef,
  });
  // Calculate effective space ID early to avoid circular dependency
  const publicSpaceId = window.publicAccessSpace;
  const effectiveSpaceId = publicSpaceId || currentSpaceId;

  // Calculate access early for spatial manager
  const canViewSpace = !!(
    user ||
    (publicSpaceId && (currentSpaceOwner || publicSpaceReady))
  );

  // Spatial partitioning hook with object change handler
  const handleSpatialObjectChange = useCallback(
    (change) => {
      if (change.source === 'cell-unload') {
        // Remove objects when their cells are unloaded
        setObjects((prev) => {
          const filtered = prev.filter(
            (obj) => obj.id.toString() !== change.id.toString()
          );
          return filtered;
        });
      }
    },
    [setObjects]
  );
  const {
    loadedCells,
    isInitialized: isSpatialInitialized,
    currentCellCoords,
    trackObjectInCell,
    untrackObjectInCell,
  } = useSpatialManager({
    user,
    currentSpaceId: canViewSpace ? effectiveSpaceId : null, // Only pass spaceId if user can view space
    currentSpaceOwner, // Pass owner state to enable re-initialization when resolved
    cameraRef,
    onObjectsChange: handleSpatialObjectChange,
  }); // Initialize animation system for connection line animations
  useEffect(() => {
    initAnimationSystem();
  }, []);

  // Initialize centralized broadcast manager
  useCentralizedBroadcastManager();
  // Setup debug context for spatial partitioning - memoized to reduce re-renders
  const spatialManagerDebug = useMemo(
    () => ({
      loadedCells,
      currentCellCoords,
      isInitialized: isSpatialInitialized,
      objects: objects.length,
      trackObjectInCell,
      untrackObjectInCell,
    }),
    [
      loadedCells,
      currentCellCoords,
      isSpatialInitialized,
      objects.length,
      trackObjectInCell,
      untrackObjectInCell,
    ]
  );

  // Only update window debug object when values actually change
  useEffect(() => {
    window._spatialManagerDebug = spatialManagerDebug;
  }, [spatialManagerDebug]);
  const setSelectedConnection = useConnectionStore(
    (state) => state.selectConnection
  );
  const setShowLineTextStyleUI = useConnectionStore(
    (state) => state.setShowLineTextStyleUI
  ); // Use the useConnections hook instead of implementing handlers directly
  const {
    connections,
    setConnections,
    handleLineStyleChange,
    handleLineColorChange,
    handleConnectionClick,
    handleLineTextClick,
  } = useConnections({ user, currentSpaceId, loadedCells });

  const handleLineTextSubmit = useCallback((connectionId, text) => {
    const setLineText = useConnectionStore.getState().setLineText;
    setLineText(connectionId, text);
  }, []); // Objects hook gets the connections from above
  const {
    selectedId,
    setSelectedId,
    handleCreateObject,
    handleObjectDelete,
    lastUpdateRef,
    draggingObjectsRef,
    registerTransformingObject, // Get the transform function
    transformingObjectsRef, // Get the transform ref
    getTransformStartPosition, // Add this new property
    checkPositionJitter, // Get the jitter check function
  } = useObjects({
    user,
    currentSpaceId,
    cameraRef,
    connections,
    setConnections,
  });

  // Indicators hook
  const {
    showAllCubesIndicators,
    setShowAllCubesIndicators,
    activeIndicator,
    setActiveIndicator,
    indicatorMode,
    setIndicatorMode,
    selectedIndicators,
    setSelectedIndicators,
    isConnectMode,
    setIsConnectMode,
    globalIndicatorSelected,
    setGlobalIndicatorSelected,
    selectedIndicatorsRef,
    handleToggleIndicators,
    handleIndicatorSelected,
    handleIndicatorDeselected,
  } = useIndicators();

  // UI state
  const [activeTextStyleUI, setActiveTextStyleUI] = useState(null);

  // Track objects in transition between cells to prevent flicker
  const transitioningObjectsRef = useRef(new Set()); // Set of object IDs currently transitioning

  // Make transitioningObjectsRef available globally for cleanup
  useEffect(() => {
    window.transitioningObjectsRef = transitioningObjectsRef;
    return () => {
      delete window.transitioningObjectsRef;
    };
  }, []); // Enhanced check for public access URL parameters
  useEffect(() => {
    // Extract space ID and owner ID from URL if present
    const params = new URLSearchParams(window.location.search);
    const spaceParam = params.get('space') || params.get('spaceId'); // Support both 'space' and 'spaceId'
    const ownerParam = params.get('owner');

    if (spaceParam) {
      // If we have both space and owner, set them immediately
      if (ownerParam) {
        window.publicAccessSpace = spaceParam;
        window.currentSpaceOwner = ownerParam;
        setCurrentSpaceOwner(ownerParam);
        setPublicSpaceReady(true);

        // Store in session storage as backup
        sessionStorage.setItem(`isSharedSpace_${spaceParam}`, 'true');
        sessionStorage.setItem(`sharedSpaceOwner_${spaceParam}`, ownerParam);
        sessionStorage.setItem(`isPublicSpace_${spaceParam}`, 'true');
      } else {
        // If we only have spaceId, we need to look up the owner information
        // For now, set the space and mark it as a potential public space
        window.publicAccessSpace = spaceParam;
        setIsLookingUpPublicSpace(true);
        console.log('🔍 Looking up space metadata for:', spaceParam);

        // We'll need to fetch the space metadata to get the owner
        import('./services/spacesService')
          .then(({ getPublicSpaceMetadata }) => {
            getPublicSpaceMetadata(spaceParam)
              .then((spaceData) => {
                console.log('📋 Space metadata result:', spaceData);
                if (spaceData && spaceData.isPublic && spaceData.ownerId) {
                  console.log(
                    '✅ Public space verified, owner:',
                    spaceData.ownerId
                  );
                  window.currentSpaceOwner = spaceData.ownerId;
                  setCurrentSpaceOwner(spaceData.ownerId);
                  sessionStorage.setItem(`isSharedSpace_${spaceParam}`, 'true');
                  sessionStorage.setItem(
                    `sharedSpaceOwner_${spaceParam}`,
                    spaceData.ownerId
                  );
                  sessionStorage.setItem(`isPublicSpace_${spaceParam}`, 'true');
                  // Trigger a re-render
                  setPublicSpaceReady(true);
                } else {
                  console.log('❌ Space not found or not public:', spaceData);
                  // Redirect to volscape.com for unauthorized access to secure spaces
                  console.log(
                    '🚫 Redirecting to volscape.com - unauthorized access to secure space'
                  );
                  window.location.href = 'https://volscape.com/';
                  return;
                }
                setIsLookingUpPublicSpace(false);
              })
              .catch((error) => {
                console.error('Failed to fetch space metadata:', error);
                // Redirect to volscape.com for failed space access
                console.log(
                  '🚫 Redirecting to volscape.com - failed to access space'
                );
                window.location.href = 'https://volscape.com/';
              });
          })
          .catch((importError) => {
            console.error('Failed to import spacesService:', importError);
            setIsLookingUpPublicSpace(false);
          });
      }
    }

    // Setup debug context for spatial partitioning
    window._currentSpaceId = currentSpaceId;
    window._currentUserId = user?.uid;
    window._firebaseDb = db;
  }, [user, currentSpaceId]);
  const isReadOnly =
    !!publicSpaceId && (!user || currentSpaceOwner !== user?.uid);

  // Check for unauthorized access and redirect to volscape.com
  useEffect(() => {
    // If we have a currentSpaceId but no authentication and no public space access
    if (currentSpaceId && !user && !publicSpaceId && isAuthReady) {
      console.log(
        '🚫 Redirecting to volscape.com - unauthorized access to secure space'
      );
      window.location.href = 'https://volscape.com/';
      return;
    }
  }, [currentSpaceId, user, publicSpaceId, isAuthReady]);

  // Debug logging
  console.log('🔍 Access Debug:', {
    user: !!user,
    publicSpaceId,
    currentSpaceOwner,
    publicSpaceReady,
    isLookingUpPublicSpace,
    canViewSpace,
    effectiveSpaceId,
  });

  // Create stable key for loaded cells to prevent infinite subscription loop
  const loadedCellsKey = useMemo(() => {
    if (
      !loadedCells ||
      !Array.isArray(loadedCells) ||
      loadedCells.length === 0
    ) {
      return '';
    }
    return Array.from(loadedCells).sort().join(',');
  }, [loadedCells]);
  // Display read-only indicator for public spaces
  useEffect(() => {
    if (isReadOnly) {
      // Optionally show a UI indicator
    }
  }, [isReadOnly]);
  // Load connections when space changes (replacing useConnections hook)
  useEffect(() => {
    if (!user?.uid || !currentSpaceId) return;

    // Simple connection loading - let RealTimeConnectionUpdater handle visual updates
    const loadConnections = async () => {
      try {
        const { subscribeToConnections } = await import(
          './services/connectionsService'
        );

        const unsubscribe = subscribeToConnections(
          user.uid,
          currentSpaceId,
          (connectionUpdate) => {
            // Only update if we're not currently transforming objects
            if (
              !window._currentTransformingObjects ||
              window._currentTransformingObjects.size === 0
            ) {
              // Handle different types of connection updates
              if (Array.isArray(connectionUpdate)) {
                // Filter out connections that reference deleted objects
                const validConnections = connectionUpdate.filter((conn) => {
                  const startObjectExists = objectsFromStore.some(
                    (obj) => obj.id.toString() === conn.start?.objectId
                  );
                  const endObjectExists = objectsFromStore.some(
                    (obj) => obj.id.toString() === conn.end?.objectId
                  );
                  const isValid = startObjectExists && endObjectExists;
                  if (!isValid) {
                    // Connection references non-existent objects, filter it out
                  }

                  return isValid;
                });

                // Full array update
                setConnections(validConnections);
              } else if (
                connectionUpdate &&
                typeof connectionUpdate === 'object'
              ) {
                // Incremental update (added, modified, removed)
                const { type, connection, id } = connectionUpdate;

                if (type === 'added' && connection) {
                  // Add new connection
                  setConnections((current) => {
                    const exists = current.some(
                      (conn) => conn.id === connection.id
                    );
                    return exists ? current : [...current, connection];
                  });
                } else if (type === 'modified' && connection) {
                  // Update existing connection
                  setConnections((current) =>
                    current.map((conn) =>
                      conn.id === connection.id ? connection : conn
                    )
                  );
                } else if (type === 'removed' && id) {
                  // Remove connection
                  setConnections((current) =>
                    current.filter((conn) => conn.id !== id)
                  );
                }
              }
            }
          },
          loadedCells
        );

        return unsubscribe;
      } catch {
        // Failed to load connections
      }
    };

    const cleanupRef = { current: null };

    loadConnections().then((unsubscribe) => {
      cleanupRef.current = unsubscribe;
    });

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [user?.uid, currentSpaceId, loadedCells, setConnections]); // Subscribe to spatial objects changes - supports anonymous access to public spaces
  useEffect(() => {
    console.log('🔧 Spatial subscription effect triggered:', {
      canViewSpace,
      isSpatialInitialized,
      user: !!user,
      publicSpaceId,
      currentSpaceOwner,
      loadedCells: loadedCells?.length || 0,
    });

    if (!canViewSpace) {
      console.log('❌ Cannot view space, exiting');
      return;
    }
    if (!isSpatialInitialized) {
      console.log('❌ Spatial not initialized, exiting');
      return; // Wait for spatial system to initialize
    }

    // For public spaces, wait until we have the owner information
    if (!user && publicSpaceId && !currentSpaceOwner) {
      console.log('⏳ Waiting for public space owner information...');
      return;
    }

    if (
      !loadedCells ||
      !Array.isArray(loadedCells) ||
      loadedCells.length === 0
    ) {
      return;
    }

    // Deterministic approach: Set loading complete based on number of cells
    // Each cell subscription should be established quickly, so we can set a reasonable timeout
    const totalCells = loadedCells.length;
    const cellSubscriptionTimeout = Math.max(1000, totalCells * 200); // 200ms per cell, minimum 1 second

    const deterministic_LoadingCompleteTimeoutId = setTimeout(() => {
      currentSetIsInitialLoading(false);
      setGlobalInitialLoading(false);
    }, cellSubscriptionTimeout); // Track when object loading appears to be complete (keep as backup for edge cases)
    let loadingTimeoutId = null;
    const scheduleLoadingComplete = () => {
      // Clear any existing timeout
      if (loadingTimeoutId) {
        clearTimeout(loadingTimeoutId);
      }

      // Set a new timeout - if no more objects are added for 1.5 seconds, consider loading complete
      loadingTimeoutId = setTimeout(() => {
        currentSetIsInitialLoading(false);
        setGlobalInitialLoading(false);
      }, 1500);
    };
    const spaceToLoad = effectiveSpaceId;
    const ownerUserId = currentSpaceOwner || user?.uid;

    console.log('🚀 Starting spatial objects subscription:', {
      spaceToLoad,
      ownerUserId,
      loadedCells: loadedCells?.length || 0,
    }); // Capture current refs and functions to avoid dependency issues
    const currentLastUpdateRef = lastUpdateRef;
    const currentDraggingObjectsRef = draggingObjectsRef;
    const currentTransformingObjectsRef = transformingObjectsRef;
    const currentSetObjects = setObjects;
    const currentSetIsInitialLoading = setIsInitialLoading;
    const currentTrackObjectInCell = trackObjectInCell;
    const currentUntrackObjectInCell = untrackObjectInCell;
    const unsubscribe = subscribeToSpatialObjects(
      ownerUserId, // May be null for anonymous access
      spaceToLoad,
      loadedCells,
      (change) => {
        currentSetObjects((prev) => {
          switch (change.type) {
            case 'added': {
              // Track object change for spatial operation detection
              if (window.trackObjectChange) {
                window.trackObjectChange(change.id, 'add');
              }

              // Check if this object was recently deleted
              if (isRecentlyDeleted(change.id)) {
                console.log(
                  `🚫 Prevented re-addition of recently deleted object: ${change.id}`
                );
                return prev;
              }

              // Clear transitioning flag if object is being re-added
              if (transitioningObjectsRef.current.has(change.id.toString())) {
                transitioningObjectsRef.current.delete(change.id.toString());
                console.log(
                  `🔄 Object ${change.id} returned from transition - clearing transitioning flag`
                );
              }
              if (!prev.find((obj) => obj.id === change.id)) {
                // Validate position before adding the object
                const hasValidPosition =
                  change.object?.position &&
                  Array.isArray(change.object.position) &&
                  change.object.position.length === 3 &&
                  change.object.position.every(
                    (val) => typeof val === 'number' && !isNaN(val)
                  );

                if (!hasValidPosition) {
                  console.warn(
                    `🚫 Rejecting new object with invalid position:`,
                    {
                      id: change.id,
                      position: change.object?.position,
                      object: change.object,
                    }
                  );
                  return prev;
                }
                if (change.cellCoords && currentTrackObjectInCell) {
                  const cellId = `${change.cellCoords.x},${
                    change.cellCoords.y
                  },${change.cellCoords.z || 0}`;
                  currentTrackObjectInCell(change.id.toString(), cellId);
                }

                // Track object loading for completion detection
                scheduleLoadingComplete();

                return [...prev, change.object];
              }
              return prev;
            }
            case 'modified':
              // Prevent position updates for actively transformed/dragged objects
              if (
                currentTransformingObjectsRef.current.has(
                  change.id.toString()
                ) ||
                currentDraggingObjectsRef.current.has(change.id.toString())
              ) {
                // Find existing object
                const existingObj = prev.find(
                  (obj) => obj.id.toString() === change.id
                );
                if (existingObj) {
                  // Validate that existing object has a valid position
                  const hasValidPosition =
                    existingObj.position &&
                    Array.isArray(existingObj.position) &&
                    existingObj.position.length === 3 &&
                    existingObj.position.every(
                      (val) => typeof val === 'number' && !isNaN(val)
                    );

                  if (!hasValidPosition) {
                    console.warn(
                      `🚫 Existing object has invalid position, accepting new position:`,
                      {
                        id: change.id,
                        existingPosition: existingObj.position,
                        newPosition: change.object?.position,
                      }
                    );
                    // Fall through to normal update logic
                  } else {
                    // Preserve current position but accept other changes
                    const updatedObj = {
                      ...change.object,
                      position: existingObj.position,
                      _transformActive: true,
                    };
                    currentLastUpdateRef.current[change.id] = updatedObj;

                    return prev.map((obj) =>
                      obj.id.toString() === change.id ? updatedObj : obj
                    );
                  }
                }
              } // Update other objects normally
              if (
                !isEqual(currentLastUpdateRef.current[change.id], change.object)
              ) {
                // Validate position before accepting the change
                const hasValidPosition =
                  change.object?.position &&
                  Array.isArray(change.object.position) &&
                  change.object.position.length === 3 &&
                  change.object.position.every(
                    (val) => typeof val === 'number' && !isNaN(val)
                  );

                if (!hasValidPosition) {
                  console.warn(
                    `🚫 Rejecting object update with invalid position:`,
                    {
                      id: change.id,
                      position: change.object?.position,
                      object: change.object,
                    }
                  );
                  return prev;
                }

                currentLastUpdateRef.current[change.id] = change.object;
                return prev.map((obj) =>
                  obj.id.toString() === change.id ? change.object : obj
                );
              }
              return prev;
            case 'removed': {
              // Track object change for spatial operation detection
              if (window.trackObjectChange) {
                window.trackObjectChange(change.id, 'remove');
              }

              // Mark object as transitioning to prevent flicker during cell moves
              transitioningObjectsRef.current.add(change.id.toString());

              // Set a timeout to actually remove the object if it doesn't get re-added
              setTimeout(() => {
                if (transitioningObjectsRef.current.has(change.id.toString())) {
                  // Object was not re-added, safe to remove now
                  transitioningObjectsRef.current.delete(change.id.toString());
                  currentSetObjects((current) =>
                    current.filter((obj) => obj.id.toString() !== change.id)
                  );
                }
              }, 2000); // 2 second grace period

              // Untrack object when removed
              if (change.cellCoords && currentUntrackObjectInCell) {
                const cellId = `${change.cellCoords.x},${change.cellCoords.y},${
                  change.cellCoords.z || 0
                }`;
                currentUntrackObjectInCell(change.id.toString(), cellId);
              }
              delete currentLastUpdateRef.current[change.id];

              // Don't remove from UI if object is transitioning between cells
              if (transitioningObjectsRef.current.has(change.id.toString())) {
                return prev; // Keep the object in the UI
              }

              return prev.filter((obj) => obj.id.toString() !== change.id);
            }
            default:
              return prev;
          }
        });
      }
    );

    return () => {
      unsubscribe();
      if (loadingTimeoutId) {
        clearTimeout(loadingTimeoutId);
      }
      if (deterministic_LoadingCompleteTimeoutId) {
        clearTimeout(deterministic_LoadingCompleteTimeoutId);
      }
    };
  }, [
    effectiveSpaceId,
    canViewSpace,
    isSpatialInitialized,
    loadedCellsKey, // Use stable key to prevent infinite loop but still update on cell changes
    setObjects,
    publicSpaceId, // Include to re-run when public space changes
    currentSpaceOwner, // Include to re-run when owner is resolved
    // Note: Excluding other dependencies to prevent infinite loops
    // draggingObjectsRef, lastUpdateRef, trackObjectInCell, transformingObjectsRef, untrackObjectInCell, user
  ]);

  // Retroactively track existing objects when spatial manager becomes initialized
  const hasRetroTrackedRef = useRef(false);
  useEffect(() => {
    if (
      isSpatialInitialized &&
      trackObjectInCell &&
      objects.length > 0 &&
      !hasRetroTrackedRef.current
    ) {
      objects.forEach((obj) => {
        if (
          obj.position &&
          Array.isArray(obj.position) &&
          obj.position.length >= 3
        ) {
          // Calculate which cell this object belongs to
          const cellCoords = {
            x: Math.floor(obj.position[0] / CELL_SIZE), // Use imported CELL_SIZE constant
            y: Math.floor(obj.position[1] / CELL_SIZE),
            z: Math.floor((obj.position[2] || 0) / CELL_SIZE),
          };

          const cellId = `${cellCoords.x},${cellCoords.y},${cellCoords.z}`;

          trackObjectInCell(obj.id.toString(), cellId);
        }
      });

      hasRetroTrackedRef.current = true; // Mark that we've done the initial tracking
    }
  }, [isSpatialInitialized, trackObjectInCell, objects]); // Include objects but use ref to prevent re-runs  // Note: Initial loading state is now handled by the object loading timeout mechanism
  // in the objects subscription effect to ensure all objects are loaded before
  // spatial operations are allowed

  // Matrix updates tracking to prevent recursion
  const handleObjectMatrixChanged = useCallback((id, matrixWorld) => {
    if (!window._matrixUpdateMap) {
      window._matrixUpdateMap = new Map();
    }

    const prevMatrix = window._matrixUpdateMap.get(id.toString());
    if (prevMatrix && matrixWorld.equals(prevMatrix)) {
      return;
    }

    window._matrixUpdateMap.set(id.toString(), matrixWorld.clone());
  }, []); // Store camera reference in window for debugging
  useEffect(() => {
    if (cameraRef.current?.orbitControls) {
      window.orbitControls = cameraRef.current.orbitControls;
    }

    // Also ensure the camera is accessible
    if (cameraRef.current?.camera) {
      window.camera = cameraRef.current.camera;
    }
  }, [cameraRef.current?.orbitControls, cameraRef.current?.camera]); // Only run when camera references change

  // Camera controls
  const disableOrbitControls = useCallback(() => {
    if (cameraRef.current?.orbitControls) {
      cameraRef.current.orbitControls.enabled = false;
    }
  }, []);

  const enableOrbitControls = useCallback(() => {
    if (cameraRef.current?.orbitControls) {
      cameraRef.current.orbitControls.enabled = true;
    }
  }, []);

  // Login handler
  const handleLogin = useCallback(() => {
    signInUser();
  }, []);

  // Object click handler
  const handleObjectClick = useCallback(
    (id) => {
      setSelectedId(id);
      setShowLineTextStyleUI(null);
      setSelectedConnection(null);
    },
    [setSelectedId, setShowLineTextStyleUI, setSelectedConnection]
  ); // Object move handler
  const handleObjectMoveCallback = useCallback(
    (id, newPosition, isDragStart = false, isDragEnd = false) => {
      // Get current objects from store to avoid dependency issues
      const currentObjects = useObjectsStore.getState().objects;

      // Convert array position to object if needed
      let positionObj;
      if (Array.isArray(newPosition)) {
        positionObj = {
          x: newPosition[0],
          y: newPosition[1],
          z: newPosition[2],
        };
      } else if (
        newPosition &&
        typeof newPosition === 'object' &&
        'x' in newPosition
      ) {
        positionObj = newPosition;
      } else {
        console.warn('Invalid newPosition format:', newPosition);
        return;
      }

      handleObjectMove({
        id,
        newPosition: positionObj,
        isDragStart,
        isDragEnd,
        draggingObjectsRef,
        objects: currentObjects,
        setObjects,
        user,
        currentSpaceId,
      });
    },
    [user, currentSpaceId, setObjects, draggingObjectsRef]
  );
  const handleObjectUpdateCallback = useCallback(
    (id, updates) => {
      // Skip position updates for objects being transformed
      // UNLESS it's a final position update
      if (updates.position) {
        if (
          transformingObjectsRef.current.has(id.toString()) &&
          !updates._finalPosition
        ) {
          // Skip position updates during transform, keep other properties
          const updatesWithoutPosition = { ...updates };
          delete updatesWithoutPosition.position;
          if (Object.keys(updatesWithoutPosition).length > 0) {
            handleObjectUpdate({
              id,
              updates: updatesWithoutPosition,
              lastUpdateRef,
              user,
              currentSpaceId: effectiveSpaceId, // Use effectiveSpaceId
            });
          }
          return;
        } // If position looks like jitter (oscillation), skip it - but not for final positions
        if (
          !updates._finalPosition &&
          checkPositionJitter(id, updates.position)
        ) {
          const updatesWithoutPosition = { ...updates };
          delete updatesWithoutPosition.position;

          if (Object.keys(updatesWithoutPosition).length > 0) {
            handleObjectUpdate({
              id,
              updates: updatesWithoutPosition,
              lastUpdateRef,
              user,
              currentSpaceId: effectiveSpaceId, // Use effectiveSpaceId
            });
          }
          return;
        }
      }

      // For non-position updates or non-jittery updates, or final position updates
      handleObjectUpdate({
        id,
        updates,
        lastUpdateRef,
        user,
        currentSpaceId: effectiveSpaceId, // Use effectiveSpaceId
      });
    },
    [
      user,
      effectiveSpaceId, // Use effectiveSpaceId
      lastUpdateRef,
      transformingObjectsRef,
      checkPositionJitter,
    ]
  );
  // Face indicator click handler
  const handleFaceIndicatorClickCallback = useCallback(
    async (indicator) => {
      try {
        const result = await handleFaceIndicatorClick({
          indicator,
          objects,
          connections,
          selectedIndicatorsRef,
          setSelectedIndicators,
          setConnections,
          setIsConnectMode,
          setIndicatorMode,
          setShowAllCubesIndicators,
          setGlobalIndicatorSelected,
          user,
          currentSpaceId,
          isConnectMode,
        });

        // Log the result for debugging
        if (!result.success) {
          console.error('Face indicator click failed:', result.message);
        }
      } catch (error) {
        console.error('Error in face indicator click handler:', error);
      }
    },
    [
      objects,
      connections,
      user,
      currentSpaceId,
      isConnectMode,
      selectedIndicatorsRef,
      setSelectedIndicators,
      setConnections,
      setIsConnectMode,
      setIndicatorMode,
      setShowAllCubesIndicators,
      setGlobalIndicatorSelected,
    ]
  );

  // Face click handler
  const handleFaceClick = useCallback(
    (faceInfo) => {
      if (faceInfo.id || faceInfo.cube?.id) {
        setActiveIndicator({
          ...faceInfo,
          cube: {
            ...faceInfo.cube,
            id: faceInfo.id || faceInfo.cube?.id,
          },
        });
        setIndicatorMode('single');
      }
    },
    [setActiveIndicator, setIndicatorMode]
  ); // Canvas click handler
  const handleCanvasClick = useCallback(() => {
    // Close any active text styling menus
    setActiveTextStyleUI(null);
    setSelectedConnection(null);
    setShowLineTextStyleUI(null);
    setSelectedId(null); // Close TextStyleUI for all objects
    objects.forEach((obj) => {
      if (obj.type === 'plane') {
        setPlaneShowTextStyleUI(obj.id, false);
        setPlaneShowHeaderStyleUI(obj.id, false);
      } else if (obj.type === 'cube') {
        setCubeShowHeaderTextStyleUI(obj.id, false);
      } else if (obj.type === 'dodecahedron' || obj.type === 'sphere') {
        setDodecahedronShowStyleMenu(obj.id, false);
        setDodecahedronShowFaceTextStyleMenu(obj.id, false);
      }
    });

    // If they were trying to create a connection but clicked empty space,
    // cancel the connection creation process
    if (isConnectMode && selectedIndicators.length > 0) {
      setSelectedIndicators([]);
      selectedIndicatorsRef.current = [];
    }
  }, [
    setActiveTextStyleUI,
    setSelectedConnection,
    setShowLineTextStyleUI,
    setSelectedId,
    objects,
    setPlaneShowTextStyleUI,
    setPlaneShowHeaderStyleUI,
    setCubeShowHeaderTextStyleUI,
    setDodecahedronShowStyleMenu,
    setDodecahedronShowFaceTextStyleMenu,
    isConnectMode,
    selectedIndicators,
    setSelectedIndicators,
    selectedIndicatorsRef,
  ]);
  // Initialize WebRTC service with user ID when available
  useEffect(() => {
    if (user?.uid) {
      initWebRTC(user.uid);
    }
  }, [user?.uid]);
  // Show loading screens when authenticating
  if (isCheckingUrlAuth && !publicSpaceId) {
    return <div className="auth-loading">Authenticating...</div>;
  }

  if (!isAuthReady && !publicSpaceId) {
    return <div className="loading">Loading...</div>;
  }

  // Show loading when looking up public space metadata
  if (isLookingUpPublicSpace) {
    return <div className="loading">Loading public space...</div>;
  }
  if (!canViewSpace) {
    // Redirect to volscape.com instead of showing auth page
    console.log('🚫 Redirecting to volscape.com - cannot view space');
    window.location.href = 'https://volscape.com/';
    return <div className="loading">Redirecting...</div>;
  }

  return (
    <>
      <Canvas
        style={{
          background: backgroundColor,
          width: '100vw',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
        }}
        onPointerMissed={handleCanvasClick}
        gl={{
          antialias: true,
          samples: 16,
          alpha: true,
          stencil: true,
          depth: true,
          logarithmicDepthBuffer: true,
        }}
        dpr={[1, 2]}
      >
        {' '}
        <CustomCamera ref={cameraRef} />{' '}
        <group>
          {/* Real-time connection position updater - reactive to store changes */}
          <RealTimeConnectionUpdater /> {/* Render all connections */}
          <ConnectionsRenderer
            objects={objects}
            onLineStyleChange={handleLineStyleChange}
            onLineColorChange={handleLineColorChange}
            onConnectionClick={handleConnectionClick}
            onLineTextClick={handleLineTextClick}
            onLineTextSubmit={handleLineTextSubmit}
          />{' '}
          {/* Render all objects */}
          {objects.map((obj) => (
            <ObjectRenderer
              key={obj.id}
              obj={obj}
              selectedId={selectedId}
              handleObjectClick={handleObjectClick}
              handleObjectMove={handleObjectMoveCallback}
              handleObjectUpdate={handleObjectUpdateCallback}
              disableOrbitControls={disableOrbitControls}
              enableOrbitControls={enableOrbitControls}
              handleFaceIndicatorClick={handleFaceIndicatorClickCallback}
              handleFaceClick={handleFaceClick}
              showAllCubesIndicators={showAllCubesIndicators}
              activeIndicator={activeIndicator}
              indicatorMode={indicatorMode}
              connections={connections}
              selectedIndicators={selectedIndicators}
              activeTextStyleUI={activeTextStyleUI}
              setActiveTextStyleUI={setActiveTextStyleUI}
              handleIndicatorDeselected={handleIndicatorDeselected}
              registerTransformingObject={registerTransformingObject} // Pass the register function
              getTransformStartPosition={getTransformStartPosition} // Add this prop
              handleObjectMatrixChanged={handleObjectMatrixChanged}
              handleIndicatorSelected={handleIndicatorSelected}
              globalIndicatorSelected={globalIndicatorSelected}
              handleObjectDelete={handleObjectDelete}
              checkPositionJitter={checkPositionJitter} // Pass this prop
              user={user}
              currentSpaceId={effectiveSpaceId} // Use effectiveSpaceId instead of currentSpaceId
            />
          ))}{' '}
          {/* Render cell boundaries */}
          <CellBoundaryRenderer loadedCells={loadedCells} visible={true} />
        </group>
        <EffectComposer>
          <SMAA />
        </EffectComposer>
      </Canvas>{' '}
      <UIOverlay
        onCreateObject={handleCreateObject}
        onToggleIndicators={handleToggleIndicators}
        user={user}
        onLogin={handleLogin}
        isAuthReady={isAuthReady}
        isLoading={!isAuthReady}
        showLoginButton={!isCheckingUrlAuth && !user}
        isConnectMode={isConnectMode}
        currentCell={currentCellCoords}
      />
    </>
  );
};

export default App;
