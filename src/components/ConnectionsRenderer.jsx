import React, { useMemo } from 'react';
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
import PublicConnectionsRenderer from './PublicConnectionsRenderer';
import { useConnectionStore } from '../stores';

// Separate connection rendering into a sub-component to fix the hooks issue
const Connection = ({
  connection,
  objects,
  onLineStyleChange,
  onLineColorChange,
  onConnectionClick,
  onLineTextClick,
  onLineTextSubmit,
}) => {
  // Use connection store for state
  const selectedConnection = useConnectionStore(
    (state) => state.selectedConnection
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
  const updateLineTextStyle = useConnectionStore(
    (state) => state.updateLineTextStyle
  );
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
      setShowLineTextInput(connectionId);
    }
  };

  const handleLineTextSubmit = (connectionId, text) => {
    if (onLineTextSubmit) {
      return onLineTextSubmit(connectionId, text);
    } else {
      setLineText(connectionId, text);
      setShowLineTextInput(null);
      // Update the connection object with the new text
      updateConnection(connectionId, { text });
      return true;
    }
  };

  const handleLineTextStyleChange = (connectionId, style) => {
    updateLineTextStyle(connectionId, style);
    // Update the connection object with the new text style
    updateConnection(connectionId, { textStyle: style });
  };
  const handleLineStyleChange = (connectionId, styleType) => {
    if (onLineStyleChange) {
      onLineStyleChange(connectionId, styleType);
    } else {
      updateConnection(connectionId, { lineStyle: styleType });
    }
  };

  const handleLineColorChange = (connectionId, color) => {
    if (onLineColorChange) {
      onLineColorChange(connectionId, color);
    } else {
      updateConnection(connectionId, { lineColor: color });
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
          type: startObject.type || 'cube',
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
        startPosition = calculateFacePosition(indicatorData, objects);
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
    } else if (startObject && startObject.position) {
      // Last resort: Use current object center position
      startPosition = startObject.position;
    } else {
      startPosition = [0, 0, 0];
    } // For end position - same priority order
    let endPosition;
    if (endObject && endObject.position && connection.end?.face) {
      // First priority: Recalculate face position based on current object position
      try {
        const indicatorData = {
          type: endObject.type || 'cube',
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
        endPosition = calculateFacePosition(indicatorData, objects);
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
    } else if (endObject && endObject.position) {
      // Last resort: Use current object center position
      endPosition = endObject.position;
    } else {
      endPosition = [0, 0, 0];
    }

    return {
      isValid: Boolean(
        connection &&
          connection.start &&
          connection.end &&
          startPosition &&
          endPosition
      ),
      midpoint: calculateMidpoint(startPosition, endPosition),
      startPosition,
      endPosition,
    };
    // Simplified dependencies to reduce re-calculations
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

    // Generate path (curved if needed)
    const calculatedPathPoints =
      pathPoints ||
      generateCurvedPath(
        startPosition,
        endPosition,
        intersections,
        startObjectId,
        endObjectId,
        lineStyle === 'curved'
      ); // Determine if path should be curved
    const isCurvedPath =
      calculatedPathPoints &&
      calculatedPathPoints.length > 2 &&
      intersections &&
      intersections.length > 0; // Determine effective line style
    const effectiveLineStyle =
      isCurvedPath || lineStyle === 'curved' ? 'curved' : lineStyle;
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
        textPosition = [
          calculatedPathPoints[midIdx].x,
          calculatedPathPoints[midIdx].y + defaultCurvedLineOffset,
          calculatedPathPoints[midIdx].z,
        ];
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

  // Determine connection text
  const connectionText =
    connection.text || (lineTexts && lineTexts[connection.id]) || '';
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
        lineWidth={selectedConnection === connection.id ? 1 : 1}
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
          onTextClick={() => setShowLineTextInput(connection.id)}
          currentText={connectionText}
          hasText={!!connectionText && connectionText.trim() !== ''}
          currentConnection={connection}
        />
      )}
    </group>
  );
};

// Simplified memoization to reduce excessive re-renders
const MemoizedConnection = React.memo(Connection, (prevProps, nextProps) => {
  // Always re-render if connection has visual updates
  if (
    nextProps.connection?._visualUpdate !== prevProps.connection?._visualUpdate
  ) {
    return false; // Re-render
  }

  // Always re-render if connection has local updates
  if (
    nextProps.connection?._localUpdate !== prevProps.connection?._localUpdate
  ) {
    return false; // Re-render
  }

  // Re-render if connection object reference has actually changed
  if (prevProps.connection !== nextProps.connection) return false;

  // Re-render if objects array reference has changed
  if (prevProps.objects !== nextProps.objects) return false;

  // Re-render if any handlers have changed
  if (prevProps.onLineStyleChange !== nextProps.onLineStyleChange) return false;
  if (prevProps.onLineColorChange !== nextProps.onLineColorChange) return false;
  if (prevProps.onConnectionClick !== nextProps.onConnectionClick) return false;
  if (prevProps.onLineTextClick !== nextProps.onLineTextClick) return false;
  if (prevProps.onLineTextSubmit !== nextProps.onLineTextSubmit) return false;

  // If none changed, prevent re-render
  return true;
});

/**
 * Component for rendering all connections
 */
const ConnectionsRenderer = ({
  objects,
  onLineStyleChange,
  onLineColorChange,
  onConnectionClick,
  onLineTextClick,
  onLineTextSubmit,
}) => {
  // Use connection store for state
  const connectionsFromStore = useConnectionStore((state) => state.connections); // Ensure connections is always an array
  const connections = useMemo(() => {
    if (Array.isArray(connectionsFromStore)) {
      return connectionsFromStore;
    }
    return []; // Fallback to empty array
  }, [connectionsFromStore]);

  // DEBUG: Removed console.log to prevent infinite re-render loop

  // Check if we're in read-only public mode (anonymous access)
  const isAnonymous = !window.currentUser;
  const isPublicSpace = window.publicAccessSpace && window.currentSpaceOwner;

  // For anonymous users in public spaces, use the dedicated public renderer
  if (isAnonymous && isPublicSpace) {
    return (
      <PublicConnectionsRenderer
        spaceId={window.publicAccessSpace}
        ownerId={window.currentSpaceOwner}
        objects={objects}
      />
    );
  }
  // Regular rendering for authenticated users
  return (
    <>
      {' '}
      {connections.map((connection) => {
        return (
          <MemoizedConnection
            key={connection?.id || Math.random().toString()}
            connection={connection}
            objects={objects}
            onLineStyleChange={onLineStyleChange}
            onLineColorChange={onLineColorChange}
            onConnectionClick={onConnectionClick}
            onLineTextClick={onLineTextClick}
            onLineTextSubmit={onLineTextSubmit}
          />
        );
      })}
    </>
  );
};

export default ConnectionsRenderer;
