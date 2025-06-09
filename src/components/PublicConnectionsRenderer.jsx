import { useEffect, useState } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Line } from '@react-three/drei';
import TextSprite from './TextSprite';
import { calculateMidpoint } from '../utils/positionUtils';
import {
  checkLineIntersection,
  generateCurvedPath,
} from '../utils/pathfindingUtils';

// Import global subscription manager
import {
  getOrCreateSubscription,
  generateSubscriptionKey,
  SUBSCRIPTION_TYPES,
} from '../services/globalSubscriptionManager';

/**
 * Special component for rendering connections in public spaces
 * when the user is not authenticated
 */
const PublicConnectionsRenderer = ({ spaceId, ownerId, objects }) => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!spaceId || !ownerId) return;

    setLoading(true);

    try {
      const subscriptionKey = generateSubscriptionKey.legacyObjects(
        `connections_${spaceId}`
      );

      // Use global subscription manager
      const { unsubscribe } = getOrCreateSubscription(
        subscriptionKey,
        SUBSCRIPTION_TYPES.LEGACY_OBJECTS,
        () => {
          console.log(
            `🔥 Creating NEW public connections subscription for space: ${spaceId}`
          );

          const connectionsRef = collection(
            db,
            'users',
            ownerId,
            'spaces',
            spaceId,
            'connections'
          );
          const q = query(connectionsRef);

          return onSnapshot(
            q,
            (snapshot) => {
              const connectionsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));

              console.log(
                `Loaded ${connectionsData.length} connections for public space`
              );
              setConnections(connectionsData);
              setLoading(false);
            },
            (error) => {
              console.error('Error loading public connections:', error);
              setLoading(false);
            }
          );
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Failed to set up public connections subscription:', error);
      setLoading(false);
    }
  }, [spaceId, ownerId]);

  if (loading) return null;

  return (
    <>
      {connections.map((connection) => (
        <PublicConnection
          key={connection.id}
          connection={connection}
          objects={objects}
        />
      ))}
    </>
  );
};

// Simple connection renderer component for public spaces
const PublicConnection = ({ connection, objects }) => {
  if (!connection || !connection.start?.position || !connection.end?.position) {
    return null;
  }

  // Extract positions
  const startPosition = connection.start.position;
  const endPosition = connection.end.position;

  // Calculate midpoint for text
  const midpoint = calculateMidpoint(startPosition, endPosition);

  // Generate path points
  let pathPoints = [startPosition, endPosition];

  // Use curved path if specified
  if (connection.lineStyle === 'curved') {
    const filteredObjects = objects.filter(
      (obj) =>
        obj.id.toString() !== connection.start.objectId &&
        obj.id.toString() !== connection.end.objectId
    );

    const intersections = checkLineIntersection(
      startPosition,
      endPosition,
      filteredObjects
    );

    pathPoints = generateCurvedPath(
      startPosition,
      endPosition,
      intersections,
      connection.start.objectId,
      connection.end.objectId,
      true
    );
  }

  return (
    <group>
      {/* Main connection line */}
      <Line
        points={pathPoints}
        color={connection.color || 'black'}
        lineWidth={2}
        dashed={
          connection.lineStyle === 'dashed' || connection.lineStyle === 'dotted'
        }
        dashScale={connection.lineStyle === 'dotted' ? 1 : 0.5}
        dashSize={connection.lineStyle === 'dotted' ? 0.5 : 4}
        gapSize={connection.lineStyle === 'dotted' ? 1 : 10}
        dashOffset={connection.dashOffset || 0}
        renderOrder={20}
      />

      {/* Text on the connection if it exists */}
      {connection.text && (
        <TextSprite
          text={connection.text}
          position={[midpoint[0], midpoint[1] + 2, midpoint[2]]}
          style={{
            fontSize: connection.textStyle?.fontSize || 1.5,
            color: connection.textStyle?.color || 'black',
            underline: connection.textStyle?.underline || false,
            fixedSize: true,
            backgroundOpacity: 0.4,
            backgroundColor: '#000000',
            padding: 0.3,
          }}
          billboard={true}
          renderOrder={20}
        />
      )}
    </group>
  );
};

export default PublicConnectionsRenderer;
