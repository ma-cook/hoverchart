import { useEffect, useState } from 'react';
import InstancedLine from './InstancedLine';

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

/**
 * Visual indicator showing a solid line between objects when snapping
 * @param {Object} props - Component properties
 * @param {Array} props.points - Array of two points for start and end of the line [[x1,y1,z1], [x2,y2,z2]]
 * @param {string} props.axis - The axis being snapped to ('x', 'y', or 'z')
 * @param {boolean} props.visible - Whether the indicator is visible
 */
const SnapLineIndicator = ({ points, axis, visible }) => {
  const [, setFadeOut] = useState(false);

  // Color mapping based on axes with yellow as base
  const colors = {
    x: '#ffdd00', // Yellow with red tint for X axis
    y: '#ffee00', // Yellow with green tint for Y axis
    z: '#ffd500', // Yellow with blue tint for Z axis
    default: '#ffcc00', // Default yellow
  };

  const color = colors[axis] || colors.default;

  // Reset fade state when visibility changes
  useEffect(() => {
    if (visible) {
      setFadeOut(false);

      // Auto-fade after 2 seconds
      const timer = setTimeout(() => {
        setFadeOut(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [visible, points]);

  // Don't render if not visible or missing points
  if (!visible || !points || points.length !== 2) return null;

  return (
    <InstancedLine
      points={points}
      color={color}
      lineWidth={isMobile ? 4 : 2}
    />
  );
};

export default SnapLineIndicator;
