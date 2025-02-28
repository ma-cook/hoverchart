import { useEffect, useState } from 'react';
import { subscribeToConnections } from '../services/connectionsService';
import FaceIndicator from './FaceIndicator';
import * as THREE from 'three';

const IndicatorManager = ({ userId }) => {
  const [indicators, setIndicators] = useState([]);
  const [activeConnections, setActiveConnections] = useState(new Map());

  // Track connections to prevent duplicate indicators
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToConnections(
      userId,
      ({ type, id, connection }) => {
        if (!connection) return;

        // Track connections in a map for reference
        setActiveConnections((prev) => {
          const newMap = new Map(prev);
          if (type === 'removed') {
            newMap.delete(id);
          } else {
            newMap.set(id, connection);
          }
          return newMap;
        });
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // We'll now let the individual cube components handle their
  // own indicators, so we won't render separate indicators here

  return null; // Don't render duplicate indicators
};

export default IndicatorManager;
