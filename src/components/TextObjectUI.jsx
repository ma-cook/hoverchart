import { Html } from '@react-three/drei';
import { useRef, useState, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { TextStyleUIContent } from './TextStyleUI';
import * as THREE from 'three';
import ColorPicker from './ColorPicker';

const TextObjectUI = forwardRef(
  (
    {
      onStyleChange,
      onBorderChange,
      followTarget,
      menuRef,
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
    const [showBorderMenu, setShowBorderMenu] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

    // Handle delete with confirmation
    const handleDeleteClick = () => {
      if (window.confirm('Are you sure you want to delete this text object?')) {
        onDelete?.();
      }
    };

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
        <Html
          ref={ref} // Changed from menuRef to ref
          onClick={handleUIClick}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          style={{
            background: 'black',
            padding: '4px',
            borderRadius: '1px',
            pointerEvents: 'auto',
            zIndex: 999999,
            transform: 'translate(-50%, -100%)',
          }}
          center
          className="object-ui-container"
          renderOrder={999}
          onResizeStart={onResizeStart} // Add resize handlers
          onResizeEnd={onResizeEnd} // Add resize handlers
        >
          <div className="object-ui-content">
            <TextStyleUIContent
              uiType="textObject"
              onStyleChange={onStyleChange}
              onTransformToggle={onTransformToggle} // Pass down the transform toggle prop
              onResizeToggle={handleResizeToggle} // Use our local handler
            />

            {/* Add delete button */}
            <button
              className="ui-button"
              onClick={handleDeleteClick}
              title="Delete text object"
            >
              🗑️
            </button>

            {/* Rest of existing buttons */}
            {showBorderMenu && (
              <div className="border-menu">{/* ...existing code... */}</div>
            )}
            {showColorPicker && (
              <ColorPicker
                onColorSelect={(color) => {
                  onBorderChange({ type: 'color', value: color });
                  setShowColorPicker(false);
                }}
                onClose={() => setShowColorPicker(false)}
              />
            )}
          </div>
        </Html>
      </group>
    );
  }
);

TextObjectUI.displayName = 'TextObjectUI'; // Add display name for dev tools

export default TextObjectUI;
