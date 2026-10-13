import { useFrame } from '@react-three/fiber';

const _meshes = new Set();

export function registerHeaderBillboardMesh(meshRef) {
  _meshes.add(meshRef);
  return () => _meshes.delete(meshRef);
}

const HeaderBillboardManager = () => {
  useFrame(({ camera }) => {
    for (const meshRef of _meshes) {
      const mesh = meshRef.current;
      if (!mesh) continue;
      const fn = mesh.userData._headerBillboard;
      if (fn) {
        fn(camera, mesh);
      }
    }
  });

  return null;
};

export default HeaderBillboardManager;
