import { useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { extend, useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import LineShaderMaterial from './LineShaderMaterial';

extend({ LineShaderMaterial });

const InstancedLine = forwardRef(
  (
    {
      points = [],
      color = 'black',
      lineWidth = 1,
      onClick,
      onPointerOver,
      onPointerOut,
    },
    ref
  ) => {
    const meshRef = useRef();

    // Expose the mesh ref via the forwarded ref
    useImperativeHandle(ref, () => meshRef.current, []);

    // Determine the number of instances based on points
    // Points should be pairs: [start1, end1, start2, end2, ...]
    // So count = points.length / 2

    // Flatten points if they're in array-of-arrays format
    const flatPoints = useMemo(() => {
      if (!points || points.length === 0) return [];

      // Check if points are already flat (all elements are numbers)
      if (typeof points[0] === 'number') {
        return points;
      }

      // Otherwise, flatten array of arrays: [[x,y,z], [x,y,z]] => [x,y,z, x,y,z]
      return points.flat();
    }, [points]);

    // For the hitbox, we need the original array-of-arrays format
    const hitboxPoints = useMemo(() => {
      if (!points || points.length === 0)
        return [
          [0, 0, 0],
          [0, 0, 0],
        ];

      // If already in array-of-arrays format, use as-is
      if (Array.isArray(points[0])) {
        return points;
      }

      // If flat, convert back to array-of-arrays for drei Line
      const result = [];
      for (let i = 0; i < points.length; i += 3) {
        result.push([points[i], points[i + 1], points[i + 2]]);
      }
      return result;
    }, [points]);

    const count = Math.floor(flatPoints.length / 6); // Each line needs 6 values (2 points × 3 coords)

    // Create geometry synchronously using useMemo to avoid null geometry
    const geometry = useMemo(() => {
      if (!flatPoints || flatPoints.length < 6) {
        // Need at least 2 points (6 values) for one line
        return null;
      }

      const geo = new THREE.InstancedBufferGeometry();

      // Create a simple quad for the line (two triangles, x in [0,1], y in [-1,1])
      // vertex layout (two triangles):
      // triangle 1: (0,-1), (1,-1), (0,1)
      // triangle 2: (1,-1), (1,1),  (0,1)
      const positions = new Float32Array([
        0, -1, 0, 1, -1, 0, 0, 1, 0,

        1, -1, 0, 1, 1, 0, 0, 1, 0,
      ]);
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      // Add instance attributes
      const instanceStart = new Float32Array(count * 3);
      const instanceEnd = new Float32Array(count * 3);
      const instanceColor = new Float32Array(count * 3);

      // Points array format: [x1,y1,z1, x2,y2,z2, x3,y3,z3, ...]
      // We need to treat them as pairs: (0,1), (2,3), (4,5), ...
      for (let i = 0; i < count; i++) {
        const startIdx = i * 2; // Every pair of points
        const endIdx = startIdx + 1;

        const start = [
          flatPoints[startIdx * 3],
          flatPoints[startIdx * 3 + 1],
          flatPoints[startIdx * 3 + 2],
        ];
        const end = [
          flatPoints[endIdx * 3],
          flatPoints[endIdx * 3 + 1],
          flatPoints[endIdx * 3 + 2],
        ];

        instanceStart.set(start, i * 3);
        instanceEnd.set(end, i * 3);
        instanceColor.set(new THREE.Color(color).toArray(), i * 3);
      }

      geo.setAttribute(
        'instanceStart',
        new THREE.InstancedBufferAttribute(instanceStart, 3)
      );
      geo.setAttribute(
        'instanceEnd',
        new THREE.InstancedBufferAttribute(instanceEnd, 3)
      );
      geo.setAttribute(
        'instanceColor',
        new THREE.InstancedBufferAttribute(instanceColor, 3)
      );

      // Compute bounding box and bounding sphere
      geo.computeBoundingBox();
      geo.computeBoundingSphere();

      return geo;
    }, [flatPoints, color, count]);

    // Create material instance with linewidth uniform
    const material = useMemo(() => {
      return LineShaderMaterial.clone();
    }, []);

    // Update linewidth uniform when lineWidth prop changes
    useMemo(() => {
      if (material) {
        material.uniforms.linewidth.value = lineWidth;
      }
    }, [material, lineWidth]);

    useFrame(() => {
      if (!meshRef.current || !geometry) return;

      // Update instance matrices (identity for all instances since shader handles positioning)
      const tempObject = new THREE.Object3D();
      for (let i = 0; i < count; i++) {
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObject.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    });

    if (!geometry || count === 0) {
      return null;
    }

    return (
      <>
        {/* Visible instanced line */}
        <instancedMesh
          ref={meshRef}
          args={[geometry, material, count]}
          frustumCulled={false}
          renderOrder={10}
          onClick={onClick}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
        />
        {/* Invisible hitbox for easier clicking */}
        {/* Use pointerEvents="none" equivalent by setting visible={false} but keeping raycast */}
        <Line
          points={hitboxPoints}
          color="white"
          lineWidth={14}
          onClick={onClick}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
          visible={false}
          renderOrder={-1}
        />
      </>
    );
  }
);

// Add a display name for debugging
InstancedLine.displayName = 'InstancedLine';

export default InstancedLine;
