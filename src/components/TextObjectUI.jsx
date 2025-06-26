import React from 'react';
import { Html } from '@react-three/drei';
import { useRef, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { TextStyleUIContent } from './TextStyleUI';
import * as THREE from 'three';
import ColorPicker from './ColorPicker';
import { useColorPickerStore } from '../stores';

const TextObjectUI = forwardRef(
  (
    {
      id, // Add id prop
      textStyle = {}, // Add textStyle prop
      onStyleChange,
      followTarget,
      onTransformToggle,
      onResizeToggle,
      onResizeStart, // Add these new props
      onResizeEnd, // Add these new props
      onDelete,
    },
    ref
  ) => {
    const groupRef = useRef();
    const lastPosition = useRef(null);

    // Use color picker store
    const isColorPickerOpen = useColorPickerStore(
      (state) => state.isColorPickerOpen
    );
    const closeColorPicker = useColorPickerStore(
      (state) => state.closeColorPicker
    );
    const pickerId = `text-object-ui-${id || 'default'}`;
    const showColorPicker = isColorPickerOpen(pickerId);

    // Add click handler to prevent clicks from propagating
    const handleUIClick = (e) => {
      e.stopPropagation();
    };

    // Add handler for resize toggle
    const handleResizeToggle = () => {
      // This will activate the drei transform controls for scaling
      onResizeToggle?.();
    };

    // Add eye button to the UI menu
    const handleEyeClick = (e) => {
      e.stopPropagation();
      if (followTarget?.current && window.cameraRef) {
        // Get the world position of the text object
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
    };

    useFrame(({ camera }) => {
      if (groupRef.current && followTarget?.current) {
        const targetPos = followTarget.current.position;
        const verticalOffset = 6; // Increased upward offset
        // Use global up vector instead of camera.up
        const newPos = targetPos
          .clone()
          .add(new THREE.Vector3(0, verticalOffset, 0));

        if (
          !lastPosition.current ||
          lastPosition.current.distanceTo(newPos) > 0.001
        ) {
          groupRef.current.position.copy(newPos);
          lastPosition.current = newPos.clone();
        }
        groupRef.current.quaternion.copy(camera.quaternion);
      }
    });

    return (
      <group ref={groupRef}>
        <Html
          ref={ref}
          onClick={handleUIClick}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            // Pause orbit controls when interacting with UI
            if (window.orbitControls) {
              window.orbitControls.enabled = false;
            }
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            e.preventDefault();
            // Re-enable orbit controls after UI interaction
            if (window.orbitControls) {
              window.orbitControls.enabled = true;
            }
          }}
          style={{
            pointerEvents: 'auto',
            transform: 'translate3d(-50%, -150%, 0)',
            background: 'transparent',
            zIndex: 999999,
          }}
          center
          className="face-ui-container"
          renderOrder={999}
          onResizeStart={onResizeStart} // Add resize handlers
          onResizeEnd={onResizeEnd} // Add resize handlers
        >
          <div
            className="face-ui-content"
            onMouseDown={(e) => {
              e.stopPropagation();
              // Pause orbit controls when clicking on UI buttons
              if (window.orbitControls) {
                window.orbitControls.enabled = false;
              }
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              // Re-enable orbit controls after clicking UI buttons
              if (window.orbitControls) {
                window.orbitControls.enabled = true;
              }
            }}
            style={{
              display: 'flex',
              gap: '4px',
              alignItems: 'center',
              padding: '4px',
              background: 'white',
              borderRadius: '4px',
            }}
          >
            <TextStyleUIContent
              uiType="textObject"
              textStyle={textStyle}
              onStyleChange={onStyleChange}
              onTransformToggle={onTransformToggle} // Pass down the transform toggle prop
              onResizeToggle={handleResizeToggle} // Use our local handler
              onDelete={onDelete} // Pass the delete handler
            />
            {/* Eye button for camera look-at */}
            <button
              className="face-tool-button"
              title="Look at this object"
              onClick={handleEyeClick}
              style={{ marginLeft: 4 }}
            >
              👁
            </button>
            {showColorPicker && (
              <ColorPicker
                onColorSelect={(color) => {
                  onStyleChange({ color }); // Fix: use onStyleChange instead of onBorderChange
                  closeColorPicker(pickerId);
                }}
                onClose={() => closeColorPicker(pickerId)}
              />
            )}
          </div>
        </Html>
      </group>
    );
  }
);

TextObjectUI.displayName = 'TextObjectUI'; // Add display name for dev tools

export default React.memo(TextObjectUI, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.id === nextProps.id &&
    prevProps.textStyle === nextProps.textStyle &&
    prevProps.followTarget === nextProps.followTarget &&
    prevProps.onTransformToggle === nextProps.onTransformToggle &&
    prevProps.onResizeToggle === nextProps.onResizeToggle &&
    prevProps.onStyleChange === nextProps.onStyleChange &&
    prevProps.onDelete === nextProps.onDelete
  );
});
