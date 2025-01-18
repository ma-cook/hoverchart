import { useRef, forwardRef, useImperativeHandle, memo } from 'react';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

const CustomCamera = forwardRef((props, ref) => {
  const { gl } = useThree();
  const cameraRef = useRef();
  const controlsRef = useRef();

  useImperativeHandle(
    ref,
    () => ({
      camera: cameraRef.current, // Ensure camera reference is exposed
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
        makeDefault
        enableDamping={false}
        screenSpacePanning={true}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
        minDistance={5}
        maxDistance={1000}
      />
    </>
  );
});

CustomCamera.displayName = 'CustomCamera';

export default memo(CustomCamera);
