import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import ObjectRenderer from './ObjectRenderer';
import GlobalCubeEdgesRenderer from './GlobalCubeEdgesRenderer';
import GlobalDodecahedronEdgesRenderer from './GlobalDodecahedronEdgesRenderer';
import GlobalTetrahedronEdgesRenderer from './GlobalTetrahedronEdgesRenderer';
import GlobalOctahedronEdgesRenderer from './GlobalOctahedronEdgesRenderer';
import GlobalCubeMediumLODRenderer from './GlobalCubeMediumLODRenderer';
import GlobalDodecahedronMediumLODRenderer from './GlobalDodecahedronMediumLODRenderer';
import GlobalTetrahedronMediumLODRenderer from './GlobalTetrahedronMediumLODRenderer';
import GlobalOctahedronMediumLODRenderer from './GlobalOctahedronMediumLODRenderer';
import GlobalCubeFaceRenderer from './GlobalCubeFaceRenderer';
import GlobalCubeFullLODInstancedRenderer, { isCubeUnmodified } from './GlobalCubeFullLODInstancedRenderer';
import GlobalCubeLowLODRenderer from './GlobalCubeLowLODRenderer';
import GlobalDodecahedronLowLODRenderer from './GlobalDodecahedronLowLODRenderer';
import GlobalTetrahedronLowLODRenderer from './GlobalTetrahedronLowLODRenderer';
import GlobalOctahedronLowLODRenderer from './GlobalOctahedronLowLODRenderer';
import AtlasTextSprite from './AtlasTextSprite';
import { useCubeStore } from '../stores';
import { acquireBudget, isCameraMoving, getSmoothedFrameTime } from '../utils/renderWorkScheduler';
import useUIOverlayStore from '../stores/uiOverlayStore';
import useDiagramStore from '../stores/diagramStore';

/**
 * PROGRESSIVE MOUNT BUDGET (Adaptive)
 * Dynamically scales based on the smoothed frame time so that fast hardware
 * mounts objects faster (up to 24/frame) while struggling hardware or heavy
 * scenes throttle back (as low as 4/frame).
 *
 * The scheduler may grant fewer than requested if connections, text atlas,
 * or other systems have already consumed part of this frame's budget.
 */
function getProgressiveBudget() {
  const ft = getSmoothedFrameTime();
  if (ft < 20) return 24;  // Very smooth: mount aggressively
  if (ft < 30) return 16;  // Smooth: mount faster
  if (ft < 50) return 8;   // Normal: standard pace
  return 4;                 // Struggling: throttle back
}

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
  onCodeToggle,
}) => {
  const { camera } = useThree();

  // ─── Progressive mounting ───────────────────────────────────────────
  // Instead of mounting every newly-visible object in one frame (which
  // causes freezes), we spread the work across multiple animation frames.
  // Edge renderers still get the FULL visible set because instanced
  // buffer updates are cheap.
  const mountedIdsRef = useRef(new Set());
  const [mountedVersion, setMountedVersion] = useState(0);
  const pendingRef = useRef([]);
  const rafIdRef = useRef(null);
  // Throttle render-progress store writes — only update every ~500ms
  const lastProgressReportRef = useRef(0);
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
    // PERF FIX: Don't cancel in-progress progressive mounting when new objects
    // arrive. Instead, merge new IDs into the pending queue. Canceling and
    // restarting caused a cascade: each Firebase snapshot → visibleObjectIds
    // change → effect restart → cancel rAF → re-sort ALL → new rAF loop,
    // which meant objects never actually finished mounting during rapid loading.
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

    // 2. Find new objects that need mounting (not already mounted or pending)
    //    BUGFIX: iterate over ALL loaded objects (objectsRef.current), not just
    //    visibleObjectIds. The virtualizer caps visibleObjectIds (e.g. 3200
    //    closest objects), so objects beyond the cap would never be queued
    //    for mounting — their Cube component never mounts, meaning no edges,
    //    no faces, and no header text.  Once mounted, objects stay mounted
    //    (Three.js frustum culling handles draw-call skipping at zero React
    //    cost), so mounting everything is safe.
    const pendingSet = new Set(pendingRef.current);
    const toAdd = [];
    for (const obj of objectsRef.current) {
      if (!currentMounted.has(obj.id) && !pendingSet.has(obj.id)) {
        toAdd.push(obj.id);
      }
    }

    // Nothing new to add and nothing removed — skip
    if (toAdd.length === 0 && !removed) return;

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
    if (toAdd.length <= getProgressiveBudget() || objectsRef.current.length <= PROGRESSIVE_THRESHOLD) {
      toAdd.forEach(id => currentMounted.add(id));
      if (removed || toAdd.length > 0) {
        setMountedVersion(v => v + 1);
        // Clear any in-progress render progress (all mounted instantly)
        useDiagramStore.getState().setRenderProgress(objectsRef.current.length, currentMounted.size);
      }
      return;
    }

    // 5. Many new objects — append to pending queue
    //    If a rAF loop is already running, it will pick these up automatically.
    //    If not, start a new one.
    const isAlreadyMounting = rafIdRef.current !== null;
    pendingRef.current = pendingRef.current.concat(toAdd);

    if (!isAlreadyMounting) {
      // Mount first batch immediately
      const firstBatch = pendingRef.current.splice(0, getProgressiveBudget());
      firstBatch.forEach(id => currentMounted.add(id));
      setMountedVersion(v => v + 1);
      // Immediately report that progressive mounting has started
      const total = objectsRef.current.length;
      useDiagramStore.getState().setRenderProgress(total, currentMounted.size);
      lastProgressReportRef.current = Date.now();
    } else if (removed) {
      // Just sync the removal
      setMountedVersion(v => v + 1);
    }

    if (!isAlreadyMounting && pendingRef.current.length > 0) {
      const mountNextBatch = () => {
        // PERF: Suspend the rAF loop while the 2D overlay is shown.
        // The pending queue is preserved so mounting resumes automatically
        // when the user switches back to 3D.
        if (useUIOverlayStore.getState().viewMode !== '3d') {
          rafIdRef.current = null;
          return;
        }

        const pending = pendingRef.current;
        if (pending.length === 0) {
          // SAFETY NET: Before terminating, check if any objects slipped through
          // the queuing pipeline (e.g., due to timing races between effects,
          // rAF callbacks, and React batching). If unmounted objects exist,
          // re-queue them instead of stopping.
          const allObjs = objectsRef.current;
          const unmounted = [];
          for (const obj of allObjs) {
            if (!mountedIdsRef.current.has(obj.id)) {
              unmounted.push(obj.id);
            }
          }
          if (unmounted.length > 0) {
            pendingRef.current = unmounted;
            rafIdRef.current = requestAnimationFrame(mountNextBatch);
            return;
          }
          rafIdRef.current = null;
          return;
        }

        // Only mount objects still in the loaded set (camera may have moved)
        // Use the shared render budget so objects + connections don't overwhelm one frame.
        // getProgressiveBudget() returns a lower value when frame times are high,
        // naturally throttling mounting during busy frames or camera movement.
        const budget = acquireBudget(getProgressiveBudget());
        if (budget === 0) {
          // Entire frame budget consumed by other systems — try next frame
          rafIdRef.current = requestAnimationFrame(mountNextBatch);
          return;
        }
        let added = 0;
        // Build object existence set once per batch (not per item)
        const allObjectIds = new Set(objectsRef.current.map(o => o.id));
        while (pending.length > 0 && added < budget) {
          const id = pending.shift();
          // BUGFIX: Check if the object still exists in the objects array, NOT
          // whether it's still in visibleObjectIds. The virtualizer may have
          // re-capped visibleObjectIds (dropping distant objects) between when
          // this ID was queued and now. Checking visibleObjectIds here caused
          // objects to silently never mount — their text appeared via
          // ConnectionsRenderer but the Cube component never mounted, so no
          // mesh or edges rendered. Once mounted, objects stay mounted until
          // truly unloaded (removed from the objects array), matching the
          // behavior documented on progressiveVisibleObjects.
          if (allObjectIds.has(id)) {
            mountedIdsRef.current.add(id);
            added++;
          }
        }

        if (added > 0) {
          setMountedVersion(v => v + 1);
          // Report progress to the store (throttled)
          const now = Date.now();
          const total = objectsRef.current.length;
          const mounted = mountedIdsRef.current.size;
          if (now - lastProgressReportRef.current > 500 || mounted >= total) {
            lastProgressReportRef.current = now;
            useDiagramStore.getState().setRenderProgress(total, mounted);
          }
        }

        if (pending.length > 0) {
          rafIdRef.current = requestAnimationFrame(mountNextBatch);
        } else {
          // Queue drained — check for unmounted objects before terminating
          // (same safety net as the top of the function)
          const allObjs = objectsRef.current;
          let hasUnmounted = false;
          for (const obj of allObjs) {
            if (!mountedIdsRef.current.has(obj.id)) {
              hasUnmounted = true;
              break;
            }
          }
          if (hasUnmounted) {
            // Re-queue on next frame — the safety net at the top will
            // populate pendingRef.current with the unmounted IDs.
            rafIdRef.current = requestAnimationFrame(mountNextBatch);
          } else {
            rafIdRef.current = null;
          }
        }
      };

      rafIdRef.current = requestAnimationFrame(mountNextBatch);
    }

    // NOTE: No cleanup that cancels rafIdRef here — we want the mounting loop
    // to survive across visibleObjectIds changes. Only the unmount effect below
    // cancels it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleObjectIds, objects.length]);

  // PERF: When switching back from 2D → 3D, restart the progressive mount
  // loop if it was suspended with pending items.
  const viewMode = useUIOverlayStore((s) => s.viewMode);
  useEffect(() => {
    if (viewMode === '3d' && rafIdRef.current === null && pendingRef.current.length > 0) {
      // Re-trigger the progressive mount effect by toggling a dummy counter.
      // The effect above uses visibleObjectIds as a dep, so we just need any
      // change.  But the simplest approach is to explicitly schedule a frame.
      const mountResume = () => {
        if (useUIOverlayStore.getState().viewMode !== '3d') {
          rafIdRef.current = null;
          return;
        }
        const pending = pendingRef.current;
        if (pending.length === 0) { rafIdRef.current = null; return; }
        const budget = acquireBudget(getProgressiveBudget());
        if (budget === 0) { rafIdRef.current = requestAnimationFrame(mountResume); return; }
        const allObjectIds = new Set(objectsRef.current.map(o => o.id));
        let added = 0;
        while (pending.length > 0 && added < budget) {
          const id = pending.shift();
          if (allObjectIds.has(id)) { mountedIdsRef.current.add(id); added++; }
        }
        if (added > 0) setMountedVersion(v => v + 1);
        if (pending.length > 0) {
          rafIdRef.current = requestAnimationFrame(mountResume);
        } else {
          rafIdRef.current = null;
        }
      };
      rafIdRef.current = requestAnimationFrame(mountResume);
    }
  }, [viewMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // ─── Derived lists ──────────────────────────────────────────────────
  // Progressive set — used for individual component mounting (expensive React work).
  // Filtered by `mountedIds` ONLY — never by `visibleObjectIds`.
  // Once mounted, an object's React component STAYS in the tree until the object
  // is truly unloaded (removed from the `objects` array via spatial cell unloading).
  // Frustum visibility is handled by Three.js native mesh frustum culling, which
  // skips draw calls for out-of-view meshes at zero React overhead.
  // Filtering by visibleObjectIds here would unmount components on every camera
  // move, causing the visible "everything reloads" flicker the user reported.
  //
  // PERF: ref-diff maintains reference equality when only object properties
  // change (position, color, etc.) without altering the mounted set. This
  // prevents unnecessary remapping of renderedObjects and cascading
  // recomputation in derived type arrays.
  const progressiveVisibleObjectsRef = useRef([]);
  const progressiveVisibleObjects = useMemo(() => {
    const currentIds = mountedIdsRef.current;
    const result = objects.filter((obj) => currentIds.has(obj.id));
    const prev = progressiveVisibleObjectsRef.current;
    if (prev.length === result.length && result.every((obj, i) => obj === prev[i])) {
      return prev;
    }
    progressiveVisibleObjectsRef.current = result;
    return result;
  }, [objects, mountedVersion]);

  // Extract cube objects for batched edge rendering (includes containers)
  // BUGFIX: Use progressiveVisibleObjects (same as mesh components) instead of
  // visibleObjects. visibleObjects is capped by the virtualizer's maxObjects
  // limit — distant objects get dropped on camera move, causing their edges to
  // vanish while the mesh/text stays mounted.  Edge renderers do their own
  // frustum culling in useFrame, so passing the full mounted set is safe.
  //
  // PERF: ref-diff prevents cross-type cascade — changes to dodecahedrons or
  // tetrahedrons no longer cause cube renderers to re-render.
  const cubeObjectsRef = useRef([]);
  const cubeObjects = useMemo(() => {
    const result = progressiveVisibleObjects.filter((obj) => obj.type === 'cube');
    const prev = cubeObjectsRef.current;
    if (prev.length === result.length && result.every((obj, i) => obj === prev[i])) {
      return prev;
    }
    cubeObjectsRef.current = result;
    return result;
  }, [progressiveVisibleObjects]);

  // Extract container cubes that need floating header labels
  const containerHeaders = useMemo(() => {
    return cubeObjects
      .filter((obj) => obj.merfolkData?.isContainer && obj.merfolkData?.groupLabel)
      .map((obj) => {
        // Position header 50 units above the container's top edge
        // Container height in world units = scale[1] * 10 (cube base size is 10)
        const halfHeight = (obj.scale?.[1] || 1) * 5;
        return {
          id: obj.id,
          label: obj.merfolkData.groupLabel,
          position: [
            obj.position[0],
            obj.position[1] + halfHeight + 50,
            obj.position[2],
          ],
        };
      });
  }, [cubeObjects]);

  const dodecahedronObjectsRef = useRef([]);
  const dodecahedronObjects = useMemo(() => {
    const result = progressiveVisibleObjects.filter(
      (obj) => obj.type === 'sphere' || obj.type === 'dodecahedron'
    );
    const prev = dodecahedronObjectsRef.current;
    if (prev.length === result.length && result.every((obj, i) => obj === prev[i])) {
      return prev;
    }
    dodecahedronObjectsRef.current = result;
    return result;
  }, [progressiveVisibleObjects]);

  // Extract tetrahedron objects for batched edge rendering
  const tetrahedronObjectsRef = useRef([]);
  const tetrahedronObjects = useMemo(() => {
    const result = progressiveVisibleObjects.filter((obj) => obj.type === 'tetrahedron');
    const prev = tetrahedronObjectsRef.current;
    if (prev.length === result.length && result.every((obj, i) => obj === prev[i])) {
      return prev;
    }
    tetrahedronObjectsRef.current = result;
    return result;
  }, [progressiveVisibleObjects]);

  // Extract octahedron objects for batched edge rendering
  const octahedronObjectsRef = useRef([]);
  const octahedronObjects = useMemo(() => {
    const result = progressiveVisibleObjects.filter((obj) => obj.type === 'octahedron');
    const prev = octahedronObjectsRef.current;
    if (prev.length === result.length && result.every((obj, i) => obj === prev[i])) {
      return prev;
    }
    octahedronObjectsRef.current = result;
    return result;
  }, [progressiveVisibleObjects]);

  // Compute set of unmodified cube IDs for instanced full-LOD rendering.
  // These cubes skip mounting individual <Cube> components — their wireframe
  // edges come from GlobalCubeEdgesRenderer and their transparent clickable
  // faces from GlobalCubeFullLODInstancedRenderer.
  const unmodifiedCubeIdsRef = useRef(null);
  const unmodifiedVersion = useCubeStore((s) => s._unmodifiedVersion);
  const unmodifiedCubeIds = useMemo(() => {
    const cubesMap = useCubeStore.getState().cubes;
    const ids = new Set();
    for (const cube of cubeObjects) {
      if (cube.merfolkData?.isContainer) continue;
      if (cube.merfolkData?.isRepoContainer) continue;
      if (isCubeUnmodified(cube.id, cubesMap, cube.headerText, cube)) {
        ids.add(cube.id);
      }
    }

    // Diff against previous set to maintain reference equality when contents unchanged
    const prev = unmodifiedCubeIdsRef.current;
    if (prev !== null && prev.size === ids.size) {
      let same = true;
      for (const id of ids) {
        if (!prev.has(id)) { same = false; break; }
      }
      if (same) return prev;
    }

    unmodifiedCubeIdsRef.current = ids;
    return ids;
  }, [cubeObjects, unmodifiedVersion]);

  // Click handler for the instanced full-LOD renderer — selects the cube,
  // which promotes it to a full <Cube> component on next render.
  const handleInstancedCubeClick = useMemo(() => {
    return (cubeId) => handleObjectClick(cubeId);
  }, [handleObjectClick]);

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
        unmodifiedCubeIds={unmodifiedCubeIds}
        onCodeToggle={onCodeToggle}
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
    unmodifiedCubeIds,
    onCodeToggle,
  ]);

  return (
    <>
      {/* PERFORMANCE: Render all cube edges in a single draw call */}
      <GlobalCubeEdgesRenderer cubes={cubeObjects} defaultLineWidth={1} />
      
      {/* PERFORMANCE: Render all colored cube faces in a single draw call */}
      <GlobalCubeFaceRenderer cubes={cubeObjects} />
      
      {/* PERFORMANCE: Render all medium-LOD cubes as simple boxes in 1 draw call */}
      <GlobalCubeMediumLODRenderer cubes={cubeObjects} onInstanceClick={handleInstancedCubeClick} />
      
      {/* PERFORMANCE: Instanced transparent faces for unmodified full-LOD cubes (1 draw call) */}
      <GlobalCubeFullLODInstancedRenderer cubes={cubeObjects} onInstanceClick={handleInstancedCubeClick} />
      
      {/* PERFORMANCE: Render all dodecahedron edges in a single draw call */}
      <GlobalDodecahedronEdgesRenderer dodecahedrons={dodecahedronObjects} defaultLineWidth={1} />
      
      {/* PERFORMANCE: Render all medium-LOD dodecahedrons as simple spheres in 1 draw call */}
      <GlobalDodecahedronMediumLODRenderer dodecahedrons={dodecahedronObjects} onInstanceClick={handleInstancedCubeClick} />
      
      {/* PERFORMANCE: Render all tetrahedron edges in a single draw call */}
      <GlobalTetrahedronEdgesRenderer tetrahedrons={tetrahedronObjects} defaultLineWidth={1} />
      
      {/* PERFORMANCE: Render all octahedron edges in a single draw call */}
      <GlobalOctahedronEdgesRenderer octahedrons={octahedronObjects} defaultLineWidth={1} />
      
      {/* PERFORMANCE: Render all medium-LOD tetrahedrons as simple boxes in 1 draw call */}
      <GlobalTetrahedronMediumLODRenderer tetrahedrons={tetrahedronObjects} onInstanceClick={handleInstancedCubeClick} />
      
      {/* PERFORMANCE: Render all medium-LOD octahedrons as simple octahedrons in 1 draw call */}
      <GlobalOctahedronMediumLODRenderer octahedrons={octahedronObjects} onInstanceClick={handleInstancedCubeClick} />
      
      {/* PERFORMANCE: Render all LOW-LOD objects as instanced 2D shapes (1 draw call each) */}
      <GlobalCubeLowLODRenderer cubes={cubeObjects} onInstanceClick={handleInstancedCubeClick} />
      <GlobalDodecahedronLowLODRenderer dodecahedrons={dodecahedronObjects} onInstanceClick={handleInstancedCubeClick} />
      <GlobalTetrahedronLowLODRenderer tetrahedrons={tetrahedronObjects} onInstanceClick={handleInstancedCubeClick} />
      <GlobalOctahedronLowLODRenderer octahedrons={octahedronObjects} onInstanceClick={handleInstancedCubeClick} />
      
      {/* Render floating header labels above group containers */}
      {containerHeaders.map((header) => (
        <AtlasTextSprite
          key={`container-header-${header.id}`}
          text={header.label}
          position={header.position}
          style={{
            fontSize: 8.0,
            color: '#000000',
            bold: true,
            depthTest: false,
            depthWrite: false,
            isContainerHeader: true,
          }}
          billboard={true}
          visible={true}
          renderOrder={25}
          scale={1}
        />
      ))}
      
      {/* Render all individual objects */}
      {renderedObjects}
    </>
  );
});

ObjectsRenderer.displayName = 'ObjectsRenderer';

export default ObjectsRenderer;
