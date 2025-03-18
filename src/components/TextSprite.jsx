import { useEffect, useRef } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

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

  // Track changes that would require position recalculation
  useEffect(() => {
    textContentRef.current = text;

    // Track changes in line style or path points that would require repositioning

    // Update refs
    lastLineStyleRef.current = lineStyle;
    lastPathLengthRef.current = pathPoints?.length || 0;

    // Set curved line flag
    isCurvedLineRef.current = lineStyle === 'curved';

    // Handle curved line text positioning
    if (lineStyle === 'curved' && pathPoints && pathPoints.length > 0) {
      // Find midpoint of the curve using middle control point
      const midIndex = Math.floor(pathPoints.length / 2);
      const midPoint = pathPoints[midIndex];

      // Add vertical offset for text placement
      const textOffset = 1.5; // Adjust this value to change text height above line
      const newPosition = [midPoint.x, midPoint.y, midPoint.z];

      if (textRef.current) {
        textRef.current.position.set(...newPosition);
      }
      lastPositionRef.current = newPosition;
      return; // Exit early to prevent other position updates
    }

    // Handle straight line text positioning
    if (lineStyle === 'straight' && position) {
      if (textRef.current) {
        textRef.current.position.set(position[0], position[1], position[2]);
      }
      lastPositionRef.current = [...position];
    }

    pathPointsRef.current = pathPoints;
  }, [text, position, lineStyle, pathPoints]);

  const MINIMUM_DISTANCE = 1; // Minimum distance from cube top
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
      // Skip position update for curved lines
      if (!isCurvedLineRef.current && position) {
        if (
          Math.abs(textRef.current.position.x - position[0]) > 0.001 ||
          Math.abs(textRef.current.position.y - position[1]) > 0.001 ||
          Math.abs(textRef.current.position.z - position[2]) > 0.001
        ) {
          textRef.current.position.set(position[0], position[1], position[2]);
        }
      }

      // Always ensure billboard is working
      if (billboard && !style.isFaceText) {
        textRef.current.quaternion.copy(camera.quaternion);
      }

      if (style.isFaceText && normal) {
        // Get parent's world scale for size compensation
        const worldScale = new THREE.Vector3();
        textRef.current.parent?.getWorldScale(worldScale);

        // Calculate inverse scale with a more reliable approach
        const inverseScale = new THREE.Vector3(
          1 / Math.max(0.0001, worldScale.x),
          1 / Math.max(0.0001, worldScale.y),
          1 / Math.max(0.0001, worldScale.z)
        );

        // Apply inverse scale to keep text size consistent
        textRef.current.scale.copy(inverseScale);

        // Compute world-space normal from the provided face normal
        const worldNormal = new THREE.Vector3(...normal);
        if (textRef.current.parent) {
          const rotationMatrix = new THREE.Matrix4();
          textRef.current.parent.updateWorldMatrix(true, false);
          rotationMatrix.extractRotation(textRef.current.parent.matrixWorld);
          worldNormal.applyMatrix4(rotationMatrix);
        }

        // Get text's world position and calculate view direction
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
            const fontSize = getFontSize(style.fontSize);

            // Different offset based on shape type
            const baseOffset = style.isDodecahedronHeader
              ? 8 * targetScale.y // Keep dodecahedron header high
              : 4 * targetScale.y; // Lower offset for cube header
            const textOffset = fontSize * 0.5;

            textRef.current.position.set(
              targetPos.x,
              targetPos.y + cubeHeight / 2 + baseOffset + textOffset,
              targetPos.z
            );

            // Scale text based on distance but with tighter bounds
            const minScale = 0.8;
            const maxScale = 10;
            const baseScale = distanceToCamera * 0.008; // Reduced factor for more subtle scaling
            const scaleFactor = Math.min(
              Math.max(baseScale, minScale),
              maxScale
            );

            textRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
          } else {
            // Calculate base heights and distances without scale influence
            const cubeHeight = 10; // Remove scale influence
            const topEdgeOffset = cubeHeight / 5;
            const fontSize = getFontSize(style.fontSize);
            const scaledTextHeight =
              fontSize * TEXT_HEIGHT * (style.underline ? 1.2 : 1);
            const scaledMinDistance = Math.max(
              MINIMUM_DISTANCE, // Remove scale factor for minimum distance
              MIN_CUBE_DISTANCE
            );

            // Calculate camera-dependent offset without scale influence
            const distanceToCamera = camera.position.distanceTo(targetPos);
            const zoomOffset = distanceToCamera * ZOOM_OFFSET_FACTOR;

            // Update position but maintain constant text size
            textRef.current.position.set(
              targetPos.x,
              targetPos.y +
                topEdgeOffset +
                scaledMinDistance +
                scaledTextHeight +
                zoomOffset,
              targetPos.z
            );

            // Use constant scale for fixed size text
            const baseScale = style.fixedSize
              ? 1
              : Math.max(distanceToCamera * 0.02, 1);
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
        position={position}
        fontSize={fontSize}
        color={style.color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor={style.color}
        billboard={billboard}
        depthTest={true}
        depthWrite={true}
        renderOrder={10} // Increase render order to prevent z-fighting
        side={THREE.DoubleSide} // Use DoubleSide to ensure text is visible from all angles
      >
        {text || ''}
      </Text>
    </group>
  );
};

export default TextSprite;
