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
  onBorderToggle, // Update this to handle more options
  onDelete, // Add this prop
  onWebcamToggle, // Add webcam toggle handler
  webcamActive = false, // Add webcam state
  isBroadcasting = false, // Add broadcasting state
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBorderMenu, setShowBorderMenu] = useState(false); // Add this state
  const [isBorderColor, setIsBorderColor] = useState(false); // Add this state
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

  const handleBorderStyleClick = (style) => {
    onBorderToggle?.({ type: 'style', value: style });
    setShowBorderMenu(false);
  };

  const handleBorderColorClick = (e) => {
    e.stopPropagation();
    setIsBorderColor(true);
    setShowColorPicker(true);
  };

  const handleLineThicknessClick = (e) => {
    e.stopPropagation();
    onBorderToggle?.({ type: 'thickness' });
  };

  const handleColorSelect = (color) => {
    if (isBorderColor) {
      // Pass color directly to parent for border color change
      onBorderToggle?.({ type: 'color', value: color });
      setIsBorderColor(false);
      setShowBorderMenu(false);
    } else {
      onColorChange?.(color, face);
    }
    setShowColorPicker(false);
  };

  // Create base tools array
  const baseTools = [
    { name: 'text', icon: 'T' },
    { name: 'arrow', icon: '↗' },
    { name: 'paint', icon: '🎨' },
    { name: 'opacity', icon: '○' },
  ];

  // Add transform, resize, border, webcam, and delete tools conditionally
  const tools = isPlane
    ? [
        ...baseTools,
        { name: 'transform', icon: '✥' },
        { name: 'resize', icon: '↔' }, // Add resize button
        { name: 'border', icon: '▢' }, // Add border tool for planes
        {
          name: 'webcam',
          icon: isBroadcasting ? `📹` : '📹', // Show viewer count if broadcasting
          active: webcamActive, // Show active state
        },
        { name: 'delete', icon: '🗑️' }, // Add delete tool for planes
      ]
    : baseTools;

  const handleToolClick = (tool, e) => {
    e.stopPropagation();
    switch (tool.name) {
      case 'paint':
        setShowColorPicker(true);
        break;
      case 'text':
        onTextClick?.(face);
        break;
      case 'transform':
        onTransformToggle?.();
        break;
      case 'resize':
        onResizeToggle?.();
        break;
      case 'border':
        setShowBorderMenu((prev) => !prev);
        setShowColorPicker(false);
        break;
      case 'webcam': // Handle webcam toggle
        onWebcamToggle?.();
        break;
      case 'delete':
        if (window.confirm('Are you sure you want to delete this object?')) {
          onDelete?.();
        }
        break;
    }
    console.log(`Face ${tool.name} clicked`);
  };

  return (
    <group ref={groupRef} position={position}>
      {' '}
      {/* Add position to group */}
      <Html
        center
        className="face-ui-container"
        style={{
          pointerEvents: 'auto',
          transform: 'translate3d(-50%, -150%, 0)', // Move UI up by adjusting Y transform
          background: 'transparent',
        }}
      >
        <div
          className="face-ui-content"
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '4px',
            padding: '4px',
            borderRadius: '4px',
            background: 'white',
          }}
        >
          {tools.map((tool) => (
            <button
              key={tool.name}
              className={`face-tool-button ${tool.active ? 'active-tool' : ''}`}
              onClick={(e) => handleToolClick(tool, e)}
              style={
                tool.active
                  ? {
                      backgroundColor:
                        tool.name === 'webcam' && isBroadcasting
                          ? '#ff4444'
                          : '#4CAF50',
                      color: 'white',
                    }
                  : {}
              }
              title={
                tool.name === 'webcam'
                  ? webcamActive
                    ? isBroadcasting
                      ? `Broadcasting`
                      : 'Disable Camera'
                    : 'Enable Camera'
                  : tool.name
              }
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
          {/* Add border menu dropdown */}
          {showBorderMenu && (
            <div className="border-menu">
              <button
                className="border-menu-item"
                onClick={() => handleBorderStyleClick('solid')}
              >
                ─────
              </button>
              <button
                className="border-menu-item"
                onClick={() => handleBorderStyleClick('dashed')}
              >
                ── ── ──
              </button>
              <button
                className="border-menu-item"
                onClick={() => handleBorderStyleClick('dotted')}
              >
                ∙∙∙∙∙∙∙
              </button>
              <button
                className="border-menu-item"
                onClick={handleBorderColorClick} // Updated handler
              >
                🎨
              </button>
              <button
                className="border-menu-item"
                onClick={handleLineThicknessClick}
                title="Toggle line thickness"
              >
                ▂▃▄
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
            <ColorPicker
              onColorSelect={handleColorSelect}
              onClose={() => {
                setShowColorPicker(false);
                setIsBorderColor(false);
                setShowBorderMenu(false);
              }}
            />
          </div>
        )}
      </Html>
    </group>
  );
};

export default FaceUI;
