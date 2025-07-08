import {
  useRef,
  forwardRef,
  useImperativeHandle,
  memo,
  useEffect,
} from 'react';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

const CustomCamera = forwardRef(({ target = [5001, 5000, 5000] }, ref) => {
  const { gl, scene } = useThree();
  const cameraRef = useRef();
  const controlsRef = useRef();

  useImperativeHandle(ref, () => {
    const handle = {
      camera: cameraRef.current,
      orbitControls: controlsRef.current,
      setTarget: (pos) => {
        if (controlsRef.current) {
          controlsRef.current.target.set(pos.x, pos.y, pos.z);
          controlsRef.current.update();
        }
      },
    };
    // Ensure global access is always up-to-date
    window.cameraRef = handle;
    return handle;
  });

  useEffect(() => {
    if (controlsRef.current) {
      scene.orbitControls = controlsRef.current;
      // Also make orbit controls globally available for text objects to pause/resume
      window.orbitControls = controlsRef.current;
    }
  }, [scene]);

  return (
    <>
      {' '}
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={70}
        near={0.1}
        far={50000}
        position={[5100, 5000, 5000]} // 100 units away from target [5000,5000,5000]
        aspect={window.innerWidth / window.innerHeight}
      />{' '}
      <OrbitControls
        ref={(controls) => {
          controlsRef.current = controls;
          if (controls) {
            scene.orbitControls = controls;
            // Make orbit controls globally available for text objects to pause/resume
            window.orbitControls = controls;
          }
        }}
        args={[cameraRef.current, gl.domElement]}
        target={target} // Use the prop value for look-at target
        makeDefault
        enableDamping={false}
        screenSpacePanning={true}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
        minDistance={5}
        maxDistance={50000}
      />
    </>
  );
});

CustomCamera.displayName = 'CustomCamera';

export default memo(CustomCamera);
