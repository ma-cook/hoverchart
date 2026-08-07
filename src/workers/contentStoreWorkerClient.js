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
/** @type {number | null} */
let _lastHeartbeat = null;
let _heartbeatLogged = false;

/**
 * Return the singleton Comlink proxy for the content store worker.
 * The underlying Worker is created on first call.
 */
export function getContentStoreWorker() {
  if (!_proxy) {
    _worker = new ContentStoreWorkerConstructor();
    attachDiagnostics(_worker);
    _proxy = wrap(_worker);
  }
  return _proxy;
}

function attachDiagnostics(worker) {
  worker.addEventListener('message', (ev) => {
    if (ev.data && typeof ev.data.__contentStoreHeartbeat === 'number') {
      _lastHeartbeat = ev.data.__contentStoreHeartbeat;
      if (!_heartbeatLogged) {
        _heartbeatLogged = true;
        console.log('[contentStoreWorker] first heartbeat received');
      }
    }
  });
  worker.onerror = (e) => {
    console.warn(
      '[contentStoreWorker] error event:',
      e.message,
      e.filename ? `at ${e.filename}:${e.lineno}` : '',
      `t=${Date.now()}`
    );
  };
  worker.onmessageerror = (e) => {
    console.warn('[contentStoreWorker] messageerror event:', e, `t=${Date.now()}`);
  };
}

export function getContentStoreWorkerHealth() {
  return {
    created: _worker !== null,
    lastHeartbeatAgeMs: _lastHeartbeat ? Date.now() - _lastHeartbeat : null,
    heartbeatSeen: _lastHeartbeat !== null,
  };
}

/**
 * Console/DevTools helper. Spawns a FRESH content store worker (independent of
 * the app's singleton) and pings it using the raw Comlink wire protocol so we
 * can tell whether the module loads and answers at all, separate from any
 * app-level state. Logs the exact load error if the worker fails to start.
 */
export async function diagnoseContentStoreWorker() {
  const report = { created: false, error: null, rawReply: null, comlinkReply: null };
  let worker;
  try {
    worker = new ContentStoreWorkerConstructor();
    report.created = true;
  } catch (err) {
    report.error = `construction threw: ${err.message}`;
    console.warn('[contentStoreWorker] diagnose result:', report);
    return report;
  }

  worker.onerror = (e) => {
    report.error = `load/runtime error: ${e.message} at ${e.filename || ''}:${e.lineno || ''}`;
    console.warn('[contentStoreWorker] diagnose error event:', report.error, `t=${Date.now()}`);
  };
  worker.onmessageerror = (e) => {
    report.error = `messageerror: ${e.message || e}`;
    console.warn('[contentStoreWorker] diagnose messageerror:', report.error, `t=${Date.now()}`);
  };

  const rawPing = new Promise((resolve) => {
    worker.onmessage = (ev) => {
      if (ev.data && ev.data.id === 'diag-ping') {
        resolve(ev.data);
      }
    };
    worker.postMessage({
      id: 'diag-ping',
      type: 'APPLY',
      path: ['ping'],
      argumentList: [],
    });
    setTimeout(() => resolve('TIMEOUT'), 3000);
  });

  report.rawReply = await rawPing;
  console.log('[contentStoreWorker] diagnose raw ping result:', report.rawReply, `t=${Date.now()}`);

  try {
    worker.terminate();
  } catch { /* ignore */ }
  console.warn('[contentStoreWorker] diagnose result:', report);
  return report;
}

// Expose diagnostics on window so they survive tree-shaking and can be called
// from DevTools without importing anything.
if (typeof window !== 'undefined') {
  window.diagnoseContentStoreWorker = diagnoseContentStoreWorker;
  window.getContentStoreWorkerHealth = getContentStoreWorkerHealth;
}
