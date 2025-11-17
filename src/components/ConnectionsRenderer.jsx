import React, { useMemo } from 'react';

import InstancedLine from './InstancedLine';
import AtlasTextSprite from './AtlasTextSprite';
import LineUI from './LineUI';
import HeaderInput from './HeaderInput';
import TextStyleUI from './TextStyleUI';
import AnimatedConnectionLine from './AnimatedConnectionLine';
import {
  checkLineIntersection,
  generateCurvedPath,
} from '../utils/pathfindingUtils';
import { calculateMidpoint } from '../utils/positionUtils';
import { calculateFacePosition } from '../utils/facePositionUtils';
import useConnectionStore from '../stores/connectionStore';
import { saveConnection } from '../services/connectionsService';
import { useConnectionObjectPositions } from '../hooks/useConnectionObjects';
import { useCallback } from 'react';

/**
 * Convert a path of connected points into line segments for InstancedLine
 * Path: [p0, p1, p2, p3] -> Segments: [p0, p1, p1, p2, p2, p3]
 * This allows InstancedLine to render connected line segments
 */
function pathToLineSegments(path) {
  if (!path || path.length < 2) return path;

  const segments = [];
  for (let i = 0; i < path.length - 1; i++) {
    segments.push(path[i], path[i + 1]);
  }
  return segments;
}

// Separate connection rendering into a sub-component to fix the hooks issue
const Connection = React.memo(
  ({
    connection,
    allObjectsForPathfinding,
    onLineStyleChange,
    onLineColorChange,
    onConnectionClick,
    onLineTextClick,
    onLineTextSubmit,
    onLineTextStyleChange,
  }) => {
    // Get only the specific objects needed for this connection
    const { startObject, endObject } = useConnectionObjectPositions(
      connection?.start?.objectId,
      connection?.end?.objectId
    );
    // Use connection store for state
    const connections = useConnectionStore((state) => state.connections);
    const selectedConnection = useConnectionStore(
      (state) => state.selectedConnection
    );
    const deletingConnections = useConnectionStore(
      (state) => state.deletingConnections
    );
    const lineTexts = useConnectionStore((state) => state.lineTexts);
    const showLineTextInput = useConnectionStore(
      (state) => state.showLineTextInput
    );
    const showLineTextStyleUI = useConnectionStore(
      (state) => state.showLineTextStyleUI
    );
    const setShowLineTextStyleUI = useConnectionStore(
      (state) => state.setShowLineTextStyleUI
    );
    const setShowLineTextInput = useConnectionStore(
      (state) => state.setShowLineTextInput
    );
    const selectConnection = useConnectionStore(
      (state) => state.selectConnection
    );
    const setLineText = useConnectionStore((state) => state.setLineText);
    const updateConnection = useConnectionStore(
      (state) => state.updateConnection
    );

    // Consolidated line width calculation - consistent across all line types
    const getLineWidth = useCallback(
      (connectionId) => {
        const isMobile =
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          );
        const baseWidth = isMobile ? 2 : 1;
        const selectedWidth = isMobile ? 3 : 2.5;
        return selectedConnection === connectionId ? selectedWidth : baseWidth;
      },
      [selectedConnection]
    );

    // Handler function - always use passed onConnectionClick if available for consistency
    const handleConnectionClick = useCallback(
      (e, connectionId) => {
        e.stopPropagation();
        if (onConnectionClick) {
          onConnectionClick(e, connectionId);
        } else {
          selectConnection(connectionId);
        }
      },
      [onConnectionClick, selectConnection]
    );

    const handleLineTextClick = (e, connectionId) => {
      if (onLineTextClick) {
        onLineTextClick(e, connectionId);
      } else {
        e.stopPropagation();
        setShowLineTextStyleUI(connectionId);
      }
    };

    const handleLineTextSubmit = (connectionId, text) => {
      if (onLineTextSubmit) {
        return onLineTextSubmit(connectionId, text);
      } else {
        // Check if connection is being deleted before saving
        if (deletingConnections.has(connectionId)) {
          return false;
        }

        setLineText(connectionId, text);
        setShowLineTextInput(null);
        // Update both store and database
        updateConnection(connectionId, { text });
        const updatedConnection = connections.find(
          (conn) => conn.id === connectionId
        );
        if (updatedConnection) {
          saveConnection(window.currentUser?.uid, window.currentSpaceId, {
            ...updatedConnection,
            text,
          });
        }
        return true;
      }
    };

    const handleLineTextStyleChange = (connectionId, style) => {
      if (onLineTextStyleChange) {
        onLineTextStyleChange(connectionId, style);
      } else {
        // Check if connection is being deleted before saving
        if (deletingConnections.has(connectionId)) {
          return;
        }

        // Get current connection to merge with existing textStyle (like cube header text)
        const currentConnection = connections.find(
          (conn) => conn.id === connectionId
        );
        const mergedTextStyle = {
          ...(currentConnection?.textStyle || {}),
          ...style,
        };

        // Update both store and database
        updateConnection(connectionId, { textStyle: mergedTextStyle });
        const updatedConnection = connections.find(
          (conn) => conn.id === connectionId
        );
        if (updatedConnection) {
          saveConnection(window.currentUser?.uid, window.currentSpaceId, {
            ...updatedConnection,
            textStyle: mergedTextStyle,
          });
        }
      }
    };
    const handleLineStyleChange = (connectionId, styleType) => {
      console.log('🎨 [ConnectionsRenderer] handleLineStyleChange called:', {
        connectionId,
        styleType,
        hasOnLineStyleChange: !!onLineStyleChange,
      });

      if (onLineStyleChange) {
        console.log(
          '🎨 [ConnectionsRenderer] Calling onLineStyleChange prop...'
        );
        onLineStyleChange(connectionId, styleType);
        console.log('🎨 [ConnectionsRenderer] onLineStyleChange prop called');
      } else {
        // Check if connection is being deleted before saving
        if (deletingConnections.has(connectionId)) {
          return;
        }

        // Parse the styleType to separate base style and direction
        let baseStyle = styleType;
        let direction = null;

        if (styleType.includes('-')) {
          const parts = styleType.split('-');
          baseStyle = parts[0];
          direction = parts[1];
        }

        console.log('🎨 Updating line style:', {
          connectionId,
          styleType,
          baseStyle,
          direction,
        });

        // Update both styleType and dashDirection with timestamp to force re-render
        updateConnection(connectionId, {
          styleType: baseStyle,
          dashDirection: direction,
          _lastStyleUpdate: Date.now(),
        });

        const updatedConnection = connections.find(
          (conn) => conn.id === connectionId
        );
        if (updatedConnection) {
          console.log('💾 Saving connection with style:', {
            id: updatedConnection.id,
            styleType: baseStyle,
            dashDirection: direction,
          });
          saveConnection(window.currentUser?.uid, window.currentSpaceId, {
            ...updatedConnection,
            styleType: baseStyle,
            dashDirection: direction,
            _lastStyleUpdate: Date.now(),
          });
        }
      }
    };

    const handleLineColorChange = (connectionId, color) => {
      if (onLineColorChange) {
        onLineColorChange(connectionId, color);
      } else {
        // Check if connection is being deleted before saving
        if (deletingConnections.has(connectionId)) {
          return;
        }

        // Update store with correct color property name
        updateConnection(connectionId, { color: color });
        const updatedConnection = connections.find(
          (conn) => conn.id === connectionId
        );
        if (updatedConnection) {
          saveConnection(window.currentUser?.uid, window.currentSpaceId, {
            ...updatedConnection,
            color: color, // Use 'color' not 'lineColor'
          });
        }
      }
    };

    // Always call hooks first, before any conditional returns
    // Declare all useMemo hooks unconditionally
    // First hook: Calculate basic connection data with real-time object positions
    const connectionData = useMemo(() => {
      // Early validation with minimal computation
      if (!connection?.start?.objectId || !connection?.end?.objectId) {
        return {
          isValid: false,
          midpoint: [0, 0, 0],
          startPosition: [0, 0, 0],
          endPosition: [0, 0, 0],
        };
      }

      // Cache object lookups to avoid repeated searches
      const startObj = startObject;
      const endObj = endObject;

      // Simplified position calculation with early returns
      const startPosition =
        startObj?.position && connection.start?.face
          ? (() => {
              try {
                return calculateFacePosition(
                  {
                    type: connection.start.type || startObj.type || 'cube',
                    face: connection.start.face,
                    objectId: connection.start.objectId,
                    faceCenter: connection.start.faceCenter,
                    cube: {
                      position: startObj.position,
                      scale: startObj.scale || [1, 1, 1],
                    },
                    plane:
                      startObj.type === 'plane'
                        ? {
                            position: startObj.position,
                            scale: startObj.scale || [1, 1, 1],
                          }
                        : undefined,
                  },
                  allObjectsForPathfinding
                );
              } catch {
                return startObj.position;
              }
            })()
          : connection.start?.position ||
            connection.start?.facePosition ||
            connection.start?.worldPosition ||
            startObj?.position || [0, 0, 0];

      const endPosition =
        endObj?.position && connection.end?.face
          ? (() => {
              try {
                return calculateFacePosition(
                  {
                    type: connection.end.type || endObj.type || 'cube',
                    face: connection.end.face,
                    objectId: connection.end.objectId,
                    faceCenter: connection.end.faceCenter,
                    cube: {
                      position: endObj.position,
                      scale: endObj.scale || [1, 1, 1],
                    },
                    plane:
                      endObj.type === 'plane'
                        ? {
                            position: endObj.position,
                            scale: endObj.scale || [1, 1, 1],
                          }
                        : undefined,
                  },
                  allObjectsForPathfinding
                );
              } catch {
                return endObj.position;
              }
            })()
          : connection.end?.position ||
            connection.end?.facePosition ||
            connection.end?.worldPosition ||
            endObj?.position || [0, 0, 0];

      // Validate positions more efficiently
      const isValid =
        Array.isArray(startPosition) &&
        Array.isArray(endPosition) &&
        startPosition.length >= 3 &&
        endPosition.length >= 3 &&
        startPosition.every((val) => typeof val === 'number' && !isNaN(val)) &&
        endPosition.every((val) => typeof val === 'number' && !isNaN(val));

      if (!isValid) {
        return {
          isValid: false,
          midpoint: [0, 0, 0],
          startPosition,
          endPosition,
        };
      }

      return {
        isValid: true,
        midpoint: calculateMidpoint(startPosition, endPosition),
        startPosition,
        endPosition,
      };
    }, [
      connection?.start?.objectId, // More specific dependencies
      connection?.end?.objectId,
      connection?.start?.face,
      connection?.end?.face,
      connection?.start?.position,
      connection?.end?.position,
      startObject?.position,
      startObject?.scale,
      startObject?.type,
      endObject?.position,
      endObject?.scale,
      endObject?.type,
      // Remove allObjectsForPathfinding from dependencies - only needed for face calculations
    ]);

    // Second hook: Filter relevant objects with stable dependencies
    // IMPORTANT: Include all objects for intersection testing, even endpoints,
    // Create a stable reference to filtered objects for pathfinding
    // This will only change when the allObjectsForPathfinding prop actually changes

    const stableLineStyle =
      connection?.styleType || connection?.lineStyle || 'straight';

    // PERFORMANCE: Separate pathfinding style from visual style
    // Only 'curved' matters for pathfinding - dashed/dotted don't affect the path
    const pathfindingStyle =
      stableLineStyle === 'curved' ? 'curved' : 'straight';

    const stableStartObjectId = connection?.start?.objectId;
    const stableEndObjectId = connection?.end?.objectId;
    const stablePathPoints = connection?._pathPoints;

    // Create a hash of nearby object positions to trigger path recalculation when they move
    // This allows dynamic pathfinding without full array comparison
    const nearbyObjectsHash = useMemo(() => {
      if (!connectionData.isValid || !allObjectsForPathfinding) return '';

      const { startPosition, endPosition } = connectionData;
      const lineLength = Math.sqrt(
        Math.pow(endPosition[0] - startPosition[0], 2) +
          Math.pow(endPosition[1] - startPosition[1], 2) +
          Math.pow(endPosition[2] - startPosition[2], 2)
      );

      // Track ALL objects that could affect this connection (within reasonable distance)
      // IMPORTANT: Include attached objects - pathfinding logic handles them separately
      const relevantObjects = allObjectsForPathfinding.filter((obj) => {
        if (!obj?.position || !Array.isArray(obj.position)) return false;

        // Quick distance check - only objects near the line
        const distanceSquared = obj.position.reduce(
          (sum, val, i) => sum + Math.pow(val - startPosition[i], 2),
          0
        );
        return distanceSquared < lineLength * lineLength * 4; // 2x line length radius
      });

      // Create hash from positions rounded to 1 decimal place for stability
      return relevantObjects
        .map(
          (obj) =>
            `${obj.id}:${obj.position.map((p) => p.toFixed(1)).join(',')}`
        )
        .join('|');
    }, [
      allObjectsForPathfinding,
      connectionData,
      stableStartObjectId,
      stableEndObjectId,
    ]);

    // Third hook: Calculate path and intersections
    // Use a more selective dependency to minimize re-renders
    const pathData = useMemo(() => {
      if (!connectionData.isValid) {
        return {
          calculatedPathPoints: [
            [0, 0, 0],
            [0, 0, 0],
          ],
          effectiveLineStyle: 'straight',
          intersections: [],
        };
      }

      const { startPosition, endPosition } = connectionData;
      const lineStyle = pathfindingStyle;
      const hasStoredPath = stablePathPoints && stablePathPoints.length > 0;

      // Only check intersections when necessary
      const shouldCheckIntersections = lineStyle === 'curved' || !hasStoredPath;
      const intersections = shouldCheckIntersections
        ? checkLineIntersection(
            startPosition,
            endPosition,
            allObjectsForPathfinding
          ) // <-- Use the prop name
        : null;

      // Determine if we need curved path
      const shouldCurve =
        lineStyle === 'curved' || (intersections && intersections.length > 0);

      // Use stored path when possible
      const calculatedPathPoints = shouldCurve
        ? generateCurvedPath(
            startPosition,
            endPosition,
            intersections,
            stableStartObjectId,
            stableEndObjectId,
            true
          )
        : stablePathPoints || [startPosition, endPosition];

      const isCurvedPath =
        calculatedPathPoints && calculatedPathPoints.length > 2 && shouldCurve;

      // PATHFINDING FIX: Don't override user's line style when pathfinding creates curved path
      // The path can be curved (multiple points) while the visual style stays straight/dashed/dotted
      // Only use 'curved' as effective style if user explicitly chose 'curved'
      const effectiveLineStyle = stableLineStyle;

      return {
        calculatedPathPoints: calculatedPathPoints || [
          startPosition,
          endPosition,
        ],
        effectiveLineStyle,
        intersections,
        isCurvedPath, // Add this so we know if pathfinding generated a curved path
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      connectionData, // Only depends on connectionData changes
      pathfindingStyle,
      stablePathPoints,
      stableStartObjectId,
      stableEndObjectId,
      stableLineStyle,
      allObjectsForPathfinding, // Keep for lint, but nearbyObjectsHash is what actually triggers
      nearbyObjectsHash, // Dynamic hash triggers recalc when nearby objects move
    ]);

    // Fourth hook: Calculate text position
    const textPositionData = useMemo(() => {
      if (!connectionData.isValid) {
        return { textPosition: [0, 0, 0] };
      }

      const { midpoint } = connectionData;
      const { calculatedPathPoints } = pathData;
      const offset = 2;

      let textPosition;
      // Check if path is curved (has more than 2 points) regardless of line style
      if (calculatedPathPoints?.length > 2) {
        // Use the middle point of the curved path
        const midIdx = Math.floor(calculatedPathPoints.length / 2);
        const midPoint = calculatedPathPoints[midIdx];
        const pos = Array.isArray(midPoint)
          ? midPoint
          : [midPoint.x, midPoint.y, midPoint.z];
        textPosition = [pos[0], pos[1] + offset, pos[2]];
      } else {
        // Use straight line midpoint
        textPosition = [midpoint[0], midpoint[1] + offset, midpoint[2]];
      }

      return { textPosition };
    }, [connectionData, pathData]); // Early return after all hooks are declared
    if (!connection) {
      return null;
    }
    // Early return for invalid connections - after all hooks are declared
    if (!connectionData.isValid) {
      return null;
    }

    // Extract all needed values from hooks
    const { midpoint } = connectionData;
    const { calculatedPathPoints, effectiveLineStyle } = pathData;
    const { textPosition } = textPositionData;
    // Determine connection text - prioritize lineTexts store over connection.text
    const connectionText =
      (lineTexts && lineTexts[connection.id]) || connection.text || '';

    // DEBUG: Log connection text for markdown connections
    if (connection.merfolkData) {
      // Debug logging removed
    }
    return (
      <group
        key={`${connection.id}-${connection._visualUpdate || 0}-${
          connection._localUpdate || 0
        }`}
      >
        {/* Conditional line rendering based on line style */}
        {/* Extract base style (without direction suffix like '-right', '-left') */}
        {(() => {
          const baseStyle = effectiveLineStyle.split('-')[0]; // 'dashed-right' -> 'dashed'

          // Render solid lines (straight path or curved path) using InstancedLine
          if (baseStyle === 'straight') {
            return (
              <InstancedLine
                key={`line-${connection.id}-${
                  connection._lastStyleUpdate || 0
                }`}
                points={pathToLineSegments(calculatedPathPoints)}
                color={
                  connection.color ||
                  (selectedConnection === connection.id ? '#ffff00' : 'black')
                }
                lineWidth={getLineWidth(connection.id)}
                onClick={(e) => handleConnectionClick(e, connection.id)}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = 'auto';
                }}
              />
            );
          }

          // Render dashed/dotted lines using AnimatedConnectionLine
          // These support pathfinding multi-point paths
          return (
            <AnimatedConnectionLine
              key={`animated-line-${connection.id}-${effectiveLineStyle}-${
                connection._lastStyleUpdate || 0
              }`}
              points={calculatedPathPoints}
              connectionId={connection.id}
              color={
                connection.color ||
                (selectedConnection === connection.id ? '#ffff00' : 'black')
              }
              lineWidth={getLineWidth(connection.id)}
              lineStyle={effectiveLineStyle}
              dashDirection={connection.dashDirection || null}
              dashOffset={connection.dashOffset || 0}
              isSelected={selectedConnection === connection.id}
              onClick={(e) => handleConnectionClick(e, connection.id)}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'auto';
              }}
            />
          );
        })()}
        {/* Connection text using AtlasTextSprite for better performance */}
        <AtlasTextSprite
          key={`text-${connection.id}-${connection.text || 'no-text'}-${
            connection.textStyle?.fontSize || 1.5
          }-${connection.textStyle?.color || 'black'}`}
          text={connectionText}
          position={textPosition}
          style={{
            fontSize: (connection.textStyle?.fontSize || 1.5) * 10, // Convert to pixel size for atlas
            color: connection.textStyle?.color || 'black',
            underline: connection.textStyle?.underline || false,
          }}
          onClick={(e) => handleLineTextClick(e, connection.id)}
          billboard={true}
          renderOrder={20} // Higher than connection lines (10) but lower than header text (3000-5000)
          scale={0.45} // 3x larger than previous 0.15 to match cube header text size
          lineStyle={effectiveLineStyle} // Pass line style for dynamic positioning
          pathPoints={calculatedPathPoints} // Pass path points for curved line positioning
        />{' '}
        {/* Text input UI */}
        {showLineTextInput === connection.id && (
          <HeaderInput
            position={[midpoint[0], midpoint[1] + 5, midpoint[2]]}
            onTextSubmit={(text) => handleLineTextSubmit(connection.id, text)}
            inputId={`connection-${connection.id}-text`}
            initialText={connectionText}
          />
        )}
        {/* Text style UI */}
        {showLineTextStyleUI === connection.id && (
          <TextStyleUI
            position={[midpoint[0], midpoint[1] + 8, midpoint[2]]}
            onStyleChange={(style) =>
              handleLineTextStyleChange(connection.id, style)
            }
            onClose={() => setShowLineTextStyleUI(null)}
            currentStyle={connection.textStyle || {}}
            uiType="connection"
          />
        )}
        {/* Connection controls */}
        {selectedConnection === connection.id && (
          <LineUI
            position={midpoint}
            onColorChange={(color) =>
              handleLineColorChange(connection.id, color)
            }
            onToggleDashed={(styleType) =>
              handleLineStyleChange(connection.id, styleType)
            }
            onTextClick={() => {
              setShowLineTextInput(connection.id);
              selectConnection(null);
            }}
            currentText={connectionText}
            hasText={!!connectionText && connectionText.trim() !== ''}
            currentConnection={connection}
          />
        )}
      </group>
    );
  },
  (prevProps, nextProps) => {
    // Re-render if the pathfinding objects changed (any object moved)
    if (
      prevProps.allObjectsForPathfinding !== nextProps.allObjectsForPathfinding
    ) {
      return false; // Props changed, need to re-render
    }

    // Only re-render if the connection data actually changed
    const connectionChanged =
      prevProps.connection.id !== nextProps.connection.id ||
      prevProps.connection._visualUpdate !==
        nextProps.connection._visualUpdate ||
      prevProps.connection._localUpdate !== nextProps.connection._localUpdate ||
      prevProps.connection._lastStyleUpdate !==
        nextProps.connection._lastStyleUpdate ||
      prevProps.connection.color !== nextProps.connection.color ||
      prevProps.connection.text !== nextProps.connection.text ||
      prevProps.connection.styleType !== nextProps.connection.styleType ||
      prevProps.connection.lineStyle !== nextProps.connection.lineStyle ||
      prevProps.connection.dashDirection !==
        nextProps.connection.dashDirection ||
      JSON.stringify(prevProps.connection.textStyle) !==
        JSON.stringify(nextProps.connection.textStyle) ||
      prevProps.connection.start?.position !==
        nextProps.connection.start?.position ||
      prevProps.connection.end?.position !== nextProps.connection.end?.position;

    // Re-render only if connection-specific data changed
    // We'll handle pathfinding object changes more selectively in the component
    return !connectionChanged;
  }
);

Connection.displayName = 'Connection';

/**
 * Component for rendering all connections
 */
const ConnectionsRenderer = ({
  objects,
  visibleObjectIds,
  onLineStyleChange,
  onLineColorChange,
  onConnectionClick,
  onLineTextClick,
  onLineTextSubmit,
  onLineTextStyleChange,
}) => {
  // Get all connections from store
  const connections = useConnectionStore((state) => state.connections);
  const connectionsVisible = useConnectionStore(
    (state) => state.connectionsVisible
  );

  // Create a stable set of available object IDs to avoid recalculating on every render
  const availableObjectIds = useMemo(() => {
    if (!objects || objects.length === 0) return new Set();
    return new Set(objects.map((obj) => obj.id.toString()));
  }, [objects]);

  // Create pathfinding objects for intersection calculations
  // This will update whenever the objects array reference changes (which happens when positions update)
  const pathfindingObjects = useMemo(() => {
    if (!objects?.length) return [];

    // Create object references with current positions
    // The objects array ref changes when ANY object position/scale changes (via store's hash comparison)
    return objects.map((obj) => ({
      id: obj.id,
      position: obj.position || [0, 0, 0],
      scale: obj.scale || [1, 1, 1],
      type: obj.type,
      faceSize: obj.faceSize,
    }));
  }, [objects]);

  // Filter connections to only show those where both endpoint objects are visible
  const visibleConnections = useMemo(() => {
    if (!connections?.length) return [];

    // Pre-create set for faster lookups
    const visibleIds = visibleObjectIds || availableObjectIds;

    return connections.filter((connection) => {
      const startId = connection.start?.objectId?.toString();
      const endId = connection.end?.objectId?.toString();
      return (
        startId && endId && visibleIds.has(startId) && visibleIds.has(endId)
      );
    });
  }, [connections, visibleObjectIds, availableObjectIds]);

  // Render each visible connection
  return (
    <group>
      {connectionsVisible &&
        visibleConnections.map((connection) => (
          <Connection
            key={connection.id}
            connection={connection}
            allObjectsForPathfinding={pathfindingObjects}
            onLineStyleChange={onLineStyleChange}
            onLineColorChange={onLineColorChange}
            onConnectionClick={onConnectionClick}
            onLineTextClick={onLineTextClick}
            onLineTextSubmit={onLineTextSubmit}
            onLineTextStyleChange={onLineTextStyleChange}
          />
        ))}
    </group>
  );
};

// Wrap in React.memo with custom comparison to prevent unnecessary re-renders
export default React.memo(ConnectionsRenderer, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.objects === nextProps.objects &&
    prevProps.visibleObjectIds === nextProps.visibleObjectIds &&
    prevProps.onLineStyleChange === nextProps.onLineStyleChange &&
    prevProps.onLineColorChange === nextProps.onLineColorChange &&
    prevProps.onConnectionClick === nextProps.onConnectionClick &&
    prevProps.onLineTextClick === nextProps.onLineTextClick &&
    prevProps.onLineTextSubmit === nextProps.onLineTextSubmit &&
    prevProps.onLineTextStyleChange === nextProps.onLineTextStyleChange
  );
});
