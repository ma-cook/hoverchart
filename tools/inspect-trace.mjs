import fs from 'node:fs';
const raw = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const events = Array.isArray(raw) ? raw : (raw.traceEvents || []);
console.log('top-level keys:', Array.isArray(raw) ? '(array)' : Object.keys(raw).slice(0, 10).join(', '));
console.log('event count:', events.length);

const byName = new Map();
for (const ev of events) {
  const n = ev && ev.name ? ev.name : '(none)';
  byName.set(n, (byName.get(n) || 0) + 1);
}
console.log('\ntop event names:');
[...byName.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([n, c]) => console.log(`  ${String(c).padStart(8)}  ${n}`));

for (const type of ['Profile', 'ProfileChunk', 'CpuProfile']) {
  const list = events.filter((e) => e && e.name === type);
  console.log(`\n=== ${type}: ${list.length} events ===`);
  if (list[0]) {
    const d = list[0].args && list[0].args.data ? list[0].args.data : list[0].args;
    console.log('first event arg keys:', d ? Object.keys(d).join(', ') : '(no args)');
    const cp = d && (d.cpuProfile || d);
    if (cp && typeof cp === 'object') {
      console.log('cpuProfile keys:', Object.keys(cp).join(', '));
      console.log('nodes?', Array.isArray(cp.nodes) ? cp.nodes.length : typeof cp.nodes);
      console.log('samples?', Array.isArray(cp.samples) ? cp.samples.length : typeof cp.samples);
      console.log('timeDeltas?', Array.isArray(cp.timeDeltas) ? cp.timeDeltas.length : typeof cp.timeDeltas);
      if (Array.isArray(cp.nodes) && cp.nodes[0]) {
        console.log('node[0] keys:', Object.keys(cp.nodes[0]).join(', '));
        console.log('node[0]:', JSON.stringify(cp.nodes[0]).slice(0, 300));
      }
    }
  }
}
