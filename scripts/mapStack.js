const { TraceMap, originalPositionFor } = require('@jridgewell/trace-mapping');
const fs = require('fs');
for (const f of fs.readdirSync('dist/assets')) {
  if (!/^index-.*\.js\.map$/.test(f)) continue;
  const map = JSON.parse(fs.readFileSync('dist/assets/' + f, 'utf8'));
  const t = new TraceMap(map);
  console.log('MAP', f);
  for (const ln of [40527, 40765, 40772, 40777, 40781, 40786, 41498]) {
    const o = originalPositionFor(t, { line: ln, column: 20 });
    console.log('  ', ln, '->', o.source ? `${o.source}:${o.line}:${o.column}` : 'none');
  }
}
