import React from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

const TextSprite = ({
  text,
  position,
  followTarget,
  onClick,
  style = { fontSize: 'medium', color: 'white', underline: false },
}) => {
  const textRef = React.useRef();
  const lastScale = React.useRef(1);
  const MINIMUM_DISTANCE = 2; // Minimum distance from cube top
  const TEXT_HEIGHT = 0.7; // Approximate height of largest text
  const ZOOM_OFFSET_FACTOR = 0.1; // Controls how much text moves up when zooming out

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
    if (textRef.current && followTarget?.current) {
      // Get target position and scale
      const targetPos = followTarget.current.position;
      const targetScale = followTarget.current.scale;

      // Calculate base heights and distances
      const cubeHeight = 10 * targetScale.y;
      const topEdgeOffset = cubeHeight / 5;
      const fontSize = getFontSize(style.fontSize);
      const scaledTextHeight =
        fontSize * TEXT_HEIGHT * (style.underline ? 1.2 : 1);
      const scaledMinDistance =
        MINIMUM_DISTANCE * Math.max(...targetScale.toArray());

      // Calculate camera-dependent offset
      const distanceToCamera = camera.position.distanceTo(targetPos);
      const zoomOffset = distanceToCamera * ZOOM_OFFSET_FACTOR;

      // Set position with zoom-adjusted height
      textRef.current.position.set(
        targetPos.x,
        targetPos.y +
          topEdgeOffset +
          scaledMinDistance +
          scaledTextHeight +
          zoomOffset,
        targetPos.z
      );

      // Calculate and apply scale
      const baseSize = Math.max(...targetScale.toArray());
      const scaleFactor = Math.max(distanceToCamera * 0.02, baseSize);

      if (Math.abs(lastScale.current - scaleFactor) > 0.01) {
        textRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
        lastScale.current = scaleFactor;
      }

      textRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <group onClick={onClick}>
      {style.underline && (
        <Text
          position={[0, -0.1, 0]}
          fontSize={getFontSize(style.fontSize)}
          color={style.color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor={style.color}
          billboard
        >
          _________________
        </Text>
      )}
      <Text
        ref={textRef}
        position={position}
        fontSize={getFontSize(style.fontSize)}
        color={style.color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor={style.color}
        billboard
      >
        {text}
      </Text>
    </group>
  );
};

export default TextSprite;
