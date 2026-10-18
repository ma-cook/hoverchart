import { useFrame } from '@react-three/fiber';
import { bulkImportState } from '../utils/bulkImportState';
import { cubeTransformMap } from './GlobalCubeEdgesRenderer';
import { dodecahedronTransformMap } from './GlobalDodecahedronEdgesRenderer';
import { octahedronTransformMap } from './GlobalOctahedronEdgesRenderer';
import { tetrahedronTransformMap } from './GlobalTetrahedronEdgesRenderer';

const _meshes = new Set();

// Bumped whenever a header mounts/unmounts so the manager applies the pending
// transform even while the camera is stationary (e.g. on initial load).
let _dirty = false;

export function registerHeaderBillboardMesh(meshRef) {
  _meshes.add(meshRef);
  _dirty = true;
  return () => {
    _meshes.delete(meshRef);
    _dirty = true;
  };
}

// Cache the last camera pose so the per-header loop can be skipped entirely
// while the scene is idle (no camera motion, no active drag transforms). This
// is the dominant idle-CPU win: headers only need to re-billboard when either
// the camera or a followed object actually moves.
let _lastX = Infinity;
let _lastY = Infinity;
let _lastZ = Infinity;
let _lastQx = Infinity;
let _lastQy = Infinity;
let _lastQz = Infinity;
let _lastQw = Infinity;

const _anyActiveTransform = () =>
  cubeTransformMap.size > 0 ||
  dodecahedronTransformMap.size > 0 ||
  octahedronTransformMap.size > 0 ||
  tetrahedronTransformMap.size > 0;

const HeaderBillboardManager = () => {
  useFrame(({ camera }) => {
    if (_meshes.size === 0) return;

    // During a bulk import the camera is typically idle; running the loop
    // every frame while thousands of meshes mount is pure waste.
    if (bulkImportState.active) return;

    const p = camera.position;
    const q = camera.quaternion;
    const cameraMoved =
      p.x !== _lastX ||
      p.y !== _lastY ||
      p.z !== _lastZ ||
      q.x !== _lastQx ||
      q.y !== _lastQy ||
      q.z !== _lastQz ||
      q.w !== _lastQw;

    // Skip while idle: camera static, no pending header mounts/unmounts, and
    // nothing is being dragged.
    if (!cameraMoved && !_dirty && !_anyActiveTransform()) return;
    _dirty = false;

    _lastX = p.x;
    _lastY = p.y;
    _lastZ = p.z;
    _lastQx = q.x;
    _lastQy = q.y;
    _lastQz = q.z;
    _lastQw = q.w;

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
