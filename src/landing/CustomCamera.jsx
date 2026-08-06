import { useRef, memo } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

const CustomCamera = ({ scrollProgressRef = null }) => {
  const cameraRef = useRef();
  const { camera } = useThree();

  useFrame(({ invalidate }) => {
    // Read the ref directly — bypasses React re-renders so camera lerp is always smooth
    const progress = scrollProgressRef ? scrollProgressRef.current : 0;
    const targetY = -progress * 80;
    const targetZ = 600 - progress * 60;
    const deltaY = targetY - camera.position.y;
    const deltaZ = targetZ - camera.position.z;
    camera.position.y += deltaY * 0.08;
    camera.position.z += deltaZ * 0.08;
    // Keep scheduling frames only while the lerp is still converging; the
    // landing page runs frameloop "never", so an idle scene renders nothing.
    if (Math.abs(deltaY) > 0.01 || Math.abs(deltaZ) > 0.01) {
      invalidate();
    }
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
