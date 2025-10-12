import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import TextSprite from './TextSprite';
import LineUI from './LineUI';
import HeaderInput from './HeaderInput';
import TextStyleUI from './TextStyleUI';
import AnimatedConnectionLine from './AnimatedConnectionLine';
import PooledLine from './PooledLine';
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
      // Handle invalid connections gracefully inside the hook
      if (!connection) {
        return { isValid: false, midpoint: [0, 0, 0] };
      }

      // Calculate positions using current object positions first (for real-time updates)
      // Priority: Current object position with face calculation > stored face positions > object centers
      let startPosition;
      if (startObject?.position && connection.start?.face) {
        // First priority: Recalculate face position based on current object position
        try {
          const indicatorData = {
            type: connection.start.type || startObject.type || 'cube',
            face: connection.start.face,
            objectId: connection.start.objectId,
            faceCenter: connection.start.faceCenter,
            cube: {
              position: startObject.position,
              scale: startObject.scale || [1, 1, 1],
            },
            plane:
              startObject.type === 'plane'
                ? {
                    position: startObject.position,
                    scale: startObject.scale || [1, 1, 1],
                  }
                : undefined,
          };

          startPosition = calculateFacePosition(
            indicatorData,
            allObjectsForPathfinding
          );
        } catch {
          startPosition = startObject.position;
        }
      } else if (Array.isArray(connection.start?.position)) {
        // Fallback: Use stored face position from connection creation
        startPosition = connection.start.position;
      } else if (Array.isArray(connection.start?.facePosition)) {
        startPosition = connection.start.facePosition;
      } else if (Array.isArray(connection.start?.worldPosition)) {
        startPosition = connection.start.worldPosition;
      } else if (startObject?.position) {
        // Last resort: Use current object center position
        startPosition = startObject.position;
      } else {
        // REMOVED: No fallback to [0, 0, 0] - this causes 5000+ unit distances
        // If we can't find the object or position, skip this connection
        // console.warn(
        //   '⚠️ ConnectionsRenderer: No valid start position found for connection',
        //   connection.id
        // );
        return { isValid: false, midpoint: [0, 0, 0] };
      } // For end position - same priority order
      let endPosition;
      if (endObject?.position && connection.end?.face) {
        // First priority: Recalculate face position based on current object position
        try {
          const indicatorData = {
            type: connection.end.type || endObject.type || 'cube',
            face: connection.end.face,
            objectId: connection.end.objectId,
            faceCenter: connection.end.faceCenter,
            cube: {
              position: endObject.position,
              scale: endObject.scale || [1, 1, 1],
            },
            plane:
              endObject.type === 'plane'
                ? {
                    position: endObject.position,
                    scale: endObject.scale || [1, 1, 1],
                  }
                : undefined,
          };

          endPosition = calculateFacePosition(
            indicatorData,
            allObjectsForPathfinding
          );
        } catch {
          endPosition = endObject.position;
        }
      } else if (Array.isArray(connection.end?.position)) {
        // Fallback: Use stored face position from connection creation
        endPosition = connection.end.position;
      } else if (Array.isArray(connection.end?.facePosition)) {
        endPosition = connection.end.facePosition;
      } else if (Array.isArray(connection.end?.worldPosition)) {
        endPosition = connection.end.worldPosition;
      } else if (endObject?.position) {
        // Last resort: Use current object center position
        endPosition = endObject.position;
      } else {
        return { isValid: false, midpoint: [0, 0, 0] };
      }
      return {
        isValid: Boolean(
          connection &&
            connection.start &&
            connection.end &&
            startPosition &&
            endPosition &&
            Array.isArray(startPosition) &&
            Array.isArray(endPosition) &&
            startPosition.length >= 3 &&
            endPosition.length >= 3 &&
            startPosition.every(
              (val) => typeof val === 'number' && !isNaN(val)
            ) &&
            endPosition.every((val) => typeof val === 'number' && !isNaN(val))
        ),
        midpoint: calculateMidpoint(startPosition, endPosition),
        startPosition,
        endPosition,
      };
    }, [connection, startObject, endObject, allObjectsForPathfinding]);

    // Second hook: Filter relevant objects with stable dependencies
    // IMPORTANT: Include all objects for intersection testing, even endpoints,
    // Create a stable reference to filtered objects for pathfinding
    // This will only change when the allObjectsForPathfinding prop actually changes
    const filteredObjects = useMemo(() => {
      if (!allObjectsForPathfinding) return [];
      return allObjectsForPathfinding.filter((obj) => obj && obj.id);
    }, [allObjectsForPathfinding]);
    const stableLineStyle =
      connection?.styleType || connection?.lineStyle || 'straight';

    // PERFORMANCE: Separate pathfinding style from visual style
    // Only 'curved' matters for pathfinding - dashed/dotted don't affect the path
    const pathfindingStyle =
      stableLineStyle === 'curved' ? 'curved' : 'straight';

    const stableStartObjectId = connection?.start?.objectId;
    const stableEndObjectId = connection?.end?.objectId;
    const stablePathPoints = connection?._pathPoints;

    // Third hook: Calculate path and intersections
    // Use a more selective dependency to minimize re-renders
    const pathData = useMemo(() => {
      if (!connection || !connectionData.isValid) {
        return {
          calculatedPathPoints: [
            [0, 0, 0],
            [0, 0, 0],
          ],
          effectiveLineStyle: 'straight',
          intersections: [],
        };
      }
      const startPosition = connectionData.startPosition;
      const endPosition = connectionData.endPosition;
      const startObjectId = stableStartObjectId || '';
      const endObjectId = stableEndObjectId || '';
      const pathPoints = stablePathPoints;
      const lineStyle = pathfindingStyle; // Use pathfinding style instead of stableLineStyle

      // PERFORMANCE OPTIMIZATION: Skip expensive pathfinding for connections that:
      // 1. Have pre-calculated pathPoints stored (from bulk imports)
      // 2. Are straight lines and user hasn't requested curved
      const hasStoredPath = pathPoints && pathPoints.length > 0;
      const userRequestedCurved = lineStyle === 'curved';

      // Only do expensive intersection checking if:
      // - User explicitly wants curved lines, OR
      // - Connection doesn't have a pre-calculated path
      const shouldCheckIntersections = userRequestedCurved || !hasStoredPath;

      const intersections = shouldCheckIntersections
        ? checkLineIntersection(startPosition, endPosition, filteredObjects)
        : null;

      // Generate path (curved if needed)
      // PATHFINDING FIX: Curve lines automatically when intersections are detected
      const shouldCurve =
        lineStyle === 'curved' || (intersections && intersections.length > 0);

      // Use stored path if available and no intersections detected, otherwise calculate
      const calculatedPathPoints = shouldCurve
        ? generateCurvedPath(
            startPosition,
            endPosition,
            intersections,
            startObjectId,
            endObjectId,
            true
          )
        : pathPoints || [startPosition, endPosition]; // No intersections -> use stored path or straight line

      // Determine if path should be curved
      const isCurvedPath =
        calculatedPathPoints &&
        calculatedPathPoints.length > 2 &&
        (shouldCurve || (intersections && intersections.length > 0));

      // Determine effective line style - use 'curved' only for user-requested curved lines
      // For dashed/dotted lines with intersections, keep the original style
      const effectiveLineStyle =
        isCurvedPath && stableLineStyle === 'straight'
          ? 'curved'
          : stableLineStyle; // Use actual line style for rendering

      const finalPathPoints = calculatedPathPoints || [
        startPosition,
        endPosition,
      ];

      return {
        calculatedPathPoints: finalPathPoints,
        effectiveLineStyle,
        intersections,
      };
    }, [
      connection, // Include connection for completeness
      // CRITICAL: Only depend on pathfinding style, not visual style
      // This prevents recalculation when changing dashed/dotted/straight
      pathfindingStyle,
      stableStartObjectId,
      stableEndObjectId,
      stablePathPoints,
      // CRITICAL: Include connectionData to recalculate paths when positions change
      connectionData,
      // Only include filteredObjects when the connection actually needs pathfinding
      filteredObjects,
      // Include actual style for effectiveLineStyle calculation
      stableLineStyle,
    ]);

    // Fourth hook: Calculate text position
    const textPositionData = useMemo(() => {
      if (!connection || !connectionData.isValid) {
        return { textPosition: [0, 0, 0] };
      }

      // Define default offsets
      const defaultStraightLineOffset = 2;
      const defaultCurvedLineOffset = 5;
      const { midpoint } = connectionData;
      const { calculatedPathPoints, effectiveLineStyle } = pathData;

      // Calculate text position based on line style
      let textPosition;
      if (calculatedPathPoints && calculatedPathPoints.length > 0) {
        if (effectiveLineStyle === 'curved') {
          const midIdx = Math.floor(calculatedPathPoints.length / 2);
          const midPoint = calculatedPathPoints[midIdx];

          // Handle both Vector3 objects and arrays
          if (midPoint && typeof midPoint === 'object' && 'x' in midPoint) {
            // Vector3 object
            textPosition = [
              midPoint.x,
              midPoint.y + defaultCurvedLineOffset,
              midPoint.z,
            ];
          } else if (Array.isArray(midPoint) && midPoint.length >= 3) {
            // Array format
            textPosition = [
              midPoint[0],
              midPoint[1] + defaultCurvedLineOffset,
              midPoint[2],
            ];
          } else {
            // Fallback to midpoint
            textPosition = [
              midpoint[0],
              midpoint[1] + defaultCurvedLineOffset,
              midpoint[2],
            ];
          }
        } else {
          textPosition = [
            midpoint[0],
            midpoint[1] + defaultStraightLineOffset,
            midpoint[2],
          ];
        }
      } else {
        textPosition = [
          midpoint[0],
          midpoint[1] + defaultStraightLineOffset,
          midpoint[2],
        ];
      }

      return {
        textPosition,
      };
    }, [connection, connectionData, pathData]); // Early return after all hooks are declared
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
        {effectiveLineStyle === 'straight' ? (
          // Visible straight line using PooledLine (falls back to Line when clickable)
          <PooledLine
            key={`pooled-line-${connection.id}-${
              connection._lastStyleUpdate || 0
            }`}
            points={calculatedPathPoints}
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
            renderOrder={10}
            depthWrite={false}
            depthTest={true}
          />
        ) : effectiveLineStyle === 'curved' ? (
          // Curved line using regular Line component for path support
          <Line
            key={`curved-line-${connection.id}-${
              connection._lastStyleUpdate || 0
            }`}
            points={calculatedPathPoints}
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
            renderOrder={10}
            depthWrite={false}
            depthTest={true}
          />
        ) : (
          // Animated lines (dashed, dotted, etc.) use AnimatedConnectionLine
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
        )}
        {/* Connection text */}
        <TextSprite
          key={`text-${connection.id}-${connection.text || 'no-text'}-${
            connection.textStyle?.fontSize || 1.5
          }-${connection.textStyle?.color || 'black'}`}
          text={connectionText}
          position={textPosition}
          style={{
            fontSize: connection.textStyle?.fontSize || 1.5,
            color: connection.textStyle?.color || 'black',
            underline: connection.textStyle?.underline || false,
            fixedSize: true,
            backgroundOpacity: 0.4,
            backgroundColor: '#000000',
            padding: 0.3,
          }}
          onClick={(e) => handleLineTextClick(e, connection.id)}
          billboard={true}
          renderOrder={20} // Higher than connection lines (10) but lower than header text (3000-5000)
          lineStyle={effectiveLineStyle}
          pathPoints={calculatedPathPoints}
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
  // Use a more stable reference that only changes when objects actually change
  const allObjectsForPathfinding = useMemo(() => {
    if (!objects || objects.length === 0) return [];

    // Create a hash of relevant object properties to detect actual changes
    const objectsHash = objects
      .map(
        (obj) =>
          `${obj.id}:${obj.position?.join(',') || ''}:${
            obj.scale?.join(',') || ''
          }:${obj.type || ''}`
      )
      .join('|');

    return {
      objects: objects.map((obj) => ({
        id: obj.id,
        position: obj.position,
        scale: obj.scale || [1, 1, 1],
        type: obj.type,
        faceSize: obj.faceSize,
      })),
      hash: objectsHash,
    };
  }, [objects]);

  // Extract just the objects array but with a stable reference when hash doesn't change
  const stablePathfindingObjects = useMemo(() => {
    return allObjectsForPathfinding.objects;
  }, [allObjectsForPathfinding.hash]);

  // Filter connections to only show those where both endpoint objects are visible
  const visibleConnections = useMemo(() => {
    // ISSUE FIX: For anonymous users or when spatial system hasn't loaded,
    // still show connections if we have objects and connections
    if (!visibleObjectIds || visibleObjectIds.size === 0) {
      // If we have objects but no visibleObjectIds, fall back to showing all connections
      // where both endpoint objects exist in the objects array
      if (availableObjectIds.size > 0 && connections.length > 0) {
        return connections.filter((connection) => {
          const startObjectId = connection.start?.objectId?.toString();
          const endObjectId = connection.end?.objectId?.toString();

          return (
            startObjectId &&
            endObjectId &&
            availableObjectIds.has(startObjectId) &&
            availableObjectIds.has(endObjectId)
          );
        });
      }

      return []; // Don't show any connections if no objects loaded
    }

    // Normal spatial filtering when visibleObjectIds is available
    return connections.filter((connection) => {
      const startObjectId = connection.start?.objectId?.toString();
      const endObjectId = connection.end?.objectId?.toString();

      // Only show connection if both endpoint objects are currently loaded/visible
      return (
        startObjectId &&
        endObjectId &&
        visibleObjectIds.has(startObjectId) &&
        visibleObjectIds.has(endObjectId)
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
            allObjectsForPathfinding={stablePathfindingObjects}
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
