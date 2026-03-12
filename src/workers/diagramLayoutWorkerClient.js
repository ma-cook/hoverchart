/**
 * diagramLayoutWorkerClient.js
 *
 * Provides a lazily-initialised Comlink proxy for the 2D diagram layout worker.
 * Import `getDiagramLayoutWorker()` anywhere on the main thread to get the proxy.
 * The worker is created once and reused for the lifetime of the page.
 *
 * Usage:
 *   import { getDiagramLayoutWorker } from '../workers/diagramLayoutWorkerClient';
 *
 *   const worker = getDiagramLayoutWorker();
 *   const result = await worker.computeLayout(nodesEntries, connections, hierarchy, { filter: 'all' });
 */

import { wrap, releaseProxy } from 'comlink';

// Vite's `?worker` suffix bundles the file as a separate worker chunk and
// returns a Worker constructor – no extra plugins required.
import DiagramLayoutWorkerConstructor from './diagramLayoutWorker.js?worker';

/** @type {import('comlink').Remote<import('./diagramLayoutWorker').workerApi> | null} */
let _proxy = null;
/** @type {Worker | null} */
let _worker = null;

/**
 * Return the singleton Comlink proxy for the 2D diagram layout worker.
 * The underlying Worker is created on first call.
 */
export function getDiagramLayoutWorker() {
  if (!_proxy) {
    _worker = new DiagramLayoutWorkerConstructor();
    _proxy = wrap(_worker);
  }
  return _proxy;
}

/**
 * Tear down the worker and reset the singleton.
 * Call this if you need to force a fresh worker (e.g. after an unrecoverable error).
 */
export function terminateDiagramLayoutWorker() {
  if (_proxy) {
    _proxy[releaseProxy]();
    _proxy = null;
  }
  if (_worker) {
    _worker.terminate();
    _worker = null;
  }
}
