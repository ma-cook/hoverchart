// TEMPORARY PERF INSTRUMENTATION — remove after import-freeze investigation.
// Usage: importPerf.begin('label'); ...work...; importPerf.end('label');
// Cumulative totals + max sample are logged every REPORT_INTERVAL_MS and on
// window.__importPerf.report().

const enabled =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('perf');

const marks = new Map(); // label -> { total, count, max, start }
let lastReportAt = 0;
const REPORT_INTERVAL_MS = 5000;

const report = () => {
  const rows = [...marks.entries()]
    .map(([label, m]) => ({ label, total: m.total, count: m.count, max: m.max }))
    .sort((a, b) => b.total - a.total);
  console.table(rows);
};

const api = {
  enabled,
  begin(label) {
    if (!enabled) return;
    if (!marks.has(label)) {
      marks.set(label, { total: 0, count: 0, max: 0 });
    }
    marks.get(label)._start = performance.now();
  },
  end(label) {
    if (!enabled) return;
    const m = marks.get(label);
    if (!m || m._start === undefined) return;
    const dt = performance.now() - m._start;
    m._start = undefined;
    m.total += dt;
    m.count += 1;
    if (dt > m.max) m.max = dt;
    const now = performance.now();
    if (now - lastReportAt > REPORT_INTERVAL_MS) {
      lastReportAt = now;
      report();
    }
  },
  // One-line timestamped marker — for localizing freezes ("last line before
  // the console goes silent" identifies the blocking phase).
  mark(label) {
    if (!enabled) return;
    console.log(`[perf][t+${((performance.now()) / 1000).toFixed(1)}s] ${label}`);
  },
  report,
};

// ── Freeze watchdogs (only with ?perf) ────────────────────────────────────
// 1. Heartbeat: if these ticks STOP appearing in the console, the main thread
//    is blocked by one long synchronous task — the last [perf] line before
//    the gap names the phase that started it.
// 2. longtask observer: logs every main-thread task >150ms as it ENDS with
//    its duration, so even a silent block is bounded and timestamped.
if (enabled && typeof window !== 'undefined') {
  const t0 = performance.now();
  setInterval(() => {
    console.log(`[perf][tick] alive t=${((performance.now() - t0) / 1000).toFixed(1)}s`);
  }, 500);
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(`[perf][longtask] ${Math.round(entry.duration)}ms ended t=${(entry.startTime / 1000).toFixed(1)}s`);
      }
    }).observe({ entryTypes: ['longtask'] });
  } catch { /* unsupported browser */ }
}

window.__importPerf = api;
export default api;
