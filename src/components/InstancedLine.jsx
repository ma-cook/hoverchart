import { useRef, useEffect, forwardRef } from 'react';
import * as THREE from 'three';
import { extend, useFrame } from '@react-three/fiber';
import LineShaderMaterial from './LineShaderMaterial';

extend({ LineShaderMaterial });

const InstancedLine = forwardRef(
  (
    { points = [], color = 'black', lineWidth = 1, count: propCount = 100 },
    ref
  ) => {
    const meshRef = useRef();
    const tempObject = new THREE.Object3D();

    // Determine the number of instances based on points or propCount
    const count = points.length > 1 ? points.length - 1 : propCount;

    useEffect(() => {
      if (!points || points.length < 2) {
        console.warn('InstancedLine: Not enough points to render lines.');
        return;
      }

      const geometry = new THREE.InstancedBufferGeometry();

      // Create a simple quad for the line
      const positions = new Float32Array([
        -1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0,
      ]);
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );

      // Add instance attributes
      const instanceStart = new Float32Array(count * 3);
      const instanceEnd = new Float32Array(count * 3);
      const instanceColor = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const start = points[i];
        const end = points[i + 1];

        instanceStart.set(start, i * 3);
        instanceEnd.set(end, i * 3);
        instanceColor.set(new THREE.Color(color).toArray(), i * 3);
      }

      geometry.setAttribute(
        'instanceStart',
        new THREE.InstancedBufferAttribute(instanceStart, 3)
      );
      geometry.setAttribute(
        'instanceEnd',
        new THREE.InstancedBufferAttribute(instanceEnd, 3)
      );
      geometry.setAttribute(
        'instanceColor',
        new THREE.InstancedBufferAttribute(instanceColor, 3)
      );

      // Compute bounding box and bounding sphere
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();

      geometry.instanceCount = count; // Set the number of instances

      if (meshRef.current) {
        meshRef.current.geometry = geometry;
      }

      console.log('InstancedLine geometry:', geometry); // Debugging
    }, [points, color, count]);

    useFrame(() => {
      if (!meshRef.current) return;

      for (let i = 0; i < count; i++) {
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObject.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
      <instancedMesh ref={meshRef} args={[null, LineShaderMaterial, count]} />
    );
  }
);

// Add a display name for debugging
InstancedLine.displayName = 'InstancedLine';

export default InstancedLine;
