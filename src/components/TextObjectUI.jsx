import { Html } from '@react-three/drei';
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { TextStyleUIContent } from './TextStyleUI';
import * as THREE from 'three';
import ColorPicker from './ColorPicker';

const TextObjectUI = ({
  onStyleChange,
  onBorderChange, // Add this prop
  followTarget,
  menuRef,
  onTransformToggle,
  onResizeToggle,
}) => {
  const groupRef = useRef();
  const lastPosition = useRef(null);
  const [showBorderMenu, setShowBorderMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

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
        ref={menuRef} // added ref prop to capture the menu element
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
      >
        <div className="object-ui-content">
          <TextStyleUIContent
            uiType="textObject"
            onStyleChange={onStyleChange}
            onTransformToggle={onTransformToggle} // Pass down the transform toggle prop
            onResizeToggle={onResizeToggle} // Pass down the onResizeToggle prop
          />
          <button
            className="ui-button"
            onClick={() => setShowBorderMenu(!showBorderMenu)}
          >
            ▢
          </button>
          {showBorderMenu && (
            <div className="border-menu">
              <button
                className="border-menu-item"
                onClick={() =>
                  onBorderChange({ type: 'style', value: 'solid' })
                }
              >
                ─────
              </button>
              <button
                className="border-menu-item"
                onClick={() =>
                  onBorderChange({ type: 'style', value: 'dashed' })
                }
              >
                ── ── ──
              </button>
              <button
                className="border-menu-item"
                onClick={() =>
                  onBorderChange({ type: 'style', value: 'dotted' })
                }
              >
                ∙∙∙∙∙∙∙
              </button>
              <button
                className="border-menu-item"
                onClick={() => {
                  setShowColorPicker(true);
                  setShowBorderMenu(false);
                }}
              >
                🎨
              </button>
              <button
                className="border-menu-item"
                onClick={() => onBorderChange({ type: 'thickness' })}
                title="Toggle line thickness"
              >
                ▂▃▄
              </button>
            </div>
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
};

export default TextObjectUI;
