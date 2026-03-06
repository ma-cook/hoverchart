/**
 * spatialIndexWorkerClient.js
 *
 * Provides a lazily-initialised Comlink proxy for the spatial index worker.
 *
 * Usage:
 *   import { getSpatialIndexWorker } from '../workers/spatialIndexWorkerClient';
 *
 *   const worker = getSpatialIndexWorker();
 *   const lodUpdates = await worker.computeLODLevels(cameraPos, parentIds, childIds, currentLod);
 */

import { wrap, releaseProxy } from 'comlink';

// Vite's `?worker` suffix bundles the file as a separate worker chunk.
import SpatialIndexWorkerConstructor from './spatialIndexWorker.js?worker';

/** @type {import('comlink').Remote<import('./spatialIndexWorker').workerApi> | null} */
let _proxy = null;
/** @type {Worker | null} */
let _worker = null;

/**
 * Return the singleton Comlink proxy for the spatial index worker.
 * The underlying Worker is created on first call.
 */
export function getSpatialIndexWorker() {
  if (!_proxy) {
    _worker = new SpatialIndexWorkerConstructor();
    _proxy = wrap(_worker);
  }
  return _proxy;
}

/**
 * Tear down the worker and reset the singleton.
 */
export function terminateSpatialIndexWorker() {
  if (_proxy) {
    _proxy[releaseProxy]();
    _proxy = null;
  }
  if (_worker) {
    _worker.terminate();
    _worker = null;
  }
}
