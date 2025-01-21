import { Html } from '@react-three/drei';
import { useState } from 'react';
import ColorPicker from './ColorPicker';

const FaceUI = ({ position, onColorChange, face }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const tools = [
    { name: 'text', icon: 'T' },
    { name: 'arrow', icon: '↗' },
    { name: 'paint', icon: '🎨' },
    { name: 'opacity', icon: '○' },
  ];

  const handleToolClick = (tool, e) => {
    e.stopPropagation();
    if (tool.name === 'paint') {
      setShowColorPicker(true);
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
        <ColorPicker
          position={[0, 40, 0]}
          onColorSelect={(color) => onColorChange(color, face)}
          onClose={() => setShowColorPicker(false)}
        />
      )}
    </Html>
  );
};

export default FaceUI;
