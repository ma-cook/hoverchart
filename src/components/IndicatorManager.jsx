import { useEffect, useState } from 'react';
import { subscribeToConnections } from '../services/connectionsService';
import FaceIndicator from './FaceIndicator';

const IndicatorManager = ({ userId }) => {
  const [indicators, setIndicators] = useState([]);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToConnections(
      userId,
      ({ type, connection }) => {
        if (!connection) return;

        setIndicators((prev) => {
          switch (type) {
            case 'added':
            case 'modified': {
              const newIndicators = prev.filter(
                (ind) => !ind.id.startsWith(`${connection.id}-`)
              );

              // Safely add start indicator if data exists
              if (connection.start?.position) {
                newIndicators.push({
                  id: `${connection.id}-start`,
                  position: connection.start.position,
                  isActive: true,
                });
              }

              // Safely add end indicator if data exists
              if (connection.end?.position) {
                newIndicators.push({
                  id: `${connection.id}-end`,
                  position: connection.end.position,
                  isActive: true,
                });
              }

              return newIndicators;
            }
            case 'removed':
              return prev.filter(
                (ind) => !ind.id.startsWith(`${connection.id}-`)
              );
            default:
              return prev;
          }
        });
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return indicators.map(({ id, position, isActive }) => (
    <FaceIndicator key={id} position={position} isActive={isActive} />
  ));
};

export default IndicatorManager;
