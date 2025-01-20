import { Html } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ObjectUI = ({
  onTransformToggle,
  onHeaderToggle,
  onResizeToggle, // Added onResizeToggle prop
  showTransform = false,
  showHeader = false,
  followTarget,
}) => {
  const groupRef = useRef();
  const lastPosition = useRef(null);

  useFrame(({ camera }) => {
    if (groupRef.current && followTarget?.current) {
      const targetScale = followTarget.current.scale;
      const cubeHeight = 10 * targetScale.y;
      const topEdgeOffset = cubeHeight / 2;
      const targetPos = followTarget.current.position;

      // Calculate new position
      const newPos = new THREE.Vector3(
        targetPos.x,
        targetPos.y + topEdgeOffset + 10,
        targetPos.z
      );

      // Only update if position has changed significantly
      if (
        !lastPosition.current ||
        lastPosition.current.distanceTo(newPos) > 0.001
      ) {
        groupRef.current.position.copy(newPos);
        lastPosition.current = newPos.clone();
      }

      // Keep UI facing camera
      groupRef.current.quaternion.copy(camera.quaternion);
    }
  });

  const tools = [
    {
      name: 'header',
      icon: 'H',
      active: showHeader,
      onClick: () => {
        console.log('Header button clicked');
        onHeaderToggle?.();
      },
    },
    { name: 'text', icon: 'T' },
    { name: 'arrow', icon: '↗' },
    { name: 'paint', icon: '🎨' },
    { name: 'opacity', icon: '○' },
    {
      name: 'transform',
      icon: '↕',
      active: showTransform,
      onClick: () => onTransformToggle?.(),
    },
    // Added Resize Button
    {
      name: 'resize',
      icon: '↔',
      active: false, // Optional: manage active state if needed
      onClick: () => {
        console.log('Resize button clicked');
        onResizeToggle?.();
      },
    },
  ];

  return (
    <group ref={groupRef}>
      <Html
        // Remove position prop from Html since we're controlling it via the group
        style={{
          background: 'white',
          pointerEvents: 'auto',
          zIndex: 999999,
        }}
        center
        className="object-ui-container"
      >
        <div className="object-ui-content">
          {tools.map((tool) => (
            <button
              key={tool.name}
              className={`object-tool-button ${tool.active ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (tool.onClick) {
                  tool.onClick();
                } else {
                  console.log(`${tool.name} button clicked`);
                }
              }}
            >
              {tool.icon}
            </button>
          ))}
        </div>
      </Html>
    </group>
  );
};

export default ObjectUI;
