import { useRef, useEffect } from 'react';

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
  const materialRef = useRef();
  const lineRef = useRef();

  // Optimization: Register with animation system only once material is ready
  useEffect(() => {
    // Skip registration for non-animated lines
    const isAnimated =
      (lineStyle === 'dashed' || lineStyle === 'dotted') &&
      (dashDirection === 'left' || dashDirection === 'right');

    if (!isAnimated) return;

    // Check if we have a material reference
    const registerMaterial = () => {
      if (!window._connectionAnimationSystem) return;

      // Try to find the line material
      let material = null;

      // First check if we have a direct material reference
      if (materialRef.current) {
        material = materialRef.current;
      }
      // Otherwise check the line's material
      else if (lineRef.current && lineRef.current.material) {
        material = lineRef.current.material;
      }

      if (material) {
        window._connectionAnimationSystem.registerLineMaterial(
          connectionId,
          material
        );

        // Add debug info
        material._connectionId = connectionId;
        material._dashDirection = dashDirection;
      }
    };

    // Wait a short time to ensure material is initialized
    const timer = setTimeout(registerMaterial, 50);

    return () => {
      clearTimeout(timer);
      if (window._connectionAnimationSystem) {
        window._connectionAnimationSystem.unregisterLineMaterial(connectionId);
      }
    };
  }, [connectionId, lineStyle, dashDirection]);

  // Parameters for the line visual style
  const isDashed = lineStyle === 'dashed' || lineStyle === 'dotted';
  const dashScale = lineStyle === 'dotted' ? 1 : 0.5;
  const dashSize = lineStyle === 'dotted' ? 0.5 : 4;
  const gapSize = lineStyle === 'dotted' ? 1 : 10;

  // Material callback ref to capture the material when it's created
  const handleMaterialRef = (material) => {
    if (material) {
      materialRef.current = material;

      // Register this material with animation system immediately
      if (window._connectionAnimationSystem && isDashed && dashDirection) {
        window._connectionAnimationSystem.registerLineMaterial(
          connectionId,
          material
        );
      }
    }
  };

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
        materialParams={{
          onUpdate: handleMaterialRef,
          linewidth: isSelected ? 4 : lineWidth,
          dashsize: dashSize,
          dashscale: dashScale,
          gapsize: gapSize,
          dashoffset: dashOffset || 0,
        }}
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
