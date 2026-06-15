import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { onRequest, onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

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
    privateKey: process.env.ADMIN_PRIVATE_KEY,
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
      'https://volscape.com',
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
          if (!obj.id) {
            console.warn('⚠️  Skipping object without id:', obj);
            continue;
          }

          // Pipeline tasks from planScape arrive without position/cellId.
          // Assign defaults so they land in Firestore; the client-side
          // UIOverlay will reposition them into the repo container grid.
          if (!obj.cellId && obj.merfolkData?.planTaskIndex != null) {
            obj.cellId = '0,0,0';
            if (!obj.position) {
              obj.position = [0, 0, 0];
            }
            console.log(`📋 Auto-assigned cellId for pipeline task ${obj.id}`);
          } else if (!obj.cellId) {
            console.warn('⚠️  Skipping object without cellId:', obj);
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
                color: obj.color || null,
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

/** Generate a short random job ID. */
function generateJobId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Return the millisecond timestamp from a Firestore Timestamp object
 * (`toMillis()`), a plain JS `Date`, a raw epoch number, or null when the
 * value is missing / unrecognisable.
 */
function toMillis(value) {
  if (!value) return null;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return null;
}

/**
 * Delete all objects and connections inside a single cell whose lastUpdated
/**
 * Delete every object/connection document beneath `cellRef` whose `lastUpdated`
 * timestamp is at or before `cutoff` (ms).  Returns { objectsDeleted,
 * connectionsDeleted, objectsRemaining, connectionsRemaining } — the
 * "*Remaining" counts include any post-cutoff docs that were intentionally
 * skipped, so callers can decide whether it is safe to delete the parent
 * cell document itself.
 */
async function deleteCellContents(cellRef, cutoff, BATCH_SIZE) {
  const [objsSnap, connsSnap] = await Promise.all([
    cellRef.collection('objects').get(),
    cellRef.collection('connections').get(),
  ]);

  const objsToDelete = objsSnap.docs.filter((d) => {
    const ms = toMillis(d.data().lastUpdated);
    return ms === null || ms <= cutoff;
  });

  const connsToDelete = connsSnap.docs.filter((d) => {
    const ms = toMillis(d.data().lastUpdated);
    return ms === null || ms <= cutoff;
  });

  let objectsDeleted = 0;
  let connectionsDeleted = 0;

  for (let i = 0; i < objsToDelete.length; i += BATCH_SIZE) {
    const chunk = objsToDelete.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const d of chunk) batch.delete(d.ref);
    await batch.commit();
    objectsDeleted += chunk.length;
  }

  for (let i = 0; i < connsToDelete.length; i += BATCH_SIZE) {
    const chunk = connsToDelete.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const d of chunk) batch.delete(d.ref);
    await batch.commit();
    connectionsDeleted += chunk.length;
  }

  return {
    objectsDeleted,
    connectionsDeleted,
    objectsRemaining: objsSnap.size - objectsDeleted,
    connectionsRemaining: connsSnap.size - connectionsDeleted,
  };
}

function createBulkDeleteApp() {
  const app = express();

  app.use(cors({ origin: true }));
  app.use(express.json());

  // ---- POST / — start an async delete job and return jobId immediately ----
  app.post('/', async (req, res) => {
    const { idToken, userId, spaceId } = req.body;

    if (!idToken || !userId || !spaceId) {
      return res.status(400).json({
        error: 'Missing required fields: idToken, userId, spaceId',
      });
    }

    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(idToken);
    } catch (authErr) {
      return res.status(401).json({ error: 'Invalid auth token', details: authErr.message });
    }

    if (decodedToken.uid !== userId) {
      return res.status(403).json({
        error: 'Token user ID does not match provided userId',
      });
    }

    const jobId = generateJobId();
    const jobStartTime = Date.now();
    const jobRef = db.doc(`users/${userId}/spaces/${spaceId}/_deleteJobs/${jobId}`);

    // Enqueue the job. The `bulkDeleteWorker` Firestore trigger picks this up
    // asynchronously and performs the actual deletion. The HTTP handler does
    // no heavy work — it returns immediately so the frontend can poll status.
    try {
      await jobRef.set({
        status: 'pending',
        userId,
        spaceId,
        jobStartTime,
        objectsDeleted: 0,
        connectionsDeleted: 0,
        cellsDeleted: 0,
        createdAt: jobStartTime,
      });
    } catch (enqueueErr) {
      console.error(`❌ [${jobId}] Failed to enqueue delete job:`, enqueueErr);
      return res.status(500).json({ error: 'Failed to enqueue delete job', details: enqueueErr.message });
    }

    console.log(`📥 [${jobId}] Enqueued bulk delete for user ${userId}, space ${spaceId}`);
    res.json({ jobId, jobStartTime });
  });

  // ---- GET /job/:jobId — poll delete job status ----
  app.get('/job/:jobId', async (req, res) => {
    const { jobId } = req.params;
    const { userId, spaceId, idToken } = req.query;

    if (!idToken || !userId || !spaceId || !jobId) {
      return res.status(400).json({ error: 'Missing required query params: idToken, userId, spaceId' });
    }

    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(idToken);
    } catch (authErr) {
      return res.status(401).json({ error: 'Invalid auth token', details: authErr.message });
    }

    if (decodedToken.uid !== userId) {
      return res.status(403).json({ error: 'Token user ID does not match provided userId' });
    }

    const jobRef = db.doc(`users/${userId}/spaces/${spaceId}/_deleteJobs/${jobId}`);
    const snap = await jobRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ jobId, ...snap.data() });
  });

  return app;
}

export const bulkDelete = onRequest(
  {
    memory: '256MiB',
    region: 'us-central1',
    cors: true,
    timeoutSeconds: 60,
    maxInstances: 10,
  },
  createBulkDeleteApp()
);

// ============= BULK DELETE WORKER (Firestore-triggered) =============

/**
 * Run the actual bulk delete work. Reads job parameters from the job doc and
 * walks all cells under the space, deleting objects/connections whose
 * lastUpdated <= jobStartTime, then the cell docs themselves (only when their
 * subcollections are now fully empty, to avoid orphaning concurrent writes).
 *
 * Uses `listDocuments()` to enumerate cell refs so that previously-orphaned
 * cells (parent doc deleted but subcollections still present) are still
 * walked and cleaned up.
 */
async function runBulkDeleteJob(jobRef, jobData) {
  const { userId, spaceId, jobStartTime } = jobData;
  const jobId = jobRef.id;

  const BATCH_SIZE = 500;
  const CELL_CONCURRENCY = 5;
  let cellsDeleted = 0;
  let objectsDeleted = 0;
  let connectionsDeleted = 0;

  console.log(`🗑️  [${jobId}] Starting bulk delete for user ${userId}, space ${spaceId}`);

  await jobRef.update({ status: 'running', startedAt: Date.now() });

  const cellsRef = db.collection(`users/${userId}/spaces/${spaceId}/cells`);
  // listDocuments() returns DocumentReferences for every cell, including
  // "orphan" cells whose parent document was deleted but whose
  // /objects and /connections subcollections still hold data.
  const cellRefs = await cellsRef.listDocuments();

  console.log(`   [${jobId}] Found ${cellRefs.length} cells to process`);

  // Cells whose subcollections are still non-empty after the cutoff filter
  // (someone wrote to them while the job was running, OR the parent doc was
  // already an orphan with stale data we couldn't fully delete in this pass).
  const cellsToKeep = new Set();

  for (let i = 0; i < cellRefs.length; i += CELL_CONCURRENCY) {
    const chunk = cellRefs.slice(i, i + CELL_CONCURRENCY);
    const results = await Promise.all(
      chunk.map((cellRef) =>
        deleteCellContents(cellRef, jobStartTime, BATCH_SIZE).then((r) => ({ cellRef, ...r }))
      )
    );
    for (const r of results) {
      objectsDeleted += r.objectsDeleted;
      connectionsDeleted += r.connectionsDeleted;
      if (r.objectsRemaining > 0 || r.connectionsRemaining > 0) {
        cellsToKeep.add(r.cellRef.path);
      }
    }

    // Periodic progress update so the frontend poll sees movement.
    if ((i / CELL_CONCURRENCY) % 4 === 0) {
      await jobRef.update({ objectsDeleted, connectionsDeleted });
    }
  }

  // Only delete cell parent docs whose subcollections are now empty.
  // Cells with surviving (post-cutoff) writes keep their parent doc so
  // the spatial subscription system continues to find those documents.
  const deletableCellRefs = cellRefs.filter((ref) => !cellsToKeep.has(ref.path));
  for (let i = 0; i < deletableCellRefs.length; i += BATCH_SIZE) {
    const chunk = deletableCellRefs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const d of chunk) batch.delete(d);
    await batch.commit();
    cellsDeleted += chunk.length;
  }

  if (cellsToKeep.size > 0) {
    console.log(
      `   [${jobId}] Preserved ${cellsToKeep.size} cells with post-cutoff writes (concurrent saves)`
    );
  }

  const duration = Date.now() - jobStartTime;
  console.log(`✅ [${jobId}] Bulk delete completed in ${duration}ms`);
  console.log(`   Cells: ${cellsDeleted}, Objects: ${objectsDeleted}, Connections: ${connectionsDeleted}`);

  await jobRef.update({
    status: 'done',
    cellsDeleted,
    cellsPreserved: cellsToKeep.size,
    objectsDeleted,
    connectionsDeleted,
    finishedAt: Date.now(),
    duration,
  });
}

export const bulkDeleteWorker = onDocumentCreated(
  {
    document: 'users/{userId}/spaces/{spaceId}/_deleteJobs/{jobId}',
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 540, // 9 minutes
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const jobData = snap.data();
    const jobRef = snap.ref;
    const jobId = jobRef.id;

    // Only act on freshly-enqueued jobs.
    if (jobData.status !== 'pending') {
      console.log(`[${jobId}] Skipping trigger — status is '${jobData.status}', not 'pending'.`);
      return;
    }

    try {
      await runBulkDeleteJob(jobRef, jobData);
    } catch (err) {
      console.error(`❌ [${jobId}] Background delete error:`, err);
      try {
        await jobRef.update({
          status: 'error',
          error: err.message ?? String(err),
          finishedAt: Date.now(),
        });
      } catch (updateErr) {
        console.error(`❌ [${jobId}] Failed to update job status to error:`, updateErr);
      }
    }
  }
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
// Components and hooks are uncapped — the fiber walk and bundle scan only yield
// real named items; large component counts are expected for rich SPAs.
const MAX_EVENT_HANDLERS = 100;
const MAX_API_CALLS = 20;

// CDP profiler function names to exclude from the diagram
const EXCLUDED_PROFILER_NAMES = new Set([
  '(anonymous)',
  '(program)',
  '(root)',
  '(idle)',
  '(garbage collector)',
]);

// Known React / framework / bundler internals that appear in minified bundles
// but are not user-defined components or utilities.
const BUNDLE_NOISE_NAMES = new Set([
  // React fiber internals
  'renderWithHooks', 'reconcileChildren', 'reconcileChildFibers',
  'createFiber', 'createWorkInProgress', 'beginWork', 'completeWork',
  'commitWork', 'commitRoot', 'performSyncWorkOnRoot', 'performConcurrentWorkOnRoot',
  'updateFunctionComponent', 'updateClassComponent', 'updateHostComponent',
  'updateMemoComponent', 'updateSimpleMemoComponent', 'updateForwardRef',
  'mountIndeterminateComponent', 'mountLazyComponent',
  'throwException', 'processUpdateQueue', 'cloneUpdateQueue',
  'getStateFromUpdate', 'invokeGuardedCallback',
  'flushPassiveEffects', 'flushPassiveEffectsImpl',
  'commitHookEffectListMount', 'commitHookEffectListUnmount',
  'scheduleUpdateOnFiber', 'ensureRootIsScheduled', 'batchedUpdates',
  'dispatchSetState', 'dispatchAction', 'basicStateReducer',
  'enqueueSetState', 'createUpdate', 'enqueueUpdate',
  'readContext', 'prepareToReadContext', 'propagateContextChange',
  'resolveDefaultProps', 'applyDerivedStateFromProps',
  // React hooks internals
  'mountState', 'updateState', 'mountReducer', 'updateReducer',
  'mountEffect', 'updateEffect', 'mountLayoutEffect', 'updateLayoutEffect',
  'mountMemo', 'updateMemo', 'mountCallback', 'updateCallback',
  'mountRef', 'updateRef', 'mountContext', 'readContextForConsumer',
  'mountImperativeHandle', 'updateImperativeHandle',
  'mountDeferredValue', 'updateDeferredValue',
  'mountTransition', 'updateTransition',
  'mountSyncExternalStore', 'updateSyncExternalStore',
  // Scheduler / runtime
  'workLoop', 'workLoopSync', 'workLoopConcurrent',
  'performWork', 'performUnitOfWork', 'prepareFreshStack',
  'pushDispatcher', 'popDispatcher', 'pushCacheProvider',
  'unstable_scheduleCallback', 'unstable_cancelCallback',
  'unstable_runWithPriority', 'requestUpdateLane',
  // Bundler/webpack runtime
  'webpackJsonpCallback', 'checkDeferredModules', '__webpack_require__',
  'hotCreateModule', 'hotApply', 'getModuleExports',
  // Generic noise
  'Object', 'Array', 'Promise', 'Error', 'Symbol',
  'Boolean', 'Number', 'String', 'Function', 'RegExp',
  'call', 'bind', 'apply', 'then', 'catch', 'finally',
  'toString', 'valueOf', 'hasOwnProperty', 'constructor',
  'render', 'setState', 'forceUpdate', 'componentDidMount',
  'componentDidUpdate', 'componentWillUnmount', 'shouldComponentUpdate',
  'getSnapshotBeforeUpdate', 'getDerivedStateFromProps',
]);

// React DevTools hook injected via evaluateOnNewDocument (before React loads)
// so React registers its renderer with us and we receive every onCommitFiberRoot call.
const REACT_DEVTOOLS_INJECTION = () => {
  window.__hc_comps = new Set();
  window.__hc_hooks = new Set();

  function getCompName(type) {
    if (!type || typeof type === 'string') return null;
    if (typeof type === 'function') return type.displayName || type.name || null;
    if (typeof type === 'object') {
      if (type.type) return (type.type.displayName || type.type.name) || null; // memo
      if (type.render) return (type.render.displayName || type.render.name) || null; // forwardRef
    }
    return null;
  }

  function walkFiber(fiber) {
    if (!fiber) return;
    const name = getCompName(fiber.type);
    if (name && name.length > 1 && /^[A-Z]/.test(name) && name !== 'Object') {
      window.__hc_comps.add(name);
    }
    // Collect hook names from the memoized state chain
    let s = fiber.memoizedState;
    while (s) {
      const dispatch = s.queue && s.queue.dispatch;
      if (dispatch && dispatch._reactName) window.__hc_hooks.add(dispatch._reactName);
      s = s.next;
    }
    walkFiber(fiber.child);
    walkFiber(fiber.sibling);
  }

  const hookImpl = {
    checkDCE: () => {},
    supportsFiber: true,
    renderers: new Map(),
    _roots: new Map(),
    onCommitFiberRoot: function(id, root) {
      try { if (root && root.current) walkFiber(root.current.child || root.current); } catch (e) { /* ignore */ }
    },
    onPostCommitFiberRoot: function(id, root) {
      try { if (root && root.current) walkFiber(root.current.child || root.current); } catch (e) { /* ignore */ }
    },
    onCommitFiberUnmount: () => {},
    inject: function(renderer) {
      const id = this.renderers.size;
      this.renderers.set(id, renderer);
      return id;
    },
  };

  if (!window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
      value: hookImpl, configurable: true, writable: true, enumerable: false,
    });
  } else {
    // Wrap existing hook (e.g. browser DevTools extension)
    const existing = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    const origCommit = existing.onCommitFiberRoot;
    existing.onCommitFiberRoot = function(id, root, priority) {
      hookImpl.onCommitFiberRoot(id, root);
      if (origCommit) origCommit.call(this, id, root, priority);
    };
    const origPost = existing.onPostCommitFiberRoot;
    existing.onPostCommitFiberRoot = function(id, root) {
      hookImpl.onPostCommitFiberRoot(id, root);
      if (origPost) origPost.call(this, id, root);
    };
  }
};

/**
 * Extract the sourceMappingURL from a JS bundle's source text.
 * Supports both inline data URIs and external URL references.
 * @param {string} source - The JS bundle source text
 * @param {string} scriptUrl - The URL of the JS bundle (for resolving relative paths)
 * @returns {string|null} - Absolute URL to the source map, or null if not found
 */
function extractSourceMapUrl(source, scriptUrl) {
  // Check last 500 chars for //# sourceMappingURL=...
  const tail = source.slice(-500);
  const match = tail.match(/\/\/[#@]\s*sourceMappingURL=(\S+)/);
  if (!match) return null;
  const raw = match[1];
  // Skip inline data URIs (base64 source maps) — too large to process efficiently
  if (raw.startsWith('data:')) return null;
  try {
    return new URL(raw, scriptUrl).href;
  } catch {
    return null;
  }
}

/**
 * Scan original (un-minified) source code for component/hook/function names.
 * These patterns are reliable on un-minified code unlike on minified bundles.
 */
function scanOriginalSource(source, components, hooks, functions) {
  if (!source || source.length === 0) return;
  // Cap per-file scan to avoid runaway processing
  const src = source.length > 500000 ? source.slice(0, 500000) : source;

  // React components: function Name( or const Name = (arrow/memo/forwardRef)
  for (const m of src.matchAll(/\bfunction\s+([A-Z][a-zA-Z0-9]{2,60})\s*\(/g)) {
    if (!BUNDLE_NOISE_NAMES.has(m[1])) components.add(m[1]);
  }
  // const/let/var Name = React.memo|forwardRef|...
  for (const m of src.matchAll(/\b(?:const|let|var)\s+([A-Z][a-zA-Z0-9]{2,60})\s*=/g)) {
    if (!BUNDLE_NOISE_NAMES.has(m[1])) components.add(m[1]);
  }
  // export default class Name
  for (const m of src.matchAll(/\bclass\s+([A-Z][a-zA-Z0-9]{2,60})\b/g)) {
    if (!BUNDLE_NOISE_NAMES.has(m[1])) components.add(m[1]);
  }

  // Hooks: function useXxx( or const useXxx =
  for (const m of src.matchAll(/\bfunction\s+(use[A-Z][a-zA-Z0-9]{1,60})\s*\(/g)) {
    hooks.add(m[1]);
  }
  for (const m of src.matchAll(/\b(?:const|let)\s+(use[A-Z][a-zA-Z0-9]{1,60})\s*=/g)) {
    hooks.add(m[1]);
  }

  // Utility functions: function camelCase( (5+ chars, exported or top-level)
  for (const m of src.matchAll(/\b(?:export\s+)?function\s+([a-z][a-zA-Z0-9]{4,60})\s*\(/g)) {
    if (!BUNDLE_NOISE_NAMES.has(m[1])) functions.add(m[1]);
  }
}

/**
 * Extract component/hook/function names from the source map's `names` array
 * and `sources` file paths. Works even without `sourcesContent`.
 */
function extractNamesFromSourceMap(sourceMap, components, hooks, functions) {
  // ── names array: contains all original identifiers before mangling ────
  const names = sourceMap.names || [];
  for (const name of names) {
    if (typeof name !== 'string' || name.length < 3) continue;
    if (BUNDLE_NOISE_NAMES.has(name)) continue;

    if (/^use[A-Z][a-zA-Z0-9]+$/.test(name) && name.length >= 5) {
      hooks.add(name);
    } else if (/^[A-Z][a-zA-Z0-9]{2,}$/.test(name)) {
      components.add(name);
    } else if (/^[a-z][a-zA-Z0-9]{4,}$/.test(name) && name.length >= 6) {
      functions.add(name);
    }
  }

  // ── sources paths: extract component names from file names ────────────
  // e.g. "../../src/components/Header.jsx" → "Header"
  const sources = sourceMap.sources || [];
  for (const filePath of sources) {
    if (typeof filePath !== 'string') continue;
    if (/node_modules[/\\]/.test(filePath)) continue;

    // Extract the filename without extension
    const match = filePath.match(/\/([^/]+?)\.(?:jsx?|tsx?|vue|svelte)$/);
    if (!match) continue;
    const fileName = match[1];

    // Skip index/test/style files
    if (/^(index|test|spec|style|__\w+)$/i.test(fileName)) continue;

    // PascalCase filenames → components
    if (/^[A-Z][a-zA-Z0-9]{2,}$/.test(fileName)) {
      components.add(fileName);
    }
    // useXxx filenames → hooks
    else if (/^use[A-Z][a-zA-Z0-9]+$/.test(fileName)) {
      hooks.add(fileName);
    }
  }
}

/**
 * Fetch loaded JS bundles server-side. Attempts three strategies in order:
 * 1. Source map `sourcesContent` — scan original un-minified code
 * 2. Source map `names` + `sources` — extract identifiers and file names
 * 3. Minified bundle regex — last resort with strict length filters
 */
async function scanJsBundles(page) {
  const scriptUrls = await page.evaluate(() =>
    Array.from(document.querySelectorAll('script[src]')).map((s) => s.src).filter(Boolean)
  );

  const bundleComponents = new Set();
  const bundleHooks = new Set();
  const bundleFunctions = new Set();
  let hasSourceMaps = false;

  // Prefer app bundles over vendor/runtime chunks; fall back to all if nothing matches
  const appBundles = scriptUrls.filter(
    (u) => !/\/(chunk-|runtime[.-]|polyfill|vendor[.-]|node_modules)/i.test(u)
  );
  const bundles = (appBundles.length > 0 ? appBundles : scriptUrls).slice(0, 8);
  console.log(`[scanJsBundles] Found ${scriptUrls.length} scripts, scanning ${bundles.length} app bundles`);

  const fetchOpts = {
    headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36' },
    signal: AbortSignal.timeout(10000),
  };

  for (const scriptUrl of bundles) {
    try {
      const res = await fetch(scriptUrl, fetchOpts);
      if (!res.ok) continue;
      let source = await res.text();
      if (source.length > 2000000) source = source.slice(0, 2000000);

      // ── Try source map ───────────────────────────────────────────────
      let sourceMapUrl = extractSourceMapUrl(source, scriptUrl);

      // Speculative fallback: try <bundle>.map if no sourceMappingURL comment
      if (!sourceMapUrl) {
        const speculativeUrl = scriptUrl + '.map';
        try {
          const probe = await fetch(speculativeUrl, { method: 'HEAD', headers: fetchOpts.headers, signal: AbortSignal.timeout(3000) });
          if (probe.ok && (probe.headers.get('content-type') || '').includes('json')) {
            sourceMapUrl = speculativeUrl;
            console.log(`[scanJsBundles] Found speculative source map at: ${speculativeUrl}`);
          }
        } catch { /* ignore */ }
      }

      if (sourceMapUrl) {
        console.log(`[scanJsBundles] Found source map URL: ${sourceMapUrl}`);
        try {
          const mapRes = await fetch(sourceMapUrl, {
            headers: fetchOpts.headers,
            signal: AbortSignal.timeout(10000),
          });
          if (mapRes.ok) {
            const sourceMap = await mapRes.json();
            console.log(`[scanJsBundles] Source map loaded: ${(sourceMap.names || []).length} names, ${(sourceMap.sources || []).length} sources, sourcesContent: ${!!(sourceMap.sourcesContent && sourceMap.sourcesContent.length > 0)}`);

            // Strategy 1: sourcesContent — scan original code
            if (sourceMap.sourcesContent && sourceMap.sourcesContent.length > 0) {
              hasSourceMaps = true;
              const sources = sourceMap.sources || [];
              for (let i = 0; i < sourceMap.sourcesContent.length; i++) {
                const filePath = sources[i] || '';
                if (/node_modules[/\\]/.test(filePath)) continue;
                scanOriginalSource(sourceMap.sourcesContent[i], bundleComponents, bundleHooks, bundleFunctions);
              }
              console.log(`[scanJsBundles] After sourcesContent scan: ${bundleComponents.size} components, ${bundleHooks.size} hooks, ${bundleFunctions.size} functions`);
              continue;
            }

            // Strategy 2: names array + sources paths
            if ((sourceMap.names && sourceMap.names.length > 0) || (sourceMap.sources && sourceMap.sources.length > 0)) {
              hasSourceMaps = true;
              extractNamesFromSourceMap(sourceMap, bundleComponents, bundleHooks, bundleFunctions);
              console.log(`[scanJsBundles] After names/sources scan: ${bundleComponents.size} components, ${bundleHooks.size} hooks, ${bundleFunctions.size} functions`);
              continue;
            }
          } else {
            console.log(`[scanJsBundles] Source map fetch failed: ${mapRes.status}`);
          }
        } catch (e) {
          console.log(`[scanJsBundles] Source map fetch error: ${e.message}`);
        }
      }

      // ── Strategy 3: Fallback — scan minified source ──────────────────
      console.log(`[scanJsBundles] No source map, falling back to minified scan for ${scriptUrl.slice(-60)}`);
      // .displayName = "MyComponent" — most reliable in production builds
      for (const m of source.matchAll(/\.displayName\s*=\s*["']([A-Z][a-zA-Z0-9]{2,50})["']/g)) {
        bundleComponents.add(m[1]);
      }
      // __name(fn, "OriginalName") — Vite/esbuild keepNames helper
      for (const m of source.matchAll(/__name\s*\(\s*\w+\s*,\s*["']([A-Z][a-zA-Z0-9]{2,50})["']\s*\)/g)) {
        if (!BUNDLE_NOISE_NAMES.has(m[1])) bundleComponents.add(m[1]);
      }
      // Named PascalCase function declarations (≥6 chars to avoid minified)
      for (const m of source.matchAll(/\bfunction\s+([A-Z][a-zA-Z0-9]{5,50})\s*[({]/g)) {
        if (!BUNDLE_NOISE_NAMES.has(m[1])) bundleComponents.add(m[1]);
      }
      // Hook definitions
      for (const m of source.matchAll(/\bfunction\s+(use[A-Z][a-zA-Z0-9]{2,50})\s*[({]/g)) {
        if (!BUNDLE_NOISE_NAMES.has(m[1])) bundleHooks.add(m[1]);
      }
      for (const m of source.matchAll(/\bconst\s+(use[A-Z][a-zA-Z0-9]{2,50})\s*=\s*(?:async\s*)?\(/g)) {
        if (!BUNDLE_NOISE_NAMES.has(m[1])) bundleHooks.add(m[1]);
      }
      // Named camelCase utility functions (min 6 chars)
      for (const m of source.matchAll(/\bfunction\s+([a-z][a-zA-Z0-9]{5,50})\s*[({]/g)) {
        if (!BUNDLE_NOISE_NAMES.has(m[1])) bundleFunctions.add(m[1]);
      }
    } catch {
      // ignore per-bundle failures
    }
  }

  console.log(`[scanJsBundles] Final: hasSourceMaps=${hasSourceMaps}, ${bundleComponents.size} components, ${bundleHooks.size} hooks, ${bundleFunctions.size} functions`);
  return { bundleComponents, bundleHooks, bundleFunctions, hasSourceMaps };
}

async function captureRuntimeTrace(page, durationMs) {
  const client = await page.createCDPSession();

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
        networkRequests.push({ method: request.method, path: urlObj.pathname, url: request.url });
      } catch { /* ignore malformed URLs */ }
    }
  });

  // Wait the configured capture window
  await new Promise((resolve) => setTimeout(resolve, durationMs));

  const profilerResult = await client.send('Profiler.stop');

  // ── Read all runtime data from the page ─────────────────────────────────
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

    // ── Framework detection ──────────────────────────────────────────────
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (hook) {
      data.framework = window.__NEXT_DATA__ ? 'Next.js' : 'React';
    } else if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__ || (window.Vue && window.Vue.version)) {
      data.framework = 'Vue';
    } else if (window.angular || (window.ng && window.ng.coreTokens)) {
      data.framework = 'Angular';
    } else if (window.Svelte) {
      data.framework = 'Svelte';
    }

    // ── Components/hooks collected by the pre-injected DevTools hook ─────
    // (hook was installed via evaluateOnNewDocument before React loaded,
    //  so every onCommitFiberRoot call has already populated __hc_comps/__hc_hooks)
    if (window.__hc_comps) {
      for (const name of window.__hc_comps) data.components.push({ name });
    }
    if (window.__hc_hooks) {
      for (const name of window.__hc_hooks) data.hooks.push({ name });
    }

    // ── Supplemental fiber walk (catches React present but not yet committed) ──
    if (hook) {
      const seen = new Set();
      const getCompName = (type) => {
        if (!type || typeof type === 'string') return null;
        if (typeof type === 'function') return type.displayName || type.name || null;
        if (typeof type === 'object') {
          if (type.type) return (type.type.displayName || type.type.name) || null; // memo
          if (type.render) return (type.render.displayName || type.render.name) || null; // forwardRef
        }
        return null;
      };
      const walkFiber = (fiber) => {
        if (!fiber || seen.has(fiber)) return;
        seen.add(fiber);
        const name = getCompName(fiber.type);
        if (name && name.length > 1 && /^[A-Z]/.test(name) && name !== 'Object') {
          if (!data.components.find((c) => c.name === name)) data.components.push({ name });
        }
        // Hooks from memoized state chain
        let s = fiber.memoizedState;
        while (s) {
          const dispatch = s.queue && s.queue.dispatch;
          if (dispatch && dispatch._reactName && !data.hooks.find((h) => h.name === dispatch._reactName)) {
            data.hooks.push({ name: dispatch._reactName });
          }
          s = s.next;
        }
        walkFiber(fiber.child);
        walkFiber(fiber.sibling);
      };
      try {
        if (hook._roots) {
          hook._roots.forEach((root) => {
            if (root && root.current) walkFiber(root.current.child || root.current);
          });
        }
        if (hook.renderers) {
          hook.renderers.forEach((renderer) => {
            if (renderer.getFiberRoots) {
              renderer.getFiberRoots().forEach((root) => {
                if (root.current) walkFiber(root.current.child || root.current);
              });
            }
          });
        }
        // Root DOM element fallback
        const rootEl = ['root', 'app', '__next', 'main'].map((id) => document.getElementById(id)).find(Boolean) || document.body;
        const fiberKey = Object.keys(rootEl).find(
          (k) => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
        );
        if (fiberKey) walkFiber(rootEl[fiberKey]);
      } catch { /* ignore DevTools access errors */ }
    }

    // ── State store detection ────────────────────────────────────────────
    if (window.__REDUX_DEVTOOLS_EXTENSION__) data.stateStores.push({ name: 'reduxStore' });
    if (window.__zustand__) data.stateStores.push({ name: 'zustandStore' });
    if (window.Vuex) data.stateStores.push({ name: 'vuexStore' });
    if (window.MobX || window.mobx) data.stateStores.push({ name: 'mobxStore' });
    if (window.Recoil) data.stateStores.push({ name: 'recoilStore' });
    if (window.jotai) data.stateStores.push({ name: 'jotaiStore' });

    // ── Library detection — script tags + window globals ─────────────────
    const scriptSrcs = Array.from(document.querySelectorAll('script[src]')).map((s) => s.src);
    const knownLibs = [
      { pattern: /lodash/i, globals: ['_', 'lodash'], name: 'lodash' },
      { pattern: /jquery/i, globals: ['$', 'jQuery'], name: 'jQuery' },
      { pattern: /axios/i, globals: ['axios'], name: 'axios' },
      { pattern: /moment/i, globals: ['moment'], name: 'moment' },
      { pattern: /dayjs/i, globals: ['dayjs'], name: 'dayjs' },
      { pattern: /\bd3(\.min)?\.js/i, globals: ['d3'], name: 'd3' },
      { pattern: /three(\.min)?\.js/i, globals: ['THREE'], name: 'three' },
      { pattern: /gsap/i, globals: ['gsap', 'TweenMax', 'TweenLite'], name: 'GSAP' },
      { pattern: /bootstrap/i, globals: ['bootstrap'], name: 'bootstrap' },
      { pattern: /tailwind/i, globals: [], name: 'tailwindcss' },
      { pattern: /framer[_-]motion/i, globals: ['Motion', 'FramerMotion'], name: 'framer-motion' },
      { pattern: /redux/i, globals: ['Redux'], name: 'redux' },
      { pattern: /mobx/i, globals: ['MobX', 'mobx'], name: 'MobX' },
      { pattern: /graphql/i, globals: ['GraphQL'], name: 'GraphQL' },
      { pattern: /socket\.io/i, globals: ['io'], name: 'socket.io' },
      { pattern: /firebase/i, globals: ['firebase'], name: 'firebase' },
      { pattern: /supabase/i, globals: ['supabase'], name: 'supabase' },
      { pattern: /tanstack|react-query/i, globals: [], name: 'tanstack-query' },
      { pattern: /swr/i, globals: [], name: 'SWR' },
    ];
    for (const { pattern, globals, name } of knownLibs) {
      if (data.libraries.find((l) => l.name === name)) continue;
      const inScript = scriptSrcs.some((s) => pattern.test(s));
      const inGlobal = globals.some((g) => { try { return window[g] !== undefined; } catch { return false; } });
      if (inScript || inGlobal) data.libraries.push({ name });
    }

    // ── Web Worker detection ─────────────────────────────────────────────
    if (window.__workers) {
      for (const w of window.__workers) data.workers.push({ name: w });
    }

    // ── DOM fallback (no framework detected) ────────────────────────────
    if (data.components.length === 0) {
      const customEls = [...new Set(
        Array.from(document.querySelectorAll('*')).map((el) => el.tagName.toLowerCase()).filter((t) => t.includes('-'))
      )].slice(0, 20);
      for (const tag of customEls) {
        data.components.push({ name: tag.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) });
      }
      if (data.components.length === 0) {
        const title = document.title || 'Page';
        data.components.push({ name: title.replace(/[^a-zA-Z0-9]/g, '') || 'RootComponent' });
      }
    }

    // ── Inline DOM event handlers ────────────────────────────────────────
    for (const type of ['click', 'submit', 'input', 'change', 'keydown', 'scroll', 'load']) {
      if (document.querySelectorAll(`[on${type}]`).length > 0) {
        const name = `on${type.charAt(0).toUpperCase()}${type.slice(1)}`;
        if (!data.eventHandlers.find((h) => h.name === name)) data.eventHandlers.push({ name });
      }
    }

    return data;
  });

  // ── CPU profiler: classify by naming convention ──────────────────────────
  const profileNodes = profilerResult.profile ? profilerResult.profile.nodes : [];
  const seenFns = new Set();
  for (const node of profileNodes) {
    const fn = node.callFrame && node.callFrame.functionName;
    if (!fn || fn.length <= 1 || EXCLUDED_PROFILER_NAMES.has(fn) || seenFns.has(fn)) continue;
    seenFns.add(fn);

    if (/^use[A-Z]/.test(fn)) {
      // Custom hook
      if (!runtimeData.hooks.find((h) => h.name === fn)) runtimeData.hooks.push({ name: fn });
    } else if (/^[A-Z][a-zA-Z0-9]+$/.test(fn) && !BUNDLE_NOISE_NAMES.has(fn)) {
      // PascalCase → likely a component
      if (!runtimeData.components.find((c) => c.name === fn)) runtimeData.components.push({ name: fn });
    } else if (/^[a-z]/.test(fn)) {
      // camelCase → utility / event handler
      if (!runtimeData.eventHandlers.find((h) => h.name === fn)) runtimeData.eventHandlers.push({ name: fn });
    }
  }

  // ── JS bundle scanning (server-side, prefers source maps) ─────────────────
  const { bundleComponents, bundleHooks, bundleFunctions, hasSourceMaps } = await scanJsBundles(page);

  console.log(`[captureRuntimeTrace] Pre-merge: fiber components=${runtimeData.components.length}, bundle components=${bundleComponents.size}, hasSourceMaps=${hasSourceMaps}`);
  console.log(`[captureRuntimeTrace] Fiber component names: ${runtimeData.components.slice(0, 10).map(c => c.name).join(', ')}${runtimeData.components.length > 10 ? '...' : ''}`);
  console.log(`[captureRuntimeTrace] Bundle component names: ${[...bundleComponents].slice(0, 10).join(', ')}${bundleComponents.size > 10 ? '...' : ''}`);

  if (hasSourceMaps && bundleComponents.size > 0) {
    // Source maps gave us real un-minified names — use those as the authoritative
    // component list instead of the (possibly mangled) fiber-walked names.
    runtimeData.components = [...bundleComponents].map((name) => ({ name }));
  } else {
    // No source maps: merge bundle-scanned names with fiber-walked names
    for (const name of bundleComponents) {
      if (!runtimeData.components.find((c) => c.name === name)) runtimeData.components.push({ name });
    }
  }

  // Merge hooks from any source
  for (const name of bundleHooks) {
    if (!runtimeData.hooks.find((h) => h.name === name)) runtimeData.hooks.push({ name });
  }

  for (const name of bundleFunctions) {
    if (runtimeData.eventHandlers.length >= MAX_EVENT_HANDLERS) break;
    if (!BUNDLE_NOISE_NAMES.has(name) && !runtimeData.eventHandlers.find((h) => h.name === name)) {
      runtimeData.eventHandlers.push({ name });
    }
  }

  // ── Deduplicate (components/hooks uncapped; functions capped at MAX_EVENT_HANDLERS) ──
  const dedup = (arr) => [...new Map(arr.map((x) => [x.name, x])).values()];
  runtimeData.apiCalls = deduplicateApiCalls(networkRequests).slice(0, MAX_API_CALLS);
  runtimeData.components = dedup(runtimeData.components);
  runtimeData.hooks = dedup(runtimeData.hooks);
  runtimeData.eventHandlers = dedup(runtimeData.eventHandlers).slice(0, MAX_EVENT_HANDLERS);

  console.log(`[captureRuntimeTrace] Final: ${runtimeData.components.length} components, ${runtimeData.hooks.length} hooks, ${runtimeData.eventHandlers.length} functions, ${runtimeData.apiCalls.length} APIs`);

  // ── Build connections ────────────────────────────────────────────────────
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

const ALLOWED_ORIGINS = [
  'https://hoverchart.web.app',
  'https://hoverchart.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:5000',
  'https://space.volscape.com',
  'https://volscape.com',
];

function createScanWebsiteRuntimeApp() {
  const app = express();

  app.use(cors({ origin: ALLOWED_ORIGINS }));
  app.use(express.json());

  app.post('/', async (req, res) => {
    const { idToken, url, duration = 10 } = req.body;

    if (!idToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      await getAuth().verifyIdToken(idToken);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Validate URL
    const validation = validateRuntimeScanUrl(url);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Clamp duration between 5 and 30 seconds
    const captureDuration = Math.max(5, Math.min(30, Number(duration) || 10));
    const captureDurationMs = captureDuration * 1000;

    const startTime = Date.now();
    let browser;

    try {
      console.log(`[scanWebsiteRuntime] Launching browser for: ${url}`);

      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });

      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );
      await page.setViewport({ width: 1280, height: 800 });

      // Inject our React DevTools-compatible hook BEFORE any scripts run,
      // so React registers its renderer with us on startup.
      await page.evaluateOnNewDocument(REACT_DEVTOOLS_INJECTION);

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Short extra wait so lazy-loaded/deferred components have time to mount
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log(`[scanWebsiteRuntime] Page loaded. Capturing for ${captureDuration}s...`);

      const traceData = await captureRuntimeTrace(page, captureDurationMs);

      const scanDuration = Date.now() - startTime;
      console.log(`[scanWebsiteRuntime] Capture complete in ${scanDuration}ms. Framework: ${traceData.framework}`);

      const markdown = generateMerfolkFromRuntimeTrace(traceData, url);

      return res.json({
        success: true,
        markdown,
        metadata: {
          framework: traceData.framework,
          url,
          componentCount: traceData.components.length,
          connectionCount: traceData.connections.length,
          scanDuration,
        },
      });
    } catch (error) {
      console.error('[scanWebsiteRuntime] Error:', error);
      return res.status(500).json({ error: 'Scan failed', details: error.message });
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  });

  return app;
}

export const scanWebsiteRuntime = onRequest(
  {
    memory: '1GiB',
    region: 'us-central1',
    timeoutSeconds: 120,
    maxInstances: 3,
    cors: true,
  },
  createScanWebsiteRuntimeApp()
);

// ============= ZEN PROXY FUNCTION =============
const zenApiKey = defineSecret('ZEN_API_KEY');

function createZenProxyApp() {
  const app = express();

  app.use(cors({ origin: true }));
  app.use(express.json({ limit: '1mb' }));

  app.post('/', async (req, res) => {
    const apiKey = zenApiKey.value();
    if (!apiKey) {
      console.error('[zenProxy] ZEN_API_KEY not configured');
      return res.status(500).json({ error: 'ZEN_API_KEY not configured' });
    }

    const { messages, model = 'big-pickle' } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    try {
      const response = await fetch('https://opencode.ai/zen/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages, stream: true }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(`[zenProxy] Zen API error ${response.status}:`, errorText);
        return res.status(response.status).json({
          error: `Zen API error ${response.status}`,
          details: errorText || response.statusText,
        });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body.getReader();

      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      } catch (streamError) {
        console.error('[zenProxy] Stream error:', streamError.message);
      } finally {
        res.end();
      }
    } catch (error) {
      console.error('[zenProxy] Error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Proxy request failed', details: error.message });
      }
    }
  });

  return app;
}

export const zenProxy = onRequest(
  {
    memory: '256MiB',
    region: 'us-central1',
    maxInstances: 10,
    secrets: [zenApiKey],
  },
  createZenProxyApp()
);
