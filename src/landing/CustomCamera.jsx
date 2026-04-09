import React, { useRef, memo } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

const CustomCamera = ({ scrollProgressRef = null }) => {
  const cameraRef = useRef();
  const { camera } = useThree();

  useFrame(() => {
    // Read the ref directly — bypasses React re-renders so camera lerp is always smooth
    const progress = scrollProgressRef ? scrollProgressRef.current : 0;
    const targetY = -progress * 80;
    const targetZ = 600 - progress * 60;
    camera.position.y += (targetY - camera.position.y) * 0.08;
    camera.position.z += (targetZ - camera.position.z) * 0.08;
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={70}
      near={0.1}
      far={5000}
      position={[0, 0, 600]}
      aspect={window.innerWidth / window.innerHeight}
    />
  );
};

export default memo(CustomCamera);
