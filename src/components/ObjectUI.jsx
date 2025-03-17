import { Html } from '@react-three/drei';
import ColorPicker from './ColorPicker';
import { useState, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber'; // <-- New import
import * as THREE from 'three';

const ObjectUI = ({
  onTransformToggle,
  onHeaderToggle,
  onResizeToggle,
  onLineColorChange, // <-- New prop
  onDelete, // Add new delete handler prop
  showTransform = false,
  showHeader = false,
  followTarget,
}) => {
  const groupRef = useRef();
  const lastPosition = useRef(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const { camera } = useThree(); // <-- Get camera from Three.js context

  useFrame(({ camera }) => {
    if (groupRef.current && followTarget?.current) {
      // Get the target's position and scale
      const targetPos = followTarget.current.position;
      const targetScale =
        followTarget.current.scale || new THREE.Vector3(1, 1, 1);

      // Calculate offset based on cube dimensions - use actual cube scale
      const cubeHeight = 10 * (targetScale.y || 1); // 10 is the base cube height
      const topEdgeOffset = cubeHeight / 2; // Half height since cube is centered

      // Calculate the position above the cube with increased offset
      const newPos = new THREE.Vector3(
        targetPos.x,
        targetPos.y + topEdgeOffset + 16, // Increased vertical offset
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

  // Updated handler for the eye tool click: use followTarget and force camera update
  const handleEyeClick = () => {
    if (followTarget?.current) {
      // Get the world position of the selected object
      const worldPosition = new THREE.Vector3();
      followTarget.current.getWorldPosition(worldPosition);

      // Set up the camera position at an offset from the object
      const offset = new THREE.Vector3(20, 20, 20);
      const cameraPosition = worldPosition.clone().add(offset);

      // Update camera
      camera.position.copy(cameraPosition);

      // Make camera and orbit controls look at the object
      camera.lookAt(worldPosition);
      if (window.orbitControls) {
        window.orbitControls.target.copy(worldPosition);
        window.orbitControls.update();
      }
    }
  };

  const handleColorPick = (color) => {
    console.log('Color picked:', color); // Add debug log
    onLineColorChange?.(color); // Ensure we call the prop function
    setShowColorPicker(false);
  };

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

    {
      name: 'transform',
      icon: '✥',
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
    { name: 'color', icon: '🎨' }, // <-- New color tool
    {
      name: 'eye',
      icon: '👁', // <-- Eye icon
      onClick: handleEyeClick, // <-- Added eye tool handler
    },
    {
      name: 'delete',
      icon: '🗑️', // <-- Add delete button with trash icon
      onClick: () => {
        if (window.confirm('Are you sure you want to delete this object?')) {
          onDelete?.();
        }
      },
    },
  ];

  const handleToolClick = (tool) => {
    switch (tool.name) {
      case 'transform':
        onTransformToggle();
        break;
      case 'header':
        onHeaderToggle();
        break;
      case 'resize':
        onResizeToggle();
        break;
      case 'color':
        setShowColorPicker(true);
        break;
    }
  };

  return (
    <group ref={groupRef}>
      <Html
        // Remove position prop from Html since we're controlling it via the group
        style={{
          background: 'black',
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
                  handleToolClick(tool);
                }
              }}
            >
              {tool.icon}
            </button>
          ))}
        </div>
        {showColorPicker && (
          <ColorPicker
            onColorSelect={handleColorPick}
            onClose={() => setShowColorPicker(false)}
          />
        )}
      </Html>
    </group>
  );
};

export default ObjectUI;
