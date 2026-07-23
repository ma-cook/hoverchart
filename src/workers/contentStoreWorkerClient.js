/**
 * contentStoreWorkerClient.js
 *
 * Provides a lazily-initialised Comlink proxy for the content store worker.
 */

import { wrap } from 'comlink';

import ContentStoreWorkerConstructor from './contentStoreWorker.js?worker';

/** @type {import('comlink').Remote<import('./contentStoreWorker').workerApi> | null} */
let _proxy = null;
/** @type {Worker | null} */
let _worker = null;

/**
 * Return the singleton Comlink proxy for the content store worker.
 * The underlying Worker is created on first call.
 */
export function getContentStoreWorker() {
  if (!_proxy) {
    _worker = new ContentStoreWorkerConstructor();
    _proxy = wrap(_worker);
  }
  return _proxy;
}
