import { create } from 'zustand';
import * as THREE from 'three';
import {
  saveObjectToCell,
  deleteObjectFromSpatialCell,
} from '../services/spatialObjectsService';
import useConnectionStore from './connectionStore';

const useObjectsStore = create((set, get) => ({
  // State
  selectedId: null,
  objects: [],
  isInitialLoading: true,
  hasLoadedInitialObjects: false,

  // Internal tracking refs (stored as state for persistence)
  lastUpdate: {},
  draggingObjects: new Set(),
  lastSaved: null,
  createdObjectIds: new Set(),
  transformingObjects: new Set(),
  transformPositions: new Map(),
  transformLockTime: new Map(),
  positionHistory: new Map(),

  // Actions
  setSelectedId: (id) => {
    set({ selectedId: id });
  },
  setObjects: (objects) => {
    // Validate that objects is an array or a function that returns an array
    if (typeof objects === 'function') {
      // If it's a function, call it with current state
      const state = get();
      const currentObjects = Array.isArray(state.objects) ? state.objects : [];
      const newObjects = objects(currentObjects);
      if (Array.isArray(newObjects)) {
        // Filter out objects that belong to unloaded cells
        const filteredObjects = newObjects.filter((obj) => {
          const objId = obj.id?.toString();
          return !window._unloadedObjects?.has(objId);
        });
        set({ objects: filteredObjects });
      } else {
        set({ objects: [] }); // Fallback to empty array
      }
    } else if (Array.isArray(objects)) {
      // Filter out objects that belong to unloaded cells
      const filteredObjects = objects.filter((obj) => {
        const objId = obj.id?.toString();
        return !window._unloadedObjects?.has(objId);
      });
      set({ objects: filteredObjects });
    } else {
      set({ objects: [] }); // Fallback to empty array
    }
  },

  setIsInitialLoading: (loading) => {
    set({ isInitialLoading: loading });
  },

  setHasLoadedInitialObjects: (loaded) => {
    set({ hasLoadedInitialObjects: loaded });
  },

  // Internal tracking actions
  addDraggingObject: (id) => {
    const state = get();
    const newSet = new Set(state.draggingObjects);
    newSet.add(id?.toString());
    set({ draggingObjects: newSet });
  },

  removeDraggingObject: (id) => {
    const state = get();
    const newSet = new Set(state.draggingObjects);
    newSet.delete(id?.toString());
    set({ draggingObjects: newSet });
  },

  addTransformingObject: (id) => {
    const state = get();
    const newSet = new Set(state.transformingObjects);
    newSet.add(id?.toString());
    set({ transformingObjects: newSet });
  },

  removeTransformingObject: (id) => {
    const state = get();
    const newSet = new Set(state.transformingObjects);
    newSet.delete(id?.toString());
    set({ transformingObjects: newSet });
  },

  setTransformPosition: (id, position) => {
    const state = get();
    const newMap = new Map(state.transformPositions);
    newMap.set(id?.toString(), [...position]);
    set({ transformPositions: newMap });
  },

  removeTransformPosition: (id) => {
    const state = get();
    const newMap = new Map(state.transformPositions);
    newMap.delete(id?.toString());
    set({ transformPositions: newMap });
  },

  setTransformLockTime: (id, time) => {
    const state = get();
    const newMap = new Map(state.transformLockTime);
    newMap.set(id?.toString(), time);
    set({ transformLockTime: newMap });
  },

  removeTransformLockTime: (id) => {
    const state = get();
    const newMap = new Map(state.transformLockTime);
    newMap.delete(id?.toString());
    set({ transformLockTime: newMap });
  },

  setPositionHistory: (id, history) => {
    const state = get();
    const newMap = new Map(state.positionHistory);
    newMap.set(id?.toString(), history);
    set({ positionHistory: newMap });
  },

  addCreatedObjectId: (id) => {
    const state = get();
    const newSet = new Set(state.createdObjectIds);
    newSet.add(id?.toString());
    set({ createdObjectIds: newSet });
  },
  removeCreatedObjectId: (id) => {
    const state = get();
    const newSet = new Set(state.createdObjectIds);
    newSet.delete(id?.toString());
    set({ createdObjectIds: newSet });
  },

  // Initialize objects loading state
  initializeObjectsLoading: () => {
    const state = get();
    if (state.objects.length > 0 && !state.hasLoadedInitialObjects) {
      set({ hasLoadedInitialObjects: true });
      // DISABLED: Automatic timeout removed - isInitialLoading now controlled manually from App.jsx
      // setTimeout(() => {
      //   set({ isInitialLoading: false });
      //   console.log(
      //     '🔧 Initial object loading complete, enabling automatic saves'
      //   );
      // }, 2000); // 2 second grace period for initial loading
    }
  },

  // DISABLED: Periodic saving replaced with immediate saves when objects are modified
  saveObjectsPeriodically: () => {
    // Objects are now saved immediately when created/modified, no need for periodic saves
    return;
  },

  // DISABLED: Old periodic save logic that was incorrectly named
  _disabledPeriodicSaveLogic: async () => {
    // NOTE: This function was incorrectly saving all existing objects to the database
    // during app startup. The logic below has been commented out to prevent unnecessary
    // database writes when objects are loaded from the database during startup.

    return;

    /*
    const state = get();

    // Validate that objects is an array
    if (!Array.isArray(state.objects)) {
      set({ objects: [] }); // Reset to empty array
      return;
    }

    // Add debugging

    // Skip object saving if we're in read-only mode (public space)
    const isReadOnly =
      window.publicAccessSpace === currentSpaceId &&
      window.currentSpaceOwner &&
      window.currentSpaceOwner !== user?.uid;
    if (
      !user ||
      !Array.isArray(state.objects) ||
      !state.objects.length ||
      !currentSpaceId ||
      isReadOnly ||
      state.isInitialLoading
    ) {
      if (
        state.isInitialLoading &&
        Array.isArray(state.objects) &&
        state.objects.length > 0
      ) {
      }
      return;
    }
    if (isEqual(state.lastSaved, state.objects)) return;

    // Safely clone objects, filtering out any invalid entries
    try {
      const validObjects = state.objects.filter((obj) => {
        // More robust validation
        return (
          obj &&
          typeof obj === 'object' &&
          obj.id !== undefined &&
          obj.id !== null &&
          !Number.isNaN(obj.id)
        );
      });

      if (validObjects.length === 0) {
        set({ lastSaved: [] });
      } else {
        // Test if objects can be stringified before parsing
        const testString = JSON.stringify(validObjects);
        const clonedObjects = JSON.parse(testString);
        set({ lastSaved: clonedObjects });
      }
    } catch (error) {
      set({ lastSaved: [...state.objects.filter((obj) => obj && obj.id)] }); // Fallback to shallow copy with basic filtering
    }
    const spaceOwnerId = window.currentSpaceOwner || user.uid;

    // Only save objects that aren't currently being dragged or transformed
    state.objects.forEach((obj) => {
      if (!obj?.id) return; // Skip objects without valid IDs

      const objId = obj.id.toString();
      if (
        !state.draggingObjects.has(objId) &&
        !state.transformingObjects.has(objId)
      ) {
        saveObjectToCell(spaceOwnerId, currentSpaceId, obj);
      }
    });
    */
  },
  // Helper function to create object at a given position
  createObjectWithPosition: async (
    type,
    position,
    user,
    currentSpaceId,
    extraData = {}
  ) => {
    // DEBUG: Log incoming extraData

    // Create a truly unique ID with a UUID suffix
    const uniqueId =
      Date.now() + '-' + Math.random().toString(36).substring(2, 10);

    // Create object with type-specific defaults
    const newObject = {
      type,
      position: [position.x, position.y, position.z],
      id: uniqueId,
      scale: [1, 1, 1],
      ...(type === 'sphere'
        ? {
            lineColor: 'black',
            headerText: '',
            headerStyle: {
              fontSize: 1.5,
              color: 'black',
              underline: false,
            },
            faceColors: Array(12)
              .fill(null)
              .reduce((acc, _, idx) => {
                acc[idx] = null;
                return acc;
              }, {}),
            faceTexts: Array(12)
              .fill('')
              .reduce((acc, _, idx) => {
                acc[idx] = '';
                return acc;
              }, {}),
            faceTextStyles: Array(12)
              .fill(null)
              .reduce((acc, _, idx) => {
                acc[idx] = {
                  fontSize: 0.5,
                  color: 'black',
                  underline: false,
                };
                return acc;
              }, {}),
          }
        : type === 'cube'
        ? {
            color: '#000000',
            headerText: '',
            faceColors: {},
            faceTexts: {
              front: '',
              back: '',
              top: '',
              bottom: '',
              right: '',
              left: '',
            },
            textStyle: { fontSize: 1.5, color: 'black', underline: false },
          }
        : type === 'tetrahedron'
        ? {
            color: '#000000',
            headerText: '',
            faceColors: {},
            faceTexts: {
              front: '',
              back: '',
              left: '',
              right: '',
            },
            textStyle: { fontSize: 1.5, color: 'black', underline: false },
          }
        : type === 'dodecahedron'
        ? {
            color: '#000000',
            headerText: '',
            faceColors: {},
            faceTexts: Array(12)
              .fill('')
              .reduce((acc, _, idx) => {
                acc[idx] = '';
                return acc;
              }, {}),
            faceTextStyles: Array(12)
              .fill(null)
              .reduce((acc, _, idx) => {
                acc[idx] = {
                  fontSize: 0.5,
                  color: 'black',
                  underline: false,
                };
                return acc;
              }, {}),
            textStyle: { fontSize: 1.5, color: 'black', underline: false },
          }
        : type === 'plane'
        ? {
            borderStyle: 'solid',
            borderColor: 'black',
            lineThickness: 1,
            color: null,
            headerText: '',
            headerStyle: {
              fontSize: 1.5,
              color: 'black',
              underline: false,
            },
            faceText: '',
            faceTextStyle: {
              fontSize: 0.5,
              color: 'black',
              underline: false,
            },
          }
        : type === 'text'
        ? {
            text: '',
            textStyle: {
              fontSize: 32,
              color: 'black',
            },
            bulletPointMode: false,
          }
        : type === 'model'
        ? {
            modelUrl: extraData.modelUrl || '',
            rotation: extraData.rotation || [0, 0, 0],
          }
        : {}),
      // Merge any additional extraData
      ...extraData,
    };

    // DEBUG: Log final object

    // Add to tracking set and objects array in a single state update to prevent multiple renders
    const state = get();
    const currentObjects = state.objects || [];
    const newCreatedObjectIds = new Set(state.createdObjectIds);
    newCreatedObjectIds.add(uniqueId.toString());

    // Determine if we need to disable initial loading
    const shouldDisableInitialLoading = state.isInitialLoading;

    set({
      objects: [...currentObjects, newObject],
      createdObjectIds: newCreatedObjectIds,
      ...(shouldDisableInitialLoading && { isInitialLoading: false }),
    });

    // Log if we disabled initial loading

    // Save to database (this handles spatial partitioning automatically)
    const spaceOwnerId = window.currentSpaceOwner || user.uid;
    saveObjectToCell(spaceOwnerId, currentSpaceId, newObject);

    // Track object in spatial system for dynamic objects
    const spatialManagerStore = (await import('../stores/spatialManagerStore'))
      .default;
    const spatialManager = spatialManagerStore.getState();
    if (spatialManager.trackObjectInCell) {
      const { getCellCoordinates } = await import(
        '../services/spatialPartitioning'
      );
      const cellCoords = getCellCoordinates(position);
      const cellId = `${cellCoords.x},${cellCoords.y},${cellCoords.z}`;
      spatialManager.trackObjectInCell(uniqueId.toString(), cellId);
    }

    // Return the created object ID
    return uniqueId;
  },
  // Create a new object with a guaranteed unique ID
  handleCreateObject: (
    type,
    position = null,
    user,
    currentSpaceId,
    cameraRef,
    extraData = {}
  ) => {
    if (!user || !currentSpaceId) return null;

    try {
      // If a position is provided (e.g., from template creation), use it directly
      if (position && Array.isArray(position) && position.length >= 3) {
        const newPosition = new THREE.Vector3(
          position[0],
          position[1],
          position[2]
        );
        return get().createObjectWithPosition(
          type,
          newPosition,
          user,
          currentSpaceId,
          extraData
        );
      }

      // Try multiple approaches to access the camera
      let camera = null;

      // Approach 1: Use the passed cameraRef if available
      if (cameraRef?.current?.camera) {
        camera = cameraRef.current.camera;
      }
      // Approach 2: Try to access via window.orbitControls
      else if (window.orbitControls?.object) {
        camera = window.orbitControls.object;
      }
      // Approach 3: Check if there's a THREE.PerspectiveCamera in the scene
      else {
        // Create a position in front of where the camera would typically be
        const newPosition = new THREE.Vector3(0, 0, -75);
        return get().createObjectWithPosition(
          type,
          newPosition,
          user,
          currentSpaceId,
          extraData
        );
      }

      if (!camera) {
        return null;
      }

      // Create vectors for position calculation
      const cameraPos = new THREE.Vector3();
      camera.getWorldPosition(cameraPos);

      // Get camera's forward direction
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(camera.quaternion);

      // Calculate position in front of camera
      const distance = type === 'text' ? 50 : type === 'model' ? 50 : 75;
      const newPosition = new THREE.Vector3();
      newPosition.copy(cameraPos).add(direction.multiplyScalar(distance));

      return get().createObjectWithPosition(
        type,
        newPosition,
        user,
        currentSpaceId,
        extraData
      );
    } catch {
      // Fallback - create object at origin if all else fails
      const newPosition = new THREE.Vector3(0, 0, 0);
      return get().createObjectWithPosition(
        type,
        newPosition,
        user,
        currentSpaceId,
        extraData
      );
    }
  },
  // Clean up objects when cells unload
  cleanupUnloadedObjects: () => {
    const state = get();
    if (!Array.isArray(state.objects)) return;

    // Filter out any objects that belong to unloaded cells
    const filteredObjects = state.objects.filter((obj) => {
      const objId = obj.id?.toString();
      const shouldKeep = !window._unloadedObjects?.has(objId);
      return shouldKeep;
    });

    // Only update if we actually removed objects
    if (filteredObjects.length !== state.objects.length) {
      set({ objects: filteredObjects });
    }
  },

  // Delete an object and its connections
  handleObjectDelete: (id, user, currentSpaceId) => {
    if (!user || !currentSpaceId) return;

    const state = get();

    // Find the object to get its position for spatial deletion
    const objectToDelete = state.objects.find(
      (obj) => obj.id?.toString() === id?.toString()
    );

    // Update UI first for responsiveness - batch all state updates together
    const filteredObjects = state.objects.filter(
      (obj) => obj.id?.toString() !== id?.toString()
    );

    const newCreatedObjectIds = new Set(state.createdObjectIds);
    newCreatedObjectIds.delete(id?.toString());

    const stateUpdates = {
      objects: filteredObjects,
      createdObjectIds: newCreatedObjectIds,
    };

    if (state.selectedId === id) {
      stateUpdates.selectedId = null;
    }

    set(stateUpdates);

    // Also delete any connections attached to this object
    const objectIdStr = id?.toString() || '';

    // Always call the store method to remove connections, even if array is empty
    useConnectionStore
      .getState()
      .deleteConnectionsByObject(objectIdStr, currentSpaceId);

    // Connection deletion is now handled entirely by the connection store

    // Delete from database - IMPORTANT: Wait for deletion to complete
    const spaceOwnerId = window.currentSpaceOwner || user.uid;

    if (objectToDelete?.position) {
      // Use async/await to ensure deletion completes before proceeding
      (async () => {
        try {
          await deleteObjectFromSpatialCell(
            spaceOwnerId,
            currentSpaceId,
            id,
            objectToDelete.position
          );
        } catch {
          // Silently handle database deletion errors
        }
      })();
    }
  },
  // FIXED VERSION: Delete an object and its connections (prevents double deletion)
  handleObjectDeleteFixed: (id, user, currentSpaceId, connections) => {
    if (!user || !currentSpaceId || !id) return;

    const state = get();
    const objectIdStr = id?.toString() || '';

    // Prevent duplicate deletions
    if (
      window.currentlyDeletingObjects &&
      window.currentlyDeletingObjects.has(objectIdStr)
    ) {
      return;
    }

    // Mark this object as being deleted
    if (!window.currentlyDeletingObjects) {
      window.currentlyDeletingObjects = new Set();
    }
    window.currentlyDeletingObjects.add(objectIdStr);

    // Auto-cleanup after 10 seconds
    setTimeout(() => {
      if (window.currentlyDeletingObjects) {
        window.currentlyDeletingObjects.delete(objectIdStr);
      }
    }, 10000);

    // Find the object to get its position for spatial deletion
    const objectToDelete = state.objects.find(
      (obj) => obj.id.toString() === objectIdStr
    );

    if (!objectToDelete) {
      window.currentlyDeletingObjects?.delete(objectIdStr);
      return;
    }

    // Update UI first for responsiveness - ONLY remove the target object
    const filteredObjects = state.objects.filter(
      (obj) => obj.id.toString() !== objectIdStr
    );

    // Batch state updates together
    const stateUpdates = { objects: filteredObjects };
    if (state.selectedId === id) {
      stateUpdates.selectedId = null;
    }
    set(stateUpdates);

    // Delete connections for this object (should NOT delete other objects)

    // Try to get connections from the parameters first, then from the store
    let relatedConnections = [];
    if (connections && Array.isArray(connections)) {
      relatedConnections = connections.filter(
        (conn) =>
          conn.start?.objectId === objectIdStr ||
          conn.end?.objectId === objectIdStr
      );
    } else {
      // Fallback: get connections from the store directly
      const storeConnections = useConnectionStore.getState().connections;
      relatedConnections = storeConnections.filter(
        (conn) =>
          conn.start?.objectId === objectIdStr ||
          conn.end?.objectId === objectIdStr
      );
    }

    // Always call the store method to remove connections, even if array is empty
    useConnectionStore
      .getState()
      .deleteConnectionsByObject(objectIdStr, currentSpaceId);

    // Delete connections from database with enhanced error handling
    if (relatedConnections.length > 0) {
      const spaceOwnerId = window.currentSpaceOwner || user.uid;

      // Delete connections from database asynchronously
      (async () => {
        try {
          // Import the enhanced connection deletion service
          const { deleteConnection } = await import(
            '../services/connectionsService'
          );
          const { removeConnectionFromAllCells } = await import(
            '../services/spatialPartitioning'
          );

          const deletionResults = await Promise.all(
            relatedConnections.map(async (conn) => {
              let result = false;

              try {
                // First try the regular deletion service
                result = await deleteConnection(
                  spaceOwnerId,
                  currentSpaceId,
                  conn.id,
                  conn // Pass the connection data
                );

                if (!result) {
                  // If regular deletion failed, try the fallback method
                  result = await removeConnectionFromAllCells(
                    spaceOwnerId,
                    currentSpaceId,
                    conn.id
                  );
                }
              } catch {
                result = false;
              }

              return { connectionId: conn.id, success: result };
            })
          );

          const failCount = deletionResults.filter((r) => !r.success).length;

          if (failCount > 0) {
            // Log failed connections for debugging if needed
          }
        } catch {
          // Silently handle connection deletion errors
        }
      })();
    }

    // Delete the object from database
    const spaceOwnerId = window.currentSpaceOwner || user.uid;

    if (objectToDelete?.position) {
      // Use async/await to ensure deletion completes before proceeding
      (async () => {
        try {
          await deleteObjectFromSpatialCell(
            spaceOwnerId,
            currentSpaceId,
            objectIdStr,
            objectToDelete.position
          );

          // Clear the deletion flag
          window.currentlyDeletingObjects?.delete(objectIdStr);
        } catch {
          window.currentlyDeletingObjects?.delete(objectIdStr);
        }
      })();
    } else {
      window.currentlyDeletingObjects?.delete(objectIdStr);
    }
  },
  // Reset all object state
  resetObjects: () => {
    set({
      selectedId: null,
      objects: [],
      isInitialLoading: true,
      hasLoadedInitialObjects: false,
      lastUpdate: {},
      draggingObjects: new Set(),
      lastSaved: null,
      createdObjectIds: new Set(),
      transformingObjects: new Set(),
      transformPositions: new Map(),
      transformLockTime: new Map(),
      positionHistory: new Map(),
    });
  },
}));

export default useObjectsStore;
