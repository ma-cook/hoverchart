import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * A 3D connected cube-grid lattice.
 * – Uniform cell size on all axes (true cubes).
 * – Extends well above the camera and far into the distance.
 * – Fades to transparent toward the left edge, the bottom edge,
 *   and into the far distance (per-vertex alpha via ShaderMaterial).
 */

// Uniform cube cell size
const CELL = 40;

// Grid node counts
const NX = 8;   // left → right
const NY = 12;  // bottom → top
const NZ = 18;  // near → far

// Grid origin = bottom-left-near corner
// Camera sits at (0, 0, 600), looking toward -Z
const X_MIN = -((NX - 15) * CELL) / 2;   // center grid horizontally on camera
const Y_MIN = -220;                       // below camera (fades here)
const Z_NEAR = 595;                      // just in front of camera
// Z_FAR computed: Z_NEAR - (NZ-1)*CELL  ≈ -85

// How many cells from each boundary the fade covers
const FADE_LEFT   = 3;
const FADE_RIGHT  = 3;
const FADE_BOTTOM = 3;
const FADE_FAR    = 8;

// Base line colour (light grey)
const BASE = new THREE.Color('#c9ced4');

export default function PerspectiveGrid() {
  const { geometry, material } = useMemo(() => {
    const positions = [];
    const rgbaColors = [];

    // Build node array with per-node alpha
    const nodes = [];
    for (let iz = 0; iz < NZ; iz++) {
      for (let iy = 0; iy < NY; iy++) {
        for (let ix = 0; ix < NX; ix++) {
          const x = X_MIN + ix * CELL;
          const y = Y_MIN + iy * CELL;
          const z = Z_NEAR - iz * CELL;

          // Fade factors (0 = invisible, 1 = fully visible)
          const leftFade   = Math.min(1, ix / FADE_LEFT);
          const rightFade  = Math.min(1, (NX - 1 - ix) / FADE_RIGHT);
          const bottomFade = Math.min(1, iy / FADE_BOTTOM);
          const farFade    = Math.min(1, (NZ - 1 - iz) / FADE_FAR);

          const alpha = leftFade * rightFade * bottomFade * farFade;
          nodes.push({ x, y, z, alpha });
        }
      }
    }

    const idx = (ix, iy, iz) => iz * (NY * NX) + iy * NX + ix;

    const addEdge = (a, b) => {
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      rgbaColors.push(
        BASE.r, BASE.g, BASE.b, a.alpha,
        BASE.r, BASE.g, BASE.b, b.alpha,
      );
    };

    // Connect adjacent nodes along X, Y, Z
    for (let iz = 0; iz < NZ; iz++) {
      for (let iy = 0; iy < NY; iy++) {
        for (let ix = 0; ix < NX; ix++) {
          const n = nodes[idx(ix, iy, iz)];
          if (ix < NX - 1) addEdge(n, nodes[idx(ix + 1, iy, iz)]);
          if (iy < NY - 1) addEdge(n, nodes[idx(ix, iy + 1, iz)]);
          if (iz < NZ - 1) addEdge(n, nodes[idx(ix, iy, iz + 1)]);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('aColor', new THREE.Float32BufferAttribute(rgbaColors, 4));

    const mat = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        attribute vec4 aColor;
        varying vec4 vColor;
        void main() {
          vColor = aColor;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec4 vColor;
        void main() {
          gl_FragColor = vColor;
        }
      `,
      transparent: true,
      depthWrite: false,
    });

    return { geometry: geo, material: mat };
  }, []);

  return <lineSegments geometry={geometry} material={material} renderOrder={-1} />;
}
