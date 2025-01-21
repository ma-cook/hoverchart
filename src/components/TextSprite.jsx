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
      // Update position if following a target
      if (followTarget?.current) {
        const targetScale = followTarget.current.scale;
        const cubeHeight = 10 * targetScale.y + 5;
        const topEdgeOffset = cubeHeight / 2;
        const targetPos = followTarget.current.position;

        textRef.current.position.set(
          targetPos.x,
          targetPos.y + topEdgeOffset,
          targetPos.z
        );
      }

      // Calculate distance-based scale
      const distanceToCamera = camera.position.distanceTo(
        textRef.current.position
      );
      const baseSize = 1; // Reduced from 5 to 1 for better initial size
      const scaleFactor = Math.max(distanceToCamera * 0.02, baseSize);

      // Only update scale if it has changed significantly
      if (Math.abs(lastScale.current - scaleFactor) > 0.01) {
        textRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
        lastScale.current = scaleFactor;
      }

      // Keep text facing camera
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
