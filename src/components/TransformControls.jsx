import { TransformControls as DreiTransform } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

const TransformControls = ({ object, onDrag }) => {
  const { camera, gl, invalidate } = useThree();

  if (!object) return null;

  return (
    <DreiTransform
      object={object}
      mode="translate"
      camera={camera}
      domElement={gl.domElement}
      onObjectChange={(e) => {
        if (onDrag && e.target.object) {
          onDrag(e.target.object.position);
          invalidate();
        }
      }}
      onChange={() => {
        invalidate();
      }}
      onMouseDown={() => {
        const orbitControls = object?.parent?.parent?.orbitControls;
        if (orbitControls) orbitControls.enabled = false;
      }}
      onMouseUp={() => {
        const orbitControls = object?.parent?.parent?.orbitControls;
        if (orbitControls) orbitControls.enabled = true;
      }}
    />
  );
};

export default TransformControls;
