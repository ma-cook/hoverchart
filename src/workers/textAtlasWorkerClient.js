/**
 * textAtlasWorkerClient.js
 *
 * Lazy singleton Comlink wrapper for the text atlas OffscreenCanvas worker.
 * The worker is only instantiated when first requested.
 */

import { wrap, releaseProxy } from 'comlink';

let instance = null;
let worker = null;

/**
 * Get (or create) the shared text atlas worker proxy.
 */
export function getTextAtlasWorker() {
  if (!instance) {
    worker = new Worker(
      new URL('./textAtlasWorker.js', import.meta.url),
      { type: 'module' }
    );
    instance = wrap(worker);
  }
  return instance;
}

/**
 * Terminate the worker and release the Comlink proxy.
 */
export function terminateTextAtlasWorker() {
  if (instance) {
    instance[releaseProxy]();
    instance = null;
  }
  if (worker) {
    worker.terminate();
    worker = null;
  }
}
