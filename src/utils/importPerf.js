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

// Ring buffer of recent events (label + wall time).  Lets the longtask
// observer ATTRIBUTE a main-thread block to the last event that ran before
// it started — "the freeze began right after <label>".
const eventLog = [];
const EVENT_LOG_MAX = 64;
const _logEvent = (label) => {
  eventLog.push({ t: performance.now(), label });
  if (eventLog.length > EVENT_LOG_MAX) eventLog.shift();
};

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
    _logEvent(`begin:${label}`);
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
    _logEvent(`end:${label} (${Math.round(dt)}ms)`);
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
    _logEvent(label);
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
        // labels the START time as "ended" (legacy wording); keep it so earlier
        // transcripts stay consistent, but now ATTRIBUTE the block via the
        // event ring buffer.
        const lastEvent = eventLog[eventLog.length - 1];
        const attribution = lastEvent
          ? ` — last event before start: ${lastEvent.label}`
          : '';
        console.log(`[perf][longtask] ${Math.round(entry.duration)}ms ended t=${(entry.startTime / 1000).toFixed(1)}s${attribution}`);
      }
    }).observe({ entryTypes: ['longtask'] });
  } catch { /* unsupported browser */ }
}

if (typeof window !== 'undefined') window.__importPerf = api;
export default api;
