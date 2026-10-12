// Offline CPU-profile / Performance-trace analyzer for the import-freeze
// investigation.  Run:  node tools/analyze-trace.mjs <path-to-trace>
//
// Thread-aware: a Chrome trace contains CPU profiles for the page's main
// thread AND every worker/thread.  Only the main renderer thread can freeze the
// UI, so we bucket samples by thread and report each thread separately.
//
// Prints the top functions by SAMPLED SELF TIME per thread — the code actually
// burning that thread.  This is the attribution the in-app importPerf marks
// cannot give (they can't see inside React/native calls and their spans
// double-count).

import fs from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('usage: node tools/analyze-trace.mjs <trace.json|*.cpuprofile>');
  process.exit(1);
}

let raw;
try {
  raw = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (e) {
  console.error(`Failed to parse ${file}: ${e.message}`);
  process.exit(1);
}

const profiles = new Map(); // tid -> profile
const threadNames = new Map(); // tid -> name

function getProfile(tid) {
  let p = profiles.get(tid);
  if (!p) {
    p = { tid, nodes: new Map(), self: new Map(), total: 0, samples: 0, start: null, end: null };
    profiles.set(tid, p);
  }
  return p;
}
function addNodes(p, list) {
  if (!Array.isArray(list)) return;
  for (const n of list) if (n && n.id !== undefined) p.nodes.set(n.id, n);
}
function accSamples(p, samples, deltas) {
  if (!Array.isArray(samples) || !Array.isArray(deltas)) return false;
  const n = Math.min(samples.length, deltas.length);
  for (let i = 0; i < n; i++) {
    const id = samples[i];
    const dt = deltas[i] || 0;
    p.self.set(id, (p.self.get(id) || 0) + dt);
    p.total += dt;
    p.samples += 1;
  }
  return n > 0;
}
function bumpWindow(p, s, e) {
  if (typeof s === 'number') p.start = p.start == null ? s : Math.min(p.start, s);
  if (typeof e === 'number') p.end = p.end == null ? e : Math.max(p.end, e);
}

// ── raw .cpuprofile (single thread) ──────────────────────────────────────
const cp0 = raw && (raw.cpuProfile || raw);
if (cp0 && Array.isArray(cp0.nodes) && Array.isArray(cp0.samples)) {
  const p = profiles.get('cpuprofile') || (() => { const q = { nodes: new Map(), self: new Map(), total: 0, samples: 0, start: null, end: null }; profiles.set('cpuprofile', q); return q; })();
  addNodes(p, cp0.nodes);
  accSamples(p, cp0.samples, cp0.timeDeltas);
  bumpWindow(p, cp0.startTime, cp0.endTime);
  threadNames.set('cpuprofile', 'main');
}

// ── Performance trace ────────────────────────────────────────────────────
const events = Array.isArray(raw) ? raw : Array.isArray(raw.traceEvents) ? raw.traceEvents : null;
if (events) {
  for (const ev of events) {
    if (!ev || !ev.name) continue;
    const d = (ev.args && ev.args.data) || null;
    if (ev.name === 'thread_name' && ev.args && ev.args.name !== undefined) {
      threadNames.set(ev.tid, ev.args.name);
      continue;
    }
    if (!d) continue;
    const tid = ev.tid != null ? ev.tid : 'unknown';
    if (ev.name === 'Profile' || ev.name === 'CpuProfile') {
      const cp = d.cpuProfile || d;
      const p = profiles.get(tid) || (profiles.set(tid, { nodes: new Map(), self: new Map(), total: 0, samples: 0, start: null, end: null }), profiles.get(tid));
      addNodes(p, cp.nodes);
      bumpWindow(p, cp.startTime ?? d.startTime, cp.endTime ?? d.endTime);
    } else if (ev.name === 'ProfileChunk') {
      const cp = d.cpuProfile || d;
      const p = profiles.get(tid) || (profiles.set(tid, { nodes: new Map(), self: new Map(), total: 0, samples: 0, start: null, end: null }), profiles.get(tid));
      addNodes(p, cp.nodes);
      accSamples(p, cp.samples, Array.isArray(d.timeDeltas) ? d.timeDeltas : cp.timeDeltas);
    }
  }
}

const ms = (us) => (us / 1000).toFixed(1);
const shortUrl = (u) => {
  if (!u) return '(native)';
  const parts = u.split(/[\\/]/);
  return parts[parts.length - 1] || u;
};
const isNoise = (name, url) =>
  /^\((idle|program|root|garbage collector|deoptimization|unoptimized)\)$/.test(name) ||
  /^(v8::|Legacy|ThreadPool|ERASURE|Blink|Wait|Idle|Program)/.test(name) ||
  /installHook/.test(url || '') ||
  /cc::|gpu|viz::|base::|content::/.test(name);

const threads = [...profiles.entries()]
  .map(([tid, p]) => ({ tid, name: threadNames.get(tid) || `tid=${tid}`, p }))
  .filter((t) => t.p.total > 0)
  .sort((a, b) => b.p.total - a.p.total);

console.log(`\nfile: ${file}`);
console.log(`threads with CPU samples: ${threads.length}`);
for (const t of threads) {
  console.log(`  - ${t.name} (tid=${t.tid}): ${ms(t.p.total)} self, ${t.p.samples} samples`);
}

// Identify the main renderer thread heuristically (largest total that runs
// React/three/bundle code, or named CrRendererMain).
const mainTid =
  threads.find((t) => /RendererMain|CrRendererMain/.test(t.name))?.tid ??
  threads.find((t) => !/Worker|worker/.test(t.name))?.tid ??
  threads[0]?.tid;

for (const t of threads) {
  const isMain = t.tid === mainTid;
  // Aggregate self time by function (excluding pure-noise frames).
  const agg = new Map();
  for (const [id, us] of t.p.self) {
    const n = t.p.nodes.get(id);
    if (!n || !n.callFrame) continue;
    const cf = n.callFrame;
    const name = cf.functionName || '(anonymous)';
    const url = cf.url || '';
    if (isNoise(name, url)) continue;
    const line = cf.lineNumber ?? cf.line ?? -1;
    const key = `${name}\u0000${url}\u0000${line}`;
    let e = agg.get(key);
    if (!e) { e = { name, url, line, us: 0, count: 0 }; agg.set(key, e); }
    e.us += us;
    e.count += 1;
  }
  const rows = [...agg.values()].sort((a, b) => b.us - a.us);
  const realUs = rows.reduce((a, r) => a + r.us, 0);

  console.log(`\n${'='.repeat(78)}`);
  console.log(`${isMain ? '★ MAIN THREAD' : '  thread'}: ${t.name} (tid=${t.tid})`);
  console.log(`  total self ${ms(t.p.total)}   real JS self ${ms(realUs)}`);
  console.log('   self(ms)  self%   samples  function @ file:line');
  console.log('  --------  ------  -------  ----------------------------------------');
  for (const r of [...agg.values()].sort((a, b) => b.us - a.us).slice(0, 25)) {
    const pct = t.p.total ? (100 * r.us) / t.p.total : 0;
    const loc = `${shortUrl(r.url)}:${(Number(r.line) || 0) + 1}`;
    console.log(
      `  ${ms(r.us).padStart(8)}  ${pct.toFixed(1).padStart(5)}  ${String(r.count).padStart(7)}  ${r.name} @ ${loc}`
    );
  }
  // Inclusive (call-tree) time: attribute each sample to every ancestor.
  const parentOf = new Map();
  for (const [id, n] of t.p.nodes) {
    if (n.parent != null) parentOf.set(id, n.parent);
  }
  const incl = new Map();
  for (const [id, us] of t.p.self) {
    let cur = id;
    let guard = 0;
    while (cur != null && guard++ < 1000) {
      incl.set(cur, (incl.get(cur) || 0) + us);
      cur = parentOf.get(cur);
    }
  }
  const aggIncl = new Map();
  for (const [id, us] of incl) {
    const n = t.p.nodes.get(id);
    if (!n || !n.callFrame) continue;
    const name = n.callFrame.functionName || '(anonymous)';
    const url = n.callFrame.url || '';
    if (isNoise(name, url)) continue;
    const line = n.callFrame.lineNumber ?? -1;
    const key = `${name}\u0000${url}\u0000${line}`;
    let e = aggIncl.get(key);
    if (!e) {
      e = { name, url, line, us: 0 };
      aggIncl.set(key, e);
    }
    e.us = Math.max(e.us, us);
  }
  console.log(`  -- top INCLUSIVE (call-tree) — who owns the work --`);
  for (const r of [...aggIncl.values()].sort((a, b) => b.us - a.us).slice(0, 18)) {
    const loc = `${shortUrl(r.url)}:${(Number(r.line) || 0) + 1}`;
    console.log(`  ${ms(r.us).padStart(8)}          ${r.name} @ ${loc}`);
  }

  // Per-file rollup for this thread.
  const byFile = new Map();
  for (const [id, us] of t.p.self) {
    const n = t.p.nodes.get(id);
    if (!n || !n.callFrame) continue;
    const name = n.callFrame.functionName || '(anonymous)';
    const url = n.callFrame.url || '';
    if (isNoise(name, url)) continue;
    const f = shortUrl(url);
    byFile.set(f, (byFile.get(f) || 0) + us);
  }
  console.log(`  -- by file --`);
  for (const [f, us] of [...byFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
    const pct = t.p.total ? (100 * us) / t.p.total : 0;
    console.log(`  ${ms(us).padStart(8)}  ${pct.toFixed(1).padStart(5)}  ${f}`);
  }
}
console.log('\n(main thread = the one that freezes the UI; worker threads run off-main-thread)');
