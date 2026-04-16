import { useMemo } from 'react';
import * as THREE from 'three';
import useObjectsStore from '../stores/objectsStore';
import { computeGridLayout } from '../services/repoContainerService';
import { TASK_STATUS } from '../services/pipelineTaskService';

const BASE_COLOR = new THREE.Color('#4a9eff');
const GRID_OPACITY = 0.35;
const GRID_CELL_PADDING = 5;

/**
 * Renders a wireframe grid inside each repo container.
 * 2D grid on the front face when only active tasks exist;
 * 3D grid with depth layers when merged tasks are present.
 * Visual style inspired by PerspectiveGrid (lineSegments + ShaderMaterial).
 */
export default function RepoGrid() {
  const objects = useObjectsStore((s) => s.objects) || [];

  const containers = useMemo(
    () => objects.filter((o) => o.merfolkData?.isRepoContainer),
    [objects]
  );

  const gridData = useMemo(() => {
    return containers.map((container) => {
      const slug = container.merfolkData?.repoSlug;
      const tasks = objects.filter(
        (o) => o.merfolkData?.planTaskIndex != null && o.merfolkData?.repoSlug === slug
      );
      const activeCount = tasks.filter((t) => t.merfolkData?.status !== TASK_STATUS.MERGED).length;
      const mergedCount = tasks.filter((t) => t.merfolkData?.status === TASK_STATUS.MERGED).length;
      const layout = computeGridLayout(activeCount, mergedCount);

      return {
        id: container.id,
        position: container.position,
        scale: container.scale,
        layout,
        hasMerged: mergedCount > 0,
      };
    });
  }, [containers, objects]);

  return (
    <>
      {gridData.map((data) => (
        <RepoGridLines key={data.id} {...data} />
      ))}
    </>
  );
}

function RepoGridLines({ position, scale, layout, hasMerged }) {
  const { geometry, material } = useMemo(() => {
    const { cols, totalRows, totalLayers } = layout;
    const halfW = scale[0] * 5;
    const halfH = scale[1] * 5;
    const halfD = scale[2] * 5;
    const pad = GRID_CELL_PADDING;

    const minX = position[0] - halfW + pad;
    const maxX = position[0] + halfW - pad;
    const minY = position[1] - halfH + pad;
    const maxY = position[1] + halfH - pad;
    const minZ = position[2] - halfD + pad;
    const maxZ = position[2] + halfD - pad;

    const usableD = maxZ - minZ;
    const layerCount = hasMerged ? totalLayers : 1;
    const positions = [];
    const alphas = [];

    // Build grid lines for each layer
    for (let li = 0; li < layerCount; li++) {
      let z;
      if (layerCount <= 1) {
        z = maxZ; // front face only
      } else {
        const layerSpacing = usableD / totalLayers;
        z = maxZ - layerSpacing * (li + 0.5);
      }

      // Horizontal grid lines (rows) on this layer
      for (let r = 0; r <= totalRows; r++) {
        const y = maxY - ((maxY - minY) / totalRows) * r;
        positions.push(minX, y, z, maxX, y, z);
        alphas.push(GRID_OPACITY, GRID_OPACITY);
      }

      // Vertical grid lines (columns) on this layer
      for (let c = 0; c <= cols; c++) {
        const x = minX + ((maxX - minX) / cols) * c;
        positions.push(x, minY, z, x, maxY, z);
        alphas.push(GRID_OPACITY, GRID_OPACITY);
      }
    }

    // If 3D (merged tasks exist), add depth lines connecting front and back layers
    if (hasMerged && layerCount > 1) {
      const frontLayerSpacing = usableD / totalLayers;
      const frontZ = maxZ - frontLayerSpacing * 0.5;
      const backZ = maxZ - frontLayerSpacing * (layerCount - 0.5);

      // Connect grid intersection points from front to back
      for (let r = 0; r <= totalRows; r++) {
        for (let c = 0; c <= cols; c++) {
          const x = minX + ((maxX - minX) / cols) * c;
          const y = maxY - ((maxY - minY) / totalRows) * r;
          positions.push(x, y, frontZ, x, y, backZ);
          alphas.push(GRID_OPACITY, GRID_OPACITY * 0.5);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('aAlpha', new THREE.Float32BufferAttribute(alphas, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: BASE_COLOR },
      },
      vertexShader: /* glsl */ `
        attribute float aAlpha;
        varying float vAlpha;
        void main() {
          vAlpha = aAlpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          gl_FragColor = vec4(uColor, vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
    });

    return { geometry: geo, material: mat };
  }, [position, scale, layout, hasMerged]);

  return <lineSegments geometry={geometry} material={material} />;
}
