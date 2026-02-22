import { useRef, useMemo, forwardRef, useImperativeHandle, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { extend, useThree } from '@react-three/fiber';
import LineShaderMaterial from './LineShaderMaterial';

extend({ LineShaderMaterial });

// Reusable identity matrix for all instances - created once
const IDENTITY_MATRIX = new THREE.Matrix4();

// Base quad geometry positions - shared across all instances
const BASE_POSITIONS = new Float32Array([
  0, -1, 0, 1, -1, 0, 0, 1, 0,
  1, -1, 0, 1, 1, 0, 0, 1, 0,
]);

// Reusable vectors for raycasting calculations
const _start = new THREE.Vector3();
const _end = new THREE.Vector3();
const _closestPoint = new THREE.Vector3();
const _rayDirection = new THREE.Vector3();
// Additional pre-allocated vectors for raycast to avoid .clone() calls
const _lineDir = new THREE.Vector3();
const _w0 = new THREE.Vector3();
const _rayPoint = new THREE.Vector3();
// Reusable color object
const _tempColor = new THREE.Color();

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
    const geometryRef = useRef(null);
    const materialRef = useRef(null);
    const bufferCapacityRef = useRef(0);

    // Expose the mesh ref via the forwarded ref
    useImperativeHandle(ref, () => meshRef.current, []);

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

    // GPU RESOURCE FIX: Create geometry ONCE with oversize buffers, then update in-place.
    // This avoids recreating InstancedBufferGeometry on every position change which
    // leaked GPU memory and caused graphics card crashes during camera movement.
    const geometry = useMemo(() => {
      if (!flatPoints || flatPoints.length < 6) {
        return null;
      }

      // If we already have a geometry with enough capacity, reuse it
      if (geometryRef.current && bufferCapacityRef.current >= count) {
        const geo = geometryRef.current;
        const instanceStart = geo.getAttribute('instanceStart');
        const instanceEnd = geo.getAttribute('instanceEnd');
        const instanceColor = geo.getAttribute('instanceColor');

        _tempColor.set(color);
        const colorArr = _tempColor.toArray();

        for (let i = 0; i < count; i++) {
          const startIdx = i * 2;
          const endIdx = startIdx + 1;
          instanceStart.setXYZ(i, flatPoints[startIdx * 3], flatPoints[startIdx * 3 + 1], flatPoints[startIdx * 3 + 2]);
          instanceEnd.setXYZ(i, flatPoints[endIdx * 3], flatPoints[endIdx * 3 + 1], flatPoints[endIdx * 3 + 2]);
          instanceColor.setXYZ(i, colorArr[0], colorArr[1], colorArr[2]);
        }

        instanceStart.needsUpdate = true;
        instanceEnd.needsUpdate = true;
        instanceColor.needsUpdate = true;
        geo.instanceCount = count;
        geo.computeBoundingBox();
        geo.computeBoundingSphere();

        return geo;
      }

      // Need a new (or larger) geometry — dispose old one first
      if (geometryRef.current) {
        geometryRef.current.dispose();
      }

      const capacity = Math.max(count * 2, 8); // Overallocate to reduce future reallocations
      const geo = new THREE.InstancedBufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(BASE_POSITIONS, 3));

      const instanceStart = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3);
      const instanceEnd = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3);
      const instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3);
      instanceStart.setUsage(THREE.DynamicDrawUsage);
      instanceEnd.setUsage(THREE.DynamicDrawUsage);
      instanceColor.setUsage(THREE.DynamicDrawUsage);

      _tempColor.set(color);
      const colorArr = _tempColor.toArray();

      for (let i = 0; i < count; i++) {
        const startIdx = i * 2;
        const endIdx = startIdx + 1;
        instanceStart.setXYZ(i, flatPoints[startIdx * 3], flatPoints[startIdx * 3 + 1], flatPoints[startIdx * 3 + 2]);
        instanceEnd.setXYZ(i, flatPoints[endIdx * 3], flatPoints[endIdx * 3 + 1], flatPoints[endIdx * 3 + 2]);
        instanceColor.setXYZ(i, colorArr[0], colorArr[1], colorArr[2]);
      }

      geo.setAttribute('instanceStart', instanceStart);
      geo.setAttribute('instanceEnd', instanceEnd);
      geo.setAttribute('instanceColor', instanceColor);
      geo.instanceCount = count;
      geo.computeBoundingBox();
      geo.computeBoundingSphere();

      geometryRef.current = geo;
      bufferCapacityRef.current = capacity;

      return geo;
    }, [flatPoints, color, count]);

    // GPU RESOURCE FIX: Dispose geometry on unmount
    useEffect(() => {
      return () => {
        if (geometryRef.current) {
          geometryRef.current.dispose();
          geometryRef.current = null;
        }
      };
    }, []);

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
        _lineDir.copy(_end).sub(_start);
        const lineLength = _lineDir.length();
        if (lineLength === 0) continue;
        _lineDir.normalize();
        
        // Ray-line segment closest point calculation
        _w0.copy(ray.origin).sub(_start);
        const a = ray.direction.dot(ray.direction);
        const b = ray.direction.dot(_lineDir);
        const c = _lineDir.dot(_lineDir);
        const d = ray.direction.dot(_w0);
        const e = _lineDir.dot(_w0);
        
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
        _closestPoint.copy(_start).addScaledVector(_lineDir, tc);
        
        // Get the closest point on the ray (reuse pre-allocated vector)
        _rayPoint.copy(ray.origin).addScaledVector(ray.direction, Math.max(0, sc));
        
        // Calculate distance between closest points
        const distance = _rayPoint.distanceTo(_closestPoint);
        
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

    // GPU RESOURCE FIX: Create material ONCE and dispose on unmount
    const material = useMemo(() => {
      const mat = LineShaderMaterial.clone();
      materialRef.current = mat;
      return mat;
    }, []);

    // GPU RESOURCE FIX: Dispose material on unmount
    useEffect(() => {
      return () => {
        if (materialRef.current) {
          materialRef.current.dispose();
          materialRef.current = null;
        }
      };
    }, []);

    // Update linewidth uniform when lineWidth prop changes
    useEffect(() => {
      if (material) {
        material.uniforms.linewidth.value = lineWidth;
      }
    }, [material, lineWidth]);

    // PERFORMANCE: Initialize instance matrices ONCE instead of every frame
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

    // Sync geometry/material to mesh when they change (in-place reuse path)
    useEffect(() => {
      if (meshRef.current && geometry) {
        meshRef.current.geometry = geometry;
        meshRef.current.count = count;
      }
    }, [geometry, count]);

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
