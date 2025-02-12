import React from 'react';
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
    isDodecahedronHeader: false, // Add this new property
  },
  billboard = true, // New prop, defaults to true
  normal, // Add normal prop for face orientation
}) => {
  const textRef = React.useRef();

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
      if (style.isFaceText && normal) {
        // Orient text to lie flat on the face
        const up = new THREE.Vector3(...normal);
        const matrix = new THREE.Matrix4();
        matrix.lookAt(
          new THREE.Vector3(0, 0, 0),
          up,
          new THREE.Vector3(0, 1, 0)
        );
        textRef.current.setRotationFromMatrix(matrix);
      } else if (followTarget?.current) {
        const targetPos = followTarget.current.position;
        const targetScale = followTarget.current.scale;

        if (style.isHeaderText) {
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
          const scaleFactor = Math.min(Math.max(baseScale, minScale), maxScale);

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
      >
        {text}
      </Text>
    </group>
  );
};

export default TextSprite;
