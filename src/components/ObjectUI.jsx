import React from 'react';
import { Html } from '@react-three/drei';
import ColorPicker from './ColorPicker';
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber'; // <-- New import
import * as THREE from 'three';
import { useColorPickerStore } from '../stores';

// Pre-allocated temp vector to avoid GC pressure in useFrame
const _tempVec3 = new THREE.Vector3();

const ObjectUI = React.memo(
  ({
    onTransformToggle,
    onHeaderToggle,
    onResizeToggle,
    onLineColorChange,
    onDelete,
    onCodeToggle,
    showTransform = false,
    showHeader = false,
    hasCode = false,
    followTarget,
  }) => {
    const groupRef = useRef();
    const lastPosition = useRef(null);

    // Use color picker store
    const isColorPickerOpen = useColorPickerStore(
      (state) => state.isColorPickerOpen
    );
    const openColorPicker = useColorPickerStore(
      (state) => state.openColorPicker
    );
    const closeColorPicker = useColorPickerStore(
      (state) => state.closeColorPicker
    );
    const pickerId = 'object-ui-color-picker';

    // Use color picker store - make it reactive
    const showColorPicker = useColorPickerStore((state) =>
      state.isColorPickerOpen(pickerId)
    );

    const { camera } = useThree(); // <-- Get camera from Three.js context
    useFrame(({ camera }) => {
      if (groupRef.current && followTarget?.current) {
        // Get the target's world position (reuse pre-allocated vector)
        followTarget.current.getWorldPosition(_tempVec3);

        // Only update if position has changed significantly
        if (
          !lastPosition.current ||
          lastPosition.current.distanceTo(_tempVec3) > 0.001
        ) {
          groupRef.current.position.copy(_tempVec3);
          if (!lastPosition.current) lastPosition.current = new THREE.Vector3();
          lastPosition.current.copy(_tempVec3);
        }

        // Keep UI facing camera
        groupRef.current.quaternion.copy(camera.quaternion);
      }
    });

    // Updated handler for the eye tool click: use followTarget and force camera update
    const handleEyeClick = () => {
      if (followTarget?.current) {
        // Get the world position of the selected object
        const worldPosition = new THREE.Vector3();
        followTarget.current.getWorldPosition(worldPosition);

        // Set up the camera position at an offset from the object
        const offset = new THREE.Vector3(79, 79, 79);
        const cameraPosition = worldPosition.clone().add(offset);

        // Update camera
        camera.position.copy(cameraPosition);

        // Set camera target to the object's position
        if (camera.target) {
          camera.target.copy(worldPosition);
        }
        // Make camera and orbit controls look at the object
        camera.lookAt(worldPosition);
        if (window.orbitControls) {
          window.orbitControls.target.copy(worldPosition);
          window.orbitControls.update();
        }
      }
    };
    const handleColorPick = (color) => {
      console.log('Color picked:', color); // Add debug log
      onLineColorChange?.(color); // Ensure we call the prop function
      closeColorPicker(pickerId);
    };

    const tools = [
      {
        name: 'header',
        icon: 'H',
        active: showHeader,
        onClick: () => {
          console.log('Header button clicked');
          onHeaderToggle?.();
        },
      },

      {
        name: 'transform',
        icon: '✥',
        active: showTransform,
        onClick: () => onTransformToggle?.(),
      },
      // Added Resize Button
      {
        name: 'resize',
        icon: '↔',
        active: false, // Optional: manage active state if needed
        onClick: () => {
          console.log('Resize button clicked');
          onResizeToggle?.();
        },
      },
      { name: 'code', icon: '</>', active: false, disabled: !hasCode,
        onClick: () => {
          console.log('Code button clicked');
          onCodeToggle?.();
        },
      },
      { name: 'color', icon: '🎨' }, // <-- New color tool
      {
        name: 'eye',
        icon: '👁', // <-- Eye icon
        onClick: handleEyeClick, // <-- Added eye tool handler
      },
      {
        name: 'delete',
        icon: '🗑️', // <-- Add delete button with trash icon
        onClick: () => {
          if (window.confirm('Are you sure you want to delete this object?')) {
            onDelete?.();
          }
        },
      },
    ];
    const handleToolClick = (tool) => {
      switch (tool.name) {
        case 'transform':
          onTransformToggle();
          break;
        case 'header':
          onHeaderToggle();
          break;
        case 'resize':
          onResizeToggle();
          break;
        case 'code':
          onCodeToggle?.();
          break;
        case 'color':
          console.log('Opening color picker with pickerId:', pickerId);
          openColorPicker(pickerId, 'object-ui');
          break;
      }
    };
    return (
      <group ref={groupRef}>
        {' '}
        <Html
          center
          className="object-ui-container"
          style={{
            pointerEvents: 'auto',
            transform: 'translate3d(-50%, -150%, 0)', // Move UI up by 150% like FaceUI
            background: 'transparent',
            zIndex: 999999,
          }}
        >
          {' '}
          <div
            className="object-ui-content"
            onClick={(e) => e.stopPropagation()}
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
                className={`face-tool-button ${
                  tool.active ? 'active-tool' : ''
                } ${tool.disabled ? 'tool-disabled' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (tool.disabled) return;
                  if (tool.onClick) {
                    tool.onClick();
                  } else {
                    console.log(`${tool.name} button clicked`);
                    handleToolClick(tool);
                  }
                }}
                style={
                  tool.active
                    ? {
                        backgroundColor: '#4CAF50',
                        color: 'white',
                      }
                    : tool.disabled
                    ? {
                        opacity: 0.4,
                        cursor: 'not-allowed',
                      }
                    : {}
                }
                title={tool.disabled ? 'No code associated with this object' : tool.name}
              >
                {tool.icon}
              </button>
            ))}{' '}
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
                pickerId={pickerId}
                onColorSelect={handleColorPick}
                onClose={() => closeColorPicker(pickerId)}
              />
            </div>
          )}
        </Html>{' '}
      </group>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Only re-render if critical props change
    return (
      prevProps.showTransform === nextProps.showTransform &&
      prevProps.showHeader === nextProps.showHeader &&
      prevProps.followTarget === nextProps.followTarget &&
      prevProps.hasCode === nextProps.hasCode
    );
  }
);

ObjectUI.displayName = 'ObjectUI';

export default ObjectUI;
