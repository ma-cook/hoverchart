import { Html } from '@react-three/drei';
import { useState } from 'react';
import ColorPicker from './ColorPicker';

const LineUI = ({ position, onColorChange, onToggleDashed, onTextClick }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLineStyles, setShowLineStyles] = useState(false);

  const tools = [
    { name: 'text', icon: 'T' },
    { name: 'paint', icon: '🎨' },
    { name: 'dotted', icon: '⋮' },
  ];

  const lineStyles = [
    { name: 'straight', icon: '—' },
    { name: 'dashed', icon: '---' },
    { name: 'dotted', icon: '⋯' },
  ];

  const handleToolClick = (tool, e) => {
    e.stopPropagation();
    switch (tool.name) {
      case 'paint':
        setShowColorPicker(true);
        setShowLineStyles(false);
        break;
      case 'text':
        onTextClick?.();
        setShowLineStyles(false);
        break;
      case 'dotted':
        setShowLineStyles(!showLineStyles);
        setShowColorPicker(false);
        break;
    }
  };

  const handleLineStyleClick = (style, e) => {
    e.stopPropagation();
    onToggleDashed?.(style.name);
    setShowLineStyles(false);
  };

  return (
    <Html
      position={position}
      center
      className="line-ui-container"
      style={{
        pointerEvents: 'auto',
        zIndex: 100,
      }}
    >
      <div
        className="line-ui-content"
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '4px',
          background: 'white',
          padding: '4px',
          borderRadius: '4px',
          position: 'relative',
        }}
      >
        {tools.map((tool) => (
          <button
            key={tool.name}
            className="line-tool-button"
            style={{
              padding: '4px 8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
            }}
            onClick={(e) => handleToolClick(tool, e)}
          >
            {tool.icon}
          </button>
        ))}

        {showLineStyles && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '66%',
              background: 'white',
              borderRadius: '4px',
              padding: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            }}
          >
            {lineStyles.map((style) => (
              <button
                key={style.name}
                onClick={(e) => handleLineStyleClick(style, e)}
                style={{
                  padding: '4px 8px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                {style.icon}
              </button>
            ))}
          </div>
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
              onColorChange?.(color);
              setShowColorPicker(false);
            }}
            onClose={() => setShowColorPicker(false)}
          />
        </div>
      )}
    </Html>
  );
};

export default LineUI;
