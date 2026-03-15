import React, { useRef, memo } from 'react';

import { PerspectiveCamera } from '@react-three/drei';

const CustomCamera = () => {
  const cameraRef = useRef();

  const planeYPosition = -50;

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={70}
        near={0.1}
        far={5000}
        position={[0, 0, 600]}
        aspect={window.innerWidth / window.innerHeight}
      />
    </>
  );
};

export default memo(CustomCamera);
