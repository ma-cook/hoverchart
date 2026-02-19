import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';

import InstancedLine from './InstancedLine';
import BatchedConnectionLines from './BatchedConnectionLines';
import BatchedCurvedLines from './BatchedCurvedLines';
import AtlasTextSprite from './AtlasTextSprite';
import DistanceFilteredTextLabels from './DistanceFilteredTextLabels';
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
import { saveConnection } from '../services/connectionsService';
import { useConnectionObjectPositions } from '../hooks/useConnectionObjects';
import { 
  useConnectionState, 
  useConnectionActions,
  useConnectionsRendererStore 
} from '../hooks/useConnectionsRendererStore';
import { useFrustumCulledConnections } from '../hooks/useFrustumCulling';
import useConnectionStore from '../stores/connectionStore';

/**
 * PERFORMANCE: Distance-filtered text for individual Connection components
 * Only renders text when camera is within maxDistance units
 */
const DistanceFilteredConnectionText = React.memo(({ 
  position, 
  maxDistance = 500,
  children 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const lastCheckRef = useRef(0);
  const maxDistanceSquared = maxDistance * maxDistance;
  
  useFrame(({ camera }) => {
    // Throttle checks to every 100ms
    const now = Date.now();
    if (now - lastCheckRef.current < 100) return;
    lastCheckRef.current = now;
    
    if (!position) {
      setIsVisible(false);
      return;
    }
    
    const dx = camera.position.x - position[0];
    const dy = camera.position.y - position[1];
    const dz = camera.position.z - position[2];
    const distanceSquared = dx * dx + dy * dy + dz * dz;
    
    const shouldBeVisible = distanceSquared <= maxDistanceSquared;
    if (shouldBeVisible !== isVisible) {
      setIsVisible(shouldBeVisible);
    }
  });
  
  return isVisible ? children : null;
});

DistanceFilteredConnectionText.displayName = 'DistanceFilteredConnectionText';

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
    // PERFORMANCE: Pass store state as props to avoid individual subscriptions
    selectedConnection,
    connections,
  }) => {
    // Get only the specific objects needed for this connection
    const { startObject, endObject } = useConnectionObjectPositions(
      connection?.start?.objectId,
      connection?.end?.objectId
    );
    
    // PERFORMANCE: Use batched state hook instead of 7+ individual subscriptions
    const connectionState = useConnectionState(connection?.id);
    const actions = useConnectionActions();
    
    // Destructure for easier access
    const { isSelected, isDeleting, lineText, showTextInput, showStyleUI } = connectionState;
    const { 
      setShowLineTextStyleUI, 
      setShowLineTextInput, 
      selectConnection, 
      setLineText, 
      updateConnection 
    } = actions;

    // Consolidated line width calculation - consistent across all line types
    const getLineWidth = useCallback(
      () => {
        const isMobile =
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          );
        const baseWidth = isMobile ? 2 : 1;
        const selectedWidth = isMobile ? 3 : 2.5;
        return isSelected ? selectedWidth : baseWidth;
      },
      [isSelected]
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
        if (isDeleting) {
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
        if (isDeleting) {
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
        if (isDeleting) {
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
        if (isDeleting) {
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

    // PERFORMANCE OPTIMIZATION: Create a numeric hash of nearby object positions
    // Uses fast integer operations instead of expensive string concatenation
    const nearbyObjectsHash = useMemo(() => {
      if (!connectionData.isValid || !allObjectsForPathfinding) return 0;

      const { startPosition, endPosition } = connectionData;
      const lineLength = Math.sqrt(
        Math.pow(endPosition[0] - startPosition[0], 2) +
          Math.pow(endPosition[1] - startPosition[1], 2) +
          Math.pow(endPosition[2] - startPosition[2], 2)
      );

      const thresholdSquared = lineLength * lineLength * 4; // 2x line length radius
      let hash = 0;
      let count = 0;

      // Use simple numeric hashing instead of string concatenation
      for (let i = 0; i < allObjectsForPathfinding.length; i++) {
        const obj = allObjectsForPathfinding[i];
        if (!obj?.position || !Array.isArray(obj.position)) continue;

        // Quick distance check - only objects near the line
        const dx = obj.position[0] - startPosition[0];
        const dy = obj.position[1] - startPosition[1];
        const dz = obj.position[2] - startPosition[2];
        const distanceSquared = dx * dx + dy * dy + dz * dz;
        
        if (distanceSquared < thresholdSquared) {
          // Fast integer hash combining position values (rounded to 1 decimal)
          const px = Math.round(obj.position[0] * 10);
          const py = Math.round(obj.position[1] * 10);
          const pz = Math.round(obj.position[2] * 10);
          // Use bitwise XOR and multiplication for fast hashing
          hash = ((hash * 31) ^ (px + py * 1000 + pz * 1000000)) >>> 0;
          count++;
        }
      }

      // Include count in hash to detect added/removed objects
      return (hash ^ (count * 17)) >>> 0;
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
    // Determine connection text - prioritize batched lineText over connection.text
    const connectionText = lineText || connection.text || '';

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
                  (isSelected ? '#ffff00' : 'black')
                }
                lineWidth={getLineWidth()}
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
                (isSelected ? '#ffff00' : 'black')
              }
              lineWidth={getLineWidth()}
              lineStyle={effectiveLineStyle}
              dashDirection={connection.dashDirection || null}
              dashOffset={connection.dashOffset || 0}
              isSelected={isSelected}
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
        {/* Connection text using AtlasTextSprite with distance filtering */}
        <DistanceFilteredConnectionText position={textPosition} maxDistance={500}>
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
          />
        </DistanceFilteredConnectionText>
        {/* Text input UI */}
        {showTextInput && (
          <HeaderInput
            position={[midpoint[0], midpoint[1] + 5, midpoint[2]]}
            onTextSubmit={(text) => handleLineTextSubmit(connection.id, text)}
            inputId={`connection-${connection.id}-text`}
            initialText={connectionText}
          />
        )}
        {/* Text style UI */}
        {showStyleUI && (
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
        {isSelected && (
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
 * PERFORMANCE OPTIMIZED:
 * - Uses batched store subscriptions (useConnectionsRendererStore)
 * - Implements frustum culling to only render visible connections
 * - Global animation manager for dashed/dotted lines
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
  // PERFORMANCE: Use batched store subscription instead of multiple individual ones
  const {
    connections,
    connectionsVisible,
    focusedObjectId,
    selectedConnection,
  } = useConnectionsRendererStore();

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
  const objectVisibleConnections = useMemo(() => {
    if (!connections?.length) return [];

    // Use visibleObjectIds if it has items, otherwise fall back to availableObjectIds
    const visibleIds = (visibleObjectIds && visibleObjectIds.size > 0) ? visibleObjectIds : availableObjectIds;

    return connections.filter((connection) => {
      const startId = connection.start?.objectId?.toString();
      const endId = connection.end?.objectId?.toString();
      return (
        startId && endId && visibleIds.has(startId) && visibleIds.has(endId)
      );
    });
  }, [connections, visibleObjectIds, availableObjectIds]);

  // Get connections for the focused object (when connections are globally hidden)
  const focusedConnections = useMemo(() => {
    if (!focusedObjectId || connectionsVisible || !connections?.length) return [];
    
    const focusedIdStr = focusedObjectId.toString();
    // Use visibleObjectIds if it has items, otherwise fall back to availableObjectIds
    const visibleIds = (visibleObjectIds && visibleObjectIds.size > 0) ? visibleObjectIds : availableObjectIds;
    
    return connections.filter((connection) => {
      const startId = connection.start?.objectId?.toString();
      const endId = connection.end?.objectId?.toString();
      
      // Connection must involve the focused object
      const involvesFocused = startId === focusedIdStr || endId === focusedIdStr;
      
      // Both endpoints must be visible/loaded
      const bothVisible = startId && endId && visibleIds.has(startId) && visibleIds.has(endId);
      
      return involvesFocused && bothVisible;
    });
  }, [focusedObjectId, connectionsVisible, connections, visibleObjectIds, availableObjectIds]);

  // Determine which connections to consider for rendering
  const connectionsForCulling = connectionsVisible ? objectVisibleConnections : focusedConnections;

  // PERFORMANCE: Apply frustum culling to only render connections visible in camera
  const { visibleConnections: frustumCulledConnections } = useFrustumCulledConnections(
    connectionsForCulling,
    objects,
    true // Enable frustum culling
  );

  // PERFORMANCE: Build object positions map for batched rendering
  // NOTE: This uses object CENTER positions - connections store their face positions
  // BatchedConnectionLines uses connection.start/end.position for accurate face positions
  const objectPositions = useMemo(() => {
    const map = new Map();
    if (!objects?.length) return map;
    
    objects.forEach(obj => {
      if (obj?.id && obj?.position) {
        map.set(obj.id.toString(), obj.position);
      }
    });
    return map;
  }, [objects]);

  // PERFORMANCE: Cache intersection results to avoid running pathfinding every frame
  // Only recalculate when objects finish moving (not during drag)
  const intersectionCacheRef = useRef(new Map()); // connectionId -> { hasIntersection, timestamp }
  const lastPathfindingHashRef = useRef('');
  const lastCategorizationRef = useRef({ batchedConnections: [], textConnections: [], curvedConnections: [], individualConnections: [] });
  const lastCategorizationInputsRef = useRef({ connectionsLength: 0, selectedConnection: null, pathfindingHash: '' });
  
  // Create a stable hash of object positions for pathfinding invalidation
  // Only changes when objects actually move significantly
  const pathfindingHash = useMemo(() => {
    if (!objects?.length) return '';
    // Create a coarse hash - round positions to reduce sensitivity
    return objects.map(obj => {
      const p = obj.position || [0, 0, 0];
      // Round to nearest 0.5 to avoid micro-changes triggering recalc
      return `${obj.id}:${Math.round(p[0] * 2) / 2},${Math.round(p[1] * 2) / 2},${Math.round(p[2] * 2) / 2}`;
    }).join('|');
  }, [objects]);
  
  // Check if any object is currently being transformed
  const isTransformingRef = useRef(false);
  
  // Effect to detect when transforms complete and invalidate cache
  useEffect(() => {
    // Only invalidate cache when hash changes AND no transform is active
    if (pathfindingHash !== lastPathfindingHashRef.current) {
      // Debounce the cache invalidation to wait for transform to complete
      const timeoutId = setTimeout(() => {
        if (!isTransformingRef.current) {
          intersectionCacheRef.current.clear();
          lastPathfindingHashRef.current = pathfindingHash;
        }
      }, 100); // Wait 100ms after last position change
      return () => clearTimeout(timeoutId);
    }
  }, [pathfindingHash]);

  // PERFORMANCE: Separate connections into categories for optimal rendering
  // - batchedConnections: straight lines without text/selection that don't intersect objects (single draw call)
  // - textConnections: straight lines with text only (batch lines + individual text sprites)
  // - curvedConnections: straight-style connections that need curved paths due to intersections (batched curved rendering)
  // - individualConnections: selected, non-straight styles (dashed/dotted), or those needing full UI
  const { batchedConnections, textConnections, curvedConnections, individualConnections } = useMemo(() => {
    // PERFORMANCE: Quick check if we can return cached result
    // Only re-categorize if connections, selection, or pathfinding actually changed
    const inputsRef = lastCategorizationInputsRef.current;
    const cacheRef = lastCategorizationRef.current;
    
    if (
      frustumCulledConnections.length === inputsRef.connectionsLength &&
      selectedConnection === inputsRef.selectedConnection &&
      pathfindingHash === inputsRef.pathfindingHash &&
      cacheRef.batchedConnections.length + cacheRef.textConnections.length + cacheRef.curvedConnections.length + cacheRef.individualConnections.length > 0
    ) {
      // Inputs haven't changed meaningfully, return cached result
      return cacheRef;
    }
    
    const batched = [];
    const withText = [];
    const curved = [];
    const individual = [];
    const cache = intersectionCacheRef.current;
    
    frustumCulledConnections.forEach(conn => {
      const style = conn.styleType || conn.lineStyle || 'straight';
      const baseStyle = style.split('-')[0];
      const isSelected = conn.id === selectedConnection;
      const hasText = conn.text && conn.text.trim() !== '';
      
      // Selected connections need full UI (LineUI, etc)
      if (isSelected) {
        individual.push(conn);
        return;
      }
      
      // Non-straight styles (dashed, dotted) need AnimatedConnectionLine
      if (baseStyle !== 'straight') {
        individual.push(conn);
        return;
      }
      
      // PERFORMANCE: Check cached intersection result first
      const cached = cache.get(conn.id);
      if (cached !== undefined) {
        if (cached.hasIntersection) {
          // Connections with intersections but no text go to curved batch
          if (hasText) {
            // Has text AND intersection - needs individual for text positioning on curve
            individual.push(conn);
          } else {
            // No text - can be batched in curved renderer
            curved.push(conn);
          }
        } else if (hasText) {
          withText.push(conn);
        } else {
          batched.push(conn);
        }
        return;
      }
      
      // For straight-style connections, check if they need pathfinding
      // Get connection positions
      let startPos = conn.start?.position || conn.start?.facePosition || conn.start?.worldPosition;
      let endPos = conn.end?.position || conn.end?.facePosition || conn.end?.worldPosition;
      
      // Fallback to object positions if needed
      if (!startPos && conn.start?.objectId) {
        startPos = objectPositions.get(conn.start.objectId.toString());
      }
      if (!endPos && conn.end?.objectId) {
        endPos = objectPositions.get(conn.end.objectId.toString());
      }
      
      // Check for intersections if we have valid positions and objects to check against
      let hasIntersection = false;
      if (startPos && endPos && pathfindingObjects && pathfindingObjects.length > 0) {
        const intersections = checkLineIntersection(startPos, endPos, pathfindingObjects);
        hasIntersection = intersections && intersections.length > 0;
      }
      
      // Cache the result
      cache.set(conn.id, { hasIntersection, timestamp: Date.now() });
      
      if (hasIntersection) {
        // Connections with intersections but no text go to curved batch
        if (hasText) {
          // Has text AND intersection - needs individual for text positioning on curve
          individual.push(conn);
        } else {
          // No text - can be batched in curved renderer
          curved.push(conn);
        }
      } else if (hasText) {
        withText.push(conn);
      } else {
        batched.push(conn);
      }
    });
    
    // Cache the result and inputs for next comparison
    const result = { 
      batchedConnections: batched, 
      textConnections: withText,
      curvedConnections: curved,
      individualConnections: individual 
    };
    lastCategorizationRef.current = result;
    lastCategorizationInputsRef.current = {
      connectionsLength: frustumCulledConnections.length,
      selectedConnection,
      pathfindingHash,
    };
    
    return result;
  }, [frustumCulledConnections, selectedConnection, objectPositions, pathfindingObjects, pathfindingHash]);

  // Combine all straight connections for batched line rendering
  const allStraightConnections = useMemo(() => {
    return [...batchedConnections, ...textConnections];
  }, [batchedConnections, textConnections]);

  // PERFORMANCE: Pre-calculate text positions for connections with text
  const textLabels = useMemo(() => {
    return textConnections.map(conn => {
      // Get connection positions
      let startPos = conn.start?.position || conn.start?.facePosition || conn.start?.worldPosition;
      let endPos = conn.end?.position || conn.end?.facePosition || conn.end?.worldPosition;
      
      // Fallback to object positions if connection positions not available
      if (!startPos && conn.start?.objectId) {
        startPos = objectPositions.get(conn.start.objectId.toString());
      }
      if (!endPos && conn.end?.objectId) {
        endPos = objectPositions.get(conn.end.objectId.toString());
      }
      
      if (!startPos || !endPos) return null;
      
      // Calculate midpoint
      const midpoint = [
        (startPos[0] + endPos[0]) / 2,
        (startPos[1] + endPos[1]) / 2 + 2, // Offset above line
        (startPos[2] + endPos[2]) / 2,
      ];
      
      return {
        id: conn.id,
        text: conn.text,
        position: midpoint,
        textStyle: conn.textStyle,
      };
    }).filter(Boolean);
  }, [textConnections, objectPositions]);

  // Handle connection click from batched renderer
  const handleBatchedConnectionClick = useCallback((e, connectionId) => {
    e.stopPropagation();
    if (onConnectionClick) {
      onConnectionClick(e, connectionId);
    } else {
      // Use store directly to select connection
      const selectConnection = useConnectionStore.getState().selectConnection;
      if (selectConnection) {
        selectConnection(connectionId);
      }
    }
  }, [onConnectionClick]);

  // Render connections with batched optimization
  return (
    <group>
      {/* PERFORMANCE: Render ALL straight connections (with or without text) in ONE draw call */}
      {allStraightConnections.length > 0 && (
        <BatchedConnectionLines
          connections={allStraightConnections}
          objectPositions={objectPositions}
          selectedConnectionId={selectedConnection}
          onConnectionClick={handleBatchedConnectionClick}
          lineWidth={/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 3 : 1}
        />
      )}
      
      {/* PERFORMANCE: Render curved connections (intersecting objects) in ONE draw call */}
      {curvedConnections.length > 0 && (
        <BatchedCurvedLines
          connections={curvedConnections}
          objectPositions={objectPositions}
          pathfindingObjects={pathfindingObjects}
          selectedConnectionId={selectedConnection}
          onConnectionClick={handleBatchedConnectionClick}
          lineWidth={/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 3 : 1}
        />
      )}
      
      {/* PERFORMANCE: Render text labels with distance filtering - only visible within 500 units */}
      <DistanceFilteredTextLabels
        labels={textLabels}
        maxDistance={500}
        onLabelClick={onLineTextClick}
      />
      
      {/* Render individual connections that need special handling (selected, dashed/dotted, with text on curves) */}
      {individualConnections.map((connection) => (
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
          selectedConnection={selectedConnection}
          connections={connections}
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
