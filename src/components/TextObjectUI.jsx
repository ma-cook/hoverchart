import { Html } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { TextStyleUIContent } from './TextStyleUI';
import * as THREE from 'three';

const TextObjectUI = ({
  onStyleChange,
  followTarget,
  menuRef,
  onTransformToggle,
}) => {
  const groupRef = useRef();
  const lastPosition = useRef(null);

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
          borderRadius: '2px',
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
          />
          <button
            className="object-tool-button"
            style={{ alignSelf: 'center' }} // added to vertically center the button
            onClick={(e) => {
              e.stopPropagation();
              onTransformToggle && onTransformToggle();
            }}
          >
            ⇄
          </button>
        </div>
      </Html>
    </group>
  );
};

export default TextObjectUI;
