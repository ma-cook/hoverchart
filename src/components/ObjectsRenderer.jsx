import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import ObjectRenderer from './ObjectRenderer';
import GlobalCubeEdgesRenderer from './GlobalCubeEdgesRenderer';
import GlobalDodecahedronEdgesRenderer from './GlobalDodecahedronEdgesRenderer';
import GlobalTetrahedronEdgesRenderer from './GlobalTetrahedronEdgesRenderer';
import { acquireBudget, isCameraMoving } from '../utils/renderWorkScheduler';

/**
 * PROGRESSIVE MOUNT BUDGET
 * Max new objects to REQUEST from the global render work scheduler per frame.
 * The scheduler may grant fewer if connections or other systems have already
 * consumed part of this frame's budget.
 */
const MOUNT_BUDGET = 4;

/** Below this object count, skip progressive mounting entirely (instant mount). */
const PROGRESSIVE_THRESHOLD = 40;

/**
 * ObjectsRenderer - Renders all objects with optimized batching
 * 
 * This component wraps the individual ObjectRenderer and adds batched rendering
 * for performance-critical elements like cube, dodecahedron, and tetrahedron edges.
 * 
 * Architecture:
 * - GlobalCubeEdgesRenderer: Renders ALL cube edges in 1 draw call
 * - GlobalDodecahedronEdgesRenderer: Renders ALL dodecahedron edges in 1 draw call
 * - GlobalTetrahedronEdgesRenderer: Renders ALL tetrahedron edges in 1 draw call
 * - ObjectRenderer (per object): Renders individual object features (faces, UI, etc.)
 */
const ObjectsRenderer = React.memo(({
  objects,
  visibleObjectIds,
  selectedId,
  handleObjectClick,
  handleObjectMove,
  handleObjectUpdate,
  disableOrbitControls,
  enableOrbitControls,
  handleFaceIndicatorClick,
  handleFaceClick,
  showAllCubesIndicators,
  activeIndicator,
  indicatorMode,
  selectedIndicators,
  activeTextStyleUI,
  setActiveTextStyleUI,
  handleIndicatorDeselected,
  registerTransformingObject,
  handleObjectMatrixChanged,
  handleIndicatorSelected,
  globalIndicatorSelected,
  handleObjectDelete,
  user,
  currentSpaceId,
  getTransformStartPosition,
  checkPositionJitter,
  useLOD,
}) => {
  const { camera } = useThree();

  // ─── Progressive mounting ───────────────────────────────────────────
  // Instead of mounting every newly-visible object in one frame (which
  // causes freezes), we spread the work across multiple animation frames.
  // Edge renderers still get the FULL visible set because instanced
  // buffer updates are cheap.
  const mountedIdsRef = useRef(new Set());
  const [mountedIds, setMountedIds] = useState(() => new Set());
  const pendingRef = useRef([]);
  const rafIdRef = useRef(null);
  // BUGFIX: Keep a ref to the latest visibleObjectIds so the rAF callback
  // checks against the current set, not a stale closure capture.
  const visibleObjectIdsRef = useRef(visibleObjectIds);
  // Ref to the latest objects array so the unload check in the effect
  // can use fresh data without adding `objects` to the dependency array
  // (adding objects would restart progressive mounting on every position update).
  const objectsRef = useRef(objects);

  // Keep refs in sync
  useEffect(() => {
    visibleObjectIdsRef.current = visibleObjectIds;
  }, [visibleObjectIds]);

  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  useEffect(() => {
    // Cancel any in-progress progressive mounting
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    const currentMounted = mountedIdsRef.current;

    // 1. Remove objects that are truly unloaded (no longer in the objects array).
    //    Do NOT remove objects that merely left the camera frustum — that would
    //    unmount and remount the 3D components on every camera move, causing the
    //    "everything reloads when I move the camera" problem.
    //    Edge renderers (GlobalCubeEdgesRenderer etc.) handle frustum-based
    //    visibility independently via `visibleObjects`.
    const allObjectIds = new Set(objectsRef.current.map(o => o.id));
    let removed = false;
    for (const id of currentMounted) {
      if (!allObjectIds.has(id)) {
        currentMounted.delete(id);
        removed = true;
      }
    }

    // 2. Find new objects that need mounting
    const toAdd = [];
    for (const id of visibleObjectIds) {
      if (!currentMounted.has(id)) {
        toAdd.push(id);
      }
    }

    // 3. Sort new objects by distance to camera (closest first)
    if (toAdd.length > 1 && camera) {
      const cx = camera.position.x;
      const cy = camera.position.y;
      const cz = camera.position.z;
      const objectMap = new Map(objectsRef.current.map(o => [o.id, o]));
      toAdd.sort((aId, bId) => {
        const a = objectMap.get(aId);
        const b = objectMap.get(bId);
        const ap = a?.position || [0, 0, 0];
        const bp = b?.position || [0, 0, 0];
        const ax = (Array.isArray(ap) ? ap[0] : ap.x) - cx;
        const ay = (Array.isArray(ap) ? ap[1] : ap.y) - cy;
        const az = (Array.isArray(ap) ? ap[2] : ap.z) - cz;
        const bx = (Array.isArray(bp) ? bp[0] : bp.x) - cx;
        const by = (Array.isArray(bp) ? bp[1] : bp.y) - cy;
        const bz = (Array.isArray(bp) ? bp[2] : bp.z) - cz;
        return (ax * ax + ay * ay + az * az) - (bx * bx + by * by + bz * bz);
      });
    }

    // 4. If few enough, mount all at once (no need for batching)
    if (toAdd.length <= MOUNT_BUDGET || visibleObjectIds.size <= PROGRESSIVE_THRESHOLD) {
      toAdd.forEach(id => currentMounted.add(id));
      if (removed || toAdd.length > 0) {
        setMountedIds(new Set(currentMounted));
      }
      return;
    }

    // 5. Many new objects — mount first batch immediately, rest progressively
    pendingRef.current = toAdd;
    const firstBatch = pendingRef.current.splice(0, MOUNT_BUDGET);
    firstBatch.forEach(id => currentMounted.add(id));
    setMountedIds(new Set(currentMounted));

    const mountNextBatch = () => {
      const pending = pendingRef.current;
      if (pending.length === 0) {
        rafIdRef.current = null;
        return;
      }

      // Only mount objects still in the visible set (camera may have moved)
      // Use the shared render budget so objects + connections don't overwhelm one frame
      // PERF: Skip mounting while camera is actively moving to keep panning smooth
      if (isCameraMoving()) {
        rafIdRef.current = requestAnimationFrame(mountNextBatch);
        return;
      }
      const budget = acquireBudget(MOUNT_BUDGET);
      let added = 0;
      while (pending.length > 0 && added < budget) {
        const id = pending.shift();
        // BUGFIX: Use ref for latest visible set instead of stale closure
        if (visibleObjectIdsRef.current.has(id)) {
          mountedIdsRef.current.add(id);
          added++;
        }
      }

      if (added > 0) {
        setMountedIds(new Set(mountedIdsRef.current));
      }

      if (pending.length > 0) {
        rafIdRef.current = requestAnimationFrame(mountNextBatch);
      } else {
        rafIdRef.current = null;
      }
    };

    rafIdRef.current = requestAnimationFrame(mountNextBatch);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleObjectIds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // ─── Derived lists ──────────────────────────────────────────────────
  // Full visible set — used for instanced edge renderers (cheap GPU buffer writes)
  const visibleObjects = useMemo(() => {
    return objects.filter((obj) => visibleObjectIds.has(obj.id));
  }, [objects, visibleObjectIds]);

  // Progressive set — used for individual component mounting (expensive React work).
  // Filtered by `mountedIds` ONLY — never by `visibleObjectIds`.
  // Once mounted, an object's React component STAYS in the tree until the object
  // is truly unloaded (removed from the `objects` array via spatial cell unloading).
  // Frustum visibility is handled by Three.js native mesh frustum culling, which
  // skips draw calls for out-of-view meshes at zero React overhead.
  // Filtering by visibleObjectIds here would unmount components on every camera
  // move, causing the visible "everything reloads" flicker the user reported.
  const progressiveVisibleObjects = useMemo(() => {
    return objects.filter((obj) => mountedIds.has(obj.id));
  }, [objects, mountedIds]);

  // Extract cube objects for batched edge rendering (includes containers)
  const cubeObjects = useMemo(() => {
    return visibleObjects.filter((obj) => obj.type === 'cube');
  }, [visibleObjects]);

  // Extract dodecahedron objects for batched edge rendering
  const dodecahedronObjects = useMemo(() => {
    return visibleObjects.filter(
      (obj) => obj.type === 'sphere' || obj.type === 'dodecahedron'
    );
  }, [visibleObjects]);

  // Extract tetrahedron objects for batched edge rendering
  const tetrahedronObjects = useMemo(() => {
    return visibleObjects.filter((obj) => obj.type === 'tetrahedron');
  }, [visibleObjects]);

  // Render individual objects (progressively mounted to prevent freezes)
  const renderedObjects = useMemo(() => {
    return progressiveVisibleObjects.map((obj) => (
      <ObjectRenderer
        key={obj.id}
        obj={obj}
        selectedId={selectedId}
        handleObjectClick={handleObjectClick}
        handleObjectMove={handleObjectMove}
        handleObjectUpdate={handleObjectUpdate}
        disableOrbitControls={disableOrbitControls}
        enableOrbitControls={enableOrbitControls}
        handleFaceIndicatorClick={handleFaceIndicatorClick}
        handleFaceClick={handleFaceClick}
        showAllCubesIndicators={showAllCubesIndicators}
        activeIndicator={activeIndicator}
        indicatorMode={indicatorMode}
        selectedIndicators={selectedIndicators}
        activeTextStyleUI={activeTextStyleUI}
        setActiveTextStyleUI={setActiveTextStyleUI}
        handleIndicatorDeselected={handleIndicatorDeselected}
        registerTransformingObject={registerTransformingObject}
        handleObjectMatrixChanged={handleObjectMatrixChanged}
        handleIndicatorSelected={handleIndicatorSelected}
        globalIndicatorSelected={globalIndicatorSelected}
        handleObjectDelete={handleObjectDelete}
        user={user}
        currentSpaceId={currentSpaceId}
        getTransformStartPosition={getTransformStartPosition}
        checkPositionJitter={checkPositionJitter}
        useLOD={useLOD}
      />
    ));
  }, [
    progressiveVisibleObjects,
    selectedId,
    handleObjectClick,
    handleObjectMove,
    handleObjectUpdate,
    disableOrbitControls,
    enableOrbitControls,
    handleFaceIndicatorClick,
    handleFaceClick,
    showAllCubesIndicators,
    activeIndicator,
    indicatorMode,
    selectedIndicators,
    activeTextStyleUI,
    setActiveTextStyleUI,
    handleIndicatorDeselected,
    registerTransformingObject,
    handleObjectMatrixChanged,
    handleIndicatorSelected,
    globalIndicatorSelected,
    handleObjectDelete,
    user,
    currentSpaceId,
    getTransformStartPosition,
    checkPositionJitter,
    useLOD,
  ]);

  return (
    <>
      {/* PERFORMANCE: Render all cube edges in a single draw call */}
      <GlobalCubeEdgesRenderer cubes={cubeObjects} defaultLineWidth={1} />
      
      {/* PERFORMANCE: Render all dodecahedron edges in a single draw call */}
      <GlobalDodecahedronEdgesRenderer dodecahedrons={dodecahedronObjects} defaultLineWidth={1} />
      
      {/* PERFORMANCE: Render all tetrahedron edges in a single draw call */}
      <GlobalTetrahedronEdgesRenderer tetrahedrons={tetrahedronObjects} defaultLineWidth={1} />
      
      {/* Render all individual objects */}
      {renderedObjects}
    </>
  );
});

ObjectsRenderer.displayName = 'ObjectsRenderer';

export default ObjectsRenderer;
