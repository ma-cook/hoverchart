import { TransformControls as DreiTransform } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

const TransformControls = ({ object, onDrag }) => {
  const { camera, gl, scene, invalidate } = useThree();

  if (!object) return null;

  return (
    <DreiTransform
      object={object}
      camera={camera}
      domElement={gl.domElement}
      mode="translate"
      space="world"
      size={1}
      onObjectChange={(e) => {
        if (onDrag && e.target.object) {
          onDrag(e.target.object.position);
          invalidate();
        }
      }}
      onChange={invalidate}
      onMouseDown={() => {
        const controls = scene.userData.controls;
        if (controls) controls.enabled = false;
      }}
      onMouseUp={() => {
        const controls = scene.userData.controls;
        if (controls) controls.enabled = true;
      }}
    />
  );
};

export default TransformControls;
