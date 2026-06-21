/**
 * treeSitterScannerWorkerClient.js
 *
 * Lazy-singleton pool of Comlink proxies for the tree-sitter scanner worker.
 * Uses multiple workers (up to hardwareConcurrency) so the main thread can
 * submit several parse jobs in parallel instead of queueing behind a single
 * worker.
 *
 * Usage:
 *   import { getTreeSitterScannerWorker } from '../workers/treeSitterScannerWorkerClient';
 *
 *   const worker = getTreeSitterScannerWorker();
 *   const symbols = await worker.extractSymbols(source, 'python');
 *
 * Calls to getTreeSitterScannerWorker() return workers in round‑robin order.
 */

import { wrap, releaseProxy } from 'comlink';
import TreeSitterScannerWorkerConstructor from './treeSitterScannerWorker.js?worker';

const POOL_SIZE = Math.min(navigator.hardwareConcurrency || 4, 6); // cap at 6

/** @type {Array<{ worker: Worker, proxy: import('comlink').Remote<any> }>} */
let _pool = null;
let _nextIndex = 0;

function ensurePool() {
  if (_pool) return;
  _pool = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const worker = new TreeSitterScannerWorkerConstructor();
    const proxy = wrap(worker);
    _pool.push({ worker, proxy });
  }
}

/**
 * Return the next available worker proxy (round‑robin).
 * All proxies expose the same `extractSymbols(source, language)` API.
 */
export function getTreeSitterScannerWorker() {
  ensurePool();
  const entry = _pool[_nextIndex % _pool.length];
  _nextIndex++;
  return entry.proxy;
}

/**
 * Terminate all workers in the pool and release their Comlink proxies.
 */
export function terminateTreeSitterScannerWorker() {
  if (!_pool) return;
  for (const entry of _pool) {
    entry.proxy[releaseProxy]();
    entry.worker.terminate();
  }
  _pool = null;
  _nextIndex = 0;
}
