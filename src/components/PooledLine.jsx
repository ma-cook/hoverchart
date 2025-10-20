import { useRef, useEffect, forwardRef } from 'react';
import { Line } from '@react-three/drei';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { useLinePool } from '../hooks/useLinePool';
// import InstancedLine from './InstancedLine';

/**
 * PooledLine - Uses object pooling for Line2 geometries and materials
 * Falls back to regular Line for complex properties
 */
const PooledLine = forwardRef(
  (
    {
      points = [],
      color = 'black',
      lineWidth = 1,
      opacity = 1,
      transparent,
      visible = true,
      onClick,
      onPointerOver,
      onPointerOut,
      enablePooling = true,
      // Complex line properties that disable pooling
      dashed,
      dashScale,
      dashSize,
      gapSize,
      dashOffset,
      resolution,
      children,
      ...props
    },
    ref
  ) => {
    const meshRef = useRef();

    // Disable pooling only when complex line properties are actually being used
    // For dash properties, only consider them complex if dashed is true
    // Also disable pooling if click handlers are present for reliable interaction
    const hasComplexProps =
      dashed === true ||
      (dashOffset !== undefined && dashOffset !== 0) ||
      (resolution !== undefined && resolution !== 2) ||
      onClick !== undefined || // Disable pooling for clickable lines
      onPointerOver !== undefined ||
      onPointerOut !== undefined;

    const usePooling = enablePooling && !hasComplexProps;

    // Use pooled resources for simple lines (now with lineWidth support)
    const { geometry, material, isPooled } = useLinePool(
      points,
      color,
      lineWidth,
      usePooling
    );

    // Update material properties
    useEffect(() => {
      if (isPooled && material) {
        material.color.set(color);
        material.opacity = opacity;
        material.transparent =
          opacity < 1 || (transparent !== undefined ? transparent : false);
        material.visible = visible;
        material.linewidth = lineWidth; // Update linewidth
        material.resolution.set(window.innerWidth, window.innerHeight);
        material.needsUpdate = true;
      }
    }, [color, opacity, visible, transparent, lineWidth, material, isPooled]);

    // Handle events
    const handleClick = (event) => {
      event.stopPropagation();
      if (onClick) onClick(event);
    };

    const handlePointerOver = (event) => {
      event.stopPropagation();
      if (onPointerOver) onPointerOver(event);
    };

    const handlePointerOut = (event) => {
      event.stopPropagation();
      if (onPointerOut) onPointerOut(event);
    };

    // Forward ref
    useEffect(() => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(meshRef.current);
        } else {
          ref.current = meshRef.current;
        }
      }
    }, [ref]);

    // Don't render if no points
    if (!points || points.length < 2) {
      return null;
    }

    // Use pooled rendering for simple lines with Line2
    if (isPooled && geometry && material) {
      return (
        <primitive
          ref={meshRef}
          object={new Line2(geometry, material)}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          {...props}
        >
          {children}
        </primitive>
      );
    }

    // If pooling is enabled but resources not available, don't render anything
    if (usePooling) {
      return null;
    }

    // Fallback to regular Line component for complex properties
    return (
      <Line
        ref={meshRef}
        points={points}
        color={color}
        lineWidth={lineWidth}
        opacity={opacity}
        transparent={transparent}
        visible={visible}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        dashed={dashed}
        dashScale={dashScale}
        dashSize={dashSize}
        gapSize={gapSize}
        dashOffset={dashOffset}
        resolution={resolution}
        {...props}
      >
        {children}
      </Line>
    );
  }
);

PooledLine.displayName = 'PooledLine';

export default PooledLine;
