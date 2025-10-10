import React from 'react';
import { Html } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import ColorPicker from './ColorPicker';
import { useColorPickerStore, useFaceStore } from '../stores';
import * as THREE from 'three';

const FaceUI = React.memo(
  ({
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
    onScreenShareToggle, // Add screen share toggle handler
    onImageUpload, // Add image upload handler
    webcamActive = false, // Add webcam state
    screenShareActive = false, // Add screen share state
    isBroadcasting = false, // Add broadcasting state
    isScreenSharing = false, // Add screen sharing state
  }) => {
    // Get menu state from store
    const faceId = face?.id || 'default';
    const faceState = useFaceStore((state) => state.getFace(faceId));
    const showBorderMenu = faceState?.showBorderMenu || false;
    const isBorderColor = faceState?.isBorderColor || false;
    const setShowBorderMenu = useFaceStore((state) => state.setShowBorderMenu);
    const toggleBorderMenu = useFaceStore((state) => state.toggleBorderMenu);
    const setIsBorderColor = useFaceStore((state) => state.setIsBorderColor);

    const groupRef = useRef();
    const lastPosition = useRef(null);
    // Use color picker store
    const openColorPicker = useColorPickerStore(
      (state) => state.openColorPicker
    );
    const closeColorPicker = useColorPickerStore(
      (state) => state.closeColorPicker
    );
    const pickerId = `face-ui-${face?.id || 'default'}`;
    // Make color picker visibility reactive to store changes
    const showColorPicker = useColorPickerStore((state) =>
      state.isColorPickerOpen(pickerId)
    );
    useFrame(({ camera }) => {
      if (groupRef.current && followTarget?.current) {
        // Throttle updates for performance
        if (
          !groupRef.current._lastFaceUIUpdate ||
          Date.now() - groupRef.current._lastFaceUIUpdate > 16
        ) {
          // ~60fps throttle
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
          groupRef.current._lastFaceUIUpdate = Date.now();
        }
      }
    });

    const handleBorderStyleClick = (style) => {
      onBorderToggle?.({ type: 'style', value: style });
      setShowBorderMenu(faceId, false);
    };
    const handleBorderColorClick = (e) => {
      e.stopPropagation();
      setIsBorderColor(faceId, true);
      openColorPicker(pickerId, 'border-color');
    };

    const handleLineThicknessClick = (e) => {
      e.stopPropagation();
      onBorderToggle?.({ type: 'thickness' });
    };
    const handleColorSelect = (color) => {
      if (isBorderColor) {
        // Pass color directly to parent for border color change
        onBorderToggle?.({ type: 'color', value: color });
        setIsBorderColor(faceId, false);
        setShowBorderMenu(faceId, false);
      } else {
        onColorChange?.(color, face);
      }
      closeColorPicker(pickerId);
    };

    // Create base tools array
    const baseTools = [
      { name: 'text', icon: 'T' },
      { name: 'arrow', icon: '↗' },
      { name: 'paint', icon: '🎨' },
      { name: 'opacity', icon: '○' },
    ]; // Add transform, resize, border, webcam, screen share, image upload, and delete tools conditionally
    const tools = isPlane
      ? [
          ...baseTools,
          { name: 'transform', icon: '✥' },
          { name: 'resize', icon: '↔' }, // Add resize button
          { name: 'border', icon: '▢' }, // Add border tool for planes
          { name: 'image', icon: '🖼️' }, // Add image upload button
          {
            name: 'webcam',
            icon: isBroadcasting ? `📹` : '📹', // Show viewer count if broadcasting
            active: webcamActive, // Show active state
          },
          {
            name: 'screenshare',
            icon: isScreenSharing ? `🖥️` : '🖥️', // Screen share icon
            active: screenShareActive, // Show active state
          },
          { name: 'delete', icon: '🗑️' }, // Add delete tool for planes
        ]
      : baseTools;

    // Add eye tool for planes
    if (isPlane) {
      tools.push({
        name: 'eye',
        icon: '👁',
        onClick: (e) => {
          e.stopPropagation();
          if (followTarget?.current && window.cameraRef) {
            // Get the world position of the plane
            const worldPosition = new THREE.Vector3();
            followTarget.current.getWorldPosition(worldPosition);
            // Move camera to offset position
            const offset = new THREE.Vector3(20, 20, 20);
            const cameraPosition = worldPosition.clone().add(offset);
            window.cameraRef.camera.position.copy(cameraPosition);
            window.cameraRef.camera.lookAt(worldPosition);
            // Set OrbitControls target using setTarget method
            if (window.cameraRef.setTarget) {
              window.cameraRef.setTarget(worldPosition);
            }
          }
        },
      });
    }

    const handleToolClick = (tool, e) => {
      e.stopPropagation();
      switch (tool.name) {
        case 'paint':
          openColorPicker(pickerId, 'face-color');
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
          toggleBorderMenu(faceId);
          closeColorPicker(pickerId);
          break;
        case 'image': {
          // Handle image upload
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
              onImageUpload?.(file);
            }
          };
          input.click();
          break;
        }
        case 'webcam': // Handle webcam toggle
          onWebcamToggle?.();
          break;
        case 'screenshare': // Handle screen share toggle
          onScreenShareToggle?.();
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this object?')) {
            onDelete?.();
          }
          break;
      }
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
                className={`face-tool-button ${
                  tool.active ? 'active-tool' : ''
                }`}
                onClick={(e) =>
                  tool.onClick ? tool.onClick(e) : handleToolClick(tool, e)
                }
                style={
                  tool.active
                    ? {
                        backgroundColor:
                          tool.name === 'webcam' && isBroadcasting
                            ? '#ff4444'
                            : tool.name === 'screenshare' && isScreenSharing
                            ? '#4444ff'
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
                    : tool.name === 'screenshare'
                    ? screenShareActive
                      ? isScreenSharing
                        ? 'Stop Screen Share'
                        : 'Disable Screen Share'
                      : 'Share Screen'
                    : tool.name === 'image'
                    ? 'Upload Image'
                    : tool.name === 'eye'
                    ? 'Look at this object'
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
                  closeColorPicker(pickerId);
                  setIsBorderColor(faceId, false);
                  setShowBorderMenu(faceId, false);
                }}
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
      prevProps.position === nextProps.position &&
      prevProps.face === nextProps.face &&
      prevProps.isPlane === nextProps.isPlane &&
      prevProps.followTarget === nextProps.followTarget &&
      prevProps.webcamActive === nextProps.webcamActive &&
      prevProps.screenShareActive === nextProps.screenShareActive &&
      prevProps.isBroadcasting === nextProps.isBroadcasting &&
      prevProps.isScreenSharing === nextProps.isScreenSharing
    );
  }
);

FaceUI.displayName = 'FaceUI';

export default FaceUI;
