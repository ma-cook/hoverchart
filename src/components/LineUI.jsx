import { Html } from '@react-three/drei';
import { useEffect } from 'react';
import ColorPicker from './ColorPicker';
import { useColorPickerStore, useConnectionStore } from '../stores';

const LineUI = ({
  position,
  onColorChange,
  onToggleDashed,
  onTextClick,
  lineId,
  currentConnection,
}) => {
  // Use Zustand store for menu state instead of local useState
  const menuState = useConnectionStore((state) =>
    state.getLineUIMenuState(currentConnection?.id)
  );
  const toggleLineStylesMenu = useConnectionStore(
    (state) => state.toggleLineStylesMenu
  );
  const toggleArrowDropdown = useConnectionStore(
    (state) => state.toggleArrowDropdown
  );
  const closeAllLineUIMenus = useConnectionStore(
    (state) => state.closeAllLineUIMenus
  );
  const setLineUIMenuState = useConnectionStore(
    (state) => state.setLineUIMenuState
  );

  const { showLineStyles, showArrowDropdown, currentLineStyle } = menuState;

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

  // Sync currentLineStyle in store when connection changes
  useEffect(() => {
    const newFullStyle = getFullStyle(currentConnection);
    if (newFullStyle !== currentLineStyle && currentConnection?.id) {
      setLineUIMenuState(currentConnection.id, {
        currentLineStyle: newFullStyle,
      });
    }
  }, [
    currentConnection,
    currentConnection?.styleType,
    currentConnection?.lineStyle,
    currentConnection?.dashDirection,
    currentLineStyle,
    setLineUIMenuState,
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
          closeAllLineUIMenus(currentConnection?.id);
          closeColorPicker(pickerId);
        }
        break;
      case 'paint':
        openColorPicker(pickerId, 'line-ui');
        closeAllLineUIMenus(currentConnection?.id);
        break;
      case 'dotted':
        toggleLineStylesMenu(currentConnection?.id);
        closeColorPicker(pickerId);
        break;
    }
  };

  const handleLineStyleClick = (style, e) => {
    e.stopPropagation();
    console.log('🔘 [LineUI] Style button clicked:', style.name);

    // Update store with new style
    if (currentConnection?.id) {
      setLineUIMenuState(currentConnection.id, {
        currentLineStyle: style.name,
      });
    }

    onToggleDashed?.(style.name);

    if (style.name === 'dashed' || style.name === 'dotted') {
      toggleArrowDropdown(currentConnection?.id);
    } else if (currentConnection?.id) {
      closeAllLineUIMenus(currentConnection.id);
    }
  };

  const handleArrowClick = (direction, e) => {
    e.stopPropagation();
    console.log('➡️ [LineUI] Arrow button clicked:', direction);

    // Use the current local state (which has the latest style from the button click)
    // Extract base style from currentLineStyle (remove any existing direction suffix)
    const baseStyle = currentLineStyle.split('-')[0];
    const fullStyleWithDirection = `${baseStyle}-${direction}`;

    console.log('➡️ [LineUI] Sending style with direction:', {
      currentLineStyle,
      baseStyle,
      fullStyleWithDirection,
    });

    // Send the style with direction
    onToggleDashed?.(fullStyleWithDirection);

    // Update store with the full style with direction
    if (currentConnection?.id) {
      setLineUIMenuState(currentConnection.id, {
        currentLineStyle: fullStyleWithDirection,
      });
      closeAllLineUIMenus(currentConnection.id);
    }
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
