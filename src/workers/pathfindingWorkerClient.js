/**
 * pathfindingWorkerClient.js
 *
 * Lazy singleton Comlink proxy for the pathfinding Web Worker.
 *
 * Usage:
 *   import { getPathfindingWorker } from '../workers/pathfindingWorkerClient';
 *
 *   const worker = getPathfindingWorker();
 *   const results = await worker.computePathsBatch(requests, objects);
 */

import { wrap, releaseProxy } from 'comlink';

// Vite bundles this as a separate worker chunk automatically.
import PathfindingWorkerConstructor from './pathfindingWorker.js?worker';

/** @type {import('comlink').Remote<import('./pathfindingWorker').workerApi> | null} */
let _proxy = null;
/** @type {Worker | null} */
let _worker = null;

/**
 * Return the singleton Comlink proxy for the pathfinding worker.
 * The underlying Worker is created on first call.
 */
export function getPathfindingWorker() {
  if (!_proxy) {
    _worker = new PathfindingWorkerConstructor();
    _proxy = wrap(_worker);
  }
  return _proxy;
}

/**
 * Tear down the worker and reset the singleton.
 */
export function terminatePathfindingWorker() {
  if (_proxy) {
    _proxy[releaseProxy]();
    _proxy = null;
  }
  if (_worker) {
    _worker.terminate();
    _worker = null;
  }
}
