import { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three'; // Add THREE import
import isEqual from 'lodash/isEqual';
import {
  saveObjectToCell,
  deleteObjectFromSpatialCell,
} from '../services/spatialObjectsService';
import { deleteConnection } from '../services/connectionsService';

/**
 * Custom hook to manage objects state and operations
 */
export function useObjects({
  user,
  currentSpaceId,
  cameraRef,
  connections,
  setConnections,
  objects, // Now passed from parent
  setObjects, // Now passed from parent
  addObjectToSpatialSystem, // Spatial partitioning function
}) {
  const [selectedId, setSelectedId] = useState(null);

  // References for optimizing updates
  const lastUpdateRef = useRef({});
  const draggingObjectsRef = useRef(new Set());
  const lastSavedRef = useRef(null);
  const createdObjectIds = useRef(new Set()); // Track locally created object IDs
  const transformingObjectsRef = useRef(new Set()); // Track objects being transformed
  const transformPositionsRef = useRef(new Map()); // Track positions during transforms
  const transformLockTimeRef = useRef(new Map()); // Track when transforms started
  const positionHistoryRef = useRef(new Map()); // Track recent positions to prevent oscillation

  // Save objects periodically with transform prevention - skip for read-only
  useEffect(() => {
    // Skip object saving if we're in read-only mode (public space)
    const isReadOnly =
      window.publicAccessSpace === currentSpaceId &&
      window.currentSpaceOwner &&
      window.currentSpaceOwner !== user?.uid;

    if (!user || !objects?.length || !currentSpaceId || isReadOnly) return;

    const saveTimeout = setTimeout(() => {
      if (isEqual(lastSavedRef.current, objects)) return;

      lastSavedRef.current = JSON.parse(JSON.stringify(objects));
      const spaceOwnerId = window.currentSpaceOwner || user.uid;
      // Only save objects that aren't currently being dragged or transformed
      objects.forEach((obj) => {
        if (!obj?.id) return; // Skip objects without valid IDs

        const objId = obj.id.toString();
        if (
          !draggingObjectsRef.current.has(objId) &&
          !transformingObjectsRef.current.has(objId)
        ) {
          saveObjectToCell(spaceOwnerId, currentSpaceId, obj);
        }
      });
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [objects, user, currentSpaceId]);

  // Helper function to create object at a given position
  const createObjectWithPosition = useCallback(
    async (type, position) => {
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
          : {}),
      };

      // Add to tracking set to prevent duplicate addition
      createdObjectIds.current.add(uniqueId.toString());

      // Update local state first for immediate feedback
      setObjects((prev) => [...prev, newObject]);

      // Save to database
      const spaceOwnerId = window.currentSpaceOwner || user.uid;
      saveObjectToCell(spaceOwnerId, currentSpaceId, newObject);

      // Add object to spatial partitioning system
      if (addObjectToSpatialSystem) {
        try {
          const success = await addObjectToSpatialSystem(
            uniqueId,
            newObject.position
          );
          if (success) {
            console.log(
              `Object ${uniqueId} added to spatial system at position`,
              newObject.position
            );
          } else {
            console.warn(`Failed to add object ${uniqueId} to spatial system`);
          }
        } catch (error) {
          console.error('Error adding object to spatial system:', error);
        }
      }
    },
    [user, currentSpaceId, setObjects, addObjectToSpatialSystem]
  );

  // Create a new object with a guaranteed unique ID
  const handleCreateObject = useCallback(
    (type) => {
      if (!user || !currentSpaceId) return;

      try {
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
          createObjectWithPosition(type, newPosition);
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
        const distance = type === 'text' ? 50 : 75;
        const newPosition = new THREE.Vector3();
        newPosition.copy(cameraPos).add(direction.multiplyScalar(distance));

        createObjectWithPosition(type, newPosition);
      } catch (err) {
        console.error('Error creating object:', err);

        // Fallback - create object at origin if all else fails
        const newPosition = new THREE.Vector3(0, 0, 0);
        createObjectWithPosition(type, newPosition);
      }
    },
    [user, currentSpaceId, cameraRef, createObjectWithPosition]
  );

  // Delete an object and its connections
  const handleObjectDelete = useCallback(
    (id) => {
      if (!user || !currentSpaceId) return;

      // Find the object to get its position for spatial deletion
      const objectToDelete = objects.find(
        (obj) => obj.id.toString() === id.toString()
      );

      // Update UI first for responsiveness
      setObjects((prev) =>
        prev.filter((obj) => obj.id.toString() !== id.toString())
      );

      if (selectedId === id) {
        setSelectedId(null);
      }

      // Also delete any connections attached to this object
      if (connections && setConnections) {
        const objectIdStr = id.toString();
        const relatedConnections = connections.filter(
          (conn) =>
            conn.start?.objectId === objectIdStr ||
            conn.end?.objectId === objectIdStr
        );

        // Remove from UI
        setConnections((prev) =>
          prev.filter(
            (conn) =>
              conn.start?.objectId !== objectIdStr &&
              conn.end?.objectId !== objectIdStr
          )
        );

        // Delete from database
        if (relatedConnections.length > 0) {
          const spaceOwnerId = window.currentSpaceOwner || user.uid;
          relatedConnections.forEach((conn) => {
            deleteConnection(spaceOwnerId, currentSpaceId, conn.id);
          });
        }
      }

      // Remove from tracking set if present
      createdObjectIds.current.delete(id.toString());

      // Delete from database
      const spaceOwnerId = window.currentSpaceOwner || user.uid;

      if (objectToDelete?.position) {
        deleteObjectFromSpatialCell(
          spaceOwnerId,
          currentSpaceId,
          id,
          objectToDelete.position
        );
      }
    },
    [
      user,
      currentSpaceId,
      selectedId,
      connections,
      setConnections,
      objects,
      setObjects,
    ]
  );

  // Enhanced transform tracking with robust locking and position history
  const registerTransformingObject = useCallback(
    (id, isTransforming, position) => {
      const objId = id?.toString();
      if (!objId) return;

      const now = Date.now();

      if (isTransforming) {
        // Mark as transforming
        transformingObjectsRef.current.add(objId);

        // Store current position to help resolve conflicts later
        if (position) {
          transformPositionsRef.current.set(objId, [...position]);
          // Also store in position history to detect jitter oscillations
          positionHistoryRef.current.set(objId, {
            position: [...position],
            timestamp: now,
          });
        } else {
          // Find existing position from objects array
          const obj = objects.find((o) => o.id.toString() === objId);
          if (obj?.position) {
            transformPositionsRef.current.set(objId, [...obj.position]);
            positionHistoryRef.current.set(objId, {
              position: [...obj.position],
              timestamp: now,
            });
          }
        }

        // Store transform start time
        transformLockTimeRef.current.set(objId, now);

        // Block any db updates for this object AND its connected objects/lines
        draggingObjectsRef.current.add(objId);

        // Update connections to mark them as locked
        if (connections && connections.length > 0) {
          setConnections((prevConnections) => {
            const updated = prevConnections.map((conn) => {
              if (
                conn.start?.objectId === objId ||
                conn.end?.objectId === objId
              ) {
                return {
                  ...conn,
                  _transformLocked: true,
                  _lockTime: now,
                  _controlledBy: objId,
                };
              }
              return conn;
            });
            return updated;
          });
        }

        // Freeze object to prevent any subscription updates during transform
        setObjects((prev) =>
          prev.map((obj) => {
            if (obj.id.toString() === objId) {
              return {
                ...obj,
                _transformLocked: true,
                _lockTime: now,
                _positionLocked: true,
              };
            }
            return obj;
          })
        );
      } else {
        // On transform end
        const lockTime = transformLockTimeRef.current.get(objId) || 0;

        // Keep transform locked briefly to prevent jitter
        setTimeout(() => {
          // Check if another transform hasn't started
          if (transformLockTimeRef.current.get(objId) === lockTime) {
            transformingObjectsRef.current.delete(objId);
            transformLockTimeRef.current.delete(objId);

            // Get final position before unlocking
            const finalPosition = transformPositionsRef.current.get(objId);
            transformPositionsRef.current.delete(objId);

            // Save final position to position history to prevent jitter
            if (finalPosition) {
              positionHistoryRef.current.set(objId, {
                position: [...finalPosition],
                timestamp: now,
                isFinal: true,
              });
            }

            // Unlock connections
            if (connections && connections.length > 0) {
              setConnections((prevConnections) => {
                return prevConnections.map((conn) => {
                  if (conn._controlledBy === objId) {
                    const newConn = { ...conn };
                    delete newConn._transformLocked;
                    delete newConn._lockTime;
                    delete newConn._controlledBy;

                    // Force connections to stay with the moved object
                    if (conn.start?.objectId === objId && finalPosition) {
                      // Recalculate start position based on new object position
                      const startPos = calculateNewConnectionPosition(
                        conn.start,
                        finalPosition
                      );
                      if (startPos) {
                        newConn.start.position = startPos;
                        // Mark this as a confirmed position after transform
                        newConn._positionConfirmed = now;
                      }
                    }

                    if (conn.end?.objectId === objId && finalPosition) {
                      // Recalculate end position based on new object position
                      const endPos = calculateNewConnectionPosition(
                        conn.end,
                        finalPosition
                      );
                      if (endPos) {
                        newConn.end.position = endPos;
                        // Mark this as a confirmed position after transform
                        newConn._positionConfirmed = now;
                      }
                    }

                    return newConn;
                  }
                  return conn;
                });
              });
            }

            // Remove transform lock flag from object
            setObjects((prev) =>
              prev.map((obj) => {
                if (obj.id.toString() === objId) {
                  const newObj = { ...obj };
                  delete newObj._transformLocked;
                  delete newObj._lockTime;
                  delete newObj._positionLocked;

                  // Update position one final time if it changed
                  if (
                    finalPosition &&
                    !isEqual(newObj.position, finalPosition)
                  ) {
                    newObj.position = [...finalPosition];
                    newObj._positionConfirmed = now;
                  }

                  return newObj;
                }
                return obj;
              })
            );

            // Extend dragging block slightly after transform ends
            setTimeout(() => {
              draggingObjectsRef.current.delete(objId);
            }, 300);
          }
        }, 150);
      }
    },
    [objects, setObjects, connections, setConnections]
  );

  // Helper function to calculate new connection position after object move
  const calculateNewConnectionPosition = (connectionEnd, newObjectPosition) => {
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
  };

  // Check if a received position update is likely jitter/oscillation
  const isPositionJitter = useCallback((objId, newPosition) => {
    const history = positionHistoryRef.current.get(objId);
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
  }, []);

  // Expose the position jitter check function
  const checkPositionJitter = useCallback(
    (objId, newPosition) => {
      return isPositionJitter(objId?.toString(), newPosition);
    },
    [isPositionJitter]
  );

  // Expose previous position for transform operations
  const getTransformStartPosition = useCallback((id) => {
    if (!id) return null;
    const idStr = id.toString();
    return transformPositionsRef.current.get(idStr);
  }, []);

  return {
    selectedId,
    setSelectedId,
    handleCreateObject,
    handleObjectDelete,
    lastUpdateRef,
    draggingObjectsRef,
    lastSavedRef,
    registerTransformingObject, // Export this function
    transformingObjectsRef, // Export this ref
    getTransformStartPosition, // Add this new function
    checkPositionJitter, // Export the jitter check function
  };
}
