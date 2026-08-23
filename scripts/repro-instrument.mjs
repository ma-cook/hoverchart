import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_PATH);

const MODE = process.env.MODE || 'snake';
function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}
const token = `${b64url({ alg: 'none' })}.${b64url({
  sub: 'user-repro-1', name: 'Repro User', email: 'repro@example.com',
})}.sig`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
await ctx.addInitScript(
  ([t]) => {
    localStorage.setItem('accessToken', t);
    localStorage.setItem('refreshToken', t);
  },
  [token]
);
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));

await page.goto('http://localhost:5173/?spaceId=space-repro-1&type=diagram');
await page.waitForTimeout(9000);

const scan = () =>
  page.evaluate(() => {
    let el = document.querySelector('canvas');
    let root = null;
    for (let i = 0; el && i < 6 && !root; i++, el = el.parentElement) {
      const sym = Object.getOwnPropertySymbols(el).find((s) =>
        String(s).includes('reactContainer')
      );
      if (sym) {
        const r = el[sym];
        root = r.store ? r : r._internalRoot;
        if (!root || !root.store) root = null;
      }
    }
    if (!root) return { err: 'no-store' };
    const state = root.store.getState();
    const out = [];
    state.scene.traverse((o) => {
      const g = o.geometry;
      if (!g) return;
      out.push({
        objType: o.type,
        name: o.name || o.userData?.connectionId || '',
        instanced: !!g.isInstancedBufferGeometry,
        instanceCount: g.isInstancedBufferGeometry ? g.instanceCount : null,
        positionCount: g.attributes?.position?.count ?? -1,
      });
    });
    return { cameraPos: state.camera.position.toArray().map(Math.round), geoms: out };
  });

// State A: hidden
const setConnState = (visible, focusId = null) =>
  page.evaluate(
    async ([v, f]) => {
      const m = await import('/src/stores/connectionStore.js');
      const s = m.default.getState();
      if (s.connectionsVisible !== v) s.toggleConnectionsVisible();
      if (f) s.setFocusedObjectId(f);
      else s.clearFocusedObject();
      return { visible: m.default.getState().connectionsVisible, focused: m.default.getState().focusedObjectId };
    },
    [visible, focusId]
  );

console.log(`[${MODE}] A(hidden): set=${JSON.stringify(await setConnState(false))}`);
await page.waitForTimeout(1200);
console.log(`[${MODE}] A scan:`, JSON.stringify(await scan()));

console.log(`[${MODE}] B(toggle): set=${JSON.stringify(await setConnState(true))}`);
await page.waitForTimeout(2500);
console.log(`[${MODE}] B scan:`, JSON.stringify(await scan()));

console.log(`[${MODE}] C(focus): set=${JSON.stringify(await setConnState(false, 'obj-a'))}`);
await page.waitForTimeout(2500);
console.log(`[${MODE}] C scan:`, JSON.stringify(await scan()));

await browser.close();
