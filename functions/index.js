import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

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
const corsHandler = cors({
  origin: [
    'https://hoverchart.web.app',
    'https://hoverchart.firebaseapp.com',
    'http://localhost:5173',
    'http://localhost:5000',
    'https://space.volscape.com',
  ],
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

export const fetchGithubToken = onRequest(
  {
    memory: '256MiB',
    region: 'us-central1',
    cors: true,
    maxInstances: 10,
    secrets: [githubClientId, githubClientSecret],
  },
  async (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
      }

      const { code } = req.body;

      if (!code) {
        console.error('No code provided in request body:', req.body);
        return res
          .status(400)
          .json({ error: 'Authorization code is required' });
      }

      // redirect_uri must match the one used in the authorization request
      const redirectUri = req.body.redirect_uri;

      try {
        const clientId = githubClientId.value();
        const clientSecret = githubClientSecret.value();

        if (!clientId || !clientSecret) {
          console.error('Missing GitHub credentials:', {
            clientId,
            clientSecret,
          });
          return res
            .status(500)
            .json({ error: 'GitHub credentials not configured' });
        }

        const tokenBody = {
          client_id: clientId,
          client_secret: clientSecret,
          code,
        };
        if (redirectUri) {
          tokenBody.redirect_uri = redirectUri;
        }

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
          return res
            .status(400)
            .json({ error: 'Failed to fetch access token', details: data });
        }

        res.json({ access_token: params.get('access_token') });
      } catch (error) {
        console.error('Error fetching GitHub token:', error.stack || error);
        res
          .status(500)
          .json({ error: 'Internal Server Error', details: error.message });
      }
    });
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
