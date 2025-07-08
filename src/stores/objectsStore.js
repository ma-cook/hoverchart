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
        set({ objects: newObjects });
      } else {
        set({ objects: [] }); // Fallback to empty array
      }
    } else if (Array.isArray(objects)) {
      const state = get();
      const currentObjects = Array.isArray(state.objects) ? state.objects : [];

      // Debug logging for object additions
      const addedObjects = objects.filter(
        (newObj) =>
          !currentObjects.some((currentObj) => currentObj.id === newObj.id)
      );
      if (addedObjects.length > 0) {
        console.log(
          `➕ [Objects Debug] Objects added via array:`,
          addedObjects.map((obj) => ({
            id: obj.id,
            type: obj.type,
            position: obj.position,
          }))
        );
      }

      set({ objects });
    } else {
      console.error(
        '❌ setObjects called with non-array, non-function:',
        objects
      );
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
    console.log('📝 Periodic save disabled - using immediate saves instead');
    return;
  },

  // DISABLED: Old periodic save logic that was incorrectly named
  _disabledPeriodicSaveLogic: async () => {
    // NOTE: This function was incorrectly saving all existing objects to the database
    // during app startup. The logic below has been commented out to prevent unnecessary
    // database writes when objects are loaded from the database during startup.

    console.log(
      '📝 _disabledPeriodicSaveLogic (old createObjectWithPosition) disabled'
    );
    return;

    /*
    const state = get();

    // Validate that objects is an array
    if (!Array.isArray(state.objects)) {
      console.error(
        '❌ state.objects is not an array in createObjectWithPosition:',
        typeof state.objects,
        state.objects
      );
      set({ objects: [] }); // Reset to empty array
      return;
    }

    // Add debugging
    console.log(
      '🔍 saveObjectsPeriodically called, state.objects length:',
      state.objects.length
    );

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
        console.log(
          '🔧 Skipping automatic save during initial loading phase, objects:',
          state.objects.length
        );
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
      console.warn(
        '⚠️ Failed to clone objects for lastSaved:',
        error,
        'state.objects:',
        state.objects
      );
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

    // Add to tracking set to prevent duplicate addition
    get().addCreatedObjectId(uniqueId); // Update local state first for immediate feedback
    const state = get();
    const currentObjects = state.objects || [];
    set({ objects: [...currentObjects, newObject] });

    // For user-created objects, enable saves immediately (bypass loading phase)
    if (state.isInitialLoading) {
      console.log(
        '🔧 User created object during loading phase, enabling saves'
      );
      set({ isInitialLoading: false });
    }

    // Save to database (this handles spatial partitioning automatically)
    const spaceOwnerId = window.currentSpaceOwner || user.uid;
    saveObjectToCell(spaceOwnerId, currentSpaceId, newObject);
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
    if (!user || !currentSpaceId) return;

    try {
      // If a position is provided (e.g., from template creation), use it directly
      if (position && Array.isArray(position) && position.length >= 3) {
        const newPosition = new THREE.Vector3(
          position[0],
          position[1],
          position[2]
        );
        get().createObjectWithPosition(
          type,
          newPosition,
          user,
          currentSpaceId,
          extraData
        );
        return;
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
        console.warn('Falling back to default camera position');
        // Create a position in front of where the camera would typically be
        const newPosition = new THREE.Vector3(0, 0, -75);
        get().createObjectWithPosition(
          type,
          newPosition,
          user,
          currentSpaceId,
          extraData
        );
        return;
      }

      if (!camera) {
        console.error('Could not find camera using any method');
        return;
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

      get().createObjectWithPosition(
        type,
        newPosition,
        user,
        currentSpaceId,
        extraData
      );
    } catch (err) {
      console.error('Error creating object:', err);
      // Fallback - create object at origin if all else fails
      const newPosition = new THREE.Vector3(0, 0, 0);
      get().createObjectWithPosition(
        type,
        newPosition,
        user,
        currentSpaceId,
        extraData
      );
    }
  },
  // Delete an object and its connections
  handleObjectDelete: (id, user, currentSpaceId, connections) => {
    if (!user || !currentSpaceId) return;

    const state = get();

    // Find the object to get its position for spatial deletion
    const objectToDelete = state.objects.find(
      (obj) => obj.id?.toString() === id?.toString()
    );
    console.log(`🗑️ [Delete Debug] Deleting object:`, {
      id: id?.toString(),
      objectToDelete,
      isInCreatedSet: state.createdObjectIds.has(id?.toString()),
      totalObjects: state.objects.length,
    });

    // Update UI first for responsiveness
    const filteredObjects = state.objects.filter(
      (obj) => obj.id?.toString() !== id?.toString()
    );
    set({ objects: filteredObjects });

    if (state.selectedId === id) {
      set({ selectedId: null });
    }

    // Also delete any connections attached to this object
    const objectIdStr = id?.toString() || '';

    console.log(
      `🗑️ [Delete Debug] Starting connection cleanup for object: ${objectIdStr}`
    );

    // Try to get connections from the parameters first, then from the store
    let relatedConnections = [];
    if (connections && Array.isArray(connections)) {
      console.log(
        `🗑️ [Delete Debug] Using connections from parameters (${connections.length} total)`
      );
      relatedConnections = connections.filter(
        (conn) =>
          conn.start?.objectId === objectIdStr ||
          conn.end?.objectId === objectIdStr
      );
    } else {
      console.log(
        `🗑️ [Delete Debug] No connections parameter, getting from store`
      );
      // Fallback: get connections from the store directly
      const storeConnections = useConnectionStore.getState().connections;
      console.log(
        `🗑️ [Delete Debug] Store has ${storeConnections.length} connections`
      );
      relatedConnections = storeConnections.filter(
        (conn) =>
          conn.start?.objectId === objectIdStr ||
          conn.end?.objectId === objectIdStr
      );
    }

    console.log(
      `🗑️ [Delete Debug] Found ${relatedConnections.length} connections to delete for object ${objectIdStr}:`,
      relatedConnections.map((c) => ({
        id: c.id,
        startObj: c.start?.objectId,
        endObj: c.end?.objectId,
      }))
    );

    // Always call the store method to remove connections, even if array is empty
    console.log(
      `🗑️ [Delete Debug] Calling deleteConnectionsByObject for: ${objectIdStr} in space: ${currentSpaceId}`
    );
    useConnectionStore
      .getState()
      .deleteConnectionsByObject(objectIdStr, currentSpaceId);

    // Connection deletion is now handled entirely by the connection store
    console.log(
      `✅ [Delete Debug] Connection deletion delegated to connection store`
    );

    // Remove from tracking set if present
    const wasInCreatedSet = state.createdObjectIds.has(id?.toString());
    get().removeCreatedObjectId(id);

    console.log(`🗑️ [Delete Debug] Before database deletion:`, {
      id: id?.toString(),
      wasInCreatedSet,
      hasPosition: !!objectToDelete?.position,
      position: objectToDelete?.position,
    });

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
          console.log(
            `✅ [Delete Debug] Successfully deleted from database:`,
            id?.toString()
          );
        } catch (error) {
          console.error(
            `❌ [Delete Debug] Failed to delete from database:`,
            id?.toString(),
            error
          );
        }
      })();
    } else {
      console.warn(
        `⚠️ [Delete Debug] No position found for object, skipping database deletion:`,
        id?.toString()
      );
    }
  },
  // FIXED VERSION: Delete an object and its connections (prevents double deletion)
  handleObjectDeleteFixed: (id, user, currentSpaceId, connections) => {
    if (!user || !currentSpaceId || !id) return;

    const state = get();
    const objectIdStr = id?.toString() || '';

    console.log(
      `🔧 [FIXED DELETE] Starting deletion for object: ${objectIdStr}`
    );

    // Prevent duplicate deletions
    if (
      window.currentlyDeletingObjects &&
      window.currentlyDeletingObjects.has(objectIdStr)
    ) {
      console.log(
        `⚠️ [FIXED DELETE] Object ${objectIdStr} already being deleted, skipping`
      );
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
        console.log(
          `🧹 [FIXED DELETE] Auto-cleared deletion flag for ${objectIdStr}`
        );
      }
    }, 10000);

    // Find the object to get its position for spatial deletion
    const objectToDelete = state.objects.find(
      (obj) => obj.id.toString() === objectIdStr
    );

    if (!objectToDelete) {
      console.log(`⚠️ [FIXED DELETE] Object ${objectIdStr} not found in store`);
      window.currentlyDeletingObjects?.delete(objectIdStr);
      return;
    }

    console.log(`🔧 [FIXED DELETE] Found object to delete:`, {
      id: objectToDelete.id,
      type: objectToDelete.type,
      position: objectToDelete.position,
    });

    // Update UI first for responsiveness - ONLY remove the target object
    const filteredObjects = state.objects.filter(
      (obj) => obj.id.toString() !== objectIdStr
    );

    console.log(
      `🔧 [FIXED DELETE] Removing object from UI store. Before: ${state.objects.length}, After: ${filteredObjects.length}`
    );

    set({ objects: filteredObjects });

    if (state.selectedId === id) {
      set({ selectedId: null });
    }

    // Delete connections for this object (should NOT delete other objects)
    console.log(
      `🔧 [FIXED DELETE] Starting connection cleanup for object: ${objectIdStr}`
    );

    // Try to get connections from the parameters first, then from the store
    let relatedConnections = [];
    if (connections && Array.isArray(connections)) {
      console.log(
        `🔧 [FIXED DELETE] Using connections from parameters (${connections.length} total)`
      );
      relatedConnections = connections.filter(
        (conn) =>
          conn.start?.objectId === objectIdStr ||
          conn.end?.objectId === objectIdStr
      );
    } else {
      console.log(
        `🔧 [FIXED DELETE] No connections parameter, getting from store`
      );
      // Fallback: get connections from the store directly
      const storeConnections = useConnectionStore.getState().connections;
      console.log(
        `🔧 [FIXED DELETE] Store has ${storeConnections.length} connections`
      );
      relatedConnections = storeConnections.filter(
        (conn) =>
          conn.start?.objectId === objectIdStr ||
          conn.end?.objectId === objectIdStr
      );
    }

    console.log(
      `🔧 [FIXED DELETE] Found ${relatedConnections.length} connections to delete for object ${objectIdStr}:`,
      relatedConnections.map((c) => ({
        id: c.id,
        startObj: c.start?.objectId,
        endObj: c.end?.objectId,
      }))
    );

    // Always call the store method to remove connections, even if array is empty
    console.log(
      `🔧 [FIXED DELETE] Calling deleteConnectionsByObject for: ${objectIdStr} in space: ${currentSpaceId}`
    );
    useConnectionStore
      .getState()
      .deleteConnectionsByObject(objectIdStr, currentSpaceId);

    // Delete connections from database with enhanced error handling
    if (relatedConnections.length > 0) {
      const spaceOwnerId = window.currentSpaceOwner || user.uid;
      console.log(
        `🔧 [FIXED DELETE] About to delete ${relatedConnections.length} connections from database:`,
        relatedConnections.map((c) => c.id)
      );

      // Delete connections from database asynchronously
      (async () => {
        try {
          console.log(
            `🔧 [FIXED DELETE] Starting database deletion for ${relatedConnections.length} connections`
          );

          // Import the enhanced connection deletion service
          const { deleteConnection } = await import(
            '../services/connectionsService'
          );
          const { removeConnectionFromAllCells } = await import(
            '../services/spatialPartitioning'
          );

          const deletionResults = await Promise.all(
            relatedConnections.map(async (conn) => {
              console.log(
                `🔧 [FIXED DELETE] Deleting connection ${conn.id} from database...`
              );

              let result = false;

              try {
                // First try the regular deletion service
                result = await deleteConnection(
                  spaceOwnerId,
                  currentSpaceId,
                  conn.id,
                  conn // Pass the connection data
                );

                console.log(
                  `🔧 [FIXED DELETE] Connection ${conn.id} deletion result:`,
                  result
                );

                if (!result) {
                  // If regular deletion failed, try the fallback method
                  console.log(
                    `🔧 [FIXED DELETE] Trying fallback deletion for connection ${conn.id}`
                  );
                  result = await removeConnectionFromAllCells(
                    spaceOwnerId,
                    currentSpaceId,
                    conn.id
                  );
                  console.log(
                    `🔧 [FIXED DELETE] Fallback deletion result for ${conn.id}:`,
                    result
                  );
                }
              } catch (error) {
                console.error(
                  `❌ [FIXED DELETE] Error deleting connection ${conn.id}:`,
                  error
                );
                result = false;
              }

              return { connectionId: conn.id, success: result };
            })
          );

          const successCount = deletionResults.filter((r) => r.success).length;
          const failCount = deletionResults.length - successCount;

          console.log(
            `✅ [FIXED DELETE] Database deletion completed: ${successCount} successful, ${failCount} failed`
          );

          if (failCount > 0) {
            const failedConnections = deletionResults.filter((r) => !r.success);
            console.error(
              `❌ [FIXED DELETE] Failed deletions:`,
              failedConnections
            );
          }
        } catch (error) {
          console.error(
            `❌ [FIXED DELETE] Error deleting connections from database:`,
            error
          );
        }
      })();
    } else {
      console.log(
        `🔧 [FIXED DELETE] No connections found to delete from database for object ${objectIdStr}`
      );
    }

    // Delete the object from database
    const spaceOwnerId = window.currentSpaceOwner || user.uid;

    if (objectToDelete?.position) {
      console.log(
        `🔧 [FIXED DELETE] Deleting object from database: ${objectIdStr}`
      );

      // Use async/await to ensure deletion completes before proceeding
      (async () => {
        try {
          await deleteObjectFromSpatialCell(
            spaceOwnerId,
            currentSpaceId,
            objectIdStr,
            objectToDelete.position
          );

          console.log(
            `✅ [FIXED DELETE] Successfully deleted object ${objectIdStr} from database`
          );

          // Clear the deletion flag
          window.currentlyDeletingObjects?.delete(objectIdStr);
        } catch (error) {
          console.error(
            `❌ [FIXED DELETE] Failed to delete object ${objectIdStr} from database:`,
            error
          );
          window.currentlyDeletingObjects?.delete(objectIdStr);
        }
      })();
    } else {
      console.warn(
        `⚠️ [FIXED DELETE] No position found for object ${objectIdStr}, skipping database deletion`
      );
      window.currentlyDeletingObjects?.delete(objectIdStr);
    }

    console.log(
      `✅ [FIXED DELETE] Deletion process completed for object ${objectIdStr}`
    );
  },
  // Reset all object state
  resetObjects: () => {
    console.log('🔄 [Reset Debug] Resetting objects store to initial state');
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
