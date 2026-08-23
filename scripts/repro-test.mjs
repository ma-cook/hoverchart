import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_PATH);
import sharp from 'sharp';

const MODE = process.env.MODE || 'snake';
function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}
const token = `${b64url({ alg: 'none' })}.${b64url({
  sub: 'user-repro-1',
  name: 'Repro User',
  email: 'repro@example.com',
})}.sig`;

async function diffCount(fileA, fileB) {
  const [a, b] = await Promise.all([
    sharp(fileA).raw().toBuffer({ resolveWithObject: true }),
    sharp(fileB).raw().toBuffer({ resolveWithObject: true }),
  ]);
  let changed = 0;
  const { data, info } = a;
  for (let i = 0; i < data.length; i++) {
    if (Math.abs(data[i] - b.data[i]) > 24) changed++;
  }
  return { changedPixels: changed, w: info.width, h: info.height };
}

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
page.on('pageerror', (err) => console.log('[pageerror]', String(err).slice(0, 200)));

await page.goto('http://localhost:5173/?spaceId=space-repro-1&type=diagram');
await page.waitForTimeout(9000);

const getVisible = () =>
  page.evaluate(async () => {
    const m = await import('/src/stores/connectionStore.js');
    return m.default.getState().connectionsVisible;
  });
const setStoreVisible = async (v) => {
  // Toggle via the same store action the top-bar button uses until target reached
  await page.evaluate(async (target) => {
    const m = await import('/src/stores/connectionStore.js');
    const s = m.default.getState();
    if (s.connectionsVisible !== target) s.toggleConnectionsVisible();
  }, v);
};

// ── State A: connections hidden ──
if (await getVisible()) await setStoreVisible(false);
// also ensure no focused object
await page.evaluate(async () => {
  const m = await import('/src/stores/connectionStore.js');
  m.default.getState().clearFocusedObject();
});
await page.waitForTimeout(1500);
await page.screenshot({ path: `.opencode/repro/state-${MODE}-A-hidden.png` });

// ── State B: toggle button ON ──
await setStoreVisible(true);
await page.waitForTimeout(2500);
await page.screenshot({ path: `.opencode/repro/state-${MODE}-B-toggle.png` });

// ── State C: hidden again + object clicked (focusedObjectId path) ──
await setStoreVisible(false);
await page.evaluate(async () => {
  const m = await import('/src/stores/connectionStore.js');
  m.default.getState().setFocusedObjectId('obj-a');
});
await page.waitForTimeout(2500);
await page.screenshot({ path: `.opencode/repro/state-${MODE}-C-focus.png` });

console.log(`[${MODE}] B vs A (toggle):`, JSON.stringify(await diffCount(
  `.opencode/repro/state-${MODE}-A-hidden.png`,
  `.opencode/repro/state-${MODE}-B-toggle.png`
)));
console.log(`[${MODE}] C vs A (object click):`, JSON.stringify(await diffCount(
  `.opencode/repro/state-${MODE}-A-hidden.png`,
  `.opencode/repro/state-${MODE}-C-focus.png`
)));

await browser.close();
