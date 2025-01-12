import React from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

const TextSprite = ({ text, position }) => {
  const textRef = React.useRef();

  useFrame(({ camera }) => {
    if (textRef.current) {
      textRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <Text
      ref={textRef}
      position={position}
      fontSize={1.5}
      color="black"
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.1}
      outlineColor="white"
      billboard
    >
      {text}
    </Text>
  );
};

export default TextSprite;
