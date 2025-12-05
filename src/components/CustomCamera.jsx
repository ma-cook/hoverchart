import {
  useRef,
  forwardRef,
  useImperativeHandle,
  memo,
  useEffect,
  useMemo,
} from 'react';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

// Reusable vector for setTarget to avoid allocations
import * as THREE from 'three';
const _targetVec = new THREE.Vector3();

const CustomCamera = forwardRef(({ target = [5001, 5000, 5000] }, ref) => {
  const { gl, scene } = useThree();
  const cameraRef = useRef();
  const controlsRef = useRef();

  // Memoize the target array to prevent unnecessary OrbitControls updates
  const memoizedTarget = useMemo(() => target, [target[0], target[1], target[2]]);

  useImperativeHandle(ref, () => {
    const handle = {
      camera: cameraRef.current,
      orbitControls: controlsRef.current,
      setTarget: (pos) => {
        if (controlsRef.current) {
          // Reuse vector instead of creating new one
          _targetVec.set(pos.x, pos.y, pos.z);
          controlsRef.current.target.copy(_targetVec);
          controlsRef.current.update();
        }
      },
    };
    // Ensure global access is always up-to-date
    window.cameraRef = handle;
    return handle;
  });

  // Memoize the ref callback to prevent re-binding on every render
  const controlsRefCallback = useMemo(() => (controls) => {
    controlsRef.current = controls;
    if (controls) {
      scene.orbitControls = controls;
      // Make orbit controls globally available for text objects to pause/resume
      window.orbitControls = controls;
    }
  }, [scene]);

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
        fov={75} // Increased FOV slightly to help with frustum culling at edges
        near={1} // Increased near plane slightly to help with precision at large distances
        far={100000} // Increased far plane to handle objects at very large distances
        position={[5100, 5000, 5000]} // 100 units away from target [5000,5000,5000]
        // Remove manual aspect - drei handles this automatically and more efficiently
      />{' '}
      <OrbitControls
        ref={controlsRefCallback}
        args={[cameraRef.current, gl.domElement]}
        target={memoizedTarget} // Use memoized prop value for look-at target
        makeDefault
        enableDamping={true} // Enable damping for smoother camera movement
        dampingFactor={0.1} // Moderate damping for responsive feel
        screenSpacePanning={true}
        minDistance={10} // Increased minimum distance to help with precision at large distances
        maxDistance={1000000} // Increased max zoom distance to match far plane
        // Performance optimizations
        enableRotate={true}
        rotateSpeed={0.8} // Slightly reduced for smoother rotation
        zoomSpeed={1.2}
        panSpeed={0.8}
        // Reduce update frequency when not interacting
        enableZoom={true}
        enablePan={true}
      />
    </>
  );
});

CustomCamera.displayName = 'CustomCamera';

export default memo(CustomCamera);
