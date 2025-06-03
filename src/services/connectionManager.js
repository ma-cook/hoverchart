import { saveConnection } from './connectionsService';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// Connection cache for performance
const connectionCache = new Map();

// Track which connections are linked to which objects
// Export this map to make it available for other components
export const objectConnectionMap = new Map();

// Track which connections have already been registered to avoid duplicates
const registeredConnections = new Set();

// Modified: Track existing connections between specific faces of objects
const connectedPairs = new Map();

// Track initialization status
let isInitialized = false;

// Register a connection with an object - ensure IDs are strings
export const registerObjectConnection = (objectId, connectionId) => {
  if (!objectId) {
    console.warn(
      'Attempted to register connection with null/undefined objectId'
    );
    return;
  }

  const objIdStr = objectId.toString();
  const connIdStr = connectionId.toString();

  // Create a unique registration key to track this specific relationship
  const registrationKey = `${objIdStr}:${connIdStr}`;

  // Skip if this exact connection is already registered with this object
  if (registeredConnections.has(registrationKey)) {
    return;
  }

  // Add to our tracking set
  registeredConnections.add(registrationKey);

  if (!objectConnectionMap.has(objIdStr)) {
    objectConnectionMap.set(objIdStr, new Set());
  }
  objectConnectionMap.get(objIdStr).add(connIdStr);

  // Make this logging conditional on debug mode to reduce noise
  if (window.DEBUG_CONNECTIONS) {
    console.log(`Registered connection ${connIdStr} with object ${objIdStr}`);
  }
};

// Check if two objects already have a connection between SPECIFIC FACES
export const objectsAreConnected = (objectId1, objectId2, face1, face2) => {
  // Standardize IDs
  const id1 = objectId1?.toString();
  const id2 = objectId2?.toString();

  if (!id1 || !id2) return false;

  // If no face parameters provided, fall back to the old behavior (any connection between objects)
  if (!face1 || !face2) {
    // Create connection keys for both directions
    const key1 = `${id1}_${id2}`;
    const key2 = `${id2}_${id1}`;

    // Check if either key exists in the map
    return connectedPairs.has(key1) || connectedPairs.has(key2);
  }

  // With face information, check for specific face connections
  // Create face-specific connection keys for both directions
  const key1 = `${id1}:${face1}_${id2}:${face2}`;
  const key2 = `${id2}:${face2}_${id1}:${face1}`;

  // Check if this specific face connection exists
  return connectedPairs.has(key1) || connectedPairs.has(key2);
};

// Modified: Track a connection between two objects' specific faces
export const registerConnectedPair = (
  objectId1,
  objectId2,
  connectionId,
  face1,
  face2
) => {
  if (!objectId1 || !objectId2 || !connectionId) return;

  // Standardize IDs
  const id1 = objectId1.toString();
  const id2 = objectId2.toString();
  const connId = connectionId.toString();

  // Store both a general object connection and the face-specific connection

  // General object-to-object connection (for backward compatibility)
  const generalKey = id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;

  // If face information is provided, also create a face-specific key
  if (face1 && face2) {
    // Create a face-specific key
    const faceKey =
      id1 < id2
        ? `${id1}:${face1}_${id2}:${face2}`
        : `${id2}:${face2}_${id1}:${face1}`;

    // Store the connection ID with the face-specific key
    connectedPairs.set(faceKey, connId);
  }

  // Always maintain the general connection reference too
  connectedPairs.set(generalKey, connId);
};

// Remove connection between objects
export const unregisterConnectedPair = (objectId1, objectId2, face1, face2) => {
  if (!objectId1 || !objectId2) return;

  const id1 = objectId1.toString();
  const id2 = objectId2.toString();

  // If face information is provided, delete the face-specific connection
  if (face1 && face2) {
    const faceKey1 = `${id1}:${face1}_${id2}:${face2}`;
    const faceKey2 = `${id2}:${face2}_${id1}:${face1}`;
    connectedPairs.delete(faceKey1);
    connectedPairs.delete(faceKey2);
  }

  // Delete the general connection key as well
  const key = id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;
  connectedPairs.delete(key);
};

// Specialized function for handling text object connections
export const handleTextObjectConnection = (
  textObjectOrIndicator,
  targetObject,
  targetFace,
  userId,
  currentSpaceId
) => {
  if (!textObjectOrIndicator || !targetObject || !userId || !currentSpaceId) {
    return { success: false, message: 'Missing required parameters' };
  }

  // Extract text object ID from either the object or its indicator
  const textObjectId = String(
    textObjectOrIndicator.id || textObjectOrIndicator.objectId
  );
  const targetObjectId = String(targetObject.id || targetObject.objectId);

  // Check if these objects are already connected on the same face
  const textFace = textObjectOrIndicator.face || 'top'; // Use 'top' as default face for text objects
  if (objectsAreConnected(textObjectId, targetObjectId, textFace, targetFace)) {
    return {
      success: false,
      message: 'These faces are already connected',
    };
  }

  // Create unique connection ID
  const connectionId = `${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  // Extract position data with multiple fallbacks for text object
  let textObjectPosition;

  // First priority: Use standardized worldPosition
  if (Array.isArray(textObjectOrIndicator.worldPosition)) {
    textObjectPosition = textObjectOrIndicator.worldPosition;
  }
  // Second priority: Use indicator position from planeData
  else if (textObjectOrIndicator.planeData?.position) {
    textObjectPosition = textObjectOrIndicator.planeData.position;
  }
  // Third priority: Use basic position
  else if (Array.isArray(textObjectOrIndicator.position)) {
    textObjectPosition = textObjectOrIndicator.position;
  }
  // Final fallback: Try userData
  else if (
    Array.isArray(textObjectOrIndicator.plane?.userData?.worldPos?.indicatorPos)
  ) {
    textObjectPosition =
      textObjectOrIndicator.plane.userData.worldPos.indicatorPos;
  } else {
    console.error('No valid position found for text object connection');
    return { success: false, message: 'Invalid indicator position' };
  }

  // Extract target position with fallbacks, prioritizing face position
  let targetPosition;
  if (Array.isArray(targetObject.facePosition)) {
    targetPosition = targetObject.facePosition;
  } else if (Array.isArray(targetObject.worldPosition)) {
    targetPosition = targetObject.worldPosition;
  } else if (Array.isArray(targetObject.position)) {
    targetPosition = targetObject.position;
  } else {
    targetPosition = [0, 0, 0];
  }

  console.log('Connection positions:', {
    textObjectPosition,
    targetPosition,
    targetObject,
  });

  // Create connection data with the correct position and metadata
  const newConnection = {
    id: connectionId,
    start: {
      type: 'text',
      objectId: textObjectId,
      position: textObjectPosition,
      worldPosition: textObjectPosition,
      face: textFace,
      plane: textObjectOrIndicator.plane || null,
      planeData: textObjectOrIndicator.planeData || {
        worldMatrix: textObjectOrIndicator.worldMatrix || null,
        position: textObjectPosition,
        scale: textObjectOrIndicator.scale || [1, 1, 1],
        offset: textObjectOrIndicator.offset || [0, 0, 0],
      },
    },
    end: {
      type: targetObject.type || 'cube',
      face: targetFace,
      objectId: targetObjectId,
      position: targetPosition,
      worldPosition: targetPosition,
      faceCenter: targetObject.faceCenter || targetPosition,
      facePosition: targetPosition,
      cube: {
        id: targetObjectId,
        position: targetObject.position || targetPosition,
        scale: targetObject.scale || [1, 1, 1],
        face: targetFace,
      },
    },
    lineStyle: 'straight',
    color: 'black',
    text: '',
    textStyle: { fontSize: 1, color: 'black' },
    dashOffset: 0,
  };

  // Register connection with both objects
  registerObjectConnection(textObjectId, connectionId);
  registerObjectConnection(targetObjectId, connectionId);

  // Register the pair as connected with face information
  registerConnectedPair(
    textObjectId,
    targetObjectId,
    connectionId,
    textFace,
    targetFace
  );

  // Save the connection to database
  try {
    const spaceOwnerId = window.currentSpaceOwner || userId;
    saveConnection(spaceOwnerId, currentSpaceId, newConnection);
    return { success: true, connection: newConnection };
  } catch (error) {
    console.error('Error saving text object connection:', error);
    return { success: false, message: 'Failed to save connection' };
  }
};

// Unregister a connection from an object
export const unregisterObjectConnection = (objectId, connectionId) => {
  const objIdStr = objectId?.toString();
  const connIdStr = connectionId?.toString();

  if (!objIdStr || !connIdStr) return;

  // Remove from tracking set
  registeredConnections.delete(`${objIdStr}:${connIdStr}`);

  if (objectConnectionMap.has(objIdStr)) {
    objectConnectionMap.get(objIdStr).delete(connIdStr);
  }
};

// Clear all registrations for testing or resets
export const clearConnectionRegistrations = () => {
  registeredConnections.clear();
  objectConnectionMap.clear();
};

// Get a connection by ID
export const getConnectionById = async (userId, connectionId) => {
  // First check the cache
  const cacheKey = `${userId}_${connectionId}`;
  if (connectionCache.has(cacheKey)) {
    return connectionCache.get(cacheKey);
  }

  // If not in cache, get from Firestore
  try {
    const connectionRef = doc(
      db,
      'users',
      userId,
      'connections',
      connectionId.toString()
    );
    const connectionSnap = await getDoc(connectionRef);

    if (connectionSnap.exists()) {
      const connectionData = connectionSnap.data();
      // Ensure text field is properly handled
      if (connectionData && !connectionData.text) {
        connectionData.text = '';
      }
      // Store in cache for future use
      connectionCache.set(cacheKey, connectionData);
      return connectionData;
    }

    // Check local storage fallback if Firestore failed
    const fallbackKey = `connection_${userId}_${connectionId}`;
    const localData = localStorage.getItem(fallbackKey);
    if (localData) {
      try {
        const parsedData = JSON.parse(localData);
        // Ensure text field exists
        if (!parsedData.text) parsedData.text = '';
        return parsedData;
      } catch {
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching connection:', error);
    return null;
  }
};

// Initialize the object-connection mapping from existing data
export const initializeConnectionMappings = async (userId) => {
  try {
    // Clear existing mappings
    objectConnectionMap.clear();
    registeredConnections.clear();
    connectedPairs.clear(); // Also clear the connected pairs

    if (window.DEBUG_CONNECTIONS) {
      console.log('Cleared existing connection mappings');
    }

    // Skip if already initialized for this user
    if (isInitialized && window.lastConnectionUserId === userId) {
      console.log('Connection mappings already initialized for this user');
      return { success: true, cached: true };
    }

    // Get all connections from all spaces for this user
    try {
      const spacesRef = collection(db, 'users', userId, 'spaces');
      const spacesSnap = await getDocs(spacesRef);

      let totalConnections = 0;

      // Process connections space by space
      for (const spaceDoc of spacesSnap.docs) {
        const spaceId = spaceDoc.id;
        const connectionsRef = collection(
          db,
          'users',
          userId,
          'spaces',
          spaceId,
          'connections'
        );
        const connectionsSnap = await getDocs(connectionsRef);

        console.log(
          `Found ${connectionsSnap.size} connections in space ${spaceId}`
        );
        totalConnections += connectionsSnap.size;

        // For each connection, register it with its objects
        connectionsSnap.forEach((docSnap) => {
          const connection = docSnap.data();

          if (connection.start?.objectId) {
            registerObjectConnection(connection.start.objectId, connection.id);
          }

          if (connection.end?.objectId) {
            registerObjectConnection(connection.end.objectId, connection.id);
          }

          // Also register the connected pair if both object IDs exist
          if (connection.start?.objectId && connection.end?.objectId) {
            registerConnectedPair(
              connection.start.objectId,
              connection.end.objectId,
              connection.id
            );
          }
        });
      }

      console.log(
        `Initialized connection mappings: ${registeredConnections.size} registrations for ${totalConnections} connections`
      );

      // Mark as initialized and store the user ID
      isInitialized = true;
      window.lastConnectionUserId = userId;

      return { success: true, count: registeredConnections.size };
    } catch (err) {
      console.error('Error loading spaces for connection initialization:', err);
      return { success: false, error: err.message };
    }
  } catch (error) {
    console.error('Error initializing connection mappings:', error);
    return { success: false, error: error.message };
  }
};

// Create a new connection between two objects
export const createConnection = async (
  userId,
  startObject,
  startFace,
  endObject,
  endFace,
  connectionId
) => {
  const connection = {
    id: connectionId,
    start: {
      objectId: startObject.id,
      face: startFace,
      position: startObject.position,
      type: startObject.type || 'cube',
    },
    end: {
      objectId: endObject.id,
      face: endFace,
      position: endObject.position,
      type: endObject.type || 'cube',
    },
    lineStyle: 'straight',
    color: 'white',
    text: '',
    textStyle: {
      fontSize: 1,
      color: 'white',
      underline: false,
    },
  };

  // Register connection with both objects
  registerObjectConnection(startObject.id, connectionId);
  registerObjectConnection(endObject.id, connectionId);

  await saveConnection(userId, connection);
  return connection;
};

// Update connections when an object moves - improve logging and ID handling
export const updateObjectConnections = async (
  userId,
  objectId,
  newPosition
) => {
  // Ensure consistent string ID format
  const objIdStr = objectId.toString();

  // Additional logging to understand ID formats
  console.log(`Checking for connections with object ${objIdStr}`, {
    hasMapping: objectConnectionMap.has(objIdStr),
    availableMappings: Array.from(objectConnectionMap.keys()),
    mappingSize: objectConnectionMap.size,
  });

  if (!objectConnectionMap.has(objIdStr)) {
    console.log(`No connections registered for object ${objIdStr}`);
    return;
  }

  const connectionIds = Array.from(objectConnectionMap.get(objIdStr));
  console.log(
    `Updating ${connectionIds.length} connections for object ${objIdStr}`
  );

  // For each connection associated with this object
  for (const connectionId of connectionIds) {
    console.log(`Processing connection ${connectionId}`);

    // Fetch the current connection data from cache or store
    const connection = await getConnectionById(userId, connectionId);

    if (!connection) {
      console.log(`Connection ${connectionId} not found, skipping update`);
      continue;
    }

    // Update the position of the appropriate end
    let updated = false;

    console.log(`Connection endpoints:`, {
      start: connection.start.objectId,
      end: connection.end.objectId,
      checkingId: objectId,
    });

    if (connection.start.objectId === objectId) {
      console.log(`Updating start position for connection ${connectionId}`);
      connection.start.position = newPosition;
      updated = true;
    }

    if (connection.end.objectId === objectId) {
      console.log(`Updating end position for connection ${connectionId}`);
      connection.end.position = newPosition;
      updated = true;
    }

    // Save the updated connection
    if (updated) {
      console.log(`Saving updated connection ${connectionId}`);
      await saveConnection(userId, connection);
    }
  }
};

// Optional: Function to get current connection with resolved positions
export const getResolvedConnections = async (userId, connections, objects) => {
  return connections.map((connection) => {
    const startObject = objects.find(
      (obj) => obj.id === connection.start.objectId
    );
    const endObject = objects.find((obj) => obj.id === connection.end.objectId);

    return {
      ...connection,
      start: {
        ...connection.start,
        position: startObject
          ? startObject.position
          : connection.start.position,
      },
      end: {
        ...connection.end,
        position: endObject ? endObject.position : connection.end.position,
      },
    };
  });
};

// Add a new function to pre-populate connection cache when needed
export const preloadConnectionsForSpace = async (userId, spaceId) => {
  try {
    if (!userId || !spaceId)
      return { success: false, reason: 'Missing userId or spaceId' };

    console.log(`Pre-loading connections for space ${spaceId}`);

    const connectionsRef = collection(
      db,
      'users',
      userId,
      'spaces',
      spaceId,
      'connections'
    );
    const connectionsSnap = await getDocs(connectionsRef);

    console.log(`Found ${connectionsSnap.size} connections to pre-load`);

    // Cache all connections
    connectionsSnap.forEach((docSnap) => {
      const connection = docSnap.data();
      const cacheKey = `${spaceId}_${connection.id}`;
      connectionCache.set(cacheKey, connection);

      // Register connections with face information
      if (connection.start?.objectId) {
        registerObjectConnection(connection.start.objectId, connection.id);
      }

      if (connection.end?.objectId) {
        registerObjectConnection(connection.end.objectId, connection.id);
      }

      if (connection.start?.objectId && connection.end?.objectId) {
        registerConnectedPair(
          connection.start.objectId,
          connection.end.objectId,
          connection.id,
          connection.start?.face,
          connection.end?.face
        );
      }
    });

    return { success: true, count: connectionsSnap.size };
  } catch (err) {
    console.error('Error pre-loading connections:', err);
    return { success: false, error: err.message };
  }
};
