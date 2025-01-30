import React from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

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
  },
  billboard = true, // New prop, defaults to true
}) => {
  const textRef = React.useRef();

  const MINIMUM_DISTANCE = 1; // Minimum distance from cube top
  const TEXT_HEIGHT = 0.7; // Approximate height of largest text
  const ZOOM_OFFSET_FACTOR = 0.05; // Controls how much text moves up when zooming out
  const MIN_CUBE_DISTANCE = 2; // Minimum distance from cube top

  const getFontSize = (size) => {
    if (typeof size === 'number') {
      return size * 0.7; // Scale the numeric size (0.7 is the previous 'large' size)
    }
    // Maintain backward compatibility with string sizes
    switch (size) {
      case 'small':
        return 0.3;
      case 'large':
        return 0.7;
      default:
        return 0.5;
    }
  };

  useFrame(({ camera }) => {
    if (textRef.current) {
      if (followTarget?.current) {
        const targetPos = followTarget.current.position;
        const targetScale = followTarget.current.scale;

        if (style.isHeaderText) {
          const cubeHeight = 10 * targetScale.y;
          const distanceToCamera = camera.position.distanceTo(targetPos);
          const fontSize = getFontSize(style.fontSize);

          // Calculate scale factor based on camera distance
          const scaleFactor = distanceToCamera * 0.02;

          // Calculate text height considering scale factor
          const textHeight = fontSize * TEXT_HEIGHT * scaleFactor;

          // Position text above cube considering both base offset and scaled text height
          textRef.current.position.set(
            targetPos.x,
            targetPos.y + cubeHeight / 2 + 2 + textHeight / 2, // Keep text bottom 2 units above cube
            targetPos.z
          );

          // Apply camera-based scaling
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
