/**
 * spatialIndexWorker.js
 *
 * Web Worker that offloads spatial queries from the main thread:
 *   - LOD level computation (distance-based, per object)
 *   - Frustum culling of connections (point-in-frustum for endpoints + midpoint)
 *   - Code-hierarchy (merfolk) parent-child relationships
 *
 * The worker maintains a mirror of all object positions and metadata.
 * The main thread syncs objects whenever they change and dispatches
 * computation requests.  Results are plain serialisable values.
 *
 * Note: geometric "which object sits inside which container box" containment
 * was removed — group containers are excluded from the LOD system and never
 * gate their contents. Only the persisted code hierarchy (parentNodeId) is
 * used for parent-child relationships.
 *
 * Safe to run in a worker — no DOM, no stores, no Three.js.
 *
 * Performance notes
 * -----------------
 * Tier-1: Internal storage uses parallel flat Float32Array / Uint8Array
 * buffers (positionsFlat, scalesFlat, metaFlagsFlat) alongside the id→index
 * Map. This makes hot-path loops cache-friendly: distance math operates on
 * sequential f32 words instead of chasing JS array pointers.
 *
 * Tier-2: When the Rust/Wasm kernels are available, LOD distance computation
 * and frustum culling are delegated to wasm functions that benefit from
 * compiler auto-vectorisation over the contiguous float buffers.
 */

import { expose } from 'comlink';

// ---------------------------------------------------------------------------
// Wasm kernel initialisation (Tier-2 acceleration)
// ---------------------------------------------------------------------------
// We import the wasm module asynchronously.  Until it loads, all hot paths
// use pure-JS fallbacks so the worker is always functional.

let _wasmMod = null;

async function initWasm() {
  try {
    const mod = await import('../wasm/pkg/hoverchart_wasm.js');
    await mod.default();
    _wasmMod = mod;
  } catch {
    // Non-fatal — JS fallbacks are always used when wasm is unavailable
  }
}

initWasm();

// ---------------------------------------------------------------------------
// Object data mirror (synced from main thread)
// ---------------------------------------------------------------------------
// Primary id-keyed Maps — kept for position lookups.
const objectPositions = new Map(); // id (string) -> [x, y, z]
const objectMerfolkData = new Map(); // id (string) -> { isContainer, parentNodeId, ... }

// Flat parallel buffers — updated every syncObjects().
// Index order matches objectIdList.
let objectIdList = [];              // string[]
let positionsFlat = new Float32Array(0);  // N×3
let scalesFlat = new Float32Array(0);     // N×3
// metaFlagsFlat: bit0=isContainer (excluded from LOD, always FULL).
// The parent bit is gone — every non-container object uses the single child
// distance regime, so no parent classification reaches the kernel.
let metaFlagsFlat = new Uint8Array(0);    // N: per-object flags
let metaFlagsBase = new Uint8Array(0);    // clean copy — no dynamic overrides
let currentLevelsFlat = new Uint8Array(0); // N: current LOD level cache
const idToIndex = new Map();        // id -> index in flat arrays

function _rebuildFlatBuffers(objects) {
  const n = objects.length;
  objectIdList = new Array(n);
  positionsFlat = new Float32Array(n * 3);
  scalesFlat = new Float32Array(n * 3);
  metaFlagsFlat = new Uint8Array(n);
  currentLevelsFlat = new Uint8Array(n); // cleared — levels will be re-derived
  idToIndex.clear();

  for (let i = 0; i < n; i++) {
    const obj = objects[i];
    const id = String(obj.id);
    objectIdList[i] = id;
    idToIndex.set(id, i);

    const pos = obj.position || [0, 0, 0];
    const pi = i * 3;
    positionsFlat[pi] = pos[0] || 0;
    positionsFlat[pi + 1] = pos[1] || 0;
    positionsFlat[pi + 2] = pos[2] || 0;

    const scl = obj.scale || [1, 1, 1];
    scalesFlat[pi] = scl[0] || 1;
    scalesFlat[pi + 1] = scl[1] || 1;
    scalesFlat[pi + 2] = scl[2] || 1;

    const meta = obj.merfolkData;
    let flags = 0;
    if (meta) {
      // bit0 = isContainer — excluded from LOD (always full detail).
      // The previous parent bit (0x02) is gone: ALL objects now use the single
      // child distance regime, so no parent classification reaches the kernel.
      if (meta.isContainer) flags |= 0x01;
    }
    metaFlagsFlat[i] = flags;
  }

  // Save a clean copy of the flags (no dynamic parent overrides).
  // computeLODLevels resets metaFlagsFlat from this base before each call.
  metaFlagsBase = new Uint8Array(metaFlagsFlat);
}

// ---------------------------------------------------------------------------
// LOD thresholds — must match lodStore.js exactly
// ---------------------------------------------------------------------------
const LOD_CHILD_FULL_SQ = 2000 * 2000;
const LOD_CHILD_MEDIUM_SQ = 20000 * 20000;

function childLOD(distanceSq) {
  if (distanceSq < LOD_CHILD_FULL_SQ) return 0;
  if (distanceSq < LOD_CHILD_MEDIUM_SQ) return 1;
  return 2;
}

// ---------------------------------------------------------------------------
// Frustum math (pure JS fallback — no Three.js needed)
// ---------------------------------------------------------------------------

function isPointInFrustum(px, py, pz, planes) {
  for (let i = 0; i < 6; i++) {
    const off = i * 4;
    if (planes[off] * px + planes[off + 1] * py + planes[off + 2] * pz + planes[off + 3] < 0) return false;
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
   * Rebuilds both the Map-based mirror (for spatial queries) and the flat
   * Float32Array buffers (for Wasm/SIMD-friendly LOD computation).
   *
   * @param {Array<{id: string, position: number[], scale?: number[],
   *                 merfolkData?: Object}>} objects
   */
  syncObjects(objects) {
    objectPositions.clear();
    objectMerfolkData.clear();

    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      const id = String(obj.id);
      objectPositions.set(id, obj.position || [0, 0, 0]);
      if (obj.merfolkData) {
        objectMerfolkData.set(id, obj.merfolkData);
      }
    }

    // Build Tier-1 flat buffers for the LOD hot path
    _rebuildFlatBuffers(objects);
  },

  /**
   * Compute LOD levels for all objects given the current camera position.
   *
   * Uses the Rust/Wasm `compute_lod_updates` kernel when available for
   * auto-vectorised distance computation over the flat Float32Array.
   * Falls back to the scalar JS loop otherwise.
   *
   * @param {number[]} cameraPos — [x, y, z]
   * @param {string[]} _parentIdList — retained for API stability; unused (single LOD regime)
   * @param {string[]} _childIdList — retained for API stability; unused (single LOD regime)
   * @param {Array<[string, number]>} currentLodEntries — [[id, level], ...]
   * @returns {Array<[string, number]>} — only the changed entries
   */
  computeLODLevels(cameraPos, _parentIdList, _childIdList, currentLodEntries) {
    const cx = cameraPos[0];
    const cy = cameraPos[1];
    const cz = cameraPos[2];

    // Reset metaFlagsFlat to the clean base (structural flags only).
    metaFlagsFlat.set(metaFlagsBase);

    // Sync current LOD levels into the flat buffer so the wasm kernel can
    // compare against them and return only deltas.
    // Iterate the entries directly via idToIndex — no intermediate Map needed.
    for (let i = 0; i < currentLodEntries.length; i++) {
      const [id, level] = currentLodEntries[i];
      const idx = idToIndex.get(id);
      if (idx !== undefined) {
        currentLevelsFlat[idx] = level;
      }
    }

    const n = objectIdList.length;

    // --- Tier-2: Wasm kernel (preferred) ---
    if (_wasmMod) {
      try {
        const rawUpdates = _wasmMod.compute_lod_updates(
          positionsFlat,
          metaFlagsFlat,
          currentLevelsFlat,
          cx, cy, cz,
          LOD_CHILD_FULL_SQ, LOD_CHILD_MEDIUM_SQ,
          LOD_CHILD_FULL_SQ, LOD_CHILD_MEDIUM_SQ,
        );

        // rawUpdates is a Uint32Array of interleaved [index, newLevel, ...]
        const updates = [];
        for (let i = 0; i < rawUpdates.length; i += 2) {
          const idx = rawUpdates[i];
          const newLevel = rawUpdates[i + 1];
          updates.push([objectIdList[idx], newLevel]);
          // Keep local cache in sync for subsequent calls within the same sync
          currentLevelsFlat[idx] = newLevel;
        }
        return updates;
      } catch {
        // Fall through to JS path
      }
    }

    // --- Tier-1: JS path with flat buffers (cache-friendly scalar loop) ---
    const updates = [];

    for (let i = 0; i < n; i++) {
      const flags = metaFlagsFlat[i];
      if (flags & 0x01) continue; // isContainer — always full detail

      const pi = i * 3;
      const dx = cx - positionsFlat[pi];
      const dy = cy - positionsFlat[pi + 1];
      const dz = cz - positionsFlat[pi + 2];
      const distanceSq = dx * dx + dy * dy + dz * dz;

      const newLevel = childLOD(distanceSq);

      const currentLevel = currentLevelsFlat[i];
      if (newLevel !== currentLevel) {
        updates.push([objectIdList[i], newLevel]);
        currentLevelsFlat[i] = newLevel;
      }
    }

    return updates;
  },

  /**
   * Frustum-cull connections by testing endpoint + midpoint visibility.
   *
   * Delegates to the Rust/Wasm `frustum_cull_connections` kernel when
   * available.  Falls back to the scalar JS implementation otherwise.
   *
   * @param {number[][]} frustumPlanes — 6 planes, each [nx, ny, nz, d]
   * @param {Array<{id: string, startObjId: string, endObjId: string}>} connections
   * @returns {string[]} — IDs of visible connections
   */
  frustumCullConnections(frustumPlanes, connections) {
    const n = connections.length;
    if (n === 0) return [];

    // --- Tier-2: Wasm kernel path ---
    if (_wasmMod) {
      try {
        // Flatten frustum planes (6 × 4 floats) — already an array of arrays
        const planesFlat = new Float32Array(24);
        for (let p = 0; p < 6; p++) {
          const plane = frustumPlanes[p];
          const off = p * 4;
          planesFlat[off] = plane[0];
          planesFlat[off + 1] = plane[1];
          planesFlat[off + 2] = plane[2];
          planesFlat[off + 3] = plane[3];
        }

        // Build flat start / end position arrays.
        // Use NaN for missing endpoints — the Rust kernel marks those visible.
        const startPos = new Float32Array(n * 3);
        const endPos = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          const conn = connections[i];
          const sp = objectPositions.get(conn.startObjId);
          const ep = objectPositions.get(conn.endObjId);
          const pi = i * 3;
          if (sp) {
            startPos[pi] = sp[0] || 0;
            startPos[pi + 1] = sp[1] || 0;
            startPos[pi + 2] = sp[2] || 0;
          } else {
            startPos[pi] = NaN;
          }
          if (ep) {
            endPos[pi] = ep[0] || 0;
            endPos[pi + 1] = ep[1] || 0;
            endPos[pi + 2] = ep[2] || 0;
          } else {
            endPos[pi] = NaN;
          }
        }

        const visibilityFlags = _wasmMod.frustum_cull_connections(startPos, endPos, planesFlat);

        const visibleIds = [];
        for (let i = 0; i < n; i++) {
          if (visibilityFlags[i]) visibleIds.push(connections[i].id);
        }
        return visibleIds;
      } catch {
        // Fall through to JS path
      }
    }

    // --- Tier-1: Scalar JS fallback ---
    const visibleIds = [];

    for (let i = 0; i < n; i++) {
      const conn = connections[i];
      const startPos = objectPositions.get(conn.startObjId);
      const endPos = objectPositions.get(conn.endObjId);

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
   * Compute the persisted code hierarchy (merfolk) parent-child relationships.
   *
   * Resolves each object's `parentNodeId` (a stable markdown node id) to its
   * containing parent's object id. This is the ONLY source of parent-child
   * relationships the LOD gating uses — group containers are excluded from the
   * LOD system entirely and must never appear here (spatial containment of which
   * object sits inside which container box was removed; containers must not
   * gate their contents).
   *
   * @returns {{ parentIdList: string[], relationships: Array<{parentId: string, childId: string}> }}
   */
  computeMerfolkHierarchy() {
    const parentIdList = [];
    const relationships = [];

    // nodeId -> object id so the persisted `parentNodeId` (a stable markdown
    // node id) can be resolved to the containing parent's object id.
    const nodeIdToObjectId = new Map();
    for (const [id, meta] of objectMerfolkData) {
      if (meta && meta.nodeId) nodeIdToObjectId.set(meta.nodeId, id);
    }

    for (const [id, meta] of objectMerfolkData) {
      if (!meta) continue;
      // Robustness fallback: legacy objects saved with isParent/hasChildren
      // (before parentNodeId-only persistence) are still marked as parents so
      // they are never treated as gated internal members.
      if (meta.isParent || meta.hasChildren) {
        parentIdList.push(id);
      }
      let parentObjectId = meta.parentNodeId
        ? nodeIdToObjectId.get(meta.parentNodeId)
        : undefined;
      if (parentObjectId && parentObjectId !== id) {
        relationships.push({ parentId: parentObjectId, childId: id });
      }
    }

    return { parentIdList, relationships };
  },
};

expose(workerApi);

