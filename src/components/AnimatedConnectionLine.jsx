import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';

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
  const animatedOffsetRef = useRef(0);

  // Determine if this line should be animated
  const isAnimated =
    (lineStyle === 'dashed' || lineStyle === 'dotted') &&
    (dashDirection === 'left' || dashDirection === 'right');
  // Use frame-based animation for smooth dash movement without re-renders
  useFrame((state, delta) => {
    if (!isAnimated || !lineRef.current) return;

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
      // Animate the dash offset based on direction
      const speed = 2.0; // Animation speed
      const direction = dashDirection === 'right' ? 1 : -1;

      animatedOffsetRef.current += delta * speed * direction;

      // Update the material's dash offset uniform directly
      material.uniforms.dashOffset.value = animatedOffsetRef.current;
      material.needsUpdate = true;

      // Debug logging (only once per second to avoid spam)
      if (
        Math.floor(state.clock.elapsedTime) % 5 === 0 &&
        animatedOffsetRef.current % 1 < 0.1
      ) {
        console.log(
          `🎬 Animating connection ${connectionId}: offset=${animatedOffsetRef.current.toFixed(
            2
          )}, direction=${dashDirection}`
        );
      }
    }
  });
  // Parameters for the line visual style
  const isDashed = lineStyle === 'dashed' || lineStyle === 'dotted';
  const dashScale = lineStyle === 'dotted' ? 1 : 0.5;
  const dashSize = lineStyle === 'dotted' ? 0.5 : 4;
  const gapSize = lineStyle === 'dotted' ? 1 : 10;

  return (
    <>
      {/* Main visible line with optimized rendering and material ref */}
      <Line
        ref={lineRef}
        points={points}
        color={color || (isSelected ? '#ffff00' : 'black')}
        lineWidth={isSelected ? 4 : lineWidth}
        dashed={isDashed}
        dashScale={dashScale}
        dashSize={dashSize}
        gapSize={gapSize}
        dashOffset={dashOffset || 0}
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
