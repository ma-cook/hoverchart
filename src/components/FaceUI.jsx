import { Html } from '@react-three/drei';
import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import ColorPicker from './ColorPicker';
import * as THREE from 'three';

const FaceUI = ({
  position,
  onColorChange,
  face,
  onTextClick,
  isPlane = false, // Add this prop
  onTransformToggle, // Add this prop
  onResizeToggle, // Add this prop
  followTarget, // Add this prop
  onHeaderToggle, // Add this prop
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const groupRef = useRef();
  const lastPosition = useRef(null);

  useFrame(({ camera }) => {
    if (groupRef.current && followTarget?.current) {
      // Keep UI facing camera
      groupRef.current.quaternion.copy(camera.quaternion);

      // Only update position if it has changed significantly
      const newPos = new THREE.Vector3(...position);
      if (
        !lastPosition.current ||
        lastPosition.current.distanceTo(newPos) > 0.001
      ) {
        groupRef.current.position.copy(newPos);
        lastPosition.current = newPos.clone();
      }
    }
  });

  // Create base tools array
  const baseTools = [
    { name: 'text', icon: 'T' },
    { name: 'arrow', icon: '↗' },
    { name: 'paint', icon: '🎨' },
    { name: 'opacity', icon: '○' },
  ];

  // Add transform and resize tools conditionally
  const tools = isPlane
    ? [
        ...baseTools,
        { name: 'transform', icon: '✥' },
        { name: 'resize', icon: '↔' }, // Add resize button
      ]
    : baseTools;

  const handleToolClick = (tool, e) => {
    e.stopPropagation();
    if (tool.name === 'paint') {
      setShowColorPicker(true);
    } else if (tool.name === 'text' && typeof onTextClick === 'function') {
      onTextClick(face);
    } else if (
      tool.name === 'transform' &&
      typeof onTransformToggle === 'function'
    ) {
      onTransformToggle();
    } else if (tool.name === 'resize' && typeof onResizeToggle === 'function') {
      onResizeToggle();
    }
    console.log(`Face ${tool.name} clicked`);
  };

  return (
    <group ref={groupRef}>
      <Html
        style={{ background: 'white', pointerEvents: 'auto' }}
        center
        className="face-ui-container"
      >
        <div className="face-ui-content">
          {tools.map((tool) => (
            <button
              key={tool.name}
              className="face-tool-button"
              onClick={(e) => handleToolClick(tool, e)}
            >
              {tool.icon}
            </button>
          ))}
          {/* Add header button for planes */}
          {isPlane && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHeaderToggle?.();
              }}
              className="face-tool-button"
            >
              H
            </button>
          )}
        </div>
        {showColorPicker && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <ColorPicker
              onColorSelect={(color) => {
                onColorChange(color, face);
              }}
              onClose={() => setShowColorPicker(false)}
            />
          </div>
        )}
      </Html>
    </group>
  );
};

export default FaceUI;
