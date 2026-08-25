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
import { useCubeStore, useSpatialManagerStore } from '../stores';
import { acquireBudget, getSmoothedFrameTime } from '../utils/renderWorkScheduler';
import importPerf from '../utils/importPerf';
import { beginBulkImport, endBulkImportIfIdle } from '../utils/bulkImportState';
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
  //
  // SCALE FIX: All mounted-state derivation is INCREMENTAL. Mounting a
  // batch appends to persistent arrays/Sets and classifies just the newly
  // mounted objects; nothing re-scans the full objects list per batch.
  // The previous implementation re-filtered all N objects and recreated
  // every mounted React element on each batch, which is O(N²) cumulative
  // and froze imports around ~9k of 92k objects.
  const mountedIdsRef = useRef(new Set());
  const [mountedVersion, setMountedVersion] = useState(0);
  const pendingRef = useRef([]);
  // Mirror of pendingRef contents for O(1) duplicate checks (the queue can
  // hold tens of thousands of ids while an import streams in).
  const pendingSetRef = useRef(new Set());
  // Head cursor into pendingRef.  Array#shift is O(n) per item, which made
  // draining a ~90k-entry queue quadratic; indexing makes dequeues O(1).
  const pendingHeadRef = useRef(0);
  // Lazily-initialized shared rAF pump (see scheduleMountLoop below).
  const runMountLoopRef = useRef(null);
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

  // ─── Persistent indexes over the store objects array ────────────────
  // Maintained incrementally by the sync effect below — never rebuilt per
  // mount batch.  unique-id count feeds getMountableTotal(); idToObject is
  // reused by the distance sort and the rAF lookup (previously rebuilt as a
  // fresh Map on EVERY batch).
  const allIdsSetRef = useRef(new Set());
  const idToObjectRef = useRef(new Map());

  // Incremental mounted collections (append-only; spliced only on unload).
  // Each is exposed to render via a per-batch slice so downstream consumers
  // keep seeing fresh array identities without any full-list rescans.
  const mountedObjectsRef = useRef([]);
  const cubeArrRef = useRef([]);
  const dodecahedronArrRef = useRef([]);
  const tetrahedronArrRef = useRef([]);
  const octahedronArrRef = useRef([]);
  const containerObjsRef = useRef([]); // containers needing floating labels
  const unmodifiedCubeIdsRef = useRef(new Set());
  // Throttle for the drain-time safety scan (previously ran over ALL objects
  // every time the pending queue emptied mid-import).
  const lastSafetyScanRef = useRef(0);

  /**
   * Classify a newly-mounted object into the incremental collections.
   * MUST be called once per mounted id, with the CURRENT object ref.
   */
  const mountObjectInternal = (obj) => {
    mountedIdsRef.current.add(obj.id);
    mountedObjectsRef.current.push(obj);
    switch (obj.type) {
      case 'cube':
        cubeArrRef.current.push(obj);
        if (obj.merfolkData?.isContainer && obj.merfolkData?.groupLabel) {
          containerObjsRef.current.push(obj);
        }
        if (
          !obj.merfolkData?.isContainer &&
          !obj.merfolkData?.isRepoContainer &&
          isCubeUnmodified(
            obj.id,
            useCubeStore.getState().cubes,
            obj.headerText,
            obj
          )
        ) {
          unmodifiedCubeIdsRef.current.add(obj.id);
        }
        break;
      case 'sphere':
      case 'dodecahedron':
        dodecahedronArrRef.current.push(obj);
        break;
      case 'tetrahedron':
        tetrahedronArrRef.current.push(obj);
        break;
      case 'octahedron':
        octahedronArrRef.current.push(obj);
        break;
      default:
        break;
    }
  };

  // ─── Store-array sync effect ────────────────────────────────────────
  // Keeps allIdsSetRef/idToObjectRef in step with the objects array using
  // ONE pass per flush (not one pass per mount batch).  Also detects
  // entries whose object REFERENCE was replaced by the store (position
  // updates usually mutate in place, so this is rare) and patches the
  // mounted collections' slots in place.
  useEffect(() => {
    const prevIds = allIdsSetRef.current;
    const nextMap = new Map();
    const nextIds = new Set(prevIds);
    let structureChanged = false;

    for (const obj of objects) {
      nextMap.set(obj.id, obj);
      if (!prevIds.has(obj.id)) {
        nextIds.add(obj.id);
      }
    }
    // Batched removal purge: collect ALL vanished ids first, then filter each
    // mounted collection once — per-id filtering would be O(removed × mounted).
    const removedNow = [];
    for (const id of prevIds) {
      if (!nextMap.has(id)) {
        nextIds.delete(id);
        removedNow.push(id);
        if (mountedIdsRef.current.delete(id)) structureChanged = true;
      }
    }
    if (removedNow.length > 0) {
      const gone = new Set(removedNow);
      const dropGone = (arr) => arr.filter((o) => !gone.has(o.id));
      mountedObjectsRef.current = dropGone(mountedObjectsRef.current);
      cubeArrRef.current = dropGone(cubeArrRef.current);
      dodecahedronArrRef.current = dropGone(dodecahedronArrRef.current);
      tetrahedronArrRef.current = dropGone(tetrahedronArrRef.current);
      octahedronArrRef.current = dropGone(octahedronArrRef.current);
      containerObjsRef.current = dropGone(containerObjsRef.current);
      for (const id of removedNow) unmodifiedCubeIdsRef.current.delete(id);
    }

    allIdsSetRef.current = nextIds;
    idToObjectRef.current = nextMap;
    objectsRef.current = objects;

    // Patch replaced references for already-mounted objects (in place, so
    // no version bump is needed for pure identity swaps — React.memo on
    // ObjectRenderer will pick the new props up on the next parent render
    // via the refreshed slots below).
    const mountedArr = mountedObjectsRef.current;
    let refsChanged = false;
    for (let i = 0; i < mountedArr.length; i++) {
      const latest = nextMap.get(mountedArr[i].id);
      if (latest && latest !== mountedArr[i]) {
        mountedArr[i] = latest;
        refsChanged = true;
      }
    }
    if (refsChanged) {
      const patch = (arr) => {
        for (let i = 0; i < arr.current.length; i++) {
          const latest = nextMap.get(arr.current[i].id);
          if (latest && latest !== arr.current[i]) arr.current[i] = latest;
        }
      };
      patch(cubeArrRef);
      patch(dodecahedronArrRef);
      patch(tetrahedronArrRef);
      patch(octahedronArrRef);
      patch(containerObjsRef);
      // Container header positions are computed from live object refs at
      // render time (see containerHeaders memo), so patched refs flow
      // through automatically.
      if (!structureChanged) structureChanged = true;
    }
    if (structureChanged) setMountedVersion((v) => v + 1);

    // NOTE: previously this component synced objectsRef in a separate tiny
    // effect; merged here so there is exactly one owner of store-array
    // synchronization.
  }, [objects]);

  // Keep refs in sync
  useEffect(() => {
    visibleObjectIdsRef.current = visibleObjectIds;
  }, [visibleObjectIds]);

  // All store objects are mounted.  The earlier cap that only mounted objects
  // whose cell was already loaded (and the mirror store cap in objectMethods.js)
  // left the services/utils/hooks/etc. groups invisible after a scan — the OOM
  // it was meant to stop still occurred, so it was reverted.  Progressive
  // mounting below spreads the mount cost across frames.

  // Total store objects that the renderer will mount (all of them).  Counts
  // unique IDs via the persistent allIdsSetRef (maintained incrementally by
  // the sync effect), so if the store ever held a duplicate ID the old
  // length-based total could never be reached and the progress toast stayed
  // stuck below 100%.  Previously this rebuilt a Set from ALL objects on
  // every progress report.
  const getMountableTotal = () => allIdsSetRef.current.size;

  // Stable key for the loaded-cell set.  PERF FIX: subscribe to the cheap
  // monotonic loadedCellsVersion counter instead of sorting+joining the whole
  // cell set on every store notification (O(N log N) → O(1) per flush).
  // The mount effect below re-runs the moment a cell loads (or unloads) so
  // objects that were skipped while their cell was unloaded get re-queued -
  // even when objects.length and visibleObjectIds haven't changed.
  const loadedCellsKey = useSpatialManagerStore((s) => s.loadedCellsVersion);

  // ─── Shared progressive-mount pump ──────────────────────────────────
  // Both the mount effect and the 2D→3D resume effect schedule this via
  // requestAnimationFrame.  All state lives in refs, so one stable closure
  // serves every caller.
  //
  // PERF NOTES vs the previous inline loop:
  // - Object lookup uses the persistent idToObjectRef map instead of
  //   rebuilding `new Map(objects.map(...))` on EVERY batch (O(N)/batch → O(1)/item).
  // - Queue dequeue uses pendingHeadRef instead of Array#shift, which moved
  //   the entire remaining queue per item (quadratic at ~90k entries).
  // - Drain-time safety scans over ALL objects are throttled to once per
  //   second; the mount effect re-running per store flush remains the
  //   primary catch-up mechanism for strays.
  const scheduleMountLoop = () => {
    if (!runMountLoopRef.current) {
      runMountLoopRef.current = () => {
        // Suspend while the 2D overlay is shown; the queue is preserved and
        // mounting resumes automatically when the user switches back to 3D.
        if (useUIOverlayStore.getState().viewMode !== '3d') {
          rafIdRef.current = null;
          return;
        }

        const pending = pendingRef.current;

        if (pendingHeadRef.current >= pending.length) {
          // SAFETY NET: before terminating, check whether any objects slipped
          // through the queuing pipeline (timing races between effects, rAF
          // callbacks, and React batching).  Throttled — during an import the
          // mount effect re-queues strays anyway.
          let repopulated = false;
          if (Date.now() - lastSafetyScanRef.current > 1000) {
            lastSafetyScanRef.current = Date.now();
            const unmounted = [];
            for (const obj of objectsRef.current) {
              if (!mountedIdsRef.current.has(obj.id)) {
                unmounted.push(obj.id);
              }
            }
            if (unmounted.length > 0) {
              pendingRef.current = unmounted;
              pendingHeadRef.current = 0;
              pendingSetRef.current = new Set(unmounted);
              repopulated = true;
            }
          }
          if (!repopulated) {
            // Report the final progress state so the toast reflects reality
            // and clears once everything mountable is mounted.
            useDiagramStore.getState().setRenderProgress(
              getMountableTotal(),
              mountedIdsRef.current.size
            );
            // Release deferred subsystems (frustum sweeps, connection
            // pathfinding) once mounting has fully settled.
            endBulkImportIfIdle(0);
            pendingRef.current = [];
            pendingHeadRef.current = 0;
            rafIdRef.current = null;
            return;
          }
        }

        // Shared render budget so objects + connections don't overwhelm a
        // single frame; acquireBudget returns less when frame times are high.
        const budget = acquireBudget(getProgressiveBudget());
        if (budget === 0) {
          rafIdRef.current = requestAnimationFrame(runMountLoopRef.current);
          return;
        }

        const objectById = idToObjectRef.current;
        let added = 0;
        let head = pendingHeadRef.current;
        importPerf.begin('mountBatch');
        while (head < pending.length && added < budget) {
          const id = pending[head];
          head++;
          pendingSetRef.current.delete(id);
          // BUGFIX (kept): check whether the object still exists in the loaded
          // set, NOT whether it is still in visibleObjectIds. The virtualizer
          // may have re-capped visible ids between queuing and now; checking
          // those caused objects to silently never mount.
          const obj = objectById.get(id);
          if (obj) {
            mountObjectInternal(obj);
            added++;
          }
        }
        pendingHeadRef.current = head;
        importPerf.end('mountBatch');

        if (added > 0) {
          // Signal bulk-import mode so expensive per-frame subsystems
          // (frustum sweeps in the global renderers, connection pathfinding)
          // defer work until the queue drains.
          beginBulkImport();
          setMountedVersion((v) => v + 1);
          // Report progress to the store (throttled)
          const now = Date.now();
          const total = getMountableTotal();
          const mounted = mountedIdsRef.current.size;
          if (now - lastProgressReportRef.current > 500 || mounted >= total) {
            lastProgressReportRef.current = now;
            useDiagramStore.getState().setRenderProgress(total, mounted);
          }
        }

        if (head < pending.length) {
          rafIdRef.current = requestAnimationFrame(runMountLoopRef.current);
        } else {
          // Queue drained — compact and give the next frame's safety-net
          // branch a chance to terminate or rescan.
          pendingRef.current = [];
          pendingHeadRef.current = 0;
          rafIdRef.current = requestAnimationFrame(runMountLoopRef.current);
        }
      };
    }
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(runMountLoopRef.current);
    }
  };

  useEffect(() => {
    // PERF FIX: Don't cancel in-progress progressive mounting when new objects
    // arrive. Instead, merge new IDs into the pending queue. Canceling and
    // restarting caused a cascade: each Firebase snapshot → visibleObjectIds
    // change → effect restart → cancel rAF → re-sort ALL → new rAF loop,
    // which meant objects never actually finished mounting during rapid loading.
    const currentMounted = mountedIdsRef.current;

    // 1. Removal detection moved to the store-sync effect above: it owns
    //    purging mounted collections whenever the objects array loses ids
    //    (including the incremental type-bucket cleanup), and runs before
    //    this effect on every commit where `objects` changed.  Objects that
    //    merely left the camera frustum still stay mounted here — edge
    //    renderers handle frustum visibility independently.

    // 2. Find new objects that need mounting (not already mounted or pending)
    //    BUGFIX: iterate over ALL loaded objects (objectsRef.current), not just
    //    visibleObjectIds. The virtualizer caps visibleObjectIds (e.g. 3200
    //    closest objects), so objects beyond the cap would never be queued
    //    for mounting — their Cube component never mounts, meaning no edges,
    //    no faces, and no header text.  Once mounted, objects stay mounted
    //    (Three.js frustum culling handles draw-call skipping at zero React
    //    cost), so mounting everything is safe.
    const pendingSet = pendingSetRef.current;
    const toAdd = [];
    for (const obj of objectsRef.current) {
      if (!currentMounted.has(obj.id) && !pendingSet.has(obj.id)) {
        toAdd.push(obj.id);
      }
    }

    // Nothing new to add — skip.  Before bailing, reconcile the progress
    // toast: if every mountable object is already mounted, push the final
    // state so the toast clears instead of freezing on a stale ratio.
    if (toAdd.length === 0) {
      const total = getMountableTotal();
      const mounted = currentMounted.size;
      if (mounted >= total && total > 0) {
        useDiagramStore.getState().setRenderProgress(total, mounted);
      }
      return;
    }

    // 3. Sort new objects by distance to camera (closest first).
    //    Uses the persistent id→object map maintained by the sync effect
    //    instead of rebuilding a Map from the entire objects array per run.
    if (toAdd.length > 1 && camera) {
      const cx = camera.position.x;
      const cy = camera.position.y;
      const cz = camera.position.z;
      const objectMap = idToObjectRef.current;
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

    // 4. If few enough, mount all at once (no need for batching).
    //    Route through mountObjectInternal so the incremental type buckets,
    //    container list and unmodified-cube set stay in sync — adding bare
    //    ids would silently desync them.
    if (
      toAdd.length <= getProgressiveBudget() ||
      objectsRef.current.length <= PROGRESSIVE_THRESHOLD
    ) {
      const objectById = idToObjectRef.current;
      for (const id of toAdd) {
        const obj = objectById.get(id);
        if (obj) mountObjectInternal(obj);
      }
      setMountedVersion((v) => v + 1);
      // Clear any in-progress render progress (all mounted instantly)
      useDiagramStore.getState().setRenderProgress(
        getMountableTotal(),
        currentMounted.size
      );
      return;
    }

    // 5. Many new objects — append to pending queue (mirror set maintained
    //    for O(1) duplicate checks) and make sure the pump is running.
    for (const id of toAdd) pendingSet.add(id);
    pendingRef.current = pendingRef.current.concat(toAdd);

    if (rafIdRef.current === null) {
      // Mount first batch immediately for responsiveness
      const firstBatch = pendingRef.current.splice(0, getProgressiveBudget());
      for (const id of firstBatch) pendingSet.delete(id);
      const objectById = idToObjectRef.current;
      for (const id of firstBatch) {
        const obj = objectById.get(id);
        if (obj) mountObjectInternal(obj);
      }
      setMountedVersion((v) => v + 1);
      // Immediately report that progressive mounting has started
      useDiagramStore.getState().setRenderProgress(
        getMountableTotal(),
        currentMounted.size
      );
      lastProgressReportRef.current = Date.now();
    }

    scheduleMountLoop();

    // NOTE: No cleanup that cancels rafIdRef here — we want the mounting loop
    // to survive across visibleObjectIds changes. Only the unmount effect below
    // cancels it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleObjectIds, objects.length, loadedCellsKey]);

  // PERF: When switching back from 2D → 3D, restart the progressive mount
  // pump if it was suspended with pending items.  The shared pump handles
  // suspension itself; this just needs to kick it while viewMode is '3d'.
  const viewMode = useUIOverlayStore((s) => s.viewMode);
  useEffect(() => {
    if (viewMode === '3d' && rafIdRef.current === null) {
      const pending = pendingRef.current;
      if (pendingHeadRef.current < pending.length) {
        scheduleMountLoop();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // SCALE FIX: every list below is a per-version snapshot of the incremental
  // collections classified at mount time (mountObjectInternal) and purged by
  // the store-sync effect.  The previous implementation re-filtered the
  // ENTIRE objects array on every mount batch — O(N) per batch, O(N²)
  // cumulative across a large import.  Now a batch only pays for shallow
  // copies of the mounted arrays, keeping fresh array identities for the
  // downstream ref-diff consumers.
  //
  // Semantics kept from the old implementation:
  // - Filtered by mountedIds ONLY — never by visibleObjectIds.  Once
  //   mounted, an object stays in the tree until truly unloaded (removed
  //   from the objects array via spatial cell unloading).  Frustum
  //   visibility is handled by Three.js native culling at zero React cost;
  //   filtering by visibleObjectIds here would remount components on every
  //   camera move (the "everything reloads" flicker).
  // Snapshot helper: shallow-copies a mounted collection, gated on
  // mountedVersion so the memo re-runs exactly once per mount batch.  The
  // version parameter makes the invalidation dependency explicit (the refs
  // themselves are intentionally read live).
  const snapshotAtVersion = (ref, _version) => ref.current.slice();

  const progressiveVisibleObjects = useMemo(
    () => snapshotAtVersion(mountedObjectsRef, mountedVersion),
    [mountedVersion]
  );

  // Extract cube objects for batched edge rendering (includes containers).
  // BUGFIX (kept): derive from the MOUNTED set, never from virtualizer-capped
  // visibleObjects — distant objects would lose edges while their meshes stay
  // mounted.  Edge renderers do their own frustum culling in useFrame.
  const cubeObjects = useMemo(
    () => snapshotAtVersion(cubeArrRef, mountedVersion),
    [mountedVersion]
  );

  const dodecahedronObjects = useMemo(
    () => snapshotAtVersion(dodecahedronArrRef, mountedVersion),
    [mountedVersion]
  );

  const tetrahedronObjects = useMemo(
    () => snapshotAtVersion(tetrahedronArrRef, mountedVersion),
    [mountedVersion]
  );

  const octahedronObjects = useMemo(
    () => snapshotAtVersion(octahedronArrRef, mountedVersion),
    [mountedVersion]
  );

  // Floating header labels above group containers.  Positions are computed
  // from the LIVE object refs at render time — position updates mutate
  // objects in place, so capturing coordinates at mount time would go stale.
  const containerHeaders = useMemo(() => {
    void mountedVersion; // invalidation: containerObjsRef content changes bump it
    return containerObjsRef.current.map((obj) => {
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
  }, [mountedVersion]);

  // Compute set of unmodified cube IDs for instanced full-LOD rendering.
  // These cubes skip mounting individual <Cube> components — their wireframe
  // edges come from GlobalCubeEdgesRenderer and their transparent clickable
  // faces from GlobalCubeFullLODInstancedRenderer.
  //
  // SCALE FIX: membership is added incrementally at classification time
  // (see mountObjectInternal).  This memo only performs a FULL rebuild when
  // cubeStore reports an external unmodified-relevant change
  // (_unmodifiedVersion — e.g. user edits face colors/texts after import)
  // or when removals purged members (mountedVersion).  Rebuilds preserve
  // the previous Set IDENTITY when contents are unchanged so downstream
  // identity checks (ObjectRenderer's memo comparator) don't cascade.
  const unmodifiedVersion = useCubeStore((s) => s._unmodifiedVersion);
  const lastUnmodifiedVersionRef = useRef(-1);
  const unmodifiedCubeIds = useMemo(() => {
    // mountedVersion also invalidates after removal purges even when
    // _unmodifiedVersion itself is unchanged.
    void mountedVersion;
    if (unmodifiedVersion !== lastUnmodifiedVersionRef.current) {
      lastUnmodifiedVersionRef.current = unmodifiedVersion;
      const cubesMap = useCubeStore.getState().cubes;
      const ids = new Set();
      for (const cube of cubeArrRef.current) {
        if (cube.merfolkData?.isContainer) continue;
        if (cube.merfolkData?.isRepoContainer) continue;
        if (isCubeUnmodified(cube.id, cubesMap, cube.headerText, cube)) {
          ids.add(cube.id);
        }
      }
      // Preserve identity when the rebuilt set matches the previous one.
      const prev = unmodifiedCubeIdsRef.current;
      let same = prev !== null && prev.size === ids.size;
      if (same) {
        for (const id of ids) {
          if (!prev.has(id)) { same = false; break; }
        }
      }
      if (!same) unmodifiedCubeIdsRef.current = ids;
    }
    return unmodifiedCubeIdsRef.current;
  }, [unmodifiedVersion, mountedVersion]);

  // NAMED-CUBE FAST PATH: headerText-only cubes stay instanced (see
  // isCubeUnmodified) and their names are drawn by these shared billboards,
  // mirroring the container-header pattern.  A cube that leaves the
  // unmodified set (selected or genuinely edited) is skipped here because
  // its mounted <Cube> renders its own interactive label instead.
  const namedCubeLabels = useMemo(() => {
    void mountedVersion; // invalidation: cubeArrRef content changes bump it
    const out = [];
    for (const obj of cubeArrRef.current) {
      if (!obj.headerText) continue;
      if (obj.merfolkData?.isContainer || obj.merfolkData?.isRepoContainer) continue;
      if (!unmodifiedCubeIds.has(obj.id)) continue;
      if (selectedId === obj.id) continue;
      const halfHeight = (obj.scale?.[1] || 1) * 5;
      out.push({
        id: obj.id,
        label: obj.headerText,
        textStyle: obj.textStyle,
        position: [
          obj.position[0],
          obj.position[1] + halfHeight + 5,
          obj.position[2],
        ],
      });
    }
    return out;
  }, [mountedVersion, unmodifiedCubeIds, selectedId]);

  // Click handler for the instanced full-LOD renderer — selects the cube,
  // which promotes it to a full <Cube> component on next render.
  const handleInstancedCubeClick = useMemo(() => {
    return (cubeId) => handleObjectClick(cubeId);
  }, [handleObjectClick]);

  // Render individual objects (progressively mounted to prevent freezes).
  //
  // SCALE FIX: element REUSE.  The mounted list is append-ordered, so each
  // batch only appends a handful of genuinely new elements at the tail.
  // Elements are reused whenever the object reference at an index is
  // unchanged (React then skips unchanged children entirely thanks to
  // ObjectRenderer's memo comparator).  The old implementation recreated
  // ALL mounted elements on every batch — O(N²) cumulative createElement +
  // reconciliation cost, which froze imports around ~9k of 92k objects.
  // Removals shift indices, but the identity guard simply recreates from
  // the first mismatch (rare, unload-time only).  Handler-prop changes
  // intentionally rebuild everything (they change rarely).
  const renderedElementsRef = useRef([]);
  const renderedSourcesRef = useRef([]);
  // Signature of every non-list prop captured inside the elements.  Element
  // reuse is only valid while ALL of them are unchanged — any handler or
  // selection change must force a full rebuild (matching the old map()
  // semantics), otherwise children would render stale props.
  const renderedDepsSigRef = useRef(null);
  const renderedObjects = useMemo(() => {
    const arr = progressiveVisibleObjects;
    const depSig = [
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
    ];
    const prevSig = renderedDepsSigRef.current;
    let depsUnchanged = prevSig !== null && prevSig.length === depSig.length;
    if (depsUnchanged) {
      for (let d = 0; d < depSig.length; d++) {
        if (!Object.is(prevSig[d], depSig[d])) {
          depsUnchanged = false;
          break;
        }
      }
    }
    const prevElements = depsUnchanged ? renderedElementsRef.current : null;
    const prevSources = depsUnchanged ? renderedSourcesRef.current : null;
    const out = new Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
      const obj = arr[i];
      if (prevElements !== null && prevElements[i] && prevSources[i] === obj) {
        out[i] = prevElements[i];
      } else {
        out[i] = (
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
        );
      }
    }
    renderedDepsSigRef.current = depSig;
    renderedElementsRef.current = out;
    renderedSourcesRef.current = arr;
    return out;
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

      {/* Names for instanced-rendered (headerText-only) cubes */}
      {namedCubeLabels.map((header) => (
        <AtlasTextSprite
          key={`instanced-name-${header.id}`}
          text={header.label}
          position={header.position}
          style={{
            ...(header.textStyle || {}),
            isHeaderText: true,
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
