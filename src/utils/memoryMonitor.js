/**
 * memoryMonitor.js
 *
 * Lightweight helpers for detecting high JS-heap pressure at runtime.
 *
 * `performance.memory` is a Chromium-only extension (used by Chrome/Edge);
 * on other browsers it is undefined and these helpers no-op.  This is a
 * best-effort early-warning signal — a memory-pressure hit means the tab is
 * close to its heap limit and heavy work (large repo scans, progressive
 * mounting) should be surfaced to the user rather than silently OOM-ing.
 */

export function getMemoryUsageInfo() {
  const mem = typeof performance !== 'undefined' ? performance.memory : null;
  if (!mem || !mem.jsHeapSizeLimit) return null;
  return {
    used: mem.usedJSHeapSize,
    limit: mem.jsHeapSizeLimit,
    ratio: mem.usedJSHeapSize / mem.jsHeapSizeLimit,
  };
}

/**
 * Returns true when the JS heap is above the given threshold fraction of its
 * limit.  Returns false when memory telemetry is unavailable.
 */
export function checkMemoryPressure(threshold = 0.85) {
  const info = getMemoryUsageInfo();
  return info ? info.ratio >= threshold : false;
}

/**
 * Logs a throttled warning when heap pressure is high and sets the global
 * `window._memoryPressureHigh` flag so UI code can surface a non-blocking
 * notice.  Returns true if pressure was detected.
 */
export function reportMemoryPressureOnce(context = '') {
  const info = getMemoryUsageInfo();
  if (!info) return false;
  if (info.ratio < 0.85) return false;

  const now = Date.now();
  if (window._lastMemoryPressureLog && now - window._lastMemoryPressureLog < 10000) {
    return true;
  }
  window._lastMemoryPressureLog = now;
  window._memoryPressureHigh = true;
  console.warn(
    `⚠️  [memory-pressure] High JS heap usage detected ${context ? `(${context}) ` : ''}` +
      `${(info.used / 1048576).toFixed(0)}MB / ${(info.limit / 1048576).toFixed(0)}MB ` +
      `(${(info.ratio * 100).toFixed(0)}%). Consider scanning a smaller repository or ` +
      `limiting the diagram size to avoid an out-of-memory crash.`
  );
  return true;
}
