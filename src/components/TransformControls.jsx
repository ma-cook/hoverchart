import React from 'react';
import { TransformControls as DreiTransform } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

const TransformControls = ({ object, onDrag }) => {
  const { scene, camera } = useThree();

  if (!object) return null;

  return (
    <DreiTransform
      object={object}
      mode="translate"
      camera={camera}
      onChange={() => {
        if (onDrag) {
          const position = object.position;
          onDrag({
            x: position.x,
            y: position.y,
            z: position.z,
          });
        }
      }}
      onDragging={({ value }) => {
        if (scene.orbitControls) {
          scene.orbitControls.enabled = !value;
        }
      }}
    />
  );
};

export default TransformControls;
