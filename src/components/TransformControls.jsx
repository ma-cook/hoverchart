import React, { useEffect } from 'react';
import { TransformControls as DreiTransform } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

const TransformControls = ({ object, onDrag }) => {
  const { camera, scene } = useThree();

  useEffect(() => {
    const orbitControls = scene?.orbitControls;
    if (!orbitControls) return;

    const handleTransformStarting = () => {
      orbitControls.enabled = false;
    };

    const handleTransformEnded = () => {
      orbitControls.enabled = true;
    };

    // Cleanup orbit controls state when component unmounts
    return () => {
      if (orbitControls) {
        orbitControls.enabled = true;
      }
    };
  }, [scene]);

  if (!object) return null;

  return (
    <DreiTransform
      object={object}
      mode="translate"
      camera={camera}
      onMouseDown={(e) => {
        if (scene.orbitControls) {
          scene.orbitControls.enabled = false;
        }
      }}
      onMouseUp={(e) => {
        if (scene.orbitControls) {
          scene.orbitControls.enabled = true;
        }
      }}
      onObjectChange={(e) => {
        if (onDrag) {
          requestAnimationFrame(() => {
            onDrag(e.target.object.position);
          });
        }
      }}
    />
  );
};

export default TransformControls;
