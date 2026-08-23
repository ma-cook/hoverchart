// Minimal mock backend that mirrors the real backend's response shapes.
// MODE=snake (default)  -> GET /connections returns raw snake_case rows exactly like backend/src/api/connections.js
// MODE=camel            -> GET /connections returns properly denormalized rows (the fix)
import http from 'node:http';

const PORT = process.env.PORT || 8080;
const MODE = process.env.MODE || 'snake';

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}
function makeToken(sub) {
  const header = b64url({ alg: 'none', typ: 'JWT' });
  const payload = b64url({ sub, name: 'Repro User', email: 'repro@example.com' });
  return `${header}.${payload}.sig`;
}

const USER_ID = 'user-repro-1';
const SPACE_ID = 'space-repro-1';

const objects = [
  {
    id: 'obj-a', space_id: SPACE_ID, cell_id: '0,0,0',
    position: [-30, 0, 0], scale: [10, 10, 10],
    rotation: { x: 0, y: 0, z: 0 }, type: 'cube', color: '#4caf50',
    content: null, header_text: 'Object A', metadata: {},
    cell_x: 0, cell_y: 0, cell_z: 0,
    last_updated: new Date().toISOString(),
  },
  {
    id: 'obj-b', space_id: SPACE_ID, cell_id: '0,0,0',
    position: [30, 0, 0], scale: [10, 10, 10],
    rotation: { x: 0, y: 0, z: 0 }, type: 'cube', color: '#2196f3',
    content: null, header_text: 'Object B', metadata: {},
    cell_x: 0, cell_y: 0, cell_z: 0,
    last_updated: new Date().toISOString(),
  },
];

const endpointStart = { objectId: 'obj-a', face: 'right', faceIndex: 0, type: 'cube' };
const endpointEnd = { objectId: 'obj-b', face: 'left', faceIndex: 4, type: 'cube' };

// Exactly what POST /connections persists (see backend POST normalizer).
const connRowSnake = {
  id: 'conn-repro-1', space_id: SPACE_ID, cell_id: '0,0,0',
  start_obj: 'obj-a', end_obj: 'obj-b',
  start_data: endpointStart, end_data: endpointEnd,
  line_style: 'straight', color: '#000000', text: '',
  metadata: {}, updated_at: new Date().toISOString(),
};

// What the client actually needs (camelCase + unwrapped start/end).
const connCamel = {
  id: 'conn-repro-1', cellId: '0,0,0',
  start: endpointStart, end: endpointEnd,
  lineStyle: 'straight', styleType: 'straight',
  color: '#000000', text: '', textStyle: {},
  dashDirection: null, dashOffset: 0,
  createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString(),
};

function toCamel(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamel);
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = value && typeof value === 'object' && !(value instanceof Date) ? toCamel(value) : value;
  }
  return result;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const p = url.pathname;

  const send = (code, body) => {
    res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' });
    res.end(body === undefined ? '' : JSON.stringify(body));
  };
  if (req.method === 'OPTIONS') return send(204);

  console.log(`[${MODE}] ${req.method} ${p}`);

  if (p === '/api/auth/guest') {
    return send(200, { accessToken: makeToken(USER_ID), refreshToken: makeToken(USER_ID + '-refresh'), userId: USER_ID });
  }
  if (!p.startsWith('/api/')) return send(404, {});

  if (p === '/api/spaces') {
    return send(200, [{ id: SPACE_ID, owner_id: USER_ID, name: 'Repro Space', is_public: false, shared_with: [], metadata: {} }]);
  }
  if (p === `/api/spaces/${SPACE_ID}`) {
    return send(200, { id: SPACE_ID, owner_id: USER_ID, name: 'Repro Space', is_public: false, shared_with: [], metadata: {}, markdown_storage_url: null });
  }
  if (p.match(/^\/api\/users\/[^/]+\/(spaces|shared-spaces)/)) {
    return send(200, { id: SPACE_ID, owner_id: USER_ID, name: 'Repro Space', is_public: false, shared_with: [], metadata: {} });
  }
  if (p.match(/^\/api\/spaces\/[^/]+\/objects/)) {
    return send(200, toCamel(objects));
  }
  if (p.match(/^\/api\/spaces\/[^/]+\/cells/)) {
    return send(200, []);
  }
  if (p.match(/^\/api\/spaces\/[^/]+\/connections/) && req.method === 'GET') {
    // Mirror the real backend exactly: raw snake_case rows, no denormalization.
    return send(200, MODE === 'snake' ? [connRowSnake] : [connCamel]);
  }
  if (p.match(/^\/api\/spaces\/[^/]+\/connections/) && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => send(201, body ? JSON.parse(body) : {}));
    return;
  }
  if (p.match(/^\/api\/organizations/)) return send(200, []);
  if (p.match(/^\/api\/plans/)) return send(200, []);
  if (p.match(/^\/api\/updates/)) return send(200, []);
  if (p.match(/^\/api\/storage/)) return send(200, []);
  if (p.match(/^\/api\/users\/me/)) return send(200, { id: USER_ID, displayName: 'Repro User' });
  return send(200, {});
});

server.listen(PORT, () => console.log(`Mock backend (${MODE}) on http://localhost:${PORT}`));
