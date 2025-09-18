import { useMemo } from 'react';
import TextSprite from './TextSprite';
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

// Separate connection rendering into a sub-component to fix the hooks issue
const Connection = ({
  connection,
  objects,
  onLineStyleChange,
  onLineColorChange,
  onConnectionClick,
  onLineTextClick,
  onLineTextSubmit,
  onLineTextStyleChange,
}) => {
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

  // Handler functions using store actions
  const handleConnectionClick = (e, connectionId) => {
    if (onConnectionClick) {
      onConnectionClick(e, connectionId);
    } else {
      e.stopPropagation();
      selectConnection(connectionId);
    }
  };

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
    if (onLineStyleChange) {
      onLineStyleChange(connectionId, styleType);
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

      // Update both styleType and dashDirection
      updateConnection(connectionId, {
        styleType: baseStyle,
        dashDirection: direction,
      });

      const updatedConnection = connections.find(
        (conn) => conn.id === connectionId
      );
      if (updatedConnection) {
        saveConnection(window.currentUser?.uid, window.currentSpaceId, {
          ...updatedConnection,
          styleType: baseStyle,
          dashDirection: direction,
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
  // Declare all useMemo hooks unconditionally  // First hook: Calculate basic connection data with real-time object positions
  const connectionData = useMemo(() => {
    // Handle invalid connections gracefully inside the hook
    if (!connection) {
      return { isValid: false, midpoint: [0, 0, 0] };
    } // Find current object positions to ensure real-time updates
    const startObject = objects?.find(
      (obj) => obj.id.toString() === connection.start?.objectId?.toString()
    );
    const endObject = objects?.find(
      (obj) => obj.id.toString() === connection.end?.objectId?.toString()
    ); // Calculate positions using current object positions first (for real-time updates)
    // Priority: Current object position with face calculation > stored face positions > object centers
    let startPosition;
    if (startObject && startObject.position && connection.start?.face) {
      // First priority: Recalculate face position based on current object position
      try {
        const indicatorData = {
          type: connection.start.type || startObject.type || 'cube', // Use stored connection type first, then object type as fallback
          face: connection.start.face,
          objectId: connection.start.objectId,
          faceCenter: connection.start.faceCenter, // Include faceCenter for dodecahedrons
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

        // Debug logging for face issues - DISABLED for performance
        // if (startObject.type === 'dodecahedron') {
        //   console.log('🔍 ConnectionsRenderer START face debug:', {
        //     connectionId: connection.id,
        //     objectType: startObject.type,
        //     originalFace: connection.start.face,
        //     faceType: typeof connection.start.face,
        //     indicatorData: indicatorData,
        //   });
        // }

        startPosition = calculateFacePosition(indicatorData, objects);

        // Debug the calculated position - DISABLED for performance
        // if (
        //   startObject.type === 'dodecahedron' ||
        //   indicatorData.type === 'dodecahedron'
        // ) {
        //   console.log('🎯 ConnectionsRenderer START calculated position:', {
        //     connectionId: connection.id,
        //     calculatedPosition: startPosition,
        //     objectCenter: startObject.position,
        //     face: connection.start.face,
        //     indicatorType: indicatorData.type,
        //   });
        // }
      } catch {
        // Calculate error fallback - debug disabled for performance
        // if (startObject.type === 'dodecahedron') {
        //   console.log(
        //     '⚠️ ConnectionsRenderer START calculateFacePosition FAILED - using fallback logic:',
        //     {
        //       connectionId: connection.id,
        //       face: connection.start.face,
        //       objectType: startObject.type,
        //       error: error.message,
        //       storedPosition: connection.start.position,
        //       fallbackSequence:
        //         'about to try stored position, facePosition, worldPosition, then center',
        //     }
        //   );
        // }

        startPosition = startObject.position;
      }
    } else if (Array.isArray(connection.start?.position)) {
      // Fallback: Use stored face position from connection creation
      startPosition = connection.start.position;
    } else if (Array.isArray(connection.start?.facePosition)) {
      startPosition = connection.start.facePosition;
    } else if (Array.isArray(connection.start?.worldPosition)) {
      startPosition = connection.start.worldPosition;
    } else if (startObject && startObject.position) {
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
    if (endObject && endObject.position && connection.end?.face) {
      // First priority: Recalculate face position based on current object position
      try {
        const indicatorData = {
          type: connection.end.type || endObject.type || 'cube', // Use stored connection type first, then object type as fallback
          face: connection.end.face,
          objectId: connection.end.objectId,
          faceCenter: connection.end.faceCenter, // Include faceCenter for dodecahedrons
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

        // Debug logging for face issues - DISABLED for performance
        // if (endObject.type === 'dodecahedron') {
        //   console.log('🔍 ConnectionsRenderer END face debug:', {
        //     connectionId: connection.id,
        //     objectType: endObject.type,
        //     originalFace: connection.end.face,
        //     faceType: typeof connection.end.face,
        //     indicatorData: indicatorData,
        //   });
        // }

        endPosition = calculateFacePosition(indicatorData, objects);

        // Debug the calculated position - DISABLED for performance
        // if (
        //   endObject.type === 'dodecahedron' ||
        //   indicatorData.type === 'dodecahedron'
        // ) {
        //   console.log('🎯 ConnectionsRenderer END calculated position:', {
        //     connectionId: connection.id,
        //     calculatedPosition: endPosition,
        //     objectCenter: endObject.position,
        //     face: connection.end.face,
        //     indicatorType: indicatorData.type,
        //   });
        // }
      } catch {
        // Calculate error fallback - debug disabled for performance
        // if (endObject.type === 'dodecahedron') {
        //   console.log(
        //     '⚠️ ConnectionsRenderer END calculateFacePosition FAILED - using fallback logic:',
        //     {
        //       connectionId: connection.id,
        //       face: connection.end.face,
        //       objectType: endObject.type,
        //       error: error.message,
        //       storedPosition: connection.end.position,
        //       fallbackSequence:
        //         'about to try stored position, facePosition, worldPosition, then center',
        //     }
        //   );
        // }

        endPosition = endObject.position;
      }
    } else if (Array.isArray(connection.end?.position)) {
      // Fallback: Use stored face position from connection creation
      endPosition = connection.end.position;
    } else if (Array.isArray(connection.end?.facePosition)) {
      endPosition = connection.end.facePosition;
    } else if (Array.isArray(connection.end?.worldPosition)) {
      endPosition = connection.end.worldPosition;
    } else if (endObject && endObject.position) {
      // Last resort: Use current object center position
      endPosition = endObject.position;
    } else {
      // REMOVED: No fallback to [0, 0, 0] - this causes 5000+ unit distances
      // If we can't find the object or position, skip this connection
      // console.warn(
      //   '⚠️ ConnectionsRenderer: No valid end position found for connection',
      //   connection.id
      // );
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
    // Depend on connection and objects, but memoization will still help with expensive calculations
  }, [connection, objects]);

  // Second hook: Filter relevant objects
  const filteredObjects = useMemo(() => {
    if (!connection) return [];

    const startObjectId = connection.start?.objectId || '';
    const endObjectId = connection.end?.objectId || '';
    return objects
      ? objects.filter(
          (obj) =>
            obj &&
            obj.id &&
            startObjectId &&
            endObjectId &&
            obj.id.toString() !== startObjectId.toString() &&
            obj.id.toString() !== endObjectId.toString()
        )
      : [];
  }, [connection, objects]); // Extract stable values to prevent unnecessary recalculations
  const stableLineStyle =
    connection?.styleType || connection?.lineStyle || 'straight';
  const stableStartObjectId = connection?.start?.objectId;
  const stableEndObjectId = connection?.end?.objectId;
  const stablePathPoints = connection?._pathPoints;

  // Third hook: Calculate path and intersections
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
    const lineStyle = stableLineStyle;

    // Calculate intersections
    const intersections = checkLineIntersection(
      startPosition,
      endPosition,
      filteredObjects
    );

    // PATHFINDING DEBUG: Log intersection results for troubleshooting
    if (connection.id && connection.id.includes('merfolk')) {
      // Debug logging removed
    }

    // Generate path (curved if needed)
    // PATHFINDING FIX: Curve lines automatically when intersections are detected
    const shouldCurve =
      lineStyle === 'curved' || (intersections && intersections.length > 0);

    // DEBUG: Log the shouldCurve decision
    if (
      connection.id &&
      connection.id.includes('merfolk') &&
      intersections &&
      intersections.length > 0
    ) {
      // Debug logging removed
    }

    const calculatedPathPoints =
      pathPoints ||
      (shouldCurve
        ? (() => {
            // DEBUG: Log right before generateCurvedPath call
            if (connection.id && connection.id.includes('merfolk')) {
              // Debug logging removed
            }
            return generateCurvedPath(
              startPosition,
              endPosition,
              intersections,
              startObjectId,
              endObjectId,
              shouldCurve // Curve when intersections found OR explicitly set to curved
            );
          })()
        : (() => {
            // DEBUG: Log when using straight line
            if (connection.id && connection.id.includes('merfolk')) {
              // Debug logging removed
            }
            return [startPosition, endPosition];
          })()); // Straight line - just use start and end points

    // DEBUG: Log the path calculation result
    if (
      connection.id &&
      connection.id.includes('merfolk') &&
      intersections &&
      intersections.length > 0
    ) {
      // Debug logging removed
    }

    // Determine if path should be curved
    const isCurvedPath =
      calculatedPathPoints &&
      calculatedPathPoints.length > 2 &&
      (shouldCurve || (intersections && intersections.length > 0)); // Determine effective line style
    const effectiveLineStyle = isCurvedPath ? 'curved' : lineStyle;
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
    // Style-related properties
    stableLineStyle,
    stableStartObjectId,
    stableEndObjectId,
    stablePathPoints,
    // CRITICAL: Include connectionData to recalculate paths when positions change
    connectionData,
    filteredObjects, // Include filtered objects for intersection calculations
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
      {/* Replace standard Line with optimized AnimatedConnectionLine */}{' '}
      <AnimatedConnectionLine
        key={`line-${connection.id}-${effectiveLineStyle}-${
          connection._lastStyleUpdate || 0
        }`}
        points={calculatedPathPoints}
        connectionId={connection.id}
        color={
          connection.color ||
          (selectedConnection === connection.id ? '#ffff00' : 'black')
        }
        lineWidth={(() => {
          const isMobile =
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
              navigator.userAgent
            );
          const baseWidth = isMobile ? 3 : 2;
          return selectedConnection === connection.id
            ? baseWidth * 1.5
            : baseWidth;
        })()}
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
      {/* Connection text */}
      <TextSprite
        key={`text-${connection.id}-${
          connection._lastStyleUpdate || 0
        }-${effectiveLineStyle}-${connection._textRefresh || 0}`}
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
        renderOrder={20}
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
          onColorChange={(color) => handleLineColorChange(connection.id, color)}
          onToggleDashed={(styleType) =>
            handleLineStyleChange(connection.id, styleType)
          }
          onTextClick={() => {
            setShowLineTextInput(connection.id);
            selectConnection(null); // Close the LineUI menu by deselecting the connection
          }}
          currentText={connectionText}
          hasText={!!connectionText && connectionText.trim() !== ''}
          currentConnection={connection}
        />
      )}
    </group>
  );
};

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

  // Filter connections to only show those where both endpoint objects are visible
  const visibleConnections = useMemo(() => {
    // Only show connections when spatial filtering is active AND objects are visible
    if (!visibleObjectIds || visibleObjectIds.size === 0) {
      return []; // Don't show any connections until spatial system loads objects
    }

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
  }, [connections, visibleObjectIds]);

  // Render each visible connection
  return (
    <group>
      {visibleConnections.map((connection) => (
        <Connection
          key={connection.id}
          connection={connection}
          objects={objects}
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

// Export the ConnectionsRenderer directly without aggressive memoization
// The useConnectionStore hook will handle re-rendering when connections change
export default ConnectionsRenderer;
