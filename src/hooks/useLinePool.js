import { useRef, useEffect, useState } from 'react';
import { getLinePool } from '../utils/linePoolManager';

/**
 * Hook for managing pooled line resources
 */
export const useLinePool = (
  points,
  color = 'black',
  lineWidth = 1,
  enabled = true
) => {
  const geometryRef = useRef(null);
  const materialRef = useRef(null);
  const poolRef = useRef(getLinePool());
  const pointCountRef = useRef(0);
  const colorRef = useRef(color);
  const lineWidthRef = useRef(lineWidth);

  // Initialize pooled resources synchronously on first render
  const initializeResources = () => {
    if (!enabled || !points || points.length < 2) {
      return { geometry: null, material: null };
    }

    const pool = poolRef.current;

    // Get geometry if needed
    if (!geometryRef.current || pointCountRef.current !== points.length) {
      if (geometryRef.current && pointCountRef.current > 0) {
        pool.releaseGeometry(geometryRef.current, pointCountRef.current);
      }
      geometryRef.current = pool.getGeometry(points.length);
      pointCountRef.current = points.length;
    }

    // Get material if needed
    if (
      !materialRef.current ||
      colorRef.current !== color ||
      lineWidthRef.current !== lineWidth
    ) {
      if (materialRef.current && colorRef.current) {
        pool.releaseMaterial(
          materialRef.current,
          colorRef.current,
          lineWidthRef.current
        );
      }
      materialRef.current = pool.getMaterial(color, lineWidth);
      colorRef.current = color;
      lineWidthRef.current = lineWidth;
    }

    // Update geometry with current points
    if (geometryRef.current) {
      pool.updateLineGeometry(geometryRef.current, points);
    }

    return {
      geometry: geometryRef.current,
      material: materialRef.current,
    };
  };

  const [pooledResources] = useState(() => initializeResources());

  useEffect(() => {
    const pool = poolRef.current; // Copy ref value for cleanup

    if (!enabled || !points || points.length < 2) {
      // Release current resources
      if (geometryRef.current && pointCountRef.current > 0) {
        pool.releaseGeometry(geometryRef.current, pointCountRef.current);
        geometryRef.current = null;
      }
      if (materialRef.current && colorRef.current) {
        pool.releaseMaterial(
          materialRef.current,
          colorRef.current,
          lineWidthRef.current
        );
        materialRef.current = null;
      }
      pointCountRef.current = 0;
      return;
    }

    const needsNewGeometry =
      !geometryRef.current || pointCountRef.current !== points.length;
    const needsNewMaterial =
      !materialRef.current ||
      colorRef.current !== color ||
      lineWidthRef.current !== lineWidth;

    // Handle geometry
    if (needsNewGeometry) {
      // Release old geometry
      if (geometryRef.current && pointCountRef.current > 0) {
        pool.releaseGeometry(geometryRef.current, pointCountRef.current);
      }

      // Get new geometry
      geometryRef.current = pool.getGeometry(points.length);
      pointCountRef.current = points.length;
    }

    // Handle material
    if (needsNewMaterial) {
      // Release old material
      if (materialRef.current && colorRef.current) {
        pool.releaseMaterial(
          materialRef.current,
          colorRef.current,
          lineWidthRef.current
        );
      }

      // Get new material
      materialRef.current = pool.getMaterial(color, lineWidth);
      colorRef.current = color;
      lineWidthRef.current = lineWidth;
    }

    // Update geometry with current points
    if (geometryRef.current) {
      pool.updateLineGeometry(geometryRef.current, points);
    }

    // Cleanup on unmount
    return () => {
      if (geometryRef.current && pointCountRef.current > 0) {
        pool.releaseGeometry(geometryRef.current, pointCountRef.current);
        geometryRef.current = null;
      }
      if (materialRef.current && colorRef.current) {
        pool.releaseMaterial(
          materialRef.current,
          colorRef.current,
          lineWidthRef.current
        );
        materialRef.current = null;
      }
      pointCountRef.current = 0;
    };
  }, [points, color, lineWidth, enabled]);

  return {
    geometry: enabled ? pooledResources.geometry : null,
    material: enabled ? pooledResources.material : null,
    isPooled: enabled && pooledResources.geometry && pooledResources.material,
  };
};

export default useLinePool;
