# Task: 3. Bulk-delete non-blocking UX (performance)

Backend uses a collectionGroup('objects') scan + path-prefix filter in index.js:394, expensive on large datasets, and the UI awaits the whole thing.

Steps:

Refactor bulkDelete to iterate users/{uid}/spaces/{spaceId}/cells directly and parallelize per-cell objects/connections deletion in batches of 500.
Add async-job mode: endpoint returns jobId immediately; status persisted at users/{uid}/spaces/{spaceId}/_deleteJobs/{jobId}. Add a getDeleteJobStatus endpoint.
Frontend: clear local state immediately, return UI control, poll job status with a small toast.
Cutoff protection: backend reads jobStartTime from job doc and skips any docs with lastUpdated > cutoff so newly-created objects are preserved.
Split locks: keep blocking incoming snapshot adds, but allow saves of new objects (loosen the guard at spatialObjectsService.js:189).