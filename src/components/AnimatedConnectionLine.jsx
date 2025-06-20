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
  );

  // Create a stable key based on points to force re-render when points change
  const pointsKey = useMemo(() => {
    return points
      .map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)},${p[2].toFixed(2)}`)
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
  }); // Parameters for the line visual style
  const isDashed = lineStyle === 'dashed' || lineStyle === 'dotted';
  const dashScale = lineStyle === 'dotted' ? 1 : 0.5;
  const dashSize = lineStyle === 'dotted' ? 0.5 : 4;
  const gapSize = lineStyle === 'dotted' ? 1 : 10;
  // Use local animation offset for animated lines, fallback to prop for static lines
  const effectiveDashOffset = shouldAnimate ? 0 : dashOffset || 0;
  return (
    <>
      {/* Main visible line with optimized rendering and material ref */}
      <Line
        key={`line-${connectionId}-${pointsKey}`}
        ref={lineRef}
        points={points}
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
        points={points}
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
