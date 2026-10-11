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

    // A fatal worker error (uncaught, outside a Comlink handler) would leave
    // in-flight proxy calls hanging forever.  Tear the worker down so callers
    // reject / time out and the next request lazily builds a fresh worker.
    worker.onerror = (e) => {
      console.error('[textAtlasWorker] fatal worker error:', e?.message || e);
      try {
        terminateTextAtlasWorker();
      } catch (err) {
        console.error('[textAtlasWorker] failed to terminate after error:', err);
      }
    };

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
