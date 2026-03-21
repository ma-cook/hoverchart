import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { onRequest, onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import puppeteer from 'puppeteer';

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Initialize Firebase Admin with service account
initializeApp({
  credential: cert({
    projectId: process.env.ADMIN_PROJECT_ID || 'hoverchart',
    clientEmail: process.env.ADMIN_CLIENT_EMAIL || 'firebase-adminsdk-wka1s@hoverchart.iam.gserviceaccount.com',
    privateKey: process.env.ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n') || '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCUv2DAoOXbH2EO\nvplIM6IHpX4jKGeoidtITnq1J06tKFFwrMcZRh3+guxYtVEZsRgV+mkv6elZOxMv\nEHoaWdUj9buUPgr/SArFZw4RJNrBlYjjl0FM+Bm8STF1tz3LcJEUQHrxrP+NiGIw\nFJENncSaF2N8bOsjdlmt7QJ7TUiUdWQR82WDyXsJD8ejbgmtzRkoCPT3UErILd80\nU2pDusOS0Ue3dCpcdjHizlzOjX91LW2h/sZswKYWKUofJkBwIcAm1v2QGpA0H68P\nnzG0KWXXte5Vrv/6XVWACtJtNNeYFTvs7Ow1+P7CRj1GzsEwf7cVLySmJ7Jei0PA\nxf+ETu4lAgMBAAECggEAB37fWsWg35pkszACnGNRsm3x/caO9qy/upSN1WweKFak\nR/fE7q6cW1NwooW8iP1mF9FvFIWGh0MVU+VSKdrGBVJgOfeoaTXRqSHo0Q9Y4LFu\n3P0lwsGr1lOf5O0vdX1+KhWXvG75z8GEJSUcLCH7osIz9rSsYrSXj06mtdzun+B4\ny8ALruR1d4DU18bbfzUMifJcrfAM3leOkBzmfIozUXfKwl2xE69HdfTKAFcwqUkK\nMQy7JIR2r3zJK/phj6njjCauXGzjcBFcId8pZFJEsxKtCun0By7BspQzGBGt0632\nBOx9Lr8fpr4nb3j4fdgRmfWEaK+3w7EGYIxLekx0zwKBgQDRXgW4DfyEDMpX7M5E\nocWslcU3rp5EtxJSsUFdAUEIhahge2xx/g1SKvVXdscjxUdrBlzzlVsN3UgKLBnz\nL+1YPSwBg9DcDSO613ZqxINQ8gMxWhiE624zveMBOUdkwmOqxH9NnpgqwRd6s9N5\nt7EUAu8BciyjjJW4xKHe9FGY6wKBgQC14NyhBgKUJ3a/x7N6AWfWEoYzUbVVTC5u\nf+8VeyorocBamzmRbRJQmnz5AfLaUCY8Hl7fayzCR2qi6w9IeuOT+mTUqT2VOfPq\nW1RIUDj5i8nAds0saCJXVd9JX0bzNsLqWaagAdL62dub9fpj+Ul3ixckJ/6WtuwK\nsEcCA3TRLwKBgGuMMcHfJWSrsVFDKp3kv8cs1DcLMu+3XuktdpcQ6tg22ExfelCA\nIVWhDZBVSmxcjZgzl5HkmfZgQf4/s0DR0Mjv+2f3z1UKRt1WitTDh3UQLIWwc0Hs\nMhrQIwjg5ISkuk/hSkeT/TSRJb95Glu++W5/J0kF3lpRACP+lewScsvrAoGAOGOq\nI+Z4IDUIFTe2RopvBikiIIEhxntjHfFeT/uqvHJe7/iWZac6eXEcdBuNjvAwmo0T\n/xL8gpOf1TkpuOAY9QU6A9Eg/cZFAJEmVXFB6OTVPW3X+P+kPg2qt9Xpani8/+mh\nxpQqNIodE4K1Cg/9Hioql5Qq09GM51d1/ILT0hMCgYBsnLNh8SCOVCbKgvMDfoXE\n+fIHQLbvqih7RfTy/x3esiTOxhxg1U/CUPhrFzW/rRo8D/Lak7OZbQQZcUD+O4mE\n0JkmDQWk0PNshw3AyDGwIuh8K1YEfP6jplH68koSqGWMVO8KQpi/gZYOamJxKSJp\niDDLO+1RvAUEiF+hU1hIug==\n-----END PRIVATE KEY-----\n'
  }),
});
const db = getFirestore();

// ============= VERIFY AUTH TOKEN FUNCTION =============
function createVerifyAuthTokenApp() {
  const app = express();

  const corsOptions = {
    origin: [
      'https://hoverchart.web.app',
      'https://hoverchart.firebaseapp.com',
      'http://localhost:5173',
      'http://localhost:5000',
      'https://space.volscape.com',
    ],
    optionsSuccessStatus: 200,
  };

  app.use(cors(corsOptions));
  app.use(express.json());

  app.post('/verify-token', async (req, res) => {
    const idToken = req.body.token;

    if (!idToken) {
      console.error('No token provided');
      return res.status(400).json({ error: 'No token provided' });
    }

    try {
      console.log('Verifying token...');
      const decodedToken = await getAuth().verifyIdToken(idToken);
      console.log('Token verified for user:', decodedToken.uid);

      const customToken = await getAuth().createCustomToken(decodedToken.uid);
      console.log('Custom token created successfully');

      res.json({
        customToken,
        uid: decodedToken.uid,
      });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(400).json({
        error: 'Invalid token',
        details: error.message,
      });
    }
  });

  return app;
}

export const verifyAuthToken = onRequest(
  {
    memory: '256MiB',
    region: 'us-central1',
    cors: true,
    maxInstances: 10,
  },
  createVerifyAuthTokenApp()
);

// ============= BULK IMPORT FUNCTION =============
function createBulkImportApp() {
  const app = express();

  app.use(cors({ origin: true }));
  app.use(express.json({ limit: '50mb' })); // Increase limit for large payloads

  app.post('/', async (req, res) => {
    try {
      const { idToken, userId, spaceId, objects, connections } = req.body;

      // Validate required fields
      if (!idToken || !userId || !spaceId) {
        return res.status(400).json({
          error: 'Missing required fields: idToken, userId, spaceId',
        });
      }

      // Verify authentication token
      const decodedToken = await getAuth().verifyIdToken(idToken);
      if (decodedToken.uid !== userId) {
        return res.status(403).json({
          error: 'Token user ID does not match provided userId',
        });
      }

      console.log(
        `🚀 Starting bulk import for user ${userId}, space ${spaceId}`
      );
      console.log(
        `   Objects: ${objects?.length || 0}, Connections: ${
          connections?.length || 0
        }`
      );

      const startTime = Date.now();
      let objectsWritten = 0;
      let connectionsWritten = 0;

      // ========== PROCESS OBJECTS ==========
      if (objects && objects.length > 0) {
        const objectsByCellId = new Map();

        // Group objects by cellId
        for (const obj of objects) {
          if (!obj.cellId || !obj.id) {
            console.warn('⚠️  Skipping object without cellId or id:', obj);
            continue;
          }

          if (!objectsByCellId.has(obj.cellId)) {
            objectsByCellId.set(obj.cellId, []);
          }
          objectsByCellId.get(obj.cellId).push(obj);
        }

        // Write objects to cells/{cellId}/objects/{id} subcollection
        // This avoids "too many index entries" error when many objects in one cell
        for (const [cellId, cellObjects] of objectsByCellId.entries()) {
          // Process in chunks of 500 (Firestore batch limit)
          const BATCH_SIZE = 500;

          for (let i = 0; i < cellObjects.length; i += BATCH_SIZE) {
            const batch = db.batch();
            const chunk = cellObjects.slice(i, i + BATCH_SIZE);

            for (const obj of chunk) {
              const objectRef = db.doc(
                `users/${userId}/spaces/${spaceId}/cells/${cellId}/objects/${obj.id}`
              );

              const objectData = {
                id: obj.id,
                position: obj.position,
                scale: obj.size || obj.scale || [1, 1, 1],
                type: obj.type,
                color: obj.color,
                content: obj.content || '',
                createdAt: obj.createdAt || Date.now(),
                updatedAt: Date.now(),
                cellId: obj.cellId,
                ...(obj.rotation && { rotation: obj.rotation }),
                ...(obj.textStyle && { textStyle: obj.textStyle }),
                ...(obj.headerText !== undefined && {
                  headerText: obj.headerText,
                }),
                ...(obj.headerStyle && { headerStyle: obj.headerStyle }),
                ...(obj.faceColors && { faceColors: obj.faceColors }),
                ...(obj.faceTexts && { faceTexts: obj.faceTexts }),
                ...(obj.faceTextStyles && {
                  faceTextStyles: obj.faceTextStyles,
                }),
                ...(obj.merfolkData && { merfolkData: obj.merfolkData }),
              };

              batch.set(objectRef, objectData);
            }

            await batch.commit();
            objectsWritten += chunk.length;

            const progress = Math.min(i + chunk.length, cellObjects.length);
            console.log(
              `   ✓ Progress: ${progress}/${cellObjects.length} objects in cell ${cellId}`
            );
          }
        }
      }

      // ========== PROCESS CONNECTIONS ==========
      if (connections && connections.length > 0) {
        const connectionsByCellId = new Map();

        // Group connections by cellId
        for (const conn of connections) {
          if (!conn.cellId || !conn.id) {
            console.warn('⚠️  Skipping connection without cellId or id:', conn);
            continue;
          }

          if (!connectionsByCellId.has(conn.cellId)) {
            connectionsByCellId.set(conn.cellId, []);
          }
          connectionsByCellId.get(conn.cellId).push(conn);
        }

        // Write connections to cells/{cellId}/connections/{id} subcollection
        for (const [cellId, cellConnections] of connectionsByCellId.entries()) {
          // Process in chunks of 500 (Firestore batch limit)
          const BATCH_SIZE = 500;

          for (let i = 0; i < cellConnections.length; i += BATCH_SIZE) {
            const batch = db.batch();
            const chunk = cellConnections.slice(i, i + BATCH_SIZE);

            for (const conn of chunk) {
              try {
                const connectionRef = db.doc(
                  `users/${userId}/spaces/${spaceId}/cells/${cellId}/connections/${conn.id}`
                );

                const connectionData = {
                  id: conn.id,
                  start: conn.start, // Use existing start object
                  end: conn.end, // Use existing end object
                  type: conn.type || 'line',
                  color: conn.color || '#000000',
                  createdAt: conn.createdAt || Date.now(),
                  updatedAt: Date.now(),
                  cellId: conn.cellId,
                  ...(conn.text && { text: conn.text }),
                  ...(conn.thickness && { thickness: conn.thickness }),
                  ...(conn.textStyle && { textStyle: conn.textStyle }),
                  ...(conn.label && { label: conn.label }),
                  ...(conn.curvedPath && { curvedPath: conn.curvedPath }),
                  ...(conn.merfolkData && { merfolkData: conn.merfolkData }),
                };

                // Log first connection for debugging
                if (i === 0 && conn === chunk[0]) {
                  console.log(
                    '📝 Sample connection being saved:',
                    JSON.stringify(connectionData, null, 2)
                  );
                }

                batch.set(connectionRef, connectionData);
              } catch (connError) {
                console.error(
                  `❌ Error processing connection ${conn.id}:`,
                  connError
                );
                console.error(
                  '   Connection data:',
                  JSON.stringify(conn, null, 2)
                );
                throw connError;
              }
            }

            await batch.commit();
            connectionsWritten += chunk.length;

            const progress = Math.min(i + chunk.length, cellConnections.length);
            console.log(
              `   ✓ Progress: ${progress}/${cellConnections.length} connections in cell ${cellId}`
            );
          }
        }
      }

      const duration = Date.now() - startTime;
      console.log(
        `✅ Bulk import completed in ${duration}ms (${(duration / 1000).toFixed(
          2
        )}s)`
      );
      console.log(
        `   Objects: ${objectsWritten}, Connections: ${connectionsWritten}`
      );

      res.json({
        success: true,
        objectsWritten,
        connectionsWritten,
        duration,
      });
    } catch (error) {
      console.error('❌ Bulk import error:', error);
      res.status(500).json({
        error: 'Bulk import failed',
        details: error.message,
      });
    }
  });

  return app;
}

export const bulkImport = onRequest(
  {
    memory: '512MiB',
    region: 'us-central1',
    cors: true,
    timeoutSeconds: 300, // 5 minutes max
    maxInstances: 5,
  },
  createBulkImportApp()
);

// Declare secrets for GitHub OAuth
const githubClientId = defineSecret('GITHUB_CLIENT_ID');
const githubClientSecret = defineSecret('GITHUB_CLIENT_SECRET');

export const fetchGithubToken = onCall(
  {
    memory: '256MiB',
    region: 'us-central1',
    maxInstances: 10,
    secrets: [githubClientId, githubClientSecret],
  },
  async (request) => {
    const { code, redirect_uri: redirectUri } = request.data;

    if (!code) {
      throw new HttpsError('invalid-argument', 'Authorization code is required');
    }

    const clientId = githubClientId.value();
    const clientSecret = githubClientSecret.value();

    if (!clientId || !clientSecret) {
      console.error('Missing GitHub credentials');
      throw new HttpsError('internal', 'GitHub credentials not configured');
    }

    const tokenBody = {
      client_id: clientId,
      client_secret: clientSecret,
      code,
    };
    if (redirectUri) {
      tokenBody.redirect_uri = redirectUri;
    }

    try {
      const response = await fetch(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tokenBody),
        }
      );

      const data = await response.text();
      const params = new URLSearchParams(data);

      if (!params.get('access_token')) {
        console.error('GitHub response did not contain access_token:', data);
        throw new HttpsError('invalid-argument', 'Failed to fetch access token');
      }

      return { access_token: params.get('access_token') };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error('Error fetching GitHub token:', error.stack || error);
      throw new HttpsError('internal', error.message);
    }
  }
);

// ============= BULK DELETE FUNCTION =============
function createBulkDeleteApp() {
  const app = express();

  app.use(cors({ origin: true }));
  app.use(express.json());

  app.post('/', async (req, res) => {
    try {
      const { idToken, userId, spaceId } = req.body;

      // Validate required fields
      if (!idToken || !userId || !spaceId) {
        return res.status(400).json({
          error: 'Missing required fields: idToken, userId, spaceId',
        });
      }

      // Verify authentication token
      const decodedToken = await getAuth().verifyIdToken(idToken);
      if (decodedToken.uid !== userId) {
        return res.status(403).json({
          error: 'Token user ID does not match provided userId',
        });
      }

      console.log(`🗑️  Starting bulk delete for user ${userId}, space ${spaceId}`);

      const startTime = Date.now();
      let cellsDeleted = 0;
      let objectsDeleted = 0;
      let connectionsDeleted = 0;

      const BATCH_SIZE = 500;

      // PHASE 1: Use collectionGroup queries to find ALL objects and connections
      // This catches orphaned subcollections where the parent cell document doesn't exist
      console.log('   Phase 1: Deleting all objects via collectionGroup query...');
      
      // Query all objects in this space using collectionGroup
      // We need to filter by the path pattern since collectionGroup returns ALL 'objects' collections
      const allObjectsQuery = db.collectionGroup('objects');
      const allObjectsSnapshot = await allObjectsQuery.get();
      
      // Filter to only objects in this user's space
      const spacePrefix = `users/${userId}/spaces/${spaceId}/cells/`;
      const objectsToDelete = allObjectsSnapshot.docs.filter(doc => 
        doc.ref.path.startsWith(spacePrefix)
      );
      
      console.log(`   Found ${objectsToDelete.length} objects to delete`);
      
      // Delete objects in batches
      for (let i = 0; i < objectsToDelete.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = objectsToDelete.slice(i, i + BATCH_SIZE);
        for (const objDoc of chunk) {
          batch.delete(objDoc.ref);
        }
        await batch.commit();
        objectsDeleted += chunk.length;
      }

      // Query all connections in this space using collectionGroup
      console.log('   Phase 1: Deleting all connections via collectionGroup query...');
      const allConnectionsQuery = db.collectionGroup('connections');
      const allConnectionsSnapshot = await allConnectionsQuery.get();
      
      // Filter to only connections in this user's space
      const connectionsToDelete = allConnectionsSnapshot.docs.filter(doc => 
        doc.ref.path.startsWith(spacePrefix)
      );
      
      console.log(`   Found ${connectionsToDelete.length} connections to delete`);
      
      // Delete connections in batches
      for (let i = 0; i < connectionsToDelete.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = connectionsToDelete.slice(i, i + BATCH_SIZE);
        for (const connDoc of chunk) {
          batch.delete(connDoc.ref);
        }
        await batch.commit();
        connectionsDeleted += chunk.length;
      }

      // PHASE 2: Delete all cell documents
      console.log('   Phase 2: Deleting cell documents...');
      const cellsRef = db.collection(`users/${userId}/spaces/${spaceId}/cells`);
      const cellsSnapshot = await cellsRef.get();

      if (!cellsSnapshot.empty) {
        const cellDocs = cellsSnapshot.docs;
        for (let i = 0; i < cellDocs.length; i += BATCH_SIZE) {
          const batch = db.batch();
          const chunk = cellDocs.slice(i, i + BATCH_SIZE);
          for (const cellDoc of chunk) {
            batch.delete(cellDoc.ref);
          }
          await batch.commit();
          cellsDeleted += chunk.length;
        }
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Bulk delete completed in ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
      console.log(`   Cells: ${cellsDeleted}, Objects: ${objectsDeleted}, Connections: ${connectionsDeleted}`);

      res.json({
        success: true,
        cellsDeleted,
        objectsDeleted,
        connectionsDeleted,
        duration,
      });
    } catch (error) {
      console.error('❌ Bulk delete error:', error);
      res.status(500).json({
        error: 'Bulk delete failed',
        details: error.message,
      });
    }
  });

  return app;
}

export const bulkDelete = onRequest(
  {
    memory: '512MiB',
    region: 'us-central1',
    cors: true,
    timeoutSeconds: 540, // 9 minutes max for large spaces
    maxInstances: 5,
  },
  createBulkDeleteApp()
);

// ============= SCAN WEBSITE RUNTIME FUNCTION =============

/**
 * Validate that a URL is safe to scan (no SSRF).
 * @param {string} url
 * @returns {{ valid: boolean, error?: string }}
 */
function validateRuntimeScanUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only http and https URLs are supported' };
  }

  const hostname = parsed.hostname.toLowerCase();

  const blockedHostnames = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
  if (blockedHostnames.includes(hostname)) {
    return { valid: false, error: 'Scanning localhost is not allowed' };
  }

  const privateRanges = [
    /^10\.\d+\.\d+\.\d+$/,
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
    /^192\.168\.\d+\.\d+$/,
    /^169\.254\.\d+\.\d+$/,
    /^fc[0-9a-f]{2}:/i,
    /^fe80:/i,
  ];

  for (const range of privateRanges) {
    if (range.test(hostname)) {
      return { valid: false, error: 'Scanning private/internal IP ranges is not allowed' };
    }
  }

  return { valid: true };
}

/**
 * Convert a string into a valid Merfolk node identifier.
 * @param {string} name
 * @returns {string}
 */
function sanitizeMerfolkId(name) {
  return String(name)
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^(\d)/, '_$1')
    .slice(0, 60);
}

/**
 * Generate Merfolk markdown from a structured runtime trace object.
 * @param {Object} traceData
 * @param {string} url
 * @returns {string}
 */
function generateMerfolkFromRuntimeTrace(traceData, url) {
  const {
    components = [],
    eventHandlers = [],
    apiCalls = [],
    stateStores = [],
    hooks = [],
    libraries = [],
    workers = [],
    connections = [],
    framework = 'unknown',
  } = traceData;

  const lines = [];
  lines.push('```merfolk');
  lines.push(`%% Runtime Analysis: ${url}`);
  lines.push(`%% Framework: ${framework}`);
  lines.push('');

  if (components.length > 0) {
    lines.push('%% Components');
    for (const comp of components) {
      lines.push(`${sanitizeMerfolkId(comp.name)}{Component: ${comp.name}}`);
    }
    lines.push('');
  }

  if (eventHandlers.length > 0) {
    lines.push('%% Event Handlers');
    for (const handler of eventHandlers) {
      lines.push(`${sanitizeMerfolkId(handler.name)}[Function: ${handler.name}]`);
    }
    lines.push('');
  }

  if (apiCalls.length > 0) {
    lines.push('%% API Calls');
    for (const call of apiCalls) {
      const label = `${call.method} ${call.path}`;
      lines.push(`${sanitizeMerfolkId(label)}((Service: ${label}))`);
    }
    lines.push('');
  }

  if (stateStores.length > 0) {
    lines.push('%% State Stores');
    for (const store of stateStores) {
      lines.push(`${sanitizeMerfolkId(store.name)}[[Store: ${store.name}]]`);
    }
    lines.push('');
  }

  if (hooks.length > 0) {
    lines.push('%% Hooks');
    for (const hook of hooks) {
      lines.push(`${sanitizeMerfolkId(hook.name)}[Hook: ${hook.name}]`);
    }
    lines.push('');
  }

  if (libraries.length > 0) {
    lines.push('%% Libraries');
    for (const lib of libraries) {
      lines.push(`${sanitizeMerfolkId(lib.name)}<Library: ${lib.name}>`);
    }
    lines.push('');
  }

  if (workers.length > 0) {
    lines.push('%% Workers');
    for (const worker of workers) {
      lines.push(`${sanitizeMerfolkId(worker.name)}[Function: ${worker.name}]`);
    }
    lines.push('');
  }

  if (connections.length > 0) {
    lines.push('%% Connections');
    for (const conn of connections) {
      const arrow = conn.style || '-->';
      const label = conn.label ? ` : "${conn.label}"` : '';
      lines.push(`${sanitizeMerfolkId(conn.from)} ${arrow} ${sanitizeMerfolkId(conn.to)}${label}`);
    }
    lines.push('');
  }

  lines.push('```');
  return lines.join('\n');
}

/**
 * Instrument a Puppeteer page and capture runtime behaviour via CDP.
 * @param {import('puppeteer').Page} page
 * @param {number} durationMs
 * @returns {Promise<Object>} - traceData
 */
// Maximum node counts — keeps the generated diagram legible
const MAX_COMPONENTS = 30;
const MAX_EVENT_HANDLERS = 20;
const MAX_API_CALLS = 20;
const MAX_HOOKS = 15;
// Maximum number of profiled function names added as event handlers
const MAX_PROFILED_HANDLERS = 15;

// CDP profiler function names to exclude from the diagram
const EXCLUDED_PROFILER_NAMES = new Set([
  '(anonymous)',
  '(program)',
  '(root)',
  '(idle)',
  '(garbage collector)',
]);

async function captureRuntimeTrace(page, durationMs) {
  const client = await page.createCDPSession();

  // Enable relevant CDP domains
  await client.send('Network.enable');
  await client.send('Runtime.enable');
  await client.send('Profiler.enable');
  await client.send('Profiler.setSamplingInterval', { interval: 100 });
  await client.send('Profiler.start');

  const networkRequests = [];

  client.on('Network.requestWillBeSent', (params) => {
    const { request, type } = params;
    if (type === 'XHR' || type === 'Fetch') {
      try {
        const urlObj = new URL(request.url);
        networkRequests.push({
          method: request.method,
          path: urlObj.pathname,
          url: request.url,
        });
      } catch {
        // ignore malformed URLs
      }
    }
  });

  // Wait for the configured capture duration
  await new Promise((resolve) => setTimeout(resolve, durationMs));

  // Stop profiler
  const profilerResult = await client.send('Profiler.stop');

  // Detect framework and extract runtime data from the page
  const runtimeData = await page.evaluate(() => {
    const data = {
      framework: 'unknown',
      components: [],
      hooks: [],
      stateStores: [],
      libraries: [],
      workers: [],
      eventHandlers: [],
    };

    // ── Framework detection ────────────────────────────────────────────────
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      data.framework = window.__NEXT_DATA__ ? 'Next.js' : 'React';
    } else if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__ || (window.Vue && window.Vue.version)) {
      data.framework = 'Vue';
    } else if (window.angular || (window.ng && window.ng.coreTokens)) {
      data.framework = 'Angular';
    } else if (window.Svelte) {
      data.framework = 'Svelte';
    }

    // ── React component tree via DevTools fiber ────────────────────────────
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      const seen = new Set();

      const walkFiber = (fiber) => {
        if (!fiber || seen.has(fiber)) return;
        seen.add(fiber);

        const name = fiber.type && (fiber.type.displayName || fiber.type.name);
        if (name && typeof name === 'string' && /^[A-Z]/.test(name)) {
          if (!data.components.find((c) => c.name === name)) {
            data.components.push({ name });
          }

          // Extract hook names from the fiber's memoized state chain
          let memoState = fiber.memoizedState;
          while (memoState) {
            const queueDispatch = memoState.queue && memoState.queue.dispatch;
            if (queueDispatch && queueDispatch._reactName) {
              const hookName = queueDispatch._reactName;
              if (!data.hooks.find((h) => h.name === hookName)) {
                data.hooks.push({ name: hookName });
              }
            }
            memoState = memoState.next;
          }
        }

        walkFiber(fiber.child);
        walkFiber(fiber.sibling);
      };

      try {
        hook.renderers && hook.renderers.forEach((renderer) => {
          const root = renderer.currentDispatcherRef;
          if (root && root.current) walkFiber(root.current);
        });
        // Also walk from the _roots map if present
        if (hook._roots) {
          hook._roots.forEach((root) => {
            walkFiber(root.current && root.current.child);
          });
        }
        // Fallback: walk the fiber tree via the root container
        const rootEl = document.getElementById('root') || document.getElementById('app') || document.body;
        const fiberKey = Object.keys(rootEl).find(
          (k) => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
        );
        if (fiberKey) walkFiber(rootEl[fiberKey]);
      } catch {
        // ignore DevTools access errors
      }
    }

    // ── State store detection ──────────────────────────────────────────────
    if (window.__REDUX_DEVTOOLS_EXTENSION__) {
      data.stateStores.push({ name: 'reduxStore' });
    }
    if (window.__zustand__) {
      data.stateStores.push({ name: 'zustandStore' });
    }
    if (window.Vuex) {
      data.stateStores.push({ name: 'vuexStore' });
    }
    if (window.MobX || window.mobx) {
      data.stateStores.push({ name: 'mobxStore' });
    }

    // ── External library detection from <script> tags ──────────────────────
    const scriptSrcs = Array.from(document.querySelectorAll('script[src]')).map((s) => s.src);
    const knownLibs = [
      { pattern: /lodash/i, name: 'lodash' },
      { pattern: /jquery/i, name: 'jQuery' },
      { pattern: /axios/i, name: 'axios' },
      { pattern: /moment/i, name: 'moment' },
      { pattern: /dayjs/i, name: 'dayjs' },
      { pattern: /d3(\.min)?\.js/i, name: 'd3' },
      { pattern: /three(\.min)?\.js/i, name: 'three' },
      { pattern: /gsap/i, name: 'GSAP' },
      { pattern: /bootstrap/i, name: 'bootstrap' },
      { pattern: /tailwind/i, name: 'tailwind' },
      { pattern: /framer-motion/i, name: 'framer-motion' },
      { pattern: /redux/i, name: 'redux' },
      { pattern: /mobx/i, name: 'MobX' },
      { pattern: /graphql/i, name: 'GraphQL' },
      { pattern: /socket\.io/i, name: 'socket.io' },
    ];
    for (const src of scriptSrcs) {
      for (const { pattern, name } of knownLibs) {
        if (pattern.test(src) && !data.libraries.find((l) => l.name === name)) {
          data.libraries.push({ name });
        }
      }
    }

    // ── Web Worker detection ───────────────────────────────────────────────
    if (window.__workers) {
      for (const w of window.__workers) {
        data.workers.push({ name: w });
      }
    }

    // ── DOM-based component detection (fallback when no framework) ─────────
    if (data.components.length === 0) {
      const customElements = Array.from(document.querySelectorAll('*'))
        .map((el) => el.tagName.toLowerCase())
        .filter((tag) => tag.includes('-'));
      const unique = [...new Set(customElements)].slice(0, 20);
      for (const tag of unique) {
        const name = tag.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        data.components.push({ name });
      }

      // If still no components, create a Root component from the page title
      if (data.components.length === 0) {
        const title = document.title || 'Page';
        data.components.push({ name: title.replace(/[^a-zA-Z0-9]/g, '') || 'RootComponent' });
      }
    }

    // ── Event handler detection ────────────────────────────────────────────
    const eventTypes = ['click', 'submit', 'input', 'change', 'keydown', 'scroll', 'load'];
    for (const type of eventTypes) {
      const els = document.querySelectorAll(`[on${type}]`);
      if (els.length > 0) {
        const name = `on${type.charAt(0).toUpperCase()}${type.slice(1)}`;
        if (!data.eventHandlers.find((h) => h.name === name)) {
          data.eventHandlers.push({ name });
        }
      }
    }

    return data;
  });

  // ── Extract top-level function names from CPU profiler ────────────────────
  const profileNodes = profilerResult.profile ? profilerResult.profile.nodes : [];
  const functionNames = new Set();
  for (const node of profileNodes) {
    const fn = node.callFrame && node.callFrame.functionName;
    if (fn && fn.length > 1 && !EXCLUDED_PROFILER_NAMES.has(fn)) {
      functionNames.add(fn);
    }
  }

  // Merge profiled handlers into event handlers list (capped at 15 new entries)
  let added = 0;
  for (const fn of functionNames) {
    if (added >= MAX_PROFILED_HANDLERS) break;
    if (!runtimeData.eventHandlers.find((h) => h.name === fn)) {
      runtimeData.eventHandlers.push({ name: fn });
      added++;
    }
  }

  // Deduplicate and cap lists to keep diagram manageable
  runtimeData.apiCalls = deduplicateApiCalls(networkRequests).slice(0, MAX_API_CALLS);
  runtimeData.components = runtimeData.components.slice(0, MAX_COMPONENTS);
  runtimeData.eventHandlers = runtimeData.eventHandlers.slice(0, MAX_EVENT_HANDLERS);
  runtimeData.hooks = runtimeData.hooks.slice(0, MAX_HOOKS);

  // ── Build connections ──────────────────────────────────────────────────────
  runtimeData.connections = buildConnections(runtimeData);

  return runtimeData;
}

/**
 * Deduplicate API calls and merge similar paths.
 * @param {Array} requests
 * @returns {Array}
 */
function deduplicateApiCalls(requests) {
  const seen = new Set();
  const result = [];
  for (const req of requests) {
    const key = `${req.method}:${req.path}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(req);
    }
  }
  return result;
}

/**
 * Build logical connections from the extracted runtime data.
 * @param {Object} traceData
 * @returns {Array}
 */
function buildConnections(traceData) {
  const { components, eventHandlers, apiCalls, stateStores, hooks } = traceData;
  const connections = [];

  // Component renders child (first comp → rest via dashed arrow)
  for (let i = 1; i < Math.min(components.length, 6); i++) {
    connections.push({
      from: components[0].name,
      to: components[i].name,
      style: '-.->', 
      label: 'renders',
    });
  }

  // Event handlers trigger API calls
  for (let i = 0; i < Math.min(eventHandlers.length, 3); i++) {
    for (let j = 0; j < Math.min(apiCalls.length, 2); j++) {
      connections.push({
        from: eventHandlers[i].name,
        to: `${apiCalls[j].method} ${apiCalls[j].path}`,
        style: '-->',
        label: 'triggers',
      });
    }
  }

  // API calls update stores
  for (const call of apiCalls.slice(0, 3)) {
    for (const store of stateStores.slice(0, 2)) {
      connections.push({
        from: `${call.method} ${call.path}`,
        to: store.name,
        style: '-->',
        label: 'updates',
      });
    }
  }

  // Store changes re-render components
  for (const store of stateStores) {
    for (const comp of components.slice(0, 3)) {
      connections.push({
        from: store.name,
        to: comp.name,
        style: '-->',
        label: 'subscribes',
      });
    }
  }

  // Components use hooks
  for (const comp of components.slice(0, 3)) {
    for (const hook of hooks.slice(0, 3)) {
      connections.push({
        from: comp.name,
        to: hook.name,
        style: '-->',
        label: 'uses',
      });
    }
  }

  return connections;
}

export const scanWebsiteRuntime = onCall(
  {
    memory: '1GiB',
    region: 'us-central1',
    timeoutSeconds: 120,
    maxInstances: 3,
  },
  async (request) => {
    const { url, duration = 10 } = request.data || {};

    // Validate URL
    const validation = validateRuntimeScanUrl(url);
    if (!validation.valid) {
      throw new HttpsError('invalid-argument', validation.error);
    }

    // Clamp duration between 5 and 30 seconds
    const captureDuration = Math.max(5, Math.min(30, Number(duration) || 10));
    const captureDurationMs = captureDuration * 1000;

    const startTime = Date.now();
    let browser;

    try {
      console.log(`[scanWebsiteRuntime] Launching browser for: ${url}`);

      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
        ],
      });

      const page = await browser.newPage();

      // Set a realistic user agent and viewport
      await page.setUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );
      await page.setViewport({ width: 1280, height: 800 });

      // Hard navigation timeout of 30 s
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      console.log(`[scanWebsiteRuntime] Page loaded. Capturing for ${captureDuration}s...`);

      const traceData = await captureRuntimeTrace(page, captureDurationMs);

      const scanDuration = Date.now() - startTime;
      console.log(`[scanWebsiteRuntime] Capture complete in ${scanDuration}ms. Framework: ${traceData.framework}`);

      const markdown = generateMerfolkFromRuntimeTrace(traceData, url);

      return {
        success: true,
        markdown,
        metadata: {
          framework: traceData.framework,
          url,
          componentCount: traceData.components.length,
          connectionCount: traceData.connections.length,
          scanDuration,
        },
      };
    } catch (error) {
      console.error('[scanWebsiteRuntime] Error:', error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', `Scan failed: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }
);
