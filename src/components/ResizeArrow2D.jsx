import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

const ResizeArrow2D = ({ followTarget }) => {
  const arrowRef = useRef();
  const groupRef = useRef();

  useFrame(() => {
    if (groupRef.current && followTarget?.current && arrowRef.current) {
      // Get target's dimensions and position
      const bbox = new THREE.Box3().setFromObject(followTarget.current);
      const size = new THREE.Vector3();
      bbox.getSize(size);
      const center = new THREE.Vector3();
      bbox.getCenter(center);

      // Get world position and rotation
      const worldCenter = new THREE.Vector3();
      followTarget.current.getWorldPosition(worldCenter);
      const worldQuaternion = new THREE.Quaternion();
      followTarget.current.getWorldQuaternion(worldQuaternion);

      // Position the arrow at the right edge
      const margin = 2;
      groupRef.current.position.copy(worldCenter);
      groupRef.current.position.x += size.x / 2 + margin;

      // Instead of copying full quaternion, apply only Y rotation for flat alignment
      const euler = new THREE.Euler().setFromQuaternion(worldQuaternion, 'YXZ');
      groupRef.current.rotation.set(0, euler.y, 0);
    }
  });

  return (
    <group ref={groupRef}>
      <Html ref={arrowRef} transform position={[0, 0, 0]} center>
        <div
          style={{
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'ew-resize',
            color: 'yellow',
            fontSize: '20px',
            userSelect: 'none',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: '4px',
          }}
        >
          →
        </div>
      </Html>
    </group>
  );
};

export default ResizeArrow2D;
