import React from 'react';
import { TransformControls as DreiTransform } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

const TransformControls = ({ object, onDrag }) => {
  const { camera } = useThree();

  if (!object) return null;

  return (
    <DreiTransform
      object={object}
      mode="translate"
      camera={camera}
      space="world"
      onDragging={({ value }) => {
        const orbitControls = object?.parent?.parent?.orbitControls;
        if (orbitControls) {
          orbitControls.enabled = !value;
        }
      }}
      onChange={(event) => {
        if (onDrag && event?.target?.object?.position) {
          const pos = event.target.object.position;
          requestAnimationFrame(() => {
            onDrag(pos);
          });
        }
      }}
    />
  );
};

export default TransformControls;
