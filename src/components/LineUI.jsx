import { Html } from '@react-three/drei';
import { useState, useEffect } from 'react';
import ColorPicker from './ColorPicker';
import { useColorPickerStore } from '../stores';

const LineUI = ({
  position,
  onColorChange,
  onToggleDashed,
  onTextClick,
  lineId,
  currentConnection,
}) => {
  const [showLineStyles, setShowLineStyles] = useState(false);
  const [showArrowDropdown, setShowArrowDropdown] = useState(false); // <-- New state
  // Extract the full style from the current connection, including direction
  const getFullStyle = (connection) => {
    if (!connection) return 'straight';
    const baseStyle =
      connection.styleType || connection.lineStyle || 'straight';
    const direction = connection.dashDirection;

    // If there's a direction, combine it with the base style
    if (direction && (baseStyle === 'dashed' || baseStyle === 'dotted')) {
      return `${baseStyle}-${direction}`;
    }
    return baseStyle;
  };

  // Extract just the base style (without direction) for UI display purposes
  const getBaseStyle = (connection) => {
    if (!connection) return 'straight';
    return connection.styleType || connection.lineStyle || 'straight';
  };
  const [currentLineStyle, setCurrentLineStyle] = useState(() =>
    getFullStyle(currentConnection)
  );
  // Update currentLineStyle when the connection changes or its style changes
  useEffect(() => {
    const newFullStyle = getFullStyle(currentConnection);
    setCurrentLineStyle(newFullStyle);
  }, [
    currentConnection,
    currentConnection?.styleType,
    currentConnection?.lineStyle,
    currentConnection?.dashDirection,
  ]);

  // Use color picker store
  const openColorPicker = useColorPickerStore((state) => state.openColorPicker);
  const closeColorPicker = useColorPickerStore(
    (state) => state.closeColorPicker
  );

  const pickerId = `line-ui-${lineId || 'default'}`;
  // Make color picker visibility reactive to store changes
  const showColorPicker = useColorPickerStore((state) =>
    state.isColorPickerOpen(pickerId)
  );

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
      case 'text':
        // Call text click handler and make sure it's working
        if (onTextClick) {
          onTextClick();
          // Reset other UI states
          setShowLineStyles(false);
          setShowArrowDropdown(false);
          closeColorPicker(pickerId);
        }
        break;
      case 'paint':
        openColorPicker(pickerId, 'line-ui');
        setShowLineStyles(false);
        setShowArrowDropdown(false);
        break;
      case 'dotted':
        setShowLineStyles(!showLineStyles);
        closeColorPicker(pickerId);
        setShowArrowDropdown(false);
        break;
    }
  };

  const handleLineStyleClick = (style, e) => {
    e.stopPropagation();
    setCurrentLineStyle(style.name);
    onToggleDashed?.(style.name);

    if (style.name === 'dashed' || style.name === 'dotted') {
      setShowArrowDropdown(true);
    } else {
      setShowLineStyles(false);
      setShowArrowDropdown(false);
    }
  };
  const handleArrowClick = (direction, e) => {
    e.stopPropagation(); // Get the current base style from the connection
    const actualBaseStyle = getBaseStyle(currentConnection);
    const fullStyleWithDirection = `${actualBaseStyle}-${direction}`;

    // Use the actual base style from the connection, not the local state
    onToggleDashed?.(fullStyleWithDirection);

    // Update local state to the full style with direction (not just base style)
    setCurrentLineStyle(fullStyleWithDirection);

    setShowArrowDropdown(false);
    setShowLineStyles(false);
  };

  return (
    <Html
      position={position}
      center
      className="line-ui-container"
      style={{
        pointerEvents: 'auto',
        transform: 'translate3d(-50%, -150%, 0)',
        background: 'transparent',
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
            className="face-tool-button"
            onClick={(e) => handleToolClick(tool, e)}
          >
            {tool.icon}
          </button>
        ))}{' '}
        {showLineStyles && (
          <div
            className="border-menu"
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
                className="face-tool-button"
                onClick={(e) => handleLineStyleClick(style, e)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                {style.icon}
              </button>
            ))}
          </div>
        )}
        {showArrowDropdown && (
          <div
            className="border-menu"
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'white',
              borderRadius: '4px',
              padding: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            }}
          >
            <button
              className="face-tool-button"
              onClick={(e) => handleArrowClick('left', e)}
            >
              ←
            </button>
            <button
              className="face-tool-button"
              onClick={(e) => handleArrowClick('right', e)}
            >
              →
            </button>
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
          {' '}
          <ColorPicker
            onColorSelect={(color) => {
              onColorChange?.(color);
              closeColorPicker(pickerId);
            }}
            onClose={() => closeColorPicker(pickerId)}
          />
        </div>
      )}
    </Html>
  );
};

export default LineUI;
