import { useFrame } from '@react-three/fiber';
import importPerf from '../utils/importPerf';

const _meshes = new Set();

export function registerHeaderBillboardMesh(meshRef) {
  _meshes.add(meshRef);
  return () => _meshes.delete(meshRef);
}

const HeaderBillboardManager = () => {
  useFrame(({ camera }) => {
    importPerf.begin('FR-hbm');
    for (const meshRef of _meshes) {
      const mesh = meshRef.current;
      if (!mesh) continue;
      const fn = mesh.userData._headerBillboard;
      if (fn) {
        fn(camera, mesh);
      }
    }
    importPerf.end('FR-hbm');
  });

  return null;
};

export default HeaderBillboardManager;
