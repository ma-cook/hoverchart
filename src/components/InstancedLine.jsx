import { useRef, useMemo, forwardRef, useImperativeHandle, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { extend, useThree } from '@react-three/fiber';
import LineShaderMaterial from './LineShaderMaterial';

extend({ LineShaderMaterial });

// Reusable identity matrix for all instances - created once
const IDENTITY_MATRIX = new THREE.Matrix4();

// Reusable vectors for raycasting calculations
const _start = new THREE.Vector3();
const _end = new THREE.Vector3();
const _closestPoint = new THREE.Vector3();
const _rayDirection = new THREE.Vector3();

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
    const matricesInitializedRef = useRef(false);

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

    // Get camera for screen-space line width calculation
    const { camera } = useThree();

    // Custom raycast function for line intersection
    // This is needed because the shader positions lines differently than the base geometry
    const customRaycast = useCallback((raycaster, intersects) => {
      if (!geometry || count === 0) return;
      
      const instanceStart = geometry.getAttribute('instanceStart');
      const instanceEnd = geometry.getAttribute('instanceEnd');
      if (!instanceStart || !instanceEnd) return;
      
      const ray = raycaster.ray;
      // Use a threshold based on lineWidth - wider lines are easier to click
      // Scale threshold based on distance for more consistent clicking
      const baseThreshold = Math.max(lineWidth * 0.1, 0.5);
      
      for (let i = 0; i < count; i++) {
        _start.set(
          instanceStart.getX(i),
          instanceStart.getY(i),
          instanceStart.getZ(i)
        );
        _end.set(
          instanceEnd.getX(i),
          instanceEnd.getY(i),
          instanceEnd.getZ(i)
        );
        
        // Calculate the closest point on the line segment to the ray
        const lineDir = _end.clone().sub(_start);
        const lineLength = lineDir.length();
        if (lineLength === 0) continue;
        lineDir.normalize();
        
        // Ray-line segment closest point calculation
        const w0 = ray.origin.clone().sub(_start);
        const a = ray.direction.dot(ray.direction);
        const b = ray.direction.dot(lineDir);
        const c = lineDir.dot(lineDir);
        const d = ray.direction.dot(w0);
        const e = lineDir.dot(w0);
        
        const denom = a * c - b * b;
        let sc, tc;
        
        if (Math.abs(denom) < 0.00001) {
          // Lines are nearly parallel
          sc = 0;
          tc = (b > c ? d / b : e / c);
        } else {
          sc = (b * e - c * d) / denom;
          tc = (a * e - b * d) / denom;
        }
        
        // Clamp tc to [0, lineLength] to stay on segment
        tc = Math.max(0, Math.min(lineLength, tc));
        
        // Get the closest point on the line segment
        _closestPoint.copy(_start).addScaledVector(lineDir, tc);
        
        // Get the closest point on the ray
        const rayPoint = ray.origin.clone().addScaledVector(ray.direction, Math.max(0, sc));
        
        // Calculate distance between closest points
        const distance = rayPoint.distanceTo(_closestPoint);
        
        // Adjust threshold based on distance to camera for consistent clicking
        const distanceToCamera = _closestPoint.distanceTo(camera.position);
        const adjustedThreshold = baseThreshold * (1 + distanceToCamera * 0.01);
        
        if (distance < adjustedThreshold && sc > 0) {
          intersects.push({
            distance: sc,
            point: _closestPoint.clone(),
            object: meshRef.current,
            instanceId: i,
          });
        }
      }
    }, [geometry, count, lineWidth, camera]);

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

    // PERFORMANCE: Initialize instance matrices ONCE instead of every frame
    // This removes the useFrame loop that was running for every InstancedLine
    useEffect(() => {
      if (!meshRef.current || !geometry || matricesInitializedRef.current) return;
      
      // Set identity matrices once - the shader handles positioning via instance attributes
      for (let i = 0; i < count; i++) {
        meshRef.current.setMatrixAt(i, IDENTITY_MATRIX);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      matricesInitializedRef.current = true;
    }, [geometry, count]);

    // Reset initialization flag when geometry changes
    useEffect(() => {
      matricesInitializedRef.current = false;
    }, [flatPoints, color]);

    // Attach custom raycast function to the mesh
    useEffect(() => {
      if (meshRef.current) {
        meshRef.current.raycast = customRaycast;
      }
    }, [customRaycast]);

    if (!geometry || count === 0) {
      return null;
    }

    return (
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, count]}
        frustumCulled={false}
        renderOrder={10}
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      />
    );
  }
);

// Add a display name for debugging
InstancedLine.displayName = 'InstancedLine';

export default InstancedLine;
