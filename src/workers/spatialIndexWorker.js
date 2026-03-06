/**
 * spatialIndexWorker.js
 *
 * Web Worker that offloads spatial queries from the main thread:
 *   - LOD level computation (distance-based, per object)
 *   - Frustum culling of connections (point-in-frustum for endpoints + midpoint)
 *   - Spatial containment for parent-child relationships
 *
 * The worker maintains a mirror of all object positions and metadata.
 * The main thread syncs objects whenever they change and dispatches
 * computation requests.  Results are plain serialisable values.
 *
 * Safe to run in a worker — no DOM, no stores, no Three.js.
 */

import { expose } from 'comlink';

// ---------------------------------------------------------------------------
// Object data mirror (synced from main thread)
// ---------------------------------------------------------------------------
const objectPositions = new Map(); // id (string) -> [x, y, z]
const objectScales = new Map();    // id (string) -> [sx, sy, sz]
const objectMerfolkData = new Map(); // id (string) -> { isContainer, isParent, parentId, ... }

// ---------------------------------------------------------------------------
// LOD thresholds — must match lodStore.js exactly
// ---------------------------------------------------------------------------
const LOD_CHILD_FULL_SQ = 2000 * 2000;     // 4_000_000
const LOD_CHILD_MEDIUM_SQ = 20000 * 20000;  // 400_000_000

const LOD_PARENT_FULL_SQ = 4000 * 4000;     // 16_000_000
const LOD_PARENT_MEDIUM_SQ = 20000 * 20000;  // 400_000_000

function childLOD(distanceSq) {
  if (distanceSq < LOD_CHILD_FULL_SQ) return 0;
  if (distanceSq < LOD_CHILD_MEDIUM_SQ) return 1;
  return 2;
}

function parentLOD(distanceSq) {
  if (distanceSq < LOD_PARENT_FULL_SQ) return 0;
  if (distanceSq < LOD_PARENT_MEDIUM_SQ) return 1;
  return 2;
}

// ---------------------------------------------------------------------------
// Frustum math (pure JS — no Three.js needed)
// ---------------------------------------------------------------------------

/**
 * A frustum plane is [nx, ny, nz, d].
 * A point is "inside" if dot(normal, point) + d >= 0 for ALL 6 planes.
 */
function isPointInFrustum(px, py, pz, planes) {
  for (let i = 0; i < 6; i++) {
    const p = planes[i];
    if (p[0] * px + p[1] * py + p[2] * pz + p[3] < 0) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Worker API
// ---------------------------------------------------------------------------

const workerApi = {
  /**
   * Full sync of all object data.  Called when the objects array changes.
   *
   * @param {Array<{id: string, position: number[], scale?: number[],
   *                 merfolkData?: Object}>} objects
   */
  syncObjects(objects) {
    objectPositions.clear();
    objectScales.clear();
    objectMerfolkData.clear();

    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      const id = String(obj.id);
      objectPositions.set(id, obj.position || [0, 0, 0]);
      objectScales.set(id, obj.scale || [1, 1, 1]);
      if (obj.merfolkData) {
        objectMerfolkData.set(id, obj.merfolkData);
      }
    }
  },

  /**
   * Compute LOD levels for all objects given the current camera position.
   *
   * @param {number[]} cameraPos — [x, y, z]
   * @param {string[]} parentIdList — IDs of parent objects
   * @param {string[]} childIdList — IDs that have a parent (from childParentMap)
   * @param {Array<[string, number]>} currentLodEntries — [[id, level], ...]
   * @returns {Array<[string, number]>} — only the changed entries
   */
  computeLODLevels(cameraPos, parentIdList, childIdList, currentLodEntries) {
    const cx = cameraPos[0];
    const cy = cameraPos[1];
    const cz = cameraPos[2];

    const parentIds = new Set(parentIdList);
    // Build a fast lookup for current levels
    const currentMap = new Map(currentLodEntries);

    const updates = [];

    for (const [id, pos] of objectPositions) {
      // Skip grouping containers — they always stay at full detail
      const meta = objectMerfolkData.get(id);
      if (meta && meta.isContainer === true) continue;

      const dx = cx - (pos[0] || 0);
      const dy = cy - (pos[1] || 0);
      const dz = cz - (pos[2] || 0);
      const distanceSq = dx * dx + dy * dy + dz * dz;

      const isParent = parentIds.has(id);
      const newLevel = isParent ? parentLOD(distanceSq) : childLOD(distanceSq);

      if (currentMap.get(id) !== newLevel) {
        updates.push([id, newLevel]);
      }
    }

    return updates;
  },

  /**
   * Frustum-cull connections by testing endpoint + midpoint visibility.
   *
   * @param {number[][]} frustumPlanes — 6 planes, each [nx, ny, nz, d]
   * @param {Array<{id: string, startObjId: string, endObjId: string}>} connections
   * @returns {string[]} — IDs of visible connections
   */
  frustumCullConnections(frustumPlanes, connections) {
    const visibleIds = [];

    for (let i = 0; i < connections.length; i++) {
      const conn = connections[i];
      const startPos = objectPositions.get(conn.startObjId);
      const endPos = objectPositions.get(conn.endObjId);

      // If either endpoint is missing from our mirror, include the connection
      // (safe default — don't hide things we can't test).
      if (!startPos || !endPos) {
        visibleIds.push(conn.id);
        continue;
      }

      const sx = startPos[0] || 0;
      const sy = startPos[1] || 0;
      const sz = startPos[2] || 0;
      const ex = endPos[0] || 0;
      const ey = endPos[1] || 0;
      const ez = endPos[2] || 0;

      // Visible if start, end, or midpoint is inside the frustum
      if (
        isPointInFrustum(sx, sy, sz, frustumPlanes) ||
        isPointInFrustum(ex, ey, ez, frustumPlanes) ||
        isPointInFrustum(
          (sx + ex) * 0.5,
          (sy + ey) * 0.5,
          (sz + ez) * 0.5,
          frustumPlanes
        )
      ) {
        visibleIds.push(conn.id);
      }
    }

    return visibleIds;
  },

  /**
   * Compute parent-child spatial containment.
   *
   * Finds which objects are inside which containers based on bounding-box
   * overlap and explicit merfolkData.parentId references.
   *
   * @returns {{ parentIdList: string[], relationships: Array<{parentId: string, childId: string}> }}
   */
  computeSpatialContainment() {
    const containers = [];

    for (const [id, meta] of objectMerfolkData) {
      if (meta.isContainer) {
        containers.push(id);
      }
    }

    const parentIdList = [];
    const relationships = [];

    // Also include non-container parents
    for (const [id, meta] of objectMerfolkData) {
      if (meta.isParent || meta.hasChildren) {
        parentIdList.push(id);
      }
    }

    if (containers.length === 0) {
      return { parentIdList, relationships };
    }

    // Add containers to parentIdList (deduplicated later on main thread)
    for (const cId of containers) {
      parentIdList.push(cId);
    }

    for (const containerId of containers) {
      const containerPos = objectPositions.get(containerId);
      if (!containerPos) continue;

      const containerScale = objectScales.get(containerId) || [1, 1, 1];
      const halfX = (containerScale[0] || 1) * 5 * 1.5;
      const halfY = (containerScale[1] || 1) * 5 * 1.5;
      const halfZ = (containerScale[2] || 1) * 5 * 1.5;
      const ccx = containerPos[0] || 0;
      const ccy = containerPos[1] || 0;
      const ccz = containerPos[2] || 0;

      for (const [objId, pos] of objectPositions) {
        if (objId === containerId) continue;

        // Skip other containers
        const meta = objectMerfolkData.get(objId);
        if (meta && meta.isContainer) continue;

        // Explicit parent reference
        if (meta && meta.parentId === containerId) {
          relationships.push({ parentId: containerId, childId: objId });
          continue;
        }

        // Spatial containment
        const ox = pos[0] || 0;
        const oy = pos[1] || 0;
        const oz = pos[2] || 0;
        if (
          Math.abs(ox - ccx) < halfX &&
          Math.abs(oy - ccy) < halfY &&
          Math.abs(oz - ccz) < halfZ
        ) {
          relationships.push({ parentId: containerId, childId: objId });
        }
      }
    }

    return { parentIdList, relationships };
  },
};

expose(workerApi);
