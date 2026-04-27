/**
 * handTrackingWorkerClient.js
 *
 * Provides a lazily-initialised Comlink proxy for the hand-tracking worker.
 * Import `getHandTrackingWorker()` anywhere on the main thread to get the
 * proxy.  The worker is created once and reused for the lifetime of the page.
 *
 * Usage:
 *   import { getHandTrackingWorker } from '../workers/handTrackingWorkerClient';
 *
 *   const worker = getHandTrackingWorker();
 *   await worker.init(modelUrl);
 *   const result = await worker.detect(imageBitmap, timestampMs);
 */

import { wrap, releaseProxy } from 'comlink';

/** @type {import('comlink').Remote<{ init: Function, detect: Function, dispose: Function }> | null} */
let _proxy = null;
/** @type {Worker | null} */
let _worker = null;

/**
 * Return the singleton Comlink proxy for the hand-tracking worker.
 * The underlying Worker is created on first call.
 *
 * NOTE: must be a module worker (`type: 'module'`) because MediaPipe's
 * `@mediapipe/tasks-vision` bundle uses dynamic `import()` internally to
 * load its WASM loader. Classic workers throw `self.import is not a function`.
 */
export function getHandTrackingWorker() {
  if (!_proxy) {
    _worker = new Worker(
      new URL('./handTrackingWorker.js', import.meta.url),
      { type: 'module' }
    );
    _proxy = wrap(_worker);
  }
  return _proxy;
}

/**
 * Tear down the worker and reset the singleton.
 * Call this if you need to force a fresh worker (e.g. after an unrecoverable error).
 */
export function terminateHandTrackingWorker() {
  if (_proxy) {
    _proxy[releaseProxy]();
    _proxy = null;
  }
  if (_worker) {
    _worker.terminate();
    _worker = null;
  }
}
