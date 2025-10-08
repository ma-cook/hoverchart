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
import useTimeoutManager from './hooks/useTimeoutManager';
import { getCellCoordinates } from './services/spatialPartitioning';
import {
  useObjectsStore,
  useConnectionStore,
  usePlaneStore,
  useCubeStore,
  useTetrahedronStore,
  useDodecahedronStore,
} from './stores';

// Utility imports
import {
  handleObjectMove,
  handleObjectUpdate,
} from './utils/objectUpdateHandlers';
import { handleFaceIndicatorClick } from './utils/faceIndicatorUtils';
import { checkPositionJitter } from './utils/positionUtils';
import { throttle } from './utils/unifiedPerformanceUtils'; // Unified throttle utility

import { signInUser } from './services/authService';
import { subscribeToSpatialObjects } from './services/spatialObjectsService';
import { CELL_SIZE } from './services/spatialPartitioning'; // Import CELL_SIZE constant
import { setIsInitialLoading as setGlobalInitialLoading } from './utils/loadingState';
import { db } from './firebase';
import isEqual from 'lodash/isEqual';
import { initWebRTC } from './services/webRservice';
import { initAnimationSystem } from './utils/animationUtils';
import { objectVirtualizer } from './utils/objectVirtualization';

/**
 * Main application component
 */
const App = () => {
  // Base state
  const [backgroundColor] = useState('white');
  const [publicSpaceReady, setPublicSpaceReady] = useState(false);
  const [currentSpaceOwner, setCurrentSpaceOwner] = useState(null);

  // Unified timeout manager (replaces individual timeout refs)
  const {
    setRedirectTimeout,
    clearRedirectTimeout,

    clearLoadingTimeout,
    setObjectLoadingTimeout,
    clearObjectLoadingTimeout,
  } = useTimeoutManager();

  const cameraRef = useRef();
  const intentionalSpaceChangeRef = useRef(false); // Get objects from store with safety check
  const objectsFromStore = useObjectsStore((state) => state.objects);
  const objects = useMemo(() => {
    return Array.isArray(objectsFromStore) ? objectsFromStore : [];
  }, [objectsFromStore]);
  const setObjects = useObjectsStore((state) => state.setObjects);
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

  // Tetrahedron store
  const setTetrahedronShowHeaderTextStyleUI = useTetrahedronStore(
    (state) => state.setTetrahedronShowHeaderTextStyleUI
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
  // Initialize publicSpaceId and isLookingUpPublicSpace immediately from URL to prevent timing issues
  const { publicSpaceId, shouldLookupPublicSpace } = useMemo(() => {
    // First check if already set in window
    if (window.publicAccessSpace) {
      return {
        publicSpaceId: window.publicAccessSpace,
        shouldLookupPublicSpace: false,
      };
    }

    // Otherwise, extract from URL parameters immediately
    const params = new URLSearchParams(window.location.search);
    const spaceParam = params.get('space') || params.get('spaceId');
    const uidParam = params.get('uid');
    const tokenParam = params.get('token');
    const ownerParam = params.get('owner');

    // Only treat as public space if no auth params and no owner param
    if (spaceParam && !uidParam && !tokenParam && !ownerParam) {
      // Check if we already know this is a public space from session storage
      const isKnownPublic =
        sessionStorage.getItem(`isPublicSpace_${spaceParam}`) === 'true';
      const knownOwner = sessionStorage.getItem(
        `sharedSpaceOwner_${spaceParam}`
      );

      if (isKnownPublic && knownOwner) {
        // We already know this space and its owner, no lookup needed
        window.publicAccessSpace = spaceParam;
        window.currentSpaceOwner = knownOwner;
        return { publicSpaceId: spaceParam, shouldLookupPublicSpace: false };
      } else {
        // Need to lookup public space metadata
        return { publicSpaceId: spaceParam, shouldLookupPublicSpace: true };
      }
    }

    return {
      publicSpaceId: window.publicAccessSpace,
      shouldLookupPublicSpace: false,
    };
  }, []); // Empty deps - only calculate once on mount

  // Initialize isLookingUpPublicSpace based on whether we need to lookup
  const [isLookingUpPublicSpace, setIsLookingUpPublicSpace] = useState(
    shouldLookupPublicSpace
  );

  const effectiveSpaceId = publicSpaceId || currentSpaceId;

  // Memoize canViewSpace calculation to prevent unnecessary recalculations
  const canViewSpace = useMemo(() => {
    return !!(
      user ||
      (publicSpaceId &&
        (currentSpaceOwner || publicSpaceReady || isLookingUpPublicSpace)) ||
      // Also allow access if we have cached public space info from session storage
      (publicSpaceId && window.currentSpaceOwner)
    );
  }, [
    user,
    publicSpaceId,
    currentSpaceOwner,
    publicSpaceReady,
    isLookingUpPublicSpace,
  ]);

  // Memoize redirect decision to prevent unnecessary recalculations
  const shouldRedirect = useMemo(() => !canViewSpace, [canViewSpace]);

  // Debug redirect decision only when canViewSpace changes
  useEffect(() => {
    if (canViewSpace) {
      console.log('🔄 [App] Redirect cancelled - canViewSpace is now true');
    }
  }, [
    canViewSpace,
    user,
    publicSpaceId,
    currentSpaceOwner,
    publicSpaceReady,
    isLookingUpPublicSpace,
    shouldRedirect,
  ]);

  // Spatial partitioning hook with object change handler
  const handleSpatialObjectChange = useCallback(
    (change) => {
      if (change.source === 'cell-unload') {
        // Remove objects when their cells are unloaded
        setObjects((prev) => {
          return prev.filter(
            (obj) => obj.id.toString() !== change.id.toString()
          );
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
  }); // REMOVED: No longer using tombstone tracking

  // Initialize animation system for connection line animations
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

    // Expose tracking functions for immediate object tracking
    if (trackObjectInCell) {
      window.trackObjectInCell = trackObjectInCell;
    }
    if (untrackObjectInCell) {
      window.untrackObjectInCell = untrackObjectInCell;
    }
  }, [spatialManagerDebug, trackObjectInCell, untrackObjectInCell]);
  const setSelectedConnection = useConnectionStore(
    (state) => state.selectConnection
  );
  const setShowLineTextStyleUI = useConnectionStore(
    (state) => state.setShowLineTextStyleUI
  ); // Use the useConnections hook instead of implementing handlers directly
  // Debug: Log useConnections parameters
  const {
    connections,
    handleLineStyleChange,
    handleLineColorChange,
    handleConnectionClick,
    handleLineTextClick,
    handleLineTextSubmit,
    handleLineTextStyleChange,
  } = useConnections({ user, currentSpaceId: effectiveSpaceId, loadedCells });

  // Create position jitter checker that uses object store history
  const checkPositionJitterWithHistory = useCallback(
    (objectId, newPosition) => {
      const objectsStore = useObjectsStore.getState();
      const history =
        objectsStore.positionHistory.get(objectId.toString()) || [];

      if (history.length === 0) {
        // No history, record this position and allow
        objectsStore.setPositionHistory(objectId.toString(), [newPosition]);
        return false;
      }

      const lastPosition = history[history.length - 1];
      const isJitter = checkPositionJitter(lastPosition, newPosition, 0.001);

      if (!isJitter) {
        // Position change is significant, update history
        const newHistory = [...history.slice(-4), newPosition]; // Keep last 5 positions
        objectsStore.setPositionHistory(objectId.toString(), newHistory);
      }

      return isJitter;
    },
    []
  );

  // Objects hook gets the connections from above
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
  } = useObjects({
    user,
    currentSpaceId,
    cameraRef,
    connections,
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
  }, []); // Enhanced check for URL parameters - handle both authenticated and public access
  useEffect(() => {
    // Extract parameters from URL
    const params = new URLSearchParams(window.location.search);
    const spaceParam = params.get('space') || params.get('spaceId'); // Support both 'space' and 'spaceId'
    const ownerParam = params.get('owner');
    const uidParam = params.get('uid'); // Check for authenticated access
    const tokenParam = params.get('token'); // Check for authentication token

    if (spaceParam) {
      // If we have uid and token, this is authenticated access - let the auth system handle it
      if (uidParam && tokenParam) {
        // Don't set up public space access - let the normal auth flow handle this
        // The space manager will pick up the spaceId from URL parameters
        return;
      }

      // If we have an authenticated user, let the space manager handle it
      if (user?.uid) {
        // Reset lookup state since we're letting space manager handle this
        if (isLookingUpPublicSpace) {
          console.log(
            '🔄 [App] Authenticated user detected, letting space manager handle space access'
          );
          setIsLookingUpPublicSpace(false);
        }
        return;
      }

      // Wait for auth to be ready before making public space decisions
      if (!isAuthReady) {
        return;
      }

      // If we have both space and owner (but no auth params), treat as public access
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
        // Only try public space lookup if we're not authenticated and no auth params
        // AND we don't already have the space data
        if (
          !user &&
          !uidParam &&
          !tokenParam &&
          !publicSpaceReady &&
          !currentSpaceOwner
        ) {
          // Set window variable for consistency (may already be set by useMemo above)
          window.publicAccessSpace = spaceParam;
          setIsLookingUpPublicSpace(true);

          console.log('🔍 [App] Starting public space lookup for:', spaceParam);

          // We'll need to fetch the space metadata to get the owner
          import('./services/spacesService')
            .then(({ getPublicSpaceMetadata }) => {
              console.log(
                '📋 [App] About to call getPublicSpaceMetadata with:',
                spaceParam
              );
              getPublicSpaceMetadata(spaceParam)
                .then((spaceData) => {
                  console.log(
                    '📋 [App] getPublicSpaceMetadata returned:',
                    spaceData
                  );
                  if (spaceData && spaceData.isPublic && spaceData.ownerId) {
                    console.log(
                      '✅ [App] Successfully found public space, setting up access'
                    );
                    window.currentSpaceOwner = spaceData.ownerId;
                    setCurrentSpaceOwner(spaceData.ownerId);
                    sessionStorage.setItem(
                      `isSharedSpace_${spaceParam}`,
                      'true'
                    );
                    sessionStorage.setItem(
                      `sharedSpaceOwner_${spaceParam}`,
                      spaceData.ownerId
                    );
                    sessionStorage.setItem(
                      `isPublicSpace_${spaceParam}`,
                      'true'
                    );
                    // Trigger a re-render
                    setPublicSpaceReady(true);
                  } else {
                    console.log(
                      '❌ [App] Public space lookup failed, redirecting. SpaceData:',
                      spaceData
                    );
                    window.location.href = 'https://volscape.com/';
                    return;
                  }
                  setIsLookingUpPublicSpace(false);
                })
                .catch((error) => {
                  console.error(
                    '❌ [App] Failed to fetch space metadata:',
                    error
                  );
                  // Redirect to volscape.com for failed space access

                  window.location.href = 'https://volscape.com/';
                });
            })
            .catch((importError) => {
              console.error(
                '❌ [App] Failed to import spacesService:',
                importError
              );
              setIsLookingUpPublicSpace(false);
            });
        } else if (
          !user &&
          !uidParam &&
          !tokenParam &&
          (publicSpaceReady || currentSpaceOwner)
        ) {
          // We already have public space data, just make sure lookup state is correct
          console.log(
            '🔄 [App] Public space data already available, skipping lookup'
          );
          if (isLookingUpPublicSpace) {
            setIsLookingUpPublicSpace(false);
          }
        }
      }
    }

    // Setup debug context for spatial partitioning
    window._currentSpaceId = currentSpaceId;
    window._currentUserId = user?.uid;
    window._firebaseDb = db;

    // Setup global context for stores that need it
    window.currentSpaceId = currentSpaceId;
    window.currentUser = user;

    // Debug logging for space ID availability
    if (currentSpaceId) {
      console.log('🌍 [App] Setting global space context:', {
        currentSpaceId,
        userId: user?.uid,
      });
    } else {
      console.warn('⚠️ [App] No currentSpaceId available for global context');
    }
  }, [
    user,
    currentSpaceId,
    isAuthReady,
    isLookingUpPublicSpace,
    setIsLookingUpPublicSpace,
    currentSpaceOwner,
    publicSpaceReady,
  ]);
  const isReadOnly =
    !!publicSpaceId && (!user || currentSpaceOwner !== user?.uid);

  // Check for unauthorized access and redirect to volscape.com
  useEffect(() => {
    // If we have a currentSpaceId but no authentication and no public space access
    // BUT don't redirect if we're currently looking up a public space
    if (
      currentSpaceId &&
      !user &&
      !publicSpaceId &&
      isAuthReady &&
      !isLookingUpPublicSpace
    ) {
      console.log(
        '🔄 [App] Redirecting to volscape.com - no auth and no public space access'
      );
      window.location.href = 'https://volscape.com/';
      return;
    }
  }, [
    currentSpaceId,
    user,
    publicSpaceId,
    isAuthReady,
    isLookingUpPublicSpace,
  ]);

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
    if (!user?.uid || !currentSpaceId) return; // Simple connection loading - now fully handled by useConnections hook
    // DISABLED: Old connection subscription replaced by useConnections hook
    /*
    const loadConnections = async () => {
      try {
        const { subscribeToConnections } = await import(
          './services/connectionsService'
        );

        const unsubscribe = subscribeToConnections(
          user.uid,
          currentSpaceId,          (connectionUpdate) => {
            // Skip connection updates if object deletion is in progress
            if (window._connectionUpdateSkip) {
              return;
            }

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
                });                // Full array update - now handled by useConnections hook
                // setConnections(validConnections);
              } else if (
                connectionUpdate &&
                typeof connectionUpdate === 'object'
              ) {
                // Incremental update (added, modified, removed)
                const { type, connection, id } = connectionUpdate;                if (type === 'added' && connection) {
                  // Add new connection - now handled by useConnections hook
                  // setConnections((current) => {
                  //   const exists = current.some(
                  //     (conn) => conn.id === connection.id
                  //   );
                  //   return exists ? current : [...current, connection];
                  // });
                } else if (type === 'modified' && connection) {
                  // Update existing connection - now handled by useConnections hook
                  // setConnections((current) =>
                  //   current.map((conn) =>
                  //     conn.id === connection.id ? connection : conn
                  //   )
                  // );
                } else if (type === 'removed' && id) {
                  // Remove connection - now handled by useConnections hook
                  // setConnections((current) =>
                  //   current.filter((conn) => conn.id !== id)
                  // );
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
    */

    // Connections are now fully handled by useConnections hook - no cleanup needed here
    return () => {};
  }, [user?.uid, currentSpaceId, loadedCells]);
  // Subscribe to spatial objects changes - supports anonymous access to public spaces
  useEffect(() => {
    if (!canViewSpace) {
      return;
    }
    if (!isSpatialInitialized) {
      return; // Wait for spatial system to initialize
    }

    // For public spaces, wait until we have the owner information
    if (!user && publicSpaceId && !currentSpaceOwner) {
      return;
    }

    if (
      !loadedCells ||
      !Array.isArray(loadedCells) ||
      loadedCells.length === 0
    ) {
      return;
    } // Add an initial fetch phase to ensure we get all existing objects
    const performInitialObjectFetch = async () => {
      try {
        const { getObjectsFromCells } = await import(
          './services/spatialPartitioning'
        );
        const ownerUserId = currentSpaceOwner || user?.uid;

        // Convert cell IDs to coordinate objects
        const cellCoords = loadedCells.map((cellId) => {
          const [x, y, z] = cellId.split(',').map(Number);
          return { x, y, z: z || 0 }; // Default z to 0 for backward compatibility
        });

        const initialObjects = await getObjectsFromCells(
          ownerUserId,
          effectiveSpaceId,
          cellCoords
        ); // Add all initial objects to the store
        if (initialObjects.length > 0) {
          currentSetObjects((prev) => {
            const existingIds = new Set(prev.map((obj) => obj.id));
            const newObjects = initialObjects.filter(
              (obj) => !existingIds.has(obj.id)
            );
            return [...prev, ...newObjects];
          });
        }
      } catch (error) {
        console.error('Failed to fetch initial objects:', error);
      }
    };

    // Perform initial fetch before setting up subscriptions
    performInitialObjectFetch();

    // Adaptive loading complete detection
    let connectionSubscriptionTimeoutId = null;
    // Timing variables tracked via refs

    // Start a longer timeout for connection subscriptions (they take longer to set up)
    const totalCells = loadedCells.length;
    const connectionTimeout = Math.max(2000, totalCells * 500); // 500ms per cell, minimum 2 seconds

    connectionSubscriptionTimeoutId = setTimeout(() => {
      setGlobalInitialLoading(false);
      // Objects might finish loading before connections, so keep object loading state
    }, connectionTimeout);

    // Separate shorter timeout for object loading
    const scheduleLoadingComplete = () => {
      clearObjectLoadingTimeout();

      setObjectLoadingTimeout(() => {
        currentSetIsInitialLoading(false);
      }, 1000); // Objects load faster than connections
    };
    const spaceToLoad = effectiveSpaceId;
    const ownerUserId = currentSpaceOwner || user?.uid;

    // Capture current refs and functions to avoid dependency issues
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
              // Check deletion blacklist before adding object
              // Import deletion status check dynamically to avoid circular dependencies
              try {
                // Check if object is in deletion blacklist
                if (window.getObjectDeletionStatus) {
                  const deletionStatus = window.getObjectDeletionStatus();
                  if (
                    deletionStatus &&
                    deletionStatus.deletingObjects.includes(
                      change.id.toString()
                    )
                  ) {
                    console.log(
                      `🚫 [App] Blocked re-adding object during deletion: ${change.id}`
                    );
                    return prev;
                  }
                }
              } catch (error) {
                // If deletion status check fails, continue with normal flow
                console.warn('Could not check deletion status:', error);
              }

              // Track object change for spatial operation detection
              if (window.trackObjectChange) {
                window.trackObjectChange(change.id, 'add');
              }

              // Clear transitioning flag if object is being re-added
              if (transitioningObjectsRef.current.has(change.id.toString())) {
                transitioningObjectsRef.current.delete(change.id.toString());
              }
              // Check if object is in an unloaded cell
              if (window._unloadedObjects?.has(change.id.toString())) {
                console.log(
                  `🚫 Blocked re-adding unloaded object: ${change.id}`
                );
                return prev;
              }

              if (!prev.find((obj) => obj.id === change.id)) {
                // Validate position before adding the object (accept both array and Vector3 formats)
                const hasValidPosition =
                  change.object?.position &&
                  ((Array.isArray(change.object.position) &&
                    change.object.position.length === 3 &&
                    change.object.position.every(
                      (val) => typeof val === 'number' && !isNaN(val)
                    )) ||
                    (typeof change.object.position === 'object' &&
                      'x' in change.object.position &&
                      'y' in change.object.position &&
                      'z' in change.object.position &&
                      typeof change.object.position.x === 'number' &&
                      typeof change.object.position.y === 'number' &&
                      typeof change.object.position.z === 'number' &&
                      !isNaN(change.object.position.x) &&
                      !isNaN(change.object.position.y) &&
                      !isNaN(change.object.position.z)));

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

                // Normalize position to array format if it's a Vector3 object
                if (
                  change.object.position &&
                  !Array.isArray(change.object.position)
                ) {
                  change.object.position = [
                    change.object.position.x,
                    change.object.position.y,
                    change.object.position.z,
                  ];
                }
                if (change.cellCoords && currentTrackObjectInCell) {
                  const cellId = `${change.cellCoords.x},${
                    change.cellCoords.y
                  },${change.cellCoords.z || 0}`;
                  currentTrackObjectInCell(change.id.toString(), cellId);
                } else if (change.object.position && currentTrackObjectInCell) {
                  // Calculate cell coordinates from object position
                  const cellCoords = getCellCoordinates(change.object.position);
                  const cellId = `${cellCoords.x},${cellCoords.y},${cellCoords.z}`;
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
                    ((Array.isArray(existingObj.position) &&
                      existingObj.position.length === 3 &&
                      existingObj.position.every(
                        (val) => typeof val === 'number' && !isNaN(val)
                      )) ||
                      (typeof existingObj.position === 'object' &&
                        'x' in existingObj.position &&
                        'y' in existingObj.position &&
                        'z' in existingObj.position &&
                        typeof existingObj.position.x === 'number' &&
                        typeof existingObj.position.y === 'number' &&
                        typeof existingObj.position.z === 'number' &&
                        !isNaN(existingObj.position.x) &&
                        !isNaN(existingObj.position.y) &&
                        !isNaN(existingObj.position.z)));

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
                // Validate position before accepting the change (accept both array and Vector3 formats)
                const hasValidPosition =
                  change.object?.position &&
                  ((Array.isArray(change.object.position) &&
                    change.object.position.length === 3 &&
                    change.object.position.every(
                      (val) => typeof val === 'number' && !isNaN(val)
                    )) ||
                    (typeof change.object.position === 'object' &&
                      'x' in change.object.position &&
                      'y' in change.object.position &&
                      'z' in change.object.position &&
                      typeof change.object.position.x === 'number' &&
                      typeof change.object.position.y === 'number' &&
                      typeof change.object.position.z === 'number' &&
                      !isNaN(change.object.position.x) &&
                      !isNaN(change.object.position.y) &&
                      !isNaN(change.object.position.z)));

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

                // Normalize position to array format if it's a Vector3 object
                if (
                  change.object.position &&
                  !Array.isArray(change.object.position)
                ) {
                  change.object.position = [
                    change.object.position.x,
                    change.object.position.y,
                    change.object.position.z,
                  ];
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

              // For cell unloads, remove the object immediately
              if (change.source === 'cell-unload') {
                if (change.cellCoords && currentUntrackObjectInCell) {
                  const cellId = `${change.cellCoords.x},${
                    change.cellCoords.y
                  },${change.cellCoords.z || 0}`;
                  currentUntrackObjectInCell(change.id.toString(), cellId);
                }
                delete currentLastUpdateRef.current[change.id];
                return prev.filter((obj) => obj.id.toString() !== change.id);
              }

              // For other removals (like deletions), use transitioning behavior
              transitioningObjectsRef.current.add(change.id.toString());
              setTimeout(() => {
                if (transitioningObjectsRef.current.has(change.id.toString())) {
                  transitioningObjectsRef.current.delete(change.id.toString());
                  currentSetObjects((current) =>
                    current.filter((obj) => obj.id.toString() !== change.id)
                  );
                }
              }, 500); // Reduced from 2000ms to 500ms for non-cell-unload cases

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
      clearLoadingTimeout();
      if (connectionSubscriptionTimeoutId) {
        clearTimeout(connectionSubscriptionTimeoutId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (cameraRef.current) {
      window.camera = cameraRef.current;
    }
  }, []); // Only run once on mount

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
          checkPositionJitterWithHistory(id, updates.position)
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
      checkPositionJitterWithHistory,
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
  );

  // Canvas click handler - memoized to prevent re-creation
  const handleCanvasClick = useCallback(() => {
    // Close any active text styling menus
    setActiveTextStyleUI(null);
    setSelectedConnection(null);
    setShowLineTextStyleUI(null);
    setSelectedId(null);

    // Close line text input using connection store
    const setShowLineTextInput =
      useConnectionStore.getState().setShowLineTextInput;
    setShowLineTextInput(null);

    // Batch DOM updates for better performance
    requestAnimationFrame(() => {
      // Close TextStyleUI for all objects
      objects.forEach((obj) => {
        if (obj.type === 'plane') {
          setPlaneShowTextStyleUI(obj.id, false);
          setPlaneShowHeaderStyleUI(obj.id, false);
        } else if (obj.type === 'cube') {
          setCubeShowHeaderTextStyleUI(obj.id, false);
        } else if (obj.type === 'tetrahedron') {
          setTetrahedronShowHeaderTextStyleUI(obj.id, false);
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
    });
  }, [
    setActiveTextStyleUI,
    setSelectedConnection,
    setShowLineTextStyleUI,
    setSelectedId,
    objects,
    setPlaneShowTextStyleUI,
    setPlaneShowHeaderStyleUI,
    setCubeShowHeaderTextStyleUI,
    setTetrahedronShowHeaderTextStyleUI,
    setDodecahedronShowStyleMenu,
    setDodecahedronShowFaceTextStyleMenu,
    isConnectMode,
    selectedIndicators,
    setSelectedIndicators,
    selectedIndicatorsRef,
  ]); // Virtualized object rendering with LOD
  const [visibleObjectIds, setVisibleObjectIds] = useState(new Set());
  const [cameraDistance, setCameraDistance] = useState(50);

  // Update visible objects based on camera frustum
  const updateVisibleObjects = useCallback(
    (camera) => {
      if (!camera || objects.length === 0) return;

      // Calculate camera distance for LOD
      const distance = camera.position.length();
      setCameraDistance(distance);

      // Use virtualization to get visible objects, coordinating with spatial partitioning
      const loadedCellsSet =
        loadedCells && Array.isArray(loadedCells) ? new Set(loadedCells) : null;
      const visible = objectVirtualizer.updateVisibility(
        camera,
        objects,
        loadedCellsSet
      );
      setVisibleObjectIds(new Set(visible));
    },
    [objects, loadedCells]
  );
  // Throttled visibility update - fix throttle dependency
  const throttledUpdateVisibility = useMemo(
    () => throttle((camera) => updateVisibleObjects(camera), 100),
    [updateVisibleObjects]
  );

  // Update visible objects when camera moves
  useEffect(() => {
    if (cameraRef.current?.camera) {
      // Initial visibility update
      updateVisibleObjects(cameraRef.current.camera);

      // Set up camera update listener
      const camera = cameraRef.current.camera;
      const controls = cameraRef.current.orbitControls;

      if (controls) {
        const handleCameraUpdate = () => {
          throttledUpdateVisibility(camera);
        };

        controls.addEventListener('change', handleCameraUpdate);

        return () => {
          controls.removeEventListener('change', handleCameraUpdate);
        };
      }
    }
  }, [
    cameraRef.current?.camera,
    cameraRef.current?.orbitControls,
    throttledUpdateVisibility,
    updateVisibleObjects,
  ]);
  // Initial setup for all objects to be visible if no camera yet or if objects changed
  // Debounced to prevent infinite loops during rapid object creation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (objects.length > 0) {
        // Always ensure all objects are in the visible set initially
        // This prevents objects from disappearing due to virtualization timing issues
        const allObjectIds = new Set(objects.map((obj) => obj.id));
        setVisibleObjectIds(allObjectIds);
      }
    }, 100); // 100ms debounce

    return () => clearTimeout(timeoutId);
  }, [objects]);

  // Memoize expensive object rendering operations with virtualization
  const renderedObjects = useMemo(() => {
    // Filter objects to only render visible ones
    const visibleObjects = objects.filter((obj) =>
      visibleObjectIds.has(obj.id)
    );

    // Determine LOD based on camera distance
    const useLOD = cameraDistance > 100;

    return visibleObjects.map((obj) => (
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
        selectedIndicators={selectedIndicators}
        activeTextStyleUI={activeTextStyleUI}
        setActiveTextStyleUI={setActiveTextStyleUI}
        handleIndicatorDeselected={handleIndicatorDeselected}
        registerTransformingObject={registerTransformingObject}
        getTransformStartPosition={getTransformStartPosition}
        handleObjectMatrixChanged={handleObjectMatrixChanged}
        handleIndicatorSelected={handleIndicatorSelected}
        globalIndicatorSelected={globalIndicatorSelected}
        handleObjectDelete={handleObjectDelete}
        checkPositionJitter={checkPositionJitterWithHistory}
        user={user}
        currentSpaceId={effectiveSpaceId}
        useLOD={useLOD}
      />
    ));
  }, [
    objects,
    visibleObjectIds,
    cameraDistance,
    selectedId,
    handleObjectClick,
    handleObjectMoveCallback,
    handleObjectUpdateCallback,
    disableOrbitControls,
    enableOrbitControls,
    handleFaceIndicatorClickCallback,
    handleFaceClick,
    showAllCubesIndicators,
    activeIndicator,
    indicatorMode,
    selectedIndicators,
    activeTextStyleUI,
    setActiveTextStyleUI,
    handleIndicatorDeselected,
    registerTransformingObject,
    getTransformStartPosition,
    handleObjectMatrixChanged,
    handleIndicatorSelected,
    globalIndicatorSelected,
    handleObjectDelete,
    checkPositionJitterWithHistory,
    user,
    effectiveSpaceId,
  ]);

  // Lazy load state for Canvas
  const [shouldRenderCanvas, setShouldRenderCanvas] = useState(false);

  // Progressive canvas quality enhancement
  const [canvasQuality, setCanvasQuality] = useState('low');
  useEffect(() => {
    if (shouldRenderCanvas) {
      // Upgrade canvas quality after initial render
      const upgradeQuality = () => {
        setCanvasQuality('high');
        localStorage.setItem('canvasQuality', 'high');
      };

      // Wait for initial render to complete, then upgrade
      const timeoutId = setTimeout(upgradeQuality, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [shouldRenderCanvas]);

  // Get canvas settings based on quality level
  const getCanvasSettings = () => {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    const isLowEnd =
      navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4;

    // Force mobile devices to use mobile-optimized settings regardless of canvasQuality
    if (isMobile) {
      return {
        gl: {
          antialias: false,
          samples: 0,
          alpha: true,
          stencil: false,
          depth: true,
          logarithmicDepthBuffer: false,
          powerPreference: 'default',
          precision: 'mediump', // Use mediump for mobile
        },
        dpr: Math.min(window.devicePixelRatio, 2),
        frameloop: 'always',
        camera: {
          fov: 70, // Wider FOV on mobile for better object visibility
          near: 0.01, // Closer near plane on mobile
          far: 10000,
          position: [0, 0, 30], // Closer starting position on mobile
        },
      };
    } else if (canvasQuality === 'low' || isLowEnd) {
      return {
        gl: {
          antialias: false,
          samples: 0,
          alpha: true,
          stencil: false,
          depth: true,
          logarithmicDepthBuffer: false,
          powerPreference: 'high-performance',
          precision: 'highp', // Use highp for desktop low-end
        },
        dpr: Math.min(window.devicePixelRatio, 2),
        frameloop: 'always',
        camera: {
          fov: 50,
          near: 0.1,
          far: 10000,
          position: [0, 0, 50],
        },
      };
    } else {
      return {
        gl: {
          antialias: true,
          samples: 4,
          alpha: true,
          stencil: false,
          depth: true,
          logarithmicDepthBuffer: false,
          powerPreference: 'high-performance',
          precision: 'highp', // Use highp for high-quality rendering
        },
        dpr: Math.min(window.devicePixelRatio, 2),
        frameloop: 'always',
        camera: {
          fov: 50,
          near: 0.1,
          far: 2000,
        },
      };
    }
  };
  // Mobile performance optimization
  useEffect(() => {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    const isLowEnd =
      navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4;

    if (isMobile || isLowEnd) {
      // Keep mobile devices on low quality to ensure proper rendering
      setCanvasQuality('low');
      localStorage.setItem('canvasQuality', 'low');
    } else {
      // Only allow quality upgrades on desktop/high-end devices
      const upgradeTimer = setTimeout(() => {
        setCanvasQuality('high');
        localStorage.setItem('canvasQuality', 'high');
      }, 1000);

      return () => clearTimeout(upgradeTimer);
    }
  }, []);

  const canvasSettings = getCanvasSettings();

  // Initialize Canvas rendering after initial auth/space setup
  useEffect(() => {
    if (canViewSpace && (isAuthReady || publicSpaceId)) {
      // Defer canvas rendering to next frame for better LCP
      requestAnimationFrame(() => {
        setShouldRenderCanvas(true);
      });
    }
  }, [canViewSpace, isAuthReady, publicSpaceId]);

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
    console.log('🔍 [App] Showing loading screen for public space lookup');
    return <div className="loading">Loading public space...</div>;
  }

  if (shouldRedirect) {
    console.log('🔄 [App] Triggering redirect due to !canViewSpace');
    // Clear any existing redirect timeout and schedule new one
    clearRedirectTimeout();
    setRedirectTimeout(() => {
      console.log('🔄 [App] Executing redirect to volscape.com');
      window.location.href = 'https://volscape.com/';
    }, 0);
    return <div className="loading">Redirecting...</div>;
  }

  // Clear redirect timeout if canViewSpace becomes true
  clearRedirectTimeout();
  return (
    <>
      {/* Show a minimal loading UI while Canvas is being prepared */}
      {!shouldRenderCanvas && canViewSpace && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: backgroundColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: '#666',
          }}
        >
          Initializing 3D space...
        </div>
      )}{' '}
      {shouldRenderCanvas && (
        <Canvas
          style={{
            background: backgroundColor,
            width: '100vw',
            height: '100vh',
            position: 'fixed',
            top: 0,
            left: 0,
            touchAction: 'none', // Enable touch gestures for mobile
          }}
          onPointerMissed={handleCanvasClick}
          onCreated={() => {
            console.log('🎨 Canvas created successfully');
          }}
          onError={(error) => {
            console.error('🚨 Canvas error (WebGL issue):', error);
            // Don't redirect on WebGL errors - show fallback UI instead
          }}
          {...canvasSettings}
        >
          {' '}
          <CustomCamera ref={cameraRef} />
          <group>
            {/* Real-time connection position updater - reactive to store changes */}
            <RealTimeConnectionUpdater />{' '}
            {/* Render connections with virtualization */}
            <ConnectionsRenderer
              objects={objects}
              allObjectsForPathfinding={objects}
              visibleObjectIds={visibleObjectIds}
              onLineStyleChange={handleLineStyleChange}
              onLineColorChange={handleLineColorChange}
              onConnectionClick={handleConnectionClick}
              onLineTextClick={handleLineTextClick}
              onLineTextSubmit={handleLineTextSubmit}
              onLineTextStyleChange={handleLineTextStyleChange}
            />{' '}
            {/* Render all objects */}
            {renderedObjects}
            {/* Render cell boundaries */}
            <CellBoundaryRenderer loadedCells={loadedCells} visible={true} />
          </group>
          <EffectComposer>
            <SMAA />
          </EffectComposer>
        </Canvas>
      )}
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
        currentSpaceId={effectiveSpaceId}
      />
    </>
  );
};

export default App;
