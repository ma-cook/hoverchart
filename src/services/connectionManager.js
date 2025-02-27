import { saveConnection } from './connectionsService';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'; // Update imports
import { db } from '../firebase';

// Connection cache for performance
const connectionCache = new Map();

// Track which connections are linked to which objects
// Export this map to make it available for other components
export const objectConnectionMap = new Map();

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

  // Check if this connection is already registered with this object
  if (
    objectConnectionMap.has(objIdStr) &&
    objectConnectionMap.get(objIdStr).has(connIdStr)
  ) {
    // Skip duplicate registrations
    return;
  }

  if (!objectConnectionMap.has(objIdStr)) {
    objectConnectionMap.set(objIdStr, new Set());
  }
  objectConnectionMap.get(objIdStr).add(connIdStr);
  console.log(`Registered connection ${connIdStr} with object ${objIdStr}`);
};

// Unregister a connection from an object
export const unregisterObjectConnection = (objectId, connectionId) => {
  if (objectConnectionMap.has(objectId)) {
    objectConnectionMap.get(objectId).delete(connectionId);
  }
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
      // Store in cache for future use
      connectionCache.set(cacheKey, connectionData);
      return connectionData;
    }

    // Check local storage fallback if Firestore failed
    const fallbackKey = `connection_${userId}_${connectionId}`;
    const localData = localStorage.getItem(fallbackKey);
    if (localData) {
      return JSON.parse(localData);
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
    console.log('Cleared existing connection mappings');

    // Get all connections
    const connectionsRef = collection(db, 'users', userId, 'connections');
    const connectionsSnap = await getDocs(connectionsRef);

    console.log(`Found ${connectionsSnap.size} connections to process`);

    let registrationCount = 0;

    // For each connection, register it with its objects
    connectionsSnap.forEach((docSnap) => {
      const connection = docSnap.data();

      console.log(`Processing connection ${connection.id}`, {
        startObjectId: connection.start?.objectId,
        endObjectId: connection.end?.objectId,
      });

      if (connection.start?.objectId) {
        registerObjectConnection(connection.start.objectId, connection.id);
        registrationCount++;
      } else {
        console.warn(`Connection ${connection.id} missing start.objectId`);
      }

      if (connection.end?.objectId) {
        registerObjectConnection(connection.end.objectId, connection.id);
        registrationCount++;
      } else {
        console.warn(`Connection ${connection.id} missing end.objectId`);
      }
    });

    console.log(
      `Initialized connection mappings: ${registrationCount} registrations for ${connectionsSnap.size} connections`
    );

    // Additional debug information
    console.log(
      'Current object connection map:',
      Array.from(objectConnectionMap.keys()).map((key) => ({
        objectId: key,
        connectionCount: objectConnectionMap.get(key).size,
      }))
    );
  } catch (error) {
    console.error('Error initializing connection mappings:', error);
    throw error; // Re-throw to allow proper error handling
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
