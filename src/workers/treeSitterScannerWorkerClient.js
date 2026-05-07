/**
 * treeSitterScannerWorkerClient.js
 *
 * Lazy-singleton Comlink proxy for the tree-sitter scanner worker.
 * Mirrors the pattern used by `markdownLayoutWorkerClient.js`.
 *
 * Usage:
 *   import { getTreeSitterScannerWorker } from '../workers/treeSitterScannerWorkerClient';
 *
 *   const worker = getTreeSitterScannerWorker();
 *   const symbols = await worker.extractSymbols(source, 'python');
 */

import { wrap, releaseProxy } from 'comlink';
import TreeSitterScannerWorkerConstructor from './treeSitterScannerWorker.js?worker';

/** @type {import('comlink').Remote<any> | null} */
let _proxy = null;
/** @type {Worker | null} */
let _worker = null;

export function getTreeSitterScannerWorker() {
  if (!_proxy) {
    _worker = new TreeSitterScannerWorkerConstructor();
    _proxy = wrap(_worker);
  }
  return _proxy;
}

export function terminateTreeSitterScannerWorker() {
  if (_proxy) {
    _proxy[releaseProxy]();
    _proxy = null;
  }
  if (_worker) {
    _worker.terminate();
    _worker = null;
  }
}
