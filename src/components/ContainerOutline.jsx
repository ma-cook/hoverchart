import { useMemo } from 'react';
import PooledLine from './PooledLine';

/**
 * Simple container outline component - just renders edges without any interaction
 * Used for visualizing bounding boxes around component groups
 */
const ContainerOutline = ({
  position,
  scale,
  color = '#e0e0e0',
  lineWidth = 2,
}) => {
  // Calculate cube edges based on position and scale
  const cubeEdges = useMemo(() => {
    const [x, y, z] = position;
    const [sx, sy, sz] = scale;

    // Half dimensions (cube is centered at position)
    const hw = sx * 5; // Half width (default cube size is 10, so scale * 5)
    const hh = sy * 5; // Half height
    const hd = sz * 5; // Half depth

    // 8 corners of the cube
    const corners = [
      [x - hw, y - hh, z - hd], // 0: bottom-front-left
      [x + hw, y - hh, z - hd], // 1: bottom-front-right
      [x + hw, y + hh, z - hd], // 2: top-front-right
      [x - hw, y + hh, z - hd], // 3: top-front-left
      [x - hw, y - hh, z + hd], // 4: bottom-back-left
      [x + hw, y - hh, z + hd], // 5: bottom-back-right
      [x + hw, y + hh, z + hd], // 6: top-back-right
      [x - hw, y + hh, z + hd], // 7: top-back-left
    ];

    // 12 edges of the cube
    return [
      // Bottom face
      [corners[0], corners[1]],
      [corners[1], corners[5]],
      [corners[5], corners[4]],
      [corners[4], corners[0]],
      // Top face
      [corners[3], corners[2]],
      [corners[2], corners[6]],
      [corners[6], corners[7]],
      [corners[7], corners[3]],
      // Vertical edges
      [corners[0], corners[3]],
      [corners[1], corners[2]],
      [corners[5], corners[6]],
      [corners[4], corners[7]],
    ];
  }, [position, scale]);

  return (
    <group>
      {cubeEdges.map((edgePoints, idx) => (
        <PooledLine
          key={idx}
          points={edgePoints}
          color={color}
          lineWidth={lineWidth}
          enablePooling={true}
        />
      ))}
    </group>
  );
};

export default ContainerOutline;
