import { useEffect, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';

const ColorPicker = ({ onColorSelect, onClose }) => {
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

  const handleContainerEvents = (e) => {
    e.stopPropagation();
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
      onClick={handleContainerEvents}
      onPointerDown={handleContainerEvents}
    >
      <div>
        <HexColorPicker
          color="#ffffff"
          onChange={onColorSelect}
          style={{ width: '200px', height: '200px' }}
        />
      </div>
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
          marginTop: '8px',
        }}
      >
        Close
      </button>
    </div>
  );
};

export default ColorPicker;
