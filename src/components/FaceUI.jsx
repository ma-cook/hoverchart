import { Html } from '@react-three/drei';
import { useState } from 'react';
import ColorPicker from './ColorPicker';

const FaceUI = ({ position, onColorChange, face, onTextClick }) => {
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
    } else if (tool.name === 'text' && typeof onTextClick === 'function') {
      onTextClick(face);
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
