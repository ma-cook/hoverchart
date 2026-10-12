// TEMPORARY diagnostic — captures a real V8 sampling CPU profile for the
// import-freeze investigation.  Enable with ?cpuprofile (combine with ?perf).
//
// Why: the importPerf marks only show *where in our code* time is spent; they
// cannot attribute work inside React's render or native/framework calls, and
// their spans overlap (totals exceed wall time).  console.profile()/profileEnd()
// instead drive the browser's real sampling profiler, which walks the JS stack
// on a background thread even while the main thread is blocked — so it captures
// the actual function-level breakdown of a synchronous freeze.
//
// Usage: open ?perf&cpuprofile, reproduce the load, then in DevTools open the
// "Performance" panel (or the older "Profiler" panel), select/export the
// "hoverchart-import" recording as a .cpuprofile file, and send it.

const enabled =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('cpuprofile');

let profiling = false;

export const cpuProfileEnabled = enabled;

export function startCpuProfile(label = 'hoverchart-import') {
  if (!enabled || profiling) return;
  if (typeof console === 'undefined' || typeof console.profile !== 'function') {
    console.warn('[cpuprofile] console.profile() is unavailable in this browser');
    return;
  }
  try {
    console.profile(label);
    profiling = true;
    console.info(`[cpuprofile] sampling profile "${label}" started — reproduce the load now`);
  } catch {
    /* ignore */
  }
}

export function stopCpuProfile() {
  if (!profiling) return;
  profiling = false;
  try {
    console.profileEnd();
  } catch {
    /* ignore */
  }
  console.info(
    '[cpuprofile] sampling profile stopped — DevTools → Performance panel → ' +
      'select the "hoverchart-import" profile → Save/Export as .cpuprofile, then send it.'
  );
}

if (typeof window !== 'undefined' && enabled) {
  window.__cpuProfile = { start: startCpuProfile, stop: stopCpuProfile };
}
