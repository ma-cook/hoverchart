/**
 * markdownLayoutWorkerClient.js
 *
 * Provides a lazily-initialised Comlink proxy for the markdown layout worker.
 * Import `getMarkdownLayoutWorker()` anywhere on the main thread to get the
 * proxy.  The worker is created once and reused for the lifetime of the page.
 *
 * Usage:
 *   import { getMarkdownLayoutWorker } from '../workers/markdownLayoutWorkerClient';
 *
 *   const worker = getMarkdownLayoutWorker();
 *   const result = await worker.computeLayout(markdownText, basePosition);
 */

import { wrap, releaseProxy } from 'comlink';

// Vite's `?worker` suffix bundles the file as a separate worker chunk and
// returns a Worker constructor – no extra plugins required.
import MarkdownLayoutWorkerConstructor from './markdownLayoutWorker.js?worker';

/** @type {import('comlink').Remote<import('./markdownLayoutWorker').workerApi> | null} */
let _proxy = null;
/** @type {Worker | null} */
let _worker = null;

/**
 * Return the singleton Comlink proxy for the markdown layout worker.
 * The underlying Worker is created on first call.
 */
export function getMarkdownLayoutWorker() {
  if (!_proxy) {
    _worker = new MarkdownLayoutWorkerConstructor();
    _proxy = wrap(_worker);
  }
  return _proxy;
}

/**
 * Tear down the worker and reset the singleton.
 * Call this if you need to force a fresh worker (e.g. after an unrecoverable error).
 */
export function terminateMarkdownLayoutWorker() {
  if (_proxy) {
    _proxy[releaseProxy]();
    _proxy = null;
  }
  if (_worker) {
    _worker.terminate();
    _worker = null;
  }
}
