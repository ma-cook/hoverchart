# Task: 2. Bulk-delete ghost objects (correctness)

Likely cause: handleDeleteAllCells in UIOverlay.jsx:839 releases _bulkDeleteInProgress after a fixed 5s, but the cloud function may still be deleting. During the gap, active spatial subscriptions in spatialObjectsService.js:614 can re-emit batch-added to the App reducer at App.jsx:647, repopulating the store.

Steps:

Replace the 5s setTimeout unlock with awaited backend completion.
In the batch-added reducer in App.jsx:647, short-circuit to no-op when _bulkDeleteInProgress is set.
After the function resolves, force-cleanup spatial-objects subscriptions for the loaded cells, then call useSpatialManagerStore.getState().resetSpatialManager() (see spatialManagerStore.js:671) and re-init.
Run a getObjectsFromCells sanity pass; if any docs remain, retry once.