import { Html } from '@react-three/drei';
import { useState } from 'react';
import ColorPicker from './ColorPicker';

const FaceUI = ({
  position,
  onColorChange,
  face,
  onTextClick,
  isPlane = false, // Add this prop
  onTransformToggle, // Add this prop
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Create base tools array
  const baseTools = [
    { name: 'text', icon: 'T' },
    { name: 'arrow', icon: '↗' },
    { name: 'paint', icon: '🎨' },
    { name: 'opacity', icon: '○' },
  ];

  // Add transform tool conditionally
  const tools = isPlane
    ? [...baseTools, { name: 'transform', icon: '✥' }]
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
    }
    console.log(`Face ${tool.name} clicked`);
  };

  return (
    <Html
      position={position}
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
  );
};

export default FaceUI;
