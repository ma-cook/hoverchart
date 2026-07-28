import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import useLODStore, { calculateLODLevel, calculateParentLODLevel, LOD_LEVELS, FACE_TEXT_DISTANCE_SQ } from '../stores/lodStore';
import useObjectsStore from '../stores/objectsStore';
import { shallow } from 'zustand/shallow';
import * as THREE from 'three';
import { getSpatialIndexWorker } from '../workers/spatialIndexWorkerClient';
import { getSmoothedFrameTime } from '../utils/renderWorkScheduler';

// Reusable vectors to avoid GC pressure
const _cameraPos = new THREE.Vector3();
const _objectPos = new THREE.Vector3();

// Throttle settings
const LOD_UPDATE_INTERVAL = 100; // ms between LOD updates
const CAMERA_MOVE_THRESHOLD = 10; // Only recalculate if camera moved more than this
const CAMERA_MOVE_THRESHOLD_SQ = CAMERA_MOVE_THRESHOLD * CAMERA_MOVE_THRESHOLD;

// Transition queue settings — budget how many LOD *upgrades* apply per frame
// to prevent frame-rate spikes when many objects cross thresholds simultaneously.
// Downgrades (FULL→MEDIUM, MEDIUM→LOW) are always applied immediately since
// they reduce rendering cost.
const LOD_UPGRADE_BUDGET_PER_FRAME = 1000;

// Frame-time threshold (ms) above which upgrade budget is halved.
// Prevents piling on detail when frames are already slow.
const FRAME_TIME_THROTTLE_MS = 24; // ~42fps

/**
 * LODManager Component
 * 
 * This component manages LOD (Level of Detail) for all objects.
 * It must be placed inside the Canvas context to have access to the camera.
 * 
 * LOD Levels:
 * - 0 (FULL): Full detail
 * - 1 (MEDIUM): Medium detail (no edges)
 * - 2 (LOW): Low detail (don't render)
 * 
 * Distance Thresholds:
 * - Child objects (inside containers): FULL < 10000, MEDIUM 10000-15000, LOW > 15000
 * - Parent containers: FULL < 10000, MEDIUM 10000-11000, LOW > 11000
 */
const LODManager = ({ enabled = true }) => {
  const { camera } = useThree();
  const lastUpdateTimeRef = useRef(0);
  const lastCameraPositionRef = useRef(new THREE.Vector3());
  const initializedRef = useRef(false);
  const needsImmediateUpdateRef = useRef(false);
  const prevObjectCountRef = useRef(0);

  // Transition queue: Map<objectId, { level, distanceSq }>.
  // Holds pending LOD upgrades that will be drained at a budgeted rate per frame.
  const upgradeQueueRef = useRef(new Map());
  
  // Get objects from store — shallow equality avoids re-renders on
  // individual object property changes (position moves, text edits, etc.)
  const objects = useObjectsStore((state) => state.objects, shallow);
  
  // PERFORMANCE: Select only reactive LOD state with shallow equality —
  // avoids re-renders when _lodVersion bumps (which happens on every LOD update).
  const { 
    lodEnabled,
  } = useLODStore(
    (s) => ({
      lodEnabled: s.lodEnabled,
    }),
    shallow
  );

  // Actions are stable — read once from getState(), no subscription needed.
  const {
    batchSetLODLevels,
    batchRegisterParentChild,
    batchRegisterParents,
    setLODEnabled,
    clearLODData,
    batchSetFaceTextVisible,
  } = useLODStore.getState();
  
  // Enable/disable LOD based on prop
  useEffect(() => {
    setLODEnabled(enabled);
  }, [enabled, setLODEnabled]);
  
  // Keep a ref to the latest objects so effects can read it without being triggered by position changes
  const objectsRef = useRef(objects);
  useEffect(() => {
    objectsRef.current = objects;
    // When new objects arrive, force an immediate LOD pass so they don't
    // stay at full detail until the camera moves.
    if (objects && objects.length !== prevObjectCountRef.current) {
      prevObjectCountRef.current = objects.length;
      if (initializedRef.current) {
        needsImmediateUpdateRef.current = true;
      }
    }
  }, [objects]);

  // WORKER: Sync objects to the spatial index worker whenever they change.
  // Also request spatial containment computation (replaces the O(N²) loop below).
  const workerBusyRef = useRef(false);
  const workerSyncedRef = useRef(false);

  useEffect(() => {
    if (!objects || objects.length === 0) return;

    // Serialise just the data the worker needs
    const serialised = objects.map(obj => ({
      id: String(obj.id),
      position: obj.position || [0, 0, 0],
      scale: obj.scale || [1, 1, 1],
      merfolkData: obj.merfolkData || null,
    }));

    const worker = getSpatialIndexWorker();
    worker.syncObjects(serialised).then(() => {
      workerSyncedRef.current = true;
    }).catch(() => { /* worker unavailable — sync fallback will run */ });
  }, [objects]);

  // Stable key that only changes when container STRUCTURE changes (not positions/scales).
  // This prevents the O(N²) spatial containment scan from re-running on every object move.
  const containersKey = useMemo(() => {
    if (!objects || objects.length === 0) return '';
    const containerParts = objects
      .filter(obj => obj.merfolkData?.isContainer || obj.merfolkData?.isParent || obj.merfolkData?.parentId)
      .map(obj => `${obj.id}:${obj.merfolkData?.parentId || 'root'}`)
      .sort()
      .join('|');
    // Include objects.length so the effect re-runs when objects load,
    // even if none have container metadata (containersKey would stay '' otherwise)
    return `${objects.length}:${containerParts}`;
  }, [objects]);

  // Initialize parent-child relationships when container STRUCTURE changes.
  // Tries the worker first (off-main-thread O(N×containers) scan), falls back
  // to sync computation if the worker hasn't synced yet.
  useEffect(() => {
    const objects = objectsRef.current;
    if (!objects || objects.length === 0) {
      return;
    }

    // --- Try worker path first ---
    if (workerSyncedRef.current) {
      const worker = getSpatialIndexWorker();
      worker.computeSpatialContainment().then(({ parentIdList, relationships }) => {
        if (parentIdList.length > 0) {
          // Deduplicate parentIdList
          batchRegisterParents([...new Set(parentIdList)]);
        }
        if (relationships.length > 0) {
          batchRegisterParentChild(relationships);
        }
        initializedRef.current = true;
        needsImmediateUpdateRef.current = true;
      }).catch(() => {
        // Worker failed — fall through to sync path
        computeContainmentSync(objects);
      });
      return;
    }

    // --- Sync fallback (identical to original logic) ---
    computeContainmentSync(objects);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containersKey, batchRegisterParentChild, batchRegisterParents]);

  // Extracted sync containment logic for fallback
  const computeContainmentSync = useCallback((objects) => {
    const relationships = [];
    const parentIdList = [];

    const containers = objects.filter(obj => obj.merfolkData?.isContainer);

    for (const container of containers) {
      parentIdList.push(container.id);
    }

    if (containers.length === 0) {
      for (const obj of objects) {
        if (obj.merfolkData?.isParent || obj.merfolkData?.hasChildren) {
          parentIdList.push(obj.id);
        }
      }
      if (parentIdList.length > 0) {
        batchRegisterParents(parentIdList);
      }
      initializedRef.current = true;
      return;
    }

    for (const container of containers) {
      const containerId = container.id;
      const containerPos = container.position || [0, 0, 0];
      const containerScale = container.scale || [1, 1, 1];
      const halfSize = [
        (containerScale[0] || 1) * 5 * 1.5,
        (containerScale[1] || 1) * 5 * 1.5,
        (containerScale[2] || 1) * 5 * 1.5,
      ];

      for (const obj of objects) {
        if (obj.merfolkData?.isContainer || obj.id === containerId) continue;
        if (obj.merfolkData?.parentId === containerId) {
          relationships.push({ parentId: containerId, childId: obj.id });
          continue;
        }
        const objPos = obj.position;
        if (!objPos) continue;
        if (
          Math.abs((objPos[0] || 0) - (containerPos[0] || 0)) < halfSize[0] &&
          Math.abs((objPos[1] || 0) - (containerPos[1] || 0)) < halfSize[1] &&
          Math.abs((objPos[2] || 0) - (containerPos[2] || 0)) < halfSize[2]
        ) {
          relationships.push({ parentId: containerId, childId: obj.id });
        }
      }
    }

    if (parentIdList.length > 0) batchRegisterParents(parentIdList);
    if (relationships.length > 0) batchRegisterParentChild(relationships);
    initializedRef.current = true;
    needsImmediateUpdateRef.current = true;
  }, [batchRegisterParentChild, batchRegisterParents]);
  
  // Update LOD levels in useFrame
  useFrame(() => {
    if (!lodEnabled || !camera || !initializedRef.current) return;
    
    // NOTE: We intentionally do NOT gate on isFrameBudgetExhausted() here.
    // LOD computation is cheap (distance math for N objects) but its effect
    // is to dramatically reduce rendering cost. Blocking LOD when frames are
    // slow creates a vicious cycle: slow frames → LOD blocked → objects stay
    // at full detail → frames stay slow. The 100ms throttle + cameraMoved
    // check below are sufficient rate-limiting.
    
    const now = performance.now();
    
    // Get current camera position
    _cameraPos.setFromMatrixPosition(camera.matrixWorld);

    // Force immediate LOD pass when initialization completes or new objects arrive,
    // bypassing throttle and camera-movement gates so objects don't render at
    // full detail until the user happens to move the camera.
    const forceUpdate = needsImmediateUpdateRef.current;

    if (!forceUpdate) {
      // Throttle updates
      if (now - lastUpdateTimeRef.current < LOD_UPDATE_INTERVAL) {
        return;
      }

      // Check if camera moved significantly (squared distance avoids sqrt)
      const cameraMoved = _cameraPos.distanceToSquared(lastCameraPositionRef.current) > CAMERA_MOVE_THRESHOLD_SQ;

      if (!cameraMoved) {
        return;
      }
    }

    needsImmediateUpdateRef.current = false;
    
    // Update last camera position
    lastCameraPositionRef.current.copy(_cameraPos);
    lastUpdateTimeRef.current = now;
    
    const currentLodLevels = useLODStore.getState().lodLevels;
    const currentParentIds = useLODStore.getState().parentIds;
    const currentChildParentMap = useLODStore.getState().childParentMap;

    // --- Enqueue LOD updates with cascading transition support ---
    // Downgrades are applied immediately (they reduce render cost).
    // Upgrades are queued and drained at a budgeted rate per frame.
    const enqueueLODUpdates = (updates) => {
      if (!updates || updates.length === 0) return;

      const immediateDowngrades = [];
      const queue = upgradeQueueRef.current;

      for (const [objectId, newLevel] of updates) {
        const currentLevel = currentLodLevels.get(objectId) ?? LOD_LEVELS.FULL;
        if (newLevel === currentLevel) continue;

        if (newLevel > currentLevel) {
          // Downgrade (higher number = less detail) — apply immediately
          immediateDowngrades.push([objectId, newLevel]);
          queue.delete(objectId); // Remove any stale pending upgrade
        } else {
          // Upgrade (lower number = more detail) — queue for budgeted drain
          queue.set(objectId, { level: newLevel });
        }
      }

      if (immediateDowngrades.length > 0) {
        batchSetLODLevels(immediateDowngrades);
      }
    };

    // --- Try worker path (fire-and-forget, off main thread) ---
    if (workerSyncedRef.current && !workerBusyRef.current) {
      workerBusyRef.current = true;

      const cameraPos = [_cameraPos.x, _cameraPos.y, _cameraPos.z];
      const parentIdArr = [...currentParentIds];
      const childIdArr = [...currentChildParentMap.keys()];
      // Send current LOD levels so the worker only returns deltas
      const lodEntries = [...currentLodLevels.entries()];

      const worker = getSpatialIndexWorker();
      worker.computeLODLevels(cameraPos, parentIdArr, childIdArr, lodEntries)
        .then((updates) => {
          enqueueLODUpdates(updates);
        })
        .catch(() => { /* worker error — next frame will retry or sync fallback runs */ })
        .finally(() => { workerBusyRef.current = false; });

      // Worker handles LOD levels but face text visibility is computed on main thread.
      // This is cheap (distance check only) and avoids modifying the worker protocol.
      const currentFaceTextVisible = useLODStore.getState().faceTextVisible;
      const faceTextUpdates = [];
      for (const obj of objects) {
        const pos = obj.position;
        if (!pos) continue;
        if (Array.isArray(pos)) {
          _objectPos.set(pos[0] || 0, pos[1] || 0, pos[2] || 0);
        } else if (pos.x !== undefined) {
          _objectPos.set(pos.x, pos.y, pos.z);
        } else {
          continue;
        }
        const distSq = _cameraPos.distanceToSquared(_objectPos);
        const show = distSq < FACE_TEXT_DISTANCE_SQ;
        if (currentFaceTextVisible.get(obj.id) !== show) {
          faceTextUpdates.push([obj.id, show]);
        }
      }
      if (faceTextUpdates.length > 0) {
        batchSetFaceTextVisible(faceTextUpdates);
      }

      return; // Don't also run the sync path this frame
    }
    
    // --- Sync fallback (runs when worker not yet synced or is busy) ---
    const lodUpdates = [];
    const faceTextUpdates = [];
    const currentFaceTextVisible = useLODStore.getState().faceTextVisible;
    
    for (const obj of objects) {
      const pos = obj.position;
      if (!pos) continue;
      
      if (Array.isArray(pos)) {
        _objectPos.set(pos[0] || 0, pos[1] || 0, pos[2] || 0);
      } else if (pos.x !== undefined) {
        _objectPos.set(pos.x, pos.y, pos.z);
      } else {
        continue;
      }
      
      const distanceSq = _cameraPos.distanceToSquared(_objectPos);
      
      // Face text visibility (applies to all objects including containers)
      const showFaceText = distanceSq < FACE_TEXT_DISTANCE_SQ;
      if (currentFaceTextVisible.get(obj.id) !== showFaceText) {
        faceTextUpdates.push([obj.id, showFaceText]);
      }
      
      if (obj.merfolkData?.isContainer === true) {
        continue;
      }
      
      const isParent = currentParentIds.has(obj.id);
      
      let newLodLevel;
      if (isParent) {
        newLodLevel = calculateParentLODLevel(distanceSq);
      } else {
        newLodLevel = calculateLODLevel(distanceSq);
      }
      
      if (currentLodLevels.get(obj.id) !== newLodLevel) {
        lodUpdates.push([obj.id, newLodLevel]);
      }
    }
    
    enqueueLODUpdates(lodUpdates);
    if (faceTextUpdates.length > 0) {
      batchSetFaceTextVisible(faceTextUpdates);
    }
  });

  // --- Drain upgrade queue at a budgeted rate per frame ---
  // Runs every frame (no throttle) so queued upgrades cascade smoothly.
  // Upgrades closest objects first for best visual experience.
  useFrame(() => {
    const queue = upgradeQueueRef.current;
    if (queue.size === 0) return;

    // Allow upgrades during camera movement so objects don't stay
    // invisible during panning. The per-frame budget keeps GPU impact minimal.

    // Build sortable array with distance to current camera position
    _cameraPos.setFromMatrixPosition(camera.matrixWorld);

    // Build a quick position lookup from the objects array (avoids O(N) find per entry)
    const posMap = new Map();
    for (const obj of objects) {
      if (obj.position) posMap.set(obj.id, obj.position);
    }

    const entries = [];
    for (const [objectId, data] of queue) {
      let distSq = 0;
      const pos = posMap.get(objectId);
      if (pos) {
        if (Array.isArray(pos)) {
          _objectPos.set(pos[0] || 0, pos[1] || 0, pos[2] || 0);
        } else if (pos.x !== undefined) {
          _objectPos.set(pos.x, pos.y, pos.z);
        }
        distSq = _cameraPos.distanceToSquared(_objectPos);
      }
      entries.push({ objectId, level: data.level, distSq });
    }

    // Sort: closest objects upgrade first
    entries.sort((a, b) => a.distSq - b.distSq);

    // Apply up to the budget (adaptive: halve budget when frames are slow)
    const batch = [];
    const frameTime = getSmoothedFrameTime();
    const effectiveBudget = frameTime > FRAME_TIME_THROTTLE_MS
      ? Math.max(1, Math.floor(LOD_UPGRADE_BUDGET_PER_FRAME / 2))
      : LOD_UPGRADE_BUDGET_PER_FRAME;
    const limit = Math.min(entries.length, effectiveBudget);
    for (let i = 0; i < limit; i++) {
      const { objectId, level } = entries[i];
      batch.push([objectId, level]);
      queue.delete(objectId);
    }

    if (batch.length > 0) {
      batchSetLODLevels(batch);
    }
  });
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLODData();
    };
  }, [clearLODData]);
  
  return null; // This is a logic-only component
};

export default LODManager;
