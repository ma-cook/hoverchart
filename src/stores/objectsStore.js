import { create } from 'zustand';
import * as THREE from 'three';
import isEqual from 'lodash/isEqual';
import {
  saveObjectToCell,
  deleteObjectFromSpatialCell,
} from '../services/spatialObjectsService';
import { deleteConnection } from '../services/connectionsService';
import useConnectionStore from './connectionStore';

const useObjectsStore = create((set, get) => ({
  // State
  selectedId: null,
  objects: [],
  isInitialLoading: true,
  hasLoadedInitialObjects: false,
  recentlyDeletedObjects: new Map(), // Track recently deleted objects with timestamps
  deletedObjectTombstones: new Set(), // Permanent tombstone tracking for deleted objects

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
  addRecentlyDeletedObject: (id) => {
    const state = get();
    const newMap = new Map(state.recentlyDeletedObjects);
    newMap.set(id.toString(), Date.now());

    // Add to permanent tombstone tracking
    const newTombstones = new Set(state.deletedObjectTombstones);
    newTombstones.add(id.toString());

    set({
      recentlyDeletedObjects: newMap,
      deletedObjectTombstones: newTombstones,
    });

    // Store both recent and tombstone data in localStorage to persist across page reloads
    try {
      const persistentDeleted = JSON.parse(
        localStorage.getItem('recentlyDeletedObjects') || '{}'
      );
      persistentDeleted[id.toString()] = Date.now();
      localStorage.setItem(
        'recentlyDeletedObjects',
        JSON.stringify(persistentDeleted)
      );

      // Store tombstones permanently
      const tombstones = JSON.parse(
        localStorage.getItem('deletedObjectTombstones') || '[]'
      );
      if (!tombstones.includes(id.toString())) {
        tombstones.push(id.toString());
        localStorage.setItem(
          'deletedObjectTombstones',
          JSON.stringify(tombstones)
        );
      }
    } catch (error) {
      console.warn('Failed to persist deleted objects to localStorage:', error);
    }

    // Clean up old entries after a much longer time to prevent memory leaks
    // but still allow permanent tracking for connection filtering
    setTimeout(() => {
      const currentState = get();
      const updatedMap = new Map(currentState.recentlyDeletedObjects);
      updatedMap.delete(id.toString());
      set({ recentlyDeletedObjects: updatedMap });

      // Also clean up from localStorage (but keep tombstones)
      try {
        const persistentDeleted = JSON.parse(
          localStorage.getItem('recentlyDeletedObjects') || '{}'
        );
        delete persistentDeleted[id.toString()];
        localStorage.setItem(
          'recentlyDeletedObjects',
          JSON.stringify(persistentDeleted)
        );
      } catch (error) {
        console.warn('Failed to clean up localStorage deleted objects:', error);
      }
    }, 3600000); // 1 hour instead of 5 minutes - much longer window
  },
  isRecentlyDeleted: (id) => {
    const state = get();

    // First check permanent tombstones - if an object is tombstoned, it's permanently deleted
    if (state.deletedObjectTombstones.has(id.toString())) {
      console.log(
        `🪦 [Tombstone] Object ${id} is permanently deleted (in tombstone)`
      );
      return true;
    }

    // Also check localStorage for persistent tombstones across page reloads
    try {
      const tombstones = JSON.parse(
        localStorage.getItem('deletedObjectTombstones') || '[]'
      );
      if (tombstones.includes(id.toString())) {
        // Add back to memory set for faster future checks
        const newTombstones = new Set(state.deletedObjectTombstones);
        newTombstones.add(id.toString());
        set({ deletedObjectTombstones: newTombstones });

        console.log(
          `🪦 [Tombstone] Object ${id} is permanently deleted (from localStorage)`
        );
        return true;
      }
    } catch (error) {
      console.warn('Failed to check localStorage tombstones:', error);
    }

    // Fallback to time-based recent deletion check
    let deleteTime = state.recentlyDeletedObjects.get(id.toString());

    // Also check localStorage for persistent tracking across page reloads
    if (!deleteTime) {
      try {
        const persistentDeleted = JSON.parse(
          localStorage.getItem('recentlyDeletedObjects') || '{}'
        );
        deleteTime = persistentDeleted[id.toString()];

        // If found in localStorage, add back to memory map
        if (deleteTime) {
          const newMap = new Map(state.recentlyDeletedObjects);
          newMap.set(id.toString(), deleteTime);
          set({ recentlyDeletedObjects: newMap });
        }
      } catch (error) {
        console.warn(
          'Failed to check localStorage for recently deleted objects:',
          error
        );
      }
    }
    if (!deleteTime) return false;

    // Consider recently deleted for 1 hour - much longer than before
    // This prevents connections to deleted objects from reappearing
    const isDeleted = Date.now() - deleteTime < 3600000; // 1 hour

    if (isDeleted) {
      console.log(
        `🚫 [Objects Debug] Object ${id} is still recently deleted (${Math.round(
          (Date.now() - deleteTime) / 1000
        )}s ago)`
      );
    }

    return isDeleted;
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
  handleObjectDelete: (
    id,
    user,
    currentSpaceId,
    connections,
    setConnections
  ) => {
    if (!user || !currentSpaceId) return;

    const state = get();

    // Find the object to get its position for spatial deletion
    const objectToDelete = state.objects.find(
      (obj) => obj.id.toString() === id.toString()
    );
    console.log(`🗑️ [Delete Debug] Deleting object:`, {
      id: id.toString(),
      objectToDelete,
      isInCreatedSet: state.createdObjectIds.has(id.toString()),
      totalObjects: state.objects.length,
    });

    // Mark as recently deleted to prevent re-addition
    get().addRecentlyDeletedObject(id);

    // Update UI first for responsiveness
    const filteredObjects = state.objects.filter(
      (obj) => obj.id.toString() !== id.toString()
    );
    set({ objects: filteredObjects });

    if (state.selectedId === id) {
      set({ selectedId: null });
    }

    // Also delete any connections attached to this object
    if (connections && setConnections) {
      const objectIdStr = id.toString();
      const relatedConnections = connections.filter(
        (conn) =>
          conn.start?.objectId === objectIdStr ||
          conn.end?.objectId === objectIdStr
      ); // Remove from UI
      setConnections((prev) =>
        prev.filter(
          (conn) =>
            conn.start?.objectId !== objectIdStr &&
            conn.end?.objectId !== objectIdStr
        )
      ); // Also remove from connection store
      if (relatedConnections.length > 0) {
        try {
          relatedConnections.forEach((conn) => {
            useConnectionStore.getState().removeConnection(conn.id);
          });
        } catch (error) {
          console.warn('Failed to remove connections from store:', error);
        }
      } // Delete from database
      if (relatedConnections.length > 0) {
        const spaceOwnerId = window.currentSpaceOwner || user.uid;
        console.log(
          `🗑️ [Delete Debug] About to delete ${relatedConnections.length} connections from database:`,
          relatedConnections.map((c) => c.id)
        );

        // Delete connections from database asynchronously
        (async () => {
          try {
            await Promise.all(
              relatedConnections.map(async (conn) => {
                console.log(
                  `🗑️ [Delete Debug] Deleting connection ${conn.id} from database...`
                );
                const result = await deleteConnection(
                  spaceOwnerId,
                  currentSpaceId,
                  conn.id
                );
                console.log(
                  `🗑️ [Delete Debug] Connection ${conn.id} deletion result:`,
                  result
                );
                return result;
              })
            );
            console.log(
              `✅ [Delete Debug] Successfully deleted ${relatedConnections.length} connections from database`
            );
          } catch (error) {
            console.error(
              `❌ [Delete Debug] Error deleting connections from database:`,
              error
            );
          }
        })();
      }
    } // Remove from tracking set if present
    const wasInCreatedSet = state.createdObjectIds.has(id.toString());
    get().removeCreatedObjectId(id);

    console.log(`🗑️ [Delete Debug] Before database deletion:`, {
      id: id.toString(),
      wasInCreatedSet,
      hasPosition: !!objectToDelete?.position,
      position: objectToDelete?.position,
    }); // Delete from database - IMPORTANT: Wait for deletion to complete
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
            id.toString()
          );
          // Additional verification: wait a moment then check if object still exists
          setTimeout(async () => {
            try {
              const { findObjectInCells } = await import(
                '../services/spatialPartitioning'
              );
              const found = await findObjectInCells(
                spaceOwnerId,
                currentSpaceId,
                id.toString()
              );
              if (found) {
                console.error(
                  `❌ [Delete Debug] VERIFICATION FAILED: Object ${id} still exists in database after deletion!`,
                  found
                );

                // Try deletion one more time with more aggressive approach
                console.log(
                  `🔄 [Delete Debug] Attempting final deletion for object ${id}`
                );
                try {
                  // Import and use the direct database deletion function
                  const { deleteObjectFromCell } = await import(
                    '../services/spatialPartitioning'
                  );
                  await deleteObjectFromCell(
                    spaceOwnerId,
                    currentSpaceId,
                    id.toString(),
                    objectToDelete.position
                  );

                  // Final verification after aggressive retry
                  setTimeout(async () => {
                    const finalFound = await findObjectInCells(
                      spaceOwnerId,
                      currentSpaceId,
                      id.toString()
                    );
                    if (finalFound) {
                      console.error(
                        `❌ [Delete Debug] FINAL VERIFICATION FAILED: Object ${id} still exists after aggressive retry!`
                      );
                    } else {
                      console.log(
                        `✅ [Delete Debug] FINAL VERIFICATION PASSED: Object ${id} successfully deleted after retry`
                      );
                    }
                  }, 1500);
                } catch (retryError) {
                  console.error(
                    `❌ [Delete Debug] Final deletion retry failed for object ${id}:`,
                    retryError
                  );
                }
              } else {
                console.log(
                  `✅ [Delete Debug] VERIFICATION PASSED: Object ${id} confirmed deleted from database`
                );
              }
            } catch (verifyError) {
              console.warn(
                `⚠️ [Delete Debug] Could not verify deletion of object ${id}:`,
                verifyError
              );
            }
          }, 2000); // Wait 2 seconds for Firebase to propagate changes
        } catch (error) {
          console.error(
            `❌ [Delete Debug] Failed to delete from database:`,
            id.toString(),
            error
          );

          // If deletion failed, remove from recently deleted to allow UI re-addition
          const state = get();
          const updatedMap = new Map(state.recentlyDeletedObjects);
          updatedMap.delete(id.toString());
          set({ recentlyDeletedObjects: updatedMap });
        }
      })();
    } else {
      console.warn(
        `⚠️ [Delete Debug] No position found for object, skipping database deletion:`,
        id.toString()
      );
    }
  },

  // Enhanced transform tracking with robust locking and position history
  registerTransformingObject: (id, isTransforming, position) => {
    const objId = id?.toString();
    if (!objId) return;

    const now = Date.now();
    const state = get();

    if (isTransforming) {
      // Mark as transforming
      get().addTransformingObject(objId);

      // Store current position to help resolve conflicts later
      if (position) {
        get().setTransformPosition(objId, position);
        // Also store in position history to detect jitter oscillations
        get().setPositionHistory(objId, {
          position: [...position],
          timestamp: now,
        });
      } else {
        // Find existing position from objects array
        const obj = state.objects.find((o) => o.id.toString() === objId);
        if (obj?.position) {
          get().setTransformPosition(objId, obj.position);
          get().setPositionHistory(objId, {
            position: [...obj.position],
            timestamp: now,
          });
        }
      }

      // Store transform start time
      get().setTransformLockTime(objId, now); // Block any db updates for this object
      get().addDraggingObject(objId); // Connection updates are now handled by the connection store/real-time updater

      // Freeze object to prevent any subscription updates during transform
      const updatedObjects = state.objects.map((obj) => {
        if (obj.id.toString() === objId) {
          return {
            ...obj,
            _transformLocked: true,
            _lockTime: now,
            _positionLocked: true,
          };
        }
        return obj;
      });
      set({ objects: updatedObjects });
    } else {
      // On transform end
      const lockTime = state.transformLockTime.get(objId) || 0;

      // Keep transform locked briefly to prevent jitter
      setTimeout(() => {
        const currentState = get();
        // Check if another transform hasn't started
        if (currentState.transformLockTime.get(objId) === lockTime) {
          get().removeTransformingObject(objId);
          get().removeTransformLockTime(objId);

          // Get final position before unlocking
          const finalPosition = currentState.transformPositions.get(objId);
          get().removeTransformPosition(objId); // Save final position to position history to prevent jitter
          if (finalPosition) {
            get().setPositionHistory(objId, {
              position: [...finalPosition],
              timestamp: now,
              isFinal: true,
            });
          }

          // Connection unlocking is now handled by the connection store/real-time updater

          // Remove transform lock flag from object
          const newState = get();
          const updatedObjects = newState.objects.map((obj) => {
            if (obj.id.toString() === objId) {
              const newObj = { ...obj };
              delete newObj._transformLocked;
              delete newObj._lockTime;
              delete newObj._positionLocked;

              // Update position one final time if it changed
              if (finalPosition && !isEqual(newObj.position, finalPosition)) {
                newObj.position = [...finalPosition];
                newObj._positionConfirmed = now;
              }

              return newObj;
            }
            return obj;
          });
          set({ objects: updatedObjects });

          // Extend dragging block slightly after transform ends
          setTimeout(() => {
            get().removeDraggingObject(objId);
          }, 300);
        }
      }, 150);
    }
  },

  // Helper function to calculate new connection position after object move
  calculateNewConnectionPosition: (connectionEnd, newObjectPosition) => {
    if (!connectionEnd?.faceCenter) return null;

    try {
      // Re-calculate position based on new object position
      const faceCenter = connectionEnd.faceCenter || [0, 0, 0];
      const worldPos = new THREE.Vector3(...faceCenter);
      const worldMatrix = new THREE.Matrix4()
        .makeScale(...(connectionEnd.cube?.scale || [1, 1, 1]))
        .setPosition(
          newObjectPosition[0],
          newObjectPosition[1],
          newObjectPosition[2]
        );
      worldPos.applyMatrix4(worldMatrix);

      // Return new position as array
      return [worldPos.x, worldPos.y, worldPos.z];
    } catch (err) {
      console.error('Error calculating connection position:', err);
      return null;
    }
  },

  // Check if a received position update is likely jitter/oscillation
  checkPositionJitter: (objId, newPosition) => {
    const state = get();
    const history = state.positionHistory.get(objId?.toString());
    if (!history) return false;

    // If this position is very close to a recent confirmed position, it's likely jitter
    const dist = history.position.reduce(
      (acc, val, idx) => acc + Math.pow(val - newPosition[idx], 2),
      0
    );

    // If squared distance is very small and the history is recent, consider it jitter
    const isVeryClose = Math.sqrt(dist) < 0.05; // Threshold for "close enough"
    const isRecentHistory = Date.now() - history.timestamp < 2000; // Within 2 seconds

    return isVeryClose && isRecentHistory;
  },

  // Expose previous position for transform operations
  getTransformStartPosition: (id) => {
    if (!id) return null;
    const state = get();
    return state.transformPositions.get(id.toString());
  },

  // Reset all object state
  resetObjects: () => {
    console.log('🔄 [Reset Debug] Resetting objects store to initial state');
    set({
      selectedId: null,
      objects: [],
      isInitialLoading: true,
      hasLoadedInitialObjects: false,
      recentlyDeletedObjects: new Map(),
      deletedObjectTombstones: new Set(),
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

  // Tombstone system utilities
  initializeTombstones: () => {
    try {
      const tombstones = JSON.parse(
        localStorage.getItem('deletedObjectTombstones') || '[]'
      );
      if (tombstones.length > 0) {
        console.log(
          `🪦 [Tombstone] Loaded ${tombstones.length} tombstones from localStorage`
        );
        set({ deletedObjectTombstones: new Set(tombstones) });
      }
    } catch (error) {
      console.warn('Failed to initialize tombstones from localStorage:', error);
    }
  },

  clearTombstone: (id) => {
    const state = get();
    const newTombstones = new Set(state.deletedObjectTombstones);
    newTombstones.delete(id.toString());
    set({ deletedObjectTombstones: newTombstones });

    // Also remove from localStorage
    try {
      const tombstones = JSON.parse(
        localStorage.getItem('deletedObjectTombstones') || '[]'
      );
      const filteredTombstones = tombstones.filter((t) => t !== id.toString());
      localStorage.setItem(
        'deletedObjectTombstones',
        JSON.stringify(filteredTombstones)
      );
      console.log(`🪦 [Tombstone] Cleared tombstone for object ${id}`);
    } catch (error) {
      console.warn('Failed to clear tombstone from localStorage:', error);
    }
  },

  clearAllTombstones: () => {
    set({ deletedObjectTombstones: new Set() });
    try {
      localStorage.removeItem('deletedObjectTombstones');
      console.log('🪦 [Tombstone] Cleared all tombstones');
    } catch (error) {
      console.warn('Failed to clear all tombstones from localStorage:', error);
    }
  },
}));

export default useObjectsStore;
