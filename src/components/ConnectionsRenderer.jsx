import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import TextSprite from './TextSprite';
import LineUI from './LineUI';
import HeaderInput from './HeaderInput';
import TextStyleUI from './TextStyleUI';
import {
  checkLineIntersection,
  generateCurvedPath,
} from '../utils/pathfindingUtils';
import { calculateMidpoint } from '../utils/positionUtils';

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
  return (
    <>
      {connections.map((connection) => {
        const startPosition = connection.start?.position || [0, 0, 0];
        const endPosition = connection.end?.position || [0, 0, 0];
        const midpoint = calculateMidpoint(startPosition, endPosition);

        // Calculate intersections and path points
        const intersections = checkLineIntersection(
          startPosition,
          endPosition,
          objects.filter(
            (obj) =>
              obj.id.toString() !== connection.start?.objectId &&
              obj.id.toString() !== connection.end?.objectId
          )
        );

        // Generate path (curved if needed)
        const pathPoints =
          connection._pathPoints ||
          generateCurvedPath(
            startPosition,
            endPosition,
            intersections,
            connection.start?.objectId,
            connection.end?.objectId,
            connection.lineStyle === 'curved'
          );

        // Determine connection text
        const connectionText =
          connection.text || lineTexts[connection.id] || '';

        // Determine line style
        const isCurvedPath = pathPoints.length > 2 && intersections.length > 0;
        const effectiveLineStyle =
          isCurvedPath || connection.lineStyle === 'curved'
            ? 'curved'
            : connection.lineStyle || 'straight';

        // Calculate text position
        let textPosition;
        const defaultStraightLineOffset = 2;
        const defaultCurvedLineOffset = 5;

        if (pathPoints && pathPoints.length > 0) {
          if (effectiveLineStyle === 'curved') {
            const midIdx = Math.floor(pathPoints.length / 2);
            textPosition = [
              pathPoints[midIdx].x,
              pathPoints[midIdx].y + defaultCurvedLineOffset,
              pathPoints[midIdx].z,
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

        return (
          <group key={connection.id}>
            {/* Main visible line */}
            <Line
              points={pathPoints}
              color={
                connection.color ||
                (selectedConnection === connection.id ? '#ffff00' : 'white')
              }
              lineWidth={selectedConnection === connection.id ? 4 : 2}
              dashed={
                connection.lineStyle === 'dashed' ||
                connection.lineStyle === 'dotted'
              }
              dashScale={connection.lineStyle === 'dotted' ? 1 : 0.5}
              dashSize={connection.lineStyle === 'dotted' ? 0.5 : 4}
              gapSize={connection.lineStyle === 'dotted' ? 1 : 10}
              dashOffset={connection.dashOffset || 0}
              renderOrder={1}
              transparent={false}
              depthTest={true}
              depthWrite={false}
              toneMapped={false}
            />

            {/* Clickable area */}
            <Line
              points={pathPoints}
              color="white"
              lineWidth={20}
              onClick={(e) => handleConnectionClick(e, connection.id)}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'auto';
              }}
              transparent
              opacity={0}
              depthTest={false}
              renderOrder={10}
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
                color: connection.textStyle?.color || 'white',
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
              pathPoints={pathPoints}
            />

            {/* Text input UI */}
            {showLineTextInput === connection.id && (
              <HeaderInput
                position={[midpoint[0], midpoint[1] + 5, midpoint[2]]}
                onTextSubmit={(text) =>
                  handleLineTextSubmit(connection.id, text)
                }
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
                onColorChange={(color) =>
                  handleLineColorChange(connection.id, color)
                }
                onToggleDashed={(styleType) =>
                  handleLineStyleChange(connection.id, styleType)
                }
                onTextClick={() => setShowLineTextInput(connection.id)}
                currentText={connectionText}
                hasText={!!connectionText && connectionText.trim() !== ''}
              />
            )}
          </group>
        );
      })}
    </>
  );
};

export default React.memo(ConnectionsRenderer);
