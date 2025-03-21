import { useEffect, useRef, useMemo, useState } from 'react'; // Added useMemo
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Add this helper function for position smoothing
const lerpVector = (current, target, factor = 0.1) => {
  if (!current || !target) return target;
  return new THREE.Vector3(
    current.x + (target.x - current.x) * factor,
    current.y + (target.y - current.y) * factor,
    current.z + (target.z - current.z) * factor
  );
};

const TextSprite = ({
  text,
  position,
  followTarget,
  onClick,
  style = {
    fontSize: 'medium',
    color: 'white',
    underline: false,
    fixedSize: false,
    isFaceText: false,
    isHeaderText: false,
    isDodecahedronHeader: false,
    fixedPosition: false,
  },
  billboard = true,
  normal,
  lineStyle, // Line style prop
  pathPoints, // Path points for position calculation
}) => {
  const textRef = useRef();
  const textContentRef = useRef(text);
  const lastLineStyleRef = useRef(lineStyle);
  const lastPositionRef = useRef(position);
  const pathPointsRef = useRef(pathPoints);
  const lastPathLengthRef = useRef(0);
  const isCurvedLineRef = useRef(false);

  // Add a ref for smoothed position
  const smoothedPositionRef = useRef(
    position ? new THREE.Vector3(...position) : null
  );

  // Add state to track if we're in a dragging operation
  const [isDragging, setIsDragging] = useState(false);
  const dragTimeoutRef = useRef(null);
  const lastUpdateTimeRef = useRef(Date.now());

  // Add throttling mechanism
  const updateThrottleRef = useRef(false);
  const throttleDelayRef = useRef(100); // Reduced from 200ms

  // Add tracking for parent text editing state
  const parentEditingRef = useRef(false);

  // Track last style to avoid unnecessary recalculations
  const lastPathPointsLengthRef = useRef(pathPoints?.length || 0);

  // Calculate the optimal text position based on line style and path
  const calculatedPosition = useMemo(() => {
    // Default to the provided position
    if (!position) return position;

    // Check if parent is currently editing text (if pathPoints has a userData reference)
    const isParentEditing =
      pathPoints?.[0]?.userData?.isTextEditing ||
      pathPoints?.[pathPoints.length - 1]?.userData?.isTextEditing;

    if (isParentEditing) {
      parentEditingRef.current = true;
      // During text editing, don't recalculate position
      return lastPositionRef.current || position;
    } else {
      parentEditingRef.current = false;
    }

    // Avoid recalculation if line style and path points length haven't changed
    if (
      lineStyle === lastLineStyleRef.current &&
      pathPoints?.length === lastPathPointsLengthRef.current &&
      lastPositionRef.current
    ) {
      // DRASTICALLY reduce recalculations - only recalculate 1% of the time
      // when nothing has changed (was 10% previously)
      if (Math.random() > 0.01) {
        return lastPositionRef.current;
      }
    }

    // Update refs for comparison
    lastLineStyleRef.current = lineStyle;
    lastPathPointsLengthRef.current = pathPoints?.length || 0;

    // Throttle calculations during rapid updates
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 100 && updateThrottleRef.current) {
      // Return previous calculation during throttle period
      return lastPositionRef.current || position;
    }

    // Update the last calculation time
    lastUpdateTimeRef.current = now;
    updateThrottleRef.current = true;

    // After throttle delay, reset the throttle flag
    setTimeout(() => {
      updateThrottleRef.current = false;
    }, throttleDelayRef.current);

    // Reduce logging frequency to only once per session (0.1% chance)
    if (Math.random() < 0.001) {
      // Only log about 0.1% of calculations - drastically reduced
      console.debug('TextSprite position recalculation:', {
        lineStyle,
        pathPointsLength: pathPoints?.length || 0,
      });
    }

    // Check for 'curved' line style
    const isCurvedLine = lineStyle === 'curved';
    isCurvedLineRef.current = isCurvedLine;

    // If it's not a curved line or we don't have path points, use the provided position
    if (!isCurvedLine || !pathPoints || pathPoints.length < 3) {
      return position;
    }

    // For curved lines with valid path points, calculate position from the path
    try {
      const midIdx = Math.floor(pathPoints.length / 2);
      const curvedYOffset = 5;

      // Use the midpoint of the curved path with specific Y offset
      const newPos = [
        pathPoints[midIdx].x,
        pathPoints[midIdx].y + curvedYOffset,
        pathPoints[midIdx].z,
      ];

      // Store in lastPositionRef for throttling
      lastPositionRef.current = newPos;
      return newPos;
    } catch (err) {
      return position; // Fall back to provided position
    }
  }, [position, pathPoints, lineStyle]);

  // Detect dragging operations based on update frequency
  useEffect(() => {
    // Clear any existing timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }

    // If position changed, assume we might be in a drag operation
    if (position !== lastPositionRef.current) {
      setIsDragging(true);

      // Increase throttling during dragging
      throttleDelayRef.current = 150; // Less aggressive throttling
    }

    // Set timeout to detect end of dragging
    dragTimeoutRef.current = setTimeout(() => {
      setIsDragging(false);
      throttleDelayRef.current = 100; // Reset throttle delay

      // Force one final position update when dragging ends
      if (textRef.current && calculatedPosition) {
        if (Array.isArray(calculatedPosition)) {
          smoothedPositionRef.current = new THREE.Vector3(
            calculatedPosition[0],
            calculatedPosition[1],
            calculatedPosition[2]
          );
          textRef.current.position.copy(smoothedPositionRef.current);
        }
      }
    }, 100); // Detect drag end sooner

    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, [position, calculatedPosition]);

  // Track changes that would require position recalculation
  useEffect(() => {
    textContentRef.current = text;
    lastLineStyleRef.current = lineStyle;
    lastPathLengthRef.current = pathPoints?.length || 0;
    isCurvedLineRef.current = lineStyle === 'curved';
    lastPositionRef.current = calculatedPosition; // Use the calculated position
    pathPointsRef.current = pathPoints;
  }, [text, calculatedPosition, lineStyle, pathPoints]);

  // Initialize smoothed position when component mounts or position changes significantly
  useEffect(() => {
    if (!isDragging && calculatedPosition) {
      if (Array.isArray(calculatedPosition)) {
        smoothedPositionRef.current = new THREE.Vector3(
          calculatedPosition[0],
          calculatedPosition[1],
          calculatedPosition[2]
        );
      }
    }
  }, [isDragging]);

  const TEXT_HEIGHT = 0.7; // Approximate height of largest text
  const ZOOM_OFFSET_FACTOR = 0.05; // Controls how much text moves up when zooming out
  const MIN_CUBE_DISTANCE = 2; // Minimum distance from cube top

  const getFontSize = (size) => {
    if (typeof size === 'number') {
      return size; // Remove the * 0.7 multiplier since we're now handling raw values
    }
    // Maintain backward compatibility with string sizes
    switch (size) {
      case 'small':
        return 0.3;
      case 'large':
        return 1.5;
      default:
        return 1.0;
    }
  };

  useFrame(({ camera }) => {
    if (textRef.current) {
      // Apply smoothed position updates
      if (calculatedPosition && smoothedPositionRef.current) {
        // Create target vector from calculated position
        const targetPosition = Array.isArray(calculatedPosition)
          ? new THREE.Vector3(
              calculatedPosition[0],
              calculatedPosition[1],
              calculatedPosition[2]
            )
          : calculatedPosition;

        // Determine smoothing factor based on context
        // Much faster updates for connection texts - this is the key fix!
        // Check if this is a connection line text by looking at style
        const isConnectionText =
          pathPoints &&
          pathPoints.length > 0 &&
          (lineStyle === 'curved' ||
            lineStyle === 'straight' ||
            lineStyle === 'dotted' ||
            lineStyle === 'dashed');

        // Use much faster smoothing for connection texts
        const smoothingFactor = isConnectionText
          ? 0.5 // 50% update per frame for connection texts
          : isDragging
          ? 0.2 // 20% update per frame during drag
          : 0.3; // 30% update per frame for normal texts

        // Calculate smoothed position with lerp
        smoothedPositionRef.current = lerpVector(
          smoothedPositionRef.current,
          targetPosition,
          smoothingFactor
        );

        // Apply the smoothed position
        textRef.current.position.copy(smoothedPositionRef.current);
      }

      // Always ensure billboard is working
      if (billboard && !style.isFaceText) {
        textRef.current.quaternion.copy(camera.quaternion);
      }

      if (style.isFaceText && normal) {
        // For face text, update visibility based on face orientation to camera
        const worldNormal = new THREE.Vector3(...normal).normalize();
        const textWorldPos = new THREE.Vector3();
        textRef.current.getWorldPosition(textWorldPos);
        const viewDir = textWorldPos.clone().sub(camera.position).normalize();

        // Calculate dot product between normal and view direction
        const dotProduct = worldNormal.dot(viewDir);

        // Set visibility based on viewing angle
        if (dotProduct < 0) {
          // We're looking at the face from the front
          textRef.current.visible = true;

          // Build rotation matrix for text orientation
          const matrix = new THREE.Matrix4();
          matrix.lookAt(
            new THREE.Vector3(0, 0, 0),
            worldNormal,
            new THREE.Vector3(0, 1, 0)
          );

          // Flip text 180° to face viewer
          const flipMatrix = new THREE.Matrix4().makeRotationY(Math.PI);
          matrix.multiply(flipMatrix);

          textRef.current.setRotationFromMatrix(matrix);
        } else {
          // We're looking at the face from behind
          textRef.current.visible = false;
        }
      } else {
        // Non-face text is always visible
        textRef.current.visible = true;

        if (followTarget?.current) {
          const targetPos = followTarget.current.position;
          const targetScale = followTarget.current.scale;

          if (style.isHeaderText && style.isPlaneHeader) {
            // If fixedPosition is true, do not override the provided position.
            if (!style.fixedPosition) {
              const [x, y, z] = position;
              textRef.current.position.set(
                targetPos.x + x,
                targetPos.y + y,
                targetPos.z + z
              );
            }
            // Always update rotation (billboard) and scale.
            textRef.current.quaternion.copy(camera.quaternion);
            const distanceToCamera = camera.position.distanceTo(
              textRef.current.position
            );
            const scaleValue = Math.min(
              Math.max(distanceToCamera * 0.01, 0.5),
              2
            );
            textRef.current.scale.set(scaleValue, scaleValue, scaleValue);
          } else if (style.isHeaderText) {
            const cubeHeight = 10 * targetScale.y;
            const distanceToCamera = camera.position.distanceTo(targetPos);
            const targetY = targetPos.y + cubeHeight / 2 + TEXT_HEIGHT;
            const scale = distanceToCamera * ZOOM_OFFSET_FACTOR;

            const adjustedY = targetY + scale + MIN_CUBE_DISTANCE;

            let baseScale = 1.0;
            if (style.fixedSize) {
              baseScale = style.fontSize || 1.0;
            } else {
              baseScale = Math.min(Math.max(distanceToCamera * 0.01, 0.5), 1.5);
            }

            textRef.current.position.set(targetPos.x, adjustedY, targetPos.z);
            textRef.current.scale.set(baseScale, baseScale, baseScale);
            textRef.current.quaternion.copy(camera.quaternion);
          } else if (style.isDodecahedronHeader) {
            // Similar to cube, but with different positioning logic
            const distanceToCamera = camera.position.distanceTo(targetPos);
            const targetY = targetPos.y + 15;
            const scale = distanceToCamera * ZOOM_OFFSET_FACTOR;
            const adjustedY = targetY + scale;
            const baseScale = Math.min(
              Math.max(distanceToCamera * 0.01, 0.5),
              1.5
            );

            textRef.current.position.set(targetPos.x, adjustedY, targetPos.z);
            textRef.current.scale.set(baseScale, baseScale, baseScale);
            textRef.current.quaternion.copy(camera.quaternion);
          } else {
            // For regular following text
            const baseScale = style.fixedSize
              ? style.fontSize || 1.0
              : Math.min(
                  Math.max(camera.position.distanceTo(targetPos) * 0.01, 0.5),
                  1.5
                );
            textRef.current.scale.set(baseScale, baseScale, baseScale);
          }
          if (billboard) {
            textRef.current.quaternion.copy(camera.quaternion);
          }
        } else {
          // Handle face text differently
          if (style.isFaceText) {
            textRef.current.scale.set(1, 1, 1); // Keep constant size
            if (!style.fixedSize && billboard) {
              textRef.current.quaternion.copy(camera.quaternion);
            }
          } else if (!style.fixedSize && billboard) {
            textRef.current.quaternion.copy(camera.quaternion);
          }
        }
      }
    }
  });

  // Modify the line style change effect to use smoothing as well
  useEffect(() => {
    // Skip excessive logging
    if (Math.random() < 0.01) {
      // Reduced to 1% of changes
      console.log(
        'Line style changed:',
        lineStyle,
        'Path points:',
        pathPoints?.length
      );
    }

    // When style changes from straight to curved or vice versa, don't apply immediate position change
    // The smoothing in useFrame will handle the transition
    if (lineStyle !== lastLineStyleRef.current) {
      lastLineStyleRef.current = lineStyle;

      // Initialize the smoothed position with the current position first
      if (textRef.current && !smoothedPositionRef.current) {
        smoothedPositionRef.current = textRef.current.position.clone();
      }
    }
  }, [lineStyle]);

  // Add a separate effect for path points changes to avoid recalculating on every render
  useEffect(() => {
    // Skip if parent is editing text
    if (parentEditingRef.current) return;

    // Only apply path position changes after a delay to ensure path points are ready
    if (lineStyle === 'curved' && pathPoints?.length > 2) {
      const timeoutId = setTimeout(() => {
        if (!textRef.current) return;

        const midIdx = Math.floor(pathPoints.length / 2);
        const curvedYOffset = 5;

        // Create the target position
        const targetPos = new THREE.Vector3(
          pathPoints[midIdx].x,
          pathPoints[midIdx].y + curvedYOffset,
          pathPoints[midIdx].z
        );

        // Apply smooth transition - directly set position for immediate feedback
        // This makes position changes more responsive for connection texts
        if (smoothedPositionRef.current) {
          // For path point changes, use a faster transition (60% per frame)
          smoothedPositionRef.current.lerp(targetPos, 0.6);
        } else {
          smoothedPositionRef.current = targetPos.clone();
        }

        // Apply the position immediately
        textRef.current.position.copy(smoothedPositionRef.current);
      }, 50); // Reduced from 100ms

      return () => clearTimeout(timeoutId);
    }
  }, [pathPoints, lineStyle]);

  const fontSize = style.fixedSize
    ? style.fontSize
    : getFontSize(style.fontSize);

  return (
    <group onClick={onClick}>
      {style.underline && (
        <Text
          position={[0, -0.1, 0]}
          fontSize={fontSize}
          color={style.color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor={style.color}
          billboard={!style.fixedSize}
        >
          _________________
        </Text>
      )}
      <Text
        ref={textRef}
        position={calculatedPosition || position}
        fontSize={fontSize}
        color={style.color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor={style.color}
        billboard={billboard}
        depthTest={true}
        depthWrite={false} // Change to false to prevent z-fighting
        renderOrder={-2} // Even lower than indicators to ensure proper occlusion
        side={THREE.FrontSide}
        polygonOffset={true}
        polygonOffsetFactor={3} // Higher value to push further behind faces
        polygonOffsetUnits={3} // Higher value to push further behind faces
        transparent={true}
        opacity={1}
      >
        {text || ''}
      </Text>
    </group>
  );
};

export default TextSprite;
