import { useEffect, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useColorPickerStore } from '../stores';

const ColorPicker = ({
  onColorSelect,
  onClose,
  pickerId = 'default',
  initialColor = null,
}) => {
  const pickerRef = useRef();

  // Use store for color picker state
  const getColorPicker = useColorPickerStore((state) => state.getColorPicker);
  const setCurrentColor = useColorPickerStore((state) => state.setCurrentColor);
  const applyColor = useColorPickerStore((state) => state.applyColor);
  const cancelColorPicker = useColorPickerStore(
    (state) => state.cancelColorPicker
  );
  const openColorPicker = useColorPickerStore((state) => state.openColorPicker);

  // Get current picker state
  const pickerState = getColorPicker(pickerId);
  const currentColor = pickerState.currentColor;

  // Initialize picker when component mounts
  useEffect(() => {
    if (!pickerState.isOpen) {
      openColorPicker(pickerId, 'default', initialColor);
    }
  }, [pickerId, initialColor, pickerState.isOpen, openColorPicker]);
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
    setCurrentColor(pickerId, color);
  };

  const handleContainerClick = (e) => {
    e.stopPropagation();
  };

  const handleApplyColor = (e) => {
    e.stopPropagation();
    applyColor(pickerId, onColorSelect);
    onClose();
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    cancelColorPicker(pickerId);
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
        </button>{' '}
        <button
          onClick={handleCancel}
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
