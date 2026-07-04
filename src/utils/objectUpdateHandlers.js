import {
  saveObjectToCell,
  updateObjectInSpatialCell,
} from '../services/spatialObjectsService';
import useObjectsStore from '../stores/objectsStore';
import { useConnectionStore, usePublicSpaceStore } from '../stores';
import { api } from '../api-client';

export const handleObjectMove = ({
  id,
  newPosition,
  isDragStart = false,
  isDragEnd = false,
  draggingObjectsRef,
  objects,
  setObjects,
  user,
  currentSpaceId,
}) => {
  const objectId = id.toString();

  if (isDragStart) {
    draggingObjectsRef.current.add(objectId);
  }

  const moveTimestamp = Date.now();
  setObjects((prev) => {
    const existingObject = prev.find((obj) => obj.id === id);
    if (!existingObject) return prev;

    if (existingObject._transformLocked) {
      return prev;
    }

    if (
      existingObject._moveTimestamp &&
      existingObject._moveTimestamp > moveTimestamp
    ) {
      return prev;
    }

    const updatedObjects = prev.map((obj) => {
      if (obj.id === id) {
        const newObj = {
          ...obj,
          position: [newPosition.x, newPosition.y, newPosition.z],
          _moveTimestamp: moveTimestamp,
          _isDragging: true,
        };
        return newObj;
      }
      return obj;
    });

    return updatedObjects;
  });

  if (user && isDragEnd) {
    const currentObjects = objects || [];
    const object = currentObjects.find((obj) => obj.id === id);

    if (object) {
      if (object._transformLocked) {
        draggingObjectsRef.current.delete(objectId);
        return;
      }

      const updatedObject = {
        ...object,
        position: [newPosition.x, newPosition.y, newPosition.z],
        _finalPosition: true,
      };
      delete updatedObject._isDragging;
      delete updatedObject._moveTimestamp;
      delete updatedObject._transformActive;

      (async () => {
        try {
          const { isInitialLoading } = useObjectsStore.getState();
          if (isInitialLoading) {
            setTimeout(() => {
              draggingObjectsRef.current.delete(objectId);
            }, 300);
            return;
          }

          const spaceOwnerId = window.currentSpaceOwner || user.uid;

          await saveObjectToCell(spaceOwnerId, currentSpaceId, updatedObject);

          callUpsertObjectPosition(spaceOwnerId, currentSpaceId, updatedObject);

          if (window.transitioningObjectsRef?.current?.has(id.toString())) {
            window.transitioningObjectsRef.current.delete(id.toString());
          }

          try {
            const connectionStore = useConnectionStore.getState();
            const connections = connectionStore.connections;
            const objects = useObjectsStore.getState().objects;
            const saveConnectionsImmediately =
              usePublicSpaceStore.getState().saveConnectionsImmediately;
            let _objectIdSet = null;
            const connectionsToSave = connections.filter((conn) => {
              if (conn._visualUpdate) return false;

              if (!conn._moveTimestamp && !conn._needsSave) return false;

              if (connectionStore.deletingConnections.has(conn.id)) {
                console.log(
                  `🚫 [objectUpdateHandlers] Skipping save for deleted connection: ${conn.id}`
                );
                return false;
              }

              if (!_objectIdSet) {
                _objectIdSet = new Set(objects.map(o => o.id.toString()));
              }
              const startObjectExists = _objectIdSet.has(conn.start?.objectId);
              const endObjectExists = _objectIdSet.has(conn.end?.objectId);

              if (!startObjectExists || !endObjectExists) {
                console.log(
                  `🚫 [objectUpdateHandlers] Skipping save for connection with missing objects: ${conn.id} (start: ${startObjectExists}, end: ${endObjectExists})`
                );
                return false;
              }

              return true;
            });

            if (connectionsToSave.length > 0) {
              console.log(
                `💾 [objectUpdateHandlers] Saving ${connectionsToSave.length} connections after object movement`
              );
              await saveConnectionsImmediately(
                connectionsToSave,
                user,
                currentSpaceId
              );
            }
          } catch (error) {
            console.warn(
              'Failed to save connection positions immediately:',
              error
            );
          }

          setTimeout(() => {
            draggingObjectsRef.current.delete(objectId);
          }, 300);
        } catch (error) {
          console.error(
            `🎯 [handleObjectMove] ❌ Failed to save object ${id}:`,
            error
          );
        }
      })();
    }
  }
};

export const handleObjectUpdate = ({
  id,
  updates,
  user,
  currentSpaceId,
  lastUpdateRef,
}) => {
  if (!id || !currentSpaceId || !user?.uid) {
    return;
  }

  const cleanedUpdates = { ...updates };
  delete cleanedUpdates._finalPosition;
  delete cleanedUpdates._moveComplete;
  delete cleanedUpdates._transformActive;
  delete cleanedUpdates._isDragging;
  delete cleanedUpdates._moveTimestamp;
  let currentObjectData = lastUpdateRef?.current?.[id];

  if (!currentObjectData) {
    const objectsStore = useObjectsStore.getState();
    currentObjectData = objectsStore.objects.find((obj) => obj.id === id) || {};
  }

  const hasPosition =
    cleanedUpdates.position && Array.isArray(cleanedUpdates.position);

  const positionChanged =
    hasPosition &&
    (!currentObjectData.position ||
      !Array.isArray(currentObjectData.position) ||
      cleanedUpdates.position[0] !== currentObjectData.position[0] ||
      cleanedUpdates.position[1] !== currentObjectData.position[1] ||
      cleanedUpdates.position[2] !== currentObjectData.position[2]);

  const completeObjectData = {
    id,
    ...currentObjectData,
    ...cleanedUpdates,
  };

  const { isInitialLoading } = useObjectsStore.getState();
  if (isInitialLoading) {
    return;
  }

  const spaceOwnerId = window.currentSpaceOwner || user.uid;
  if (positionChanged) {
    updateObjectInSpatialCell(spaceOwnerId, currentSpaceId, completeObjectData)
      .then(() => {
      })
      .catch((error) => {
        console.warn(
          '[handleObjectUpdate] Error updating object position in spatial cell:',
          error
        );
      });
  } else {
    saveObjectToCell(spaceOwnerId, currentSpaceId, completeObjectData).catch(
      (error) => {
        console.warn(
          '[handleObjectUpdate] Error saving object settings:',
          error
        );
      }
    );
  }
};

const callUpsertObjectPosition = (userId, spaceId, object) => {
  try {
    api.post('/api/objects/upsert-position', { userId, spaceId, object }).catch(() => {
    });
  } catch {
  }
};
