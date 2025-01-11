import React, { useRef, forwardRef, useImperativeHandle, memo } from 'react';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

const CustomCamera = forwardRef((props, ref) => {
  const { gl } = useThree();
  const cameraRef = useRef();
  const controlsRef = useRef();

  useImperativeHandle(
    ref,
    () => ({
      ...cameraRef.current,
      orbitControls: controlsRef.current,
    }),
    []
  );

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={70}
        near={0.1}
        far={5000}
        position={[20, 20, 50]}
        aspect={window.innerWidth / window.innerHeight}
      />
      <OrbitControls
        ref={controlsRef}
        args={[cameraRef.current, gl.domElement]}
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        enableDamping={false}
        minDistance={5}
        maxDistance={100}
        rotateSpeed={0.5}
      />
    </>
  );
});

CustomCamera.displayName = 'CustomCamera';

export default memo(CustomCamera);
