# Task: 4. Cell indicator accuracy

The hook in useSpatialManager.js:110 deliberately derives currentCellCoords from controls.target (the focus point) to fix a prior zoom-unload bug. The top-right pill in SpacePresenceAvatars.jsx:83 reads that same value, so it shows the focus cell, not the camera cell.

Steps:

Compute and expose a separate cameraCellCoords from camera.position inside handleCameraMove.
Add cameraCellCoords state to spatialManagerStore.js:34.
In App.jsx:1798, pass cameraCellCoords to UIOverlay as currentCell. Leave currentCellCoords untouched for loading logic.

---

## Verification

Screen share: toggle 10× on a plane — exactly one picker per toggle; cancel shows no error.
Delete-all on 1k+ objects: zero ghost objects after completion; pan/zoom during delete shows none.
Delete-all on 5k+ objects with async=true: UI returns within ~500ms; create 5 objects within 2s — all persist after job completes.
Camera at world position (10000, 0, 0): pill shows 1,0,0 (CELL_SIZE=6667). Orbit without moving camera: pill stays put.