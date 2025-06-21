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
      onBorderChange,
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
        {' '}
        <Html
          ref={ref} // Changed from menuRef to ref
          onClick={handleUIClick}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
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

            {showColorPicker && (
              <ColorPicker
                onColorSelect={(color) => {
                  onBorderChange({ type: 'color', value: color });
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
  // Custom comparison function for React.memo
  // Only re-render if critical props change
  return (
    prevProps.id === nextProps.id &&
    prevProps.textStyle === nextProps.textStyle &&
    prevProps.followTarget === nextProps.followTarget &&
    prevProps.showTransform === nextProps.showTransform &&
    prevProps.showResizeArrow === nextProps.showResizeArrow
  );
});
