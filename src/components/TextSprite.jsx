import React from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

const TextSprite = ({ text, position, followTarget }) => {
  const textRef = React.useRef();

  useFrame(({ camera }) => {
    if (textRef.current) {
      // Update position if following a target
      if (followTarget?.current) {
        const targetScale = followTarget.current.scale;
        const cubeHeight = 10 * targetScale.y;
        const topEdgeOffset = cubeHeight / 2;
        const targetPos = followTarget.current.position;

        textRef.current.position.set(
          targetPos.x,
          targetPos.y + topEdgeOffset + 15,
          targetPos.z
        );
      }

      // Calculate fixed scale based on camera distance
      const distanceToCamera = camera.position.distanceTo(
        textRef.current.position
      );
      const baseSize = 0.15; // Base size for text
      const scaleFactor = Math.max(distanceToCamera * 0.03, baseSize); // Ensure minimum size

      // Set absolute scale instead of accumulating
      textRef.current.scale.setScalar(scaleFactor);

      // Keep text facing camera
      textRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <Text
      ref={textRef}
      position={position}
      fontSize={0.5}
      color="black"
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.03}
      outlineColor="white"
      billboard
    >
      {text}
    </Text>
  );
};

export default TextSprite;
