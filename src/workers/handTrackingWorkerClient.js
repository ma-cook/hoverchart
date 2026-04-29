/**
 * handTrackingWorkerClient.js
 *
 * Lazy Comlink proxy for the hand tracking worker. Mirrors the pattern in
 * `markdownLayoutWorkerClient.js`.
 */

import { wrap, releaseProxy } from 'comlink';
import HandTrackingWorkerConstructor from './handTrackingWorker.js?worker';

/** @type {import('comlink').Remote<any> | null} */
let _proxy = null;
/** @type {Worker | null} */
let _worker = null;

export function getHandTrackingWorker() {
  if (!_proxy) {
    _worker = new HandTrackingWorkerConstructor();
    _proxy = wrap(_worker);
  }
  return _proxy;
}

export function terminateHandTrackingWorker() {
  if (_proxy) {
    try { _proxy[releaseProxy](); } catch { /* ignore */ }
    _proxy = null;
  }
  if (_worker) {
    _worker.terminate();
    _worker = null;
  }
}
