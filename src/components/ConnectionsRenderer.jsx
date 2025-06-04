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
import PublicConnectionsRenderer from './PublicConnectionsRenderer';

// Separate connection rendering into a sub-component to fix the hooks issue
const Connection = ({
  connection,
  objects,
  selectedConnection,
  lineTexts,
  showLineTextInput,
  showLineTextStyleUI,
  handleConnectionClick,
  handleLineTextClick,
  handleLineTextSubmit,
  handleLineTextStyleChange,
  handleLineColorChange,
  handleLineStyleChange,
  setShowLineTextStyleUI,
  setShowLineTextInput,
}) => {
  // Always call hooks first, before any conditional returns
  // Declare all useMemo hooks unconditionally

  // First hook: Calculate basic connection data
  const connectionData = useMemo(() => {
    // Handle invalid connections gracefully inside the hook
    if (!connection) {
      return { isValid: false, midpoint: [0, 0, 0] };
    }

    // Extract positions with proper priority:
    // 1. facePosition (face-specific position)
    // 2. worldPosition (world-space position)
    // 3. position (object position)

    // For start position
    let startPosition;
    if (Array.isArray(connection.start?.facePosition)) {
      startPosition = connection.start.facePosition;
    } else if (Array.isArray(connection.start?.worldPosition)) {
      startPosition = connection.start.worldPosition;
    } else if (Array.isArray(connection.start?.position)) {
      startPosition = connection.start.position;
    } else {
      startPosition = [0, 0, 0];
    }

    // For end position
    let endPosition;
    if (Array.isArray(connection.end?.facePosition)) {
      endPosition = connection.end.facePosition;
    } else if (Array.isArray(connection.end?.worldPosition)) {
      endPosition = connection.end.worldPosition;
    } else if (Array.isArray(connection.end?.position)) {
      endPosition = connection.end.position;
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
  }, [connection]);

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
  }, [connection, objects]);

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
    const startObjectId = connection.start?.objectId || '';
    const endObjectId = connection.end?.objectId || '';
    const pathPoints = connection._pathPoints;
    const lineStyle = connection.lineStyle || 'straight';

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
      );

    // Determine if path should be curved
    const isCurvedPath =
      calculatedPathPoints &&
      calculatedPathPoints.length > 2 &&
      intersections &&
      intersections.length > 0;

    // Determine effective line style
    const effectiveLineStyle =
      isCurvedPath || lineStyle === 'curved' ? 'curved' : lineStyle;

    return {
      calculatedPathPoints: calculatedPathPoints || [
        startPosition,
        endPosition,
      ],
      effectiveLineStyle,
      intersections,
    };
  }, [connection, connectionData, filteredObjects]);

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
  }, [connection, connectionData, pathData]);

  // Early return after all hooks are declared
  if (!connection) return null;

  // Early return for invalid connections - after all hooks are declared
  if (!connectionData.isValid) {
    console.warn('Invalid connection structure:', connection);
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
    <group key={connection.id}>
      {/* Replace standard Line with optimized AnimatedConnectionLine */}
      <AnimatedConnectionLine
        points={calculatedPathPoints}
        connectionId={connection.id}
        color={
          connection.color ||
          (selectedConnection === connection.id ? '#ffff00' : 'black')
        }
        lineWidth={selectedConnection === connection.id ? 1 : 1}
        lineStyle={connection.lineStyle || 'straight'}
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
      />

      {/* Text input UI */}
      {showLineTextInput === connection.id && (
        <HeaderInput
          position={[midpoint[0], midpoint[1] + 5, midpoint[2]]}
          onTextSubmit={(text) => handleLineTextSubmit(connection.id, text)}
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

// Memoize the Connection component to avoid unnecessary re-renders
const MemoizedConnection = React.memo(Connection);

/**
 * Component for rendering all connections
 */
const ConnectionsRenderer = ({
  connections,
  objects,
  selectedConnection,
  lineTexts,
  showLineTextInput,
  showLineTextStyleUI,
  handleConnectionClick,
  handleLineTextClick,
  handleLineTextSubmit,
  handleLineTextStyleChange,
  handleLineColorChange,
  handleLineStyleChange,
  setShowLineTextStyleUI,
  setShowLineTextInput,
}) => {
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
      {connections.map((connection) => (
        <MemoizedConnection
          key={connection?.id || Math.random().toString()}
          connection={connection}
          objects={objects}
          selectedConnection={selectedConnection}
          lineTexts={lineTexts}
          showLineTextInput={showLineTextInput}
          showLineTextStyleUI={showLineTextStyleUI}
          handleConnectionClick={handleConnectionClick}
          handleLineTextClick={handleLineTextClick}
          handleLineTextSubmit={handleLineTextSubmit}
          handleLineTextStyleChange={handleLineTextStyleChange}
          handleLineColorChange={handleLineColorChange}
          handleLineStyleChange={handleLineStyleChange}
          setShowLineTextStyleUI={setShowLineTextStyleUI}
          setShowLineTextInput={setShowLineTextInput}
        />
      ))}
    </>
  );
};

export default ConnectionsRenderer;
