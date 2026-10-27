/**
 * markdownLayoutWorkerClient.js
 *
 * Client for the markdown layout web worker. Provides a lazy-initialized
 * Comlink-wrapped worker instance that offloads the heavy layout pipeline
 * off the main thread.
 */

import { wrap } from 'comlink';

let workerInstance = null;
let workerProxy = null;

const createWorker = () => {
  if (typeof Worker === 'undefined') {
    throw new Error('Web Workers are not supported in this environment');
  }

  // Vite will bundle this as a worker
  workerInstance = new Worker(
    new URL('./markdownLayoutWorker.js', import.meta.url),
    { type: 'module' }
  );

  workerProxy = wrap(workerInstance);
  return workerProxy;
};

export const getMarkdownLayoutWorker = () => {
  if (!workerProxy) {
    return createWorker();
  }
  return workerProxy;
};

export const terminateMarkdownLayoutWorker = () => {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
    workerProxy = null;
  }
};
