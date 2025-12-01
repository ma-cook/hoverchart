import { useRef, useEffect, useMemo } from 'react';
import { Line } from '@react-three/drei';
import { useAnimatedConnectionLineStore } from '../stores';
import { useAnimatedLine } from '../hooks/useConnectionAnimationManager';

/**
 * AnimatedConnectionLine - Optimized line component for animated dashed/dotted connection lines
 * PERFORMANCE: Now uses global animation manager instead of individual useFrame callbacks
 */
const AnimatedConnectionLine = ({
  points,
  connectionId,
  color = 'black',
  lineWidth = 2,
  lineStyle = 'straight',
  dashDirection,
  dashOffset = 0,
  isSelected = false,
  onClick,
  onPointerOver,
  onPointerOut,
}) => {
  const lineRef = useRef();
  const materialRef = useRef(null);

  // Use store for global animation state only
  const globalAnimationEnabled = useAnimatedConnectionLineStore(
    (state) => state.globalAnimationEnabled
  ); // Create a stable key based on points to force re-render when points change
  const pointsKey = useMemo(() => {
    if (!points || !Array.isArray(points) || points.length === 0) {
      return 'empty';
    }

    return points
      .map((p) => {
        let x, y, z;

        // Handle both Vector3 objects and arrays
        if (p && typeof p === 'object' && 'x' in p && 'y' in p && 'z' in p) {
          // Vector3 object
          x = typeof p.x === 'number' && !isNaN(p.x) ? p.x : 0;
          y = typeof p.y === 'number' && !isNaN(p.y) ? p.y : 0;
          z = typeof p.z === 'number' && !isNaN(p.z) ? p.z : 0;
        } else if (Array.isArray(p) && p.length >= 3) {
          // Array format
          x = typeof p[0] === 'number' && !isNaN(p[0]) ? p[0] : 0;
          y = typeof p[1] === 'number' && !isNaN(p[1]) ? p[1] : 0;
          z = typeof p[2] === 'number' && !isNaN(p[2]) ? p[2] : 0;
        } else {
          console.warn('Invalid point in AnimatedConnectionLine:', p);
          return '0,0,0';
        }

        return `${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)}`;
      })
      .join('|');
  }, [points]);

  // Force Line component to update when points change
  useEffect(() => {
    if (lineRef.current) {
      // The key change will force React to remount the Line component
    }
  }, [pointsKey, connectionId]);

  // Determine if this line should be animated
  const shouldAnimate =
    globalAnimationEnabled &&
    (lineStyle === 'dashed' || lineStyle === 'dotted') &&
    (dashDirection === 'left' || dashDirection === 'right');

  // Calculate animation speed based on direction
  const animationSpeed = dashDirection === 'right' ? 1 : -1;

  // Extract material reference from the Line component when it mounts
  useEffect(() => {
    if (!lineRef.current) return;

    // Find the line material in the drei Line component
    const line = lineRef.current;
    let material = null;

    // drei Line component stores material in different ways depending on version
    if (line.material) {
      material = line.material;
    } else if (line.children && line.children[0] && line.children[0].material) {
      material = line.children[0].material;
    }

    if (material && material.uniforms && material.uniforms.dashOffset) {
      materialRef.current = { current: material };
    }
  }, [pointsKey]); // Re-extract when points change

  // PERFORMANCE: Register with global animation manager instead of individual useFrame
  // This replaces 500+ useFrame callbacks with a single global one
  useAnimatedLine(
    connectionId, 
    materialRef.current, 
    shouldAnimate, 
    1, // speed multiplier
    animationSpeed // direction
  );

  // Parameters for the line visual style
  const isDashed = lineStyle === 'dashed' || lineStyle === 'dotted';
  const dashScale = lineStyle === 'dotted' ? 1 : 0.5;
  const dashSize = lineStyle === 'dotted' ? 0.5 : 4;
  const gapSize = lineStyle === 'dotted' ? 1 : 10;
  // Use local animation offset for animated lines, fallback to prop for static lines
  const effectiveDashOffset = shouldAnimate ? 0 : dashOffset || 0;

  // Validate points before rendering
  if (!points || !Array.isArray(points) || points.length < 2) {
    console.warn('AnimatedConnectionLine: Invalid or insufficient points', {
      points,
      connectionId,
    });
    return null;
  }
  // Validate that all points have valid coordinates
  const validPoints = points.every((p) => {
    // Handle both Vector3 objects and arrays
    if (p && typeof p === 'object' && 'x' in p && 'y' in p && 'z' in p) {
      // Vector3 object
      return (
        typeof p.x === 'number' &&
        typeof p.y === 'number' &&
        typeof p.z === 'number' &&
        !isNaN(p.x) &&
        !isNaN(p.y) &&
        !isNaN(p.z)
      );
    } else if (Array.isArray(p) && p.length >= 3) {
      // Array format
      return (
        typeof p[0] === 'number' &&
        typeof p[1] === 'number' &&
        typeof p[2] === 'number' &&
        !isNaN(p[0]) &&
        !isNaN(p[1]) &&
        !isNaN(p[2])
      );
    }
    return false;
  });
  if (!validPoints) {
    console.warn('AnimatedConnectionLine: Invalid point coordinates', {
      points,
      connectionId,
    });
    return null;
  }

  // Convert points to arrays for the Line component (handles both Vector3 and array formats)
  const normalizedPoints = points.map((p) => {
    if (p && typeof p === 'object' && 'x' in p && 'y' in p && 'z' in p) {
      // Vector3 object - convert to array
      return [p.x, p.y, p.z];
    } else if (Array.isArray(p)) {
      // Already an array
      return p;
    } else {
      // Fallback
      return [0, 0, 0];
    }
  });

  return (
    <>
      {/* Main visible line with optimized rendering and material ref */}{' '}
      <Line
        key={`line-${connectionId}-${pointsKey}`}
        ref={lineRef}
        points={normalizedPoints}
        color={color || (isSelected ? '#ffff00' : 'black')}
        lineWidth={isSelected ? 4 : lineWidth}
        dashed={isDashed}
        dashScale={dashScale}
        dashSize={dashSize}
        gapSize={gapSize}
        dashOffset={effectiveDashOffset}
        renderOrder={10} // Lower than header text (3000-5000) but higher than hitbox (5)
        transparent={false}
        depthTest={true}
        depthWrite={false} // Prevent connection lines from writing to depth buffer to avoid interfering with header text
        polygonOffset={true}
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
        toneMapped={false}
        resolution={2} // Reduced for better performance
      />
      {/* Invisible hitbox for interaction - won't block objects behind it */}
      <Line
        key={`hitbox-${connectionId}-${pointsKey}`}
        points={normalizedPoints}
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
};

export default AnimatedConnectionLine;
