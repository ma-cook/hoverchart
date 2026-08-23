import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_PATH);

const MODE = process.env.MODE || 'snake';
function b64url(o) {
  return Buffer.from(JSON.stringify(o)).toString('base64url');
}
const token = `${b64url({ alg: 'none' })}.${b64url({
  sub: 'user-repro-1', name: 'R', email: 'r@e.com',
})}.sig`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
await ctx.addInitScript(
  ([t]) => {
    localStorage.setItem('accessToken', t);
    localStorage.setItem('refreshToken', t);
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, opts = {}) {
      if (type === 'webgl2' || type === 'webgl') {
        opts = { ...opts, preserveDrawingBuffer: true };
      }
      return orig.call(this, type, opts);
    };
  },
  [token]
);
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));

await page.goto('http://localhost:5173/?spaceId=space-repro-1&type=diagram');
await page.waitForTimeout(9000);

const setConnState = (visible, focusId = null) =>
  page.evaluate(
    async ([v, f]) => {
      const m = await import('/src/stores/connectionStore.js');
      const s = m.default.getState();
      if (s.connectionsVisible !== v) s.toggleConnectionsVisible();
      if (f) s.setFocusedObjectId(f);
      else s.clearFocusedObject();
      return {
        visible: m.default.getState().connectionsVisible,
        focused: m.default.getState().focusedObjectId,
        connCount: m.default.getState().connections.length,
      };
    },
    [visible, focusId]
  );

// Grab ONLY the largest WebGL canvas as PNG buffer (pure scene, no DOM UI)
async function grabCanvas() {
  const dataUrl = await page.evaluate(() => {
    const canvases = [...document.querySelectorAll('canvas')];
    const c = canvases.sort((a, b) => b.width * b.height - a.width * a.height)[0];
    return c.toDataURL('image/png');
  });
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

import sharp from 'sharp';
async function diff(aBuf, bBuf) {
  const [a, b] = await Promise.all([
    sharp(aBuf).raw().toBuffer({ resolveWithObject: true }),
    sharp(bBuf).raw().toBuffer({ resolveWithObject: true }),
  ]);
  const { data, info } = a;
  let count = 0, minX = Infinity, maxX = -1, minY = Infinity, maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels;
      let d = 0;
      for (let c = 0; c < Math.min(info.channels, 3); c++)
        d += Math.abs(data[i + c] - b.data[i + c]);
      if (d > 72) {
        count++;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  return { count, bbox: [minX, maxX, minY, maxY], size: `${info.width}x${info.height}` };
}

console.log(`[${MODE}] hide: ${JSON.stringify(await setConnState(false))}`);
await page.waitForTimeout(1500);
const A = await grabCanvas();

console.log(`[${MODE}] show(toggle): ${JSON.stringify(await setConnState(true))}`);
await page.waitForTimeout(2500);
const B = await grabCanvas();
console.log(`[${MODE}] B-vs-A (toggle):`, JSON.stringify(await diff(A, B)));

console.log(`[${MODE}] hide+focus: ${JSON.stringify(await setConnState(false, 'obj-a'))}`);
await page.waitForTimeout(2500);
const C = await grabCanvas();
console.log(`[${MODE}] C-vs-A (object click):`, JSON.stringify(await diff(A, C)));

await browser.close();
