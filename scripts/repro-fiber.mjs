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
    // Stub React DevTools hook so we can grab the fiber root
    const hook = {
      renderers: new Map(),
      supportsFiber: true,
      inject: () => 1,
      onCommitFiberRoot: (_id, root) => { window.__fiberRoot = root; },
      onCompleteFiberRoot: () => {},
      onPostCommitFiberRoot: () => {},
      checkDCE: () => {},
    };
    Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
      value: hook,
      configurable: true,
    });
  },
  [token]
);
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));

await page.goto('http://localhost:5173/?spaceId=space-repro-1&type=diagram');
await page.waitForTimeout(9000);

// Walk the fiber tree, collecting info about connection-related fibers
const probe = () =>
  page.evaluate(() => {
    const root = window.__fiberRoot;
    if (!root) return { err: 'no-fiber-root' };
    const connFibers = [];
    const batched = [];
    const seen = new Set();
    const visit = (fiber, depth) => {
      if (!fiber || depth > 60 || seen.has(fiber)) return;
      seen.add(fiber);
      try {
        const name =
          fiber.type?.displayName ||
          fiber.type?.name ||
          (typeof fiber.tag === 'number' ? null : String(fiber.type));
        const props = fiber.memoizedProps;
        if (props?.connection?.id) {
          connFibers.push({
            comp: name,
            connId: props.connection.id,
            startOk: !!props.connection.start?.objectId,
            endOk: !!props.connection.end?.objectId,
            style: props.connection.styleType || props.connection.lineStyle,
          });
        }
        if (
          typeof name === 'string' &&
          (name.includes('BatchedConnectionLines') ||
            name.includes('BatchedCurvedLines') ||
            name.includes('ConnectionsRenderer'))
        ) {
          const pc = props?.progressiveConnections ?? props?.connections;
          batched.push({
            comp: name,
            progressiveCount: Array.isArray(pc) ? pc.length : -1,
            objectVisibleLen: Array.isArray(props?.objectVisibleConnections)
              ? props.objectVisibleConnections.length
              : undefined,
          });
        }
      } catch {}
      visit(fiber.child, depth + 1);
      visit(fiber.sibling, depth + 1);
      return;
    };
    visit(root.current, 0);
    return {
      totalConnComponents: connFibers.length,
      connFibers: connFibers.slice(0, 5),
      batched,
    };
  });

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
      };
    },
    [visible, focusId]
  );

console.log(`[${MODE}] A hide: ${JSON.stringify(await setConnState(false))}`);
await page.waitForTimeout(1500);
console.log(`[${MODE}] A probe: ${JSON.stringify(await probe())}`);

console.log(`[${MODE}] B toggle-on: ${JSON.stringify(await setConnState(true))}`);
await page.waitForTimeout(2500);
console.log(`[${MODE}] B probe: ${JSON.stringify(await probe())}`);

console.log(`[${MODE}] C focus: ${JSON.stringify(await setConnState(false, 'obj-a'))}`);
await page.waitForTimeout(2500);
console.log(`[${MODE}] C probe: ${JSON.stringify(await probe())}`);

await browser.close();
