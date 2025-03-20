import { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three'; // Add THREE import
import isEqual from 'lodash/isEqual';
import { saveObject, deleteObject } from '../services/objectsService';
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
}) {
  const [selectedId, setSelectedId] = useState(null);

  // References for optimizing updates
  const lastUpdateRef = useRef({});
  const draggingObjectsRef = useRef(new Set());
  const lastSavedRef = useRef(null);
  const createdObjectIds = useRef(new Set()); // Track locally created object IDs

  // Save objects periodically
  useEffect(() => {
    if (!user || !objects.length || !currentSpaceId) return;

    const saveTimeout = setTimeout(() => {
      if (isEqual(lastSavedRef.current, objects)) return;

      lastSavedRef.current = JSON.parse(JSON.stringify(objects));
      const spaceOwnerId = window.currentSpaceOwner || user.uid;

      objects.forEach((obj) => {
        saveObject(spaceOwnerId, currentSpaceId, obj);
      });
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [objects, user, currentSpaceId]);

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
    [user, currentSpaceId, cameraRef]
  );

  // Helper function to create object at a given position
  const createObjectWithPosition = (type, position) => {
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
            lineColor: 'white',
            headerText: '',
            headerStyle: {
              fontSize: 1.5,
              color: 'white',
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
                  color: 'white',
                  underline: false,
                };
                return acc;
              }, {}),
          }
        : type === 'cube'
        ? {
            color: '#ffffff',
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
            textStyle: { fontSize: 1.5, color: 'white', underline: false },
          }
        : type === 'plane'
        ? {
            borderStyle: 'solid',
            borderColor: 'white',
            lineThickness: 1,
            color: null,
            headerText: '',
            headerStyle: {
              fontSize: 1.5,
              color: 'white',
              underline: false,
            },
            faceText: '',
            faceTextStyle: {
              fontSize: 0.5,
              color: 'white',
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
    saveObject(spaceOwnerId, currentSpaceId, newObject);
  };

  // Delete an object and its connections
  const handleObjectDelete = useCallback(
    (id) => {
      if (!user || !currentSpaceId) return;

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

      const spaceOwnerId = window.currentSpaceOwner || user.uid;
      deleteObject(spaceOwnerId, currentSpaceId, id);
    },
    [user, currentSpaceId, selectedId, connections, setConnections]
  );

  return {
    selectedId,
    setSelectedId,
    handleCreateObject,
    handleObjectDelete,
    lastUpdateRef,
    draggingObjectsRef,
    lastSavedRef,
  };
}
