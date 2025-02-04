import { useEffect, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';

const ColorPicker = ({ onColorSelect, onClose }) => {
  const [currentColor, setCurrentColor] = useState('#ffffff');
  const pickerRef = useRef();

  useEffect(() => {
    if (window.orbitControls) {
      window.orbitControls.enabled = false;
    }
    return () => {
      if (window.orbitControls) {
        window.orbitControls.enabled = true;
      }
    };
  }, []);

  const handleColorChange = (color) => {
    setCurrentColor(color);
  };

  const handleContainerClick = (e) => {
    e.stopPropagation();
  };

  const handleApplyColor = (e) => {
    e.stopPropagation();
    onColorSelect?.(currentColor);
    onClose();
  };

  return (
    <div
      ref={pickerRef}
      style={{
        position: 'absolute',
        background: '#333',
        padding: '12px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={handleContainerClick}
      onPointerDown={handleContainerClick}
    >
      <div onClick={handleContainerClick}>
        <HexColorPicker
          color={currentColor}
          onChange={handleColorChange}
          style={{ width: '200px', height: '200px' }}
        />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleApplyColor}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            background: '#444',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Apply
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            background: '#444',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ColorPicker;
