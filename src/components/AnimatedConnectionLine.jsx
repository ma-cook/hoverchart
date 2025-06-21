import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { useAnimatedConnectionLineStore } from '../stores';

/**
 * AnimatedConnectionLine - Optimized line component for animated dashed/dotted connection lines
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

  // Use store for global animation state only
  const globalAnimationEnabled = useAnimatedConnectionLineStore(
    (state) => state.globalAnimationEnabled
  );  // Create a stable key based on points to force re-render when points change
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

  // Local animation state for smooth performance
  const animationOffsetRef = useRef(0);
  const animationSpeedRef = useRef(1);
  // Initialize animation speed based on direction and reset offset on changes
  useEffect(() => {
    if (shouldAnimate) {
      animationSpeedRef.current = dashDirection === 'right' ? 1 : -1;
      // Reset animation offset when starting animation or changing direction
      animationOffsetRef.current = 0;
    }
  }, [shouldAnimate, dashDirection]);

  // Use frame-based animation for smooth dash movement without store updates
  useFrame((state, delta) => {
    if (!shouldAnimate || !lineRef.current) return;

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
      // Update animation offset locally for smooth animation
      animationOffsetRef.current += delta * animationSpeedRef.current * 2; // Adjust speed as needed

      // Keep offset in reasonable range to prevent floating point precision issues
      if (animationOffsetRef.current > 100) animationOffsetRef.current -= 100;
      if (animationOffsetRef.current < -100) animationOffsetRef.current += 100;

      // Update the material's dash offset uniform directly
      material.uniforms.dashOffset.value = animationOffsetRef.current;
      // Only mark as needing update if the value actually changed significantly
      if (Math.abs(delta) > 0.001) {
        material.needsUpdate = true;
      }
    }
  });  // Parameters for the line visual style
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
      {/* Main visible line with optimized rendering and material ref */}      <Line
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
        renderOrder={20}
        transparent={false}
        depthTest={true}
        depthWrite={true}
        polygonOffset={true}
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
        toneMapped={false}
        resolution={2} // Reduced for better performance
      />

      {/* Invisible hitbox for interaction */}
      <Line
        key={`hitbox-${connectionId}-${pointsKey}`}
        points={normalizedPoints}
        color="white"
        lineWidth={20}
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        transparent
        opacity={0}
        depthTest={true}
        renderOrder={19}
        polygonOffset={true}
        polygonOffsetFactor={-0.9}
        polygonOffsetUnits={-0.9}
      />
    </>
  );
};

export default AnimatedConnectionLine;
