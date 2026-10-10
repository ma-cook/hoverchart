# Unify LOD system: all components blue, one distance regime, merfolk-only gating

User-approved plan (decision Q&A recorded). Group containers stay out of LOD,
never gate contents; all components/sub-components/functions/classes/vars/hooks
use the SAME (child) distance thresholds and render their OWN color (blue).

## 1. lodStore.js — remove the parent regime
- Delete `LOD_THRESHOLDS_PARENT` (lines 36-39) and `LOD_THRESHOLDS_PARENT_SQ` (42-45).
- Delete `calculateParentLODLevel` (67-78).
- Update the header comment (lines 17-20) to say ALL objects use FULL<2000/MEDIUM<20000.

## 2. spatialIndexWorker.js — single distance, merfolk-only hierarchy
- Remove `LOD_PARENT_FULL_SQ`/`LOD_PARENT_MEDIUM_SQ` (117-118) and `parentLOD` (126-130).
- `_rebuildFlatBuffers`: stop setting `0x02` parent bit (line 102); keep `0x01` container bit.
- `computeLODLevels`: remove the dynamic parent override block (200-207); wasm call
  passes child thresholds for the parent args (225-232); JS fallback uses
  `childLOD(distanceSq)` unconditionally (264-265). Drop now-unused
  `parentIdList`/`childIdList` params (keep signature doc updated; main thread passes `[]`).
- Replace `computeSpatialContainment` (387-465) with `computeMerfolkHierarchy`:
  keep nodeId->objectId resolution + `parentNodeId` relationship building
  (399-418), keep `isParent||hasChildren -> parentIdList` as a robustness
  fallback, DELETE the container geometry half (420-462). Rename JSDoc.

## 3. LODManager.jsx — always child LOD, always merfolk hierarchy
- Import: remove `calculateParentLODLevel` (line 3).
- LOD selection loop (573-580): always `newLodLevel = calculateLODLevel(distanceSq)`.
- Containment effect (260-302): always call `worker.computeMerfolkHierarchy()`
  regardless of containers; on failure/worker-unavailable run the sync fallback.
- `computeContainmentSync` (305-382): rewrite as merfolk-only — build
  nodeId->objectId, resolve `parentNodeId` relationships, add
  `isParent||hasChildren` ids to parentIds; DELETE the container geometry loop
  (350-379) and the `containers.length === 0` gate (315).
- Worker LOD call (503-509): pass empty arrays for parent/child lists (no longer used).

## 4. Medium mesh renderers — always own color (blue)
- `GlobalCubeMediumLODRenderer.jsx:164-165`: `const color = cube.color || '#2a2a2a';` (keep childParentMap/parentIds — still used by visibleAtTier).
- `GlobalDodecahedronMediumLODRenderer.jsx:137-138`: `const color = dodeca.color || '#888888';`; remove now-unused `childParentMap`/`parentIds` subscriptions + deps (37-38, 54).
- `GlobalTetrahedronMediumLODRenderer.jsx:163-164`: `const color = tetra.color || '#808080';`; remove unused `childParentMap`/`parentIds` subs + deps (63-64, 80).
- `GlobalOctahedronMediumLODRenderer.jsx:~150-151`: same pattern as tetra.

## 5. objectMethods.js — persist parentNodeId only
- Stop writing `isParent`/`hasChildren` into merfolkData (237-239) — keep `parentNodeId`.
- Backfill patch (268-272): drop `isParent`/`hasChildren`; keep `parentNodeId` (+ codeFilePath fields).
- Keep local `nodeHasChildren` calc for `calculateHeaderStyle` (206-211).

## 6. Container headers — always visible
- `ObjectsRenderer.jsx:1318-1323`: pass `maxDistance={Infinity}` to the container-header `InstancedAtlasText`.
- No change needed to named-cube labels instance (still distance-culled intentionally).
- `InstancedAtlasText.jsx`: verify the import-deferred flush (219-246) fires once
  `bulkImportState.active` drops; add a safety: if `pageGroups` changed while an old
  poll was pending, restart polling (existing cleanup already handles this).

## Verification
- `npm run lint` (expect 0 errors, 16 pre-existing warnings) and `npm run build`.
- One app load: expect all dodeca/octa/tetra/cube components BLUE at every LOD,
  identical switch distance for all objects, internal leaf members hidden only
  when their parent is not FULL, sub-components always visible, group containers
  never hide contents, container header names visible at any zoom.