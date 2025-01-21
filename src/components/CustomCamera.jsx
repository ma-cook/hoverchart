import {
  useRef,
  forwardRef,
  useImperativeHandle,
  memo,
  useEffect,
} from 'react';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

const CustomCamera = forwardRef((props, ref) => {
  const { gl, scene } = useThree();
  const cameraRef = useRef();
  const controlsRef = useRef();

  useImperativeHandle(
    ref,
    () => ({
      camera: cameraRef.current,
      orbitControls: controlsRef.current,
    }),
    []
  );

  useEffect(() => {
    if (controlsRef.current) {
      scene.orbitControls = controlsRef.current;
    }
  }, [scene]);

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
        ref={(controls) => {
          controlsRef.current = controls;
          if (controls) {
            scene.orbitControls = controls;
          }
        }}
        args={[cameraRef.current, gl.domElement]}
        makeDefault
        enableDamping={false}
        screenSpacePanning={true}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
        minDistance={5}
        maxDistance={3000}
      />
    </>
  );
});

CustomCamera.displayName = 'CustomCamera';

export default memo(CustomCamera);
