import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';

import fetch from 'node-fetch';
import express from 'express';
import cors from 'cors';

// Try to load environment variables with fallback mechanism

// Initialize Firebase Admin with service account
initializeApp({
  credential: cert({
    projectId: 'hoverchart',
    clientEmail: 'firebase-adminsdk-wka1s@hoverchart.iam.gserviceaccount.com',
    privateKey:
      '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCMot/sJZk60o9U\ntsipkOuKH09A9LJvUlaeY0tsJqxjpe29oq0g7rm5o4uasHk+lIXgIH2xIOrAyIsR\n981zlGJBk/M5JHMoEJhFcZjpXLDBZ+Ig032wtkYROdt0Iyn17rXpYkK9PSyk7erG\nkwzjDMYbQOjceQtJMtKRCLO3BP8gDD6ghSop1vvosYcSMwoZMTuAYegBaL7WTv6M\nvCOOzI7ADiO8DO5KPdqsdvHTi8D9ZRkYBjot0LdhpKFb2wlMqPOqSaayTlDJY7/C\n7T/6YyHstsAVe8u4kwfG8P2wfs2XzJ36L8mcn6E7gDcSOncK2FTrVmAkmWi1mu3v\n3zUMirjZAgMBAAECggEAEOqKerIvEzc+jFcMHfFTk6Keeta0G9XQm26gJNsmAzpz\nNUs6/eoZJu44HZw6iT9+Nu5RkBvAgP3eVIP1D4D6rJ6qM+Zhf6E3X6sBVJiUnj7r\noT0vMjFKjkniTr7oDi/va6opEvAnzZLcmZQYibsAnUiaeeKJa/2T/GQKkeok8eq5\ne3dE1NwbRLsFPMYX1JxAST3WYFxKEP6uFc4H+X6zg64Fix/YyqVegrVofTqxuBqa\nYw3f3JpBHxc6LKb/otUUaeAG13MbQa48pRNTD0BnTLqDRZQyJXoVXCwXlgPfutRX\n4mTo3nhPxGHuJ42eBEP4yXfPwnvvZWVzP4JDuzyPzQKBgQC/1x1LUqw+rJmFilRu\nQRXyHgOrR8jF58Kn6pnVEnWlrAvPbzkOgLD5YETh7MCUTcDHcmViFcVQiWLuC3em\ni30CoFKJI7OQZiuyyvk8fzdD7CXGF5KLCiF1zyr6hww4lO+blEid9NfLIAknCJt/\nIAlpz4h2Adm1efnXIMgTH6wAQwKBgQC7q8vy10QyBRqz0ysRUNA1O9lMFE5ItqrD\nzGFQrUouEzZYzzOtkKYj91dWQQkbH6uDLrJRgJPe1Bapm6CG1vi4eBLTZroZcNen\nigbHnHFxbyZL27Moh9seeokQkhEiDzvgwzXQ+ReN/Yhzp68XCDLPQ2eDgVu2sm13\nKddYC3OuswKBgB7SD5nHWXbkQfHrbG8eM8lnOw2shbwN5P8XOMm7on0QbAFSjCch\nU81swwRNBg+NglhIr7MXblDnEabO3tU5+caPPVNdEf8z+vdJlss6YQWfjd4KcXe3\nE/Maanw/cB4zB1/Gbfg6muS+a9oCjwDYg8qlFfZni7OVOidu09YGs5qDAoGBAILc\n+ds9FlWWz5bjQh3R702fjReK9Ueo8IyVwKokHBzi0ru8yDlYKzHbMHB56yKZw9w2\nvKsucG4qEB924MoFruva9q2o7U3+LLKsAaxBP62sptSwv04c5cNsCJWgdQf9/W/u\nT2GHwFAHoZWcMPBrjBqQ0uaVVmGgK8qzR3EikykXAoGAL5Un7EuwTh0c++qX8h6q\nponYoQ9pt0LWPpZHZUofc9GUxUWDS6aspJCh9CP4RW7AjHrBBHAInwfyTk9+tcZ0\nHhDsMad4bFijOBhzerJ2N0VoCh6/m7UGG0Z4QJhWRw2gaoCj4Uscig7GI02vvYnT\nWKEIVKdcMM37dz9EcEHv5pQ=\n-----END PRIVATE KEY-----\n',
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

        // Write objects to cells/{cellId} with objects.{id} map fields
        for (const [cellId, cellObjects] of objectsByCellId.entries()) {
          const cellRef = db.doc(
            `users/${userId}/spaces/${spaceId}/cells/${cellId}`
          );

          // Build the objects map field
          const objectsMap = {};
          for (const obj of cellObjects) {
            objectsMap[obj.id] = {
              id: obj.id,
              position: obj.position,
              scale: obj.size || obj.scale || [1, 1, 1], // Use 'scale' to match client expectations
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
              ...(obj.faceTextStyles && { faceTextStyles: obj.faceTextStyles }),
              ...(obj.merfolkData && { merfolkData: obj.merfolkData }),
            };
          }

          // Update cell document with objects map (merge to preserve existing data)
          await cellRef.set({ objects: objectsMap }, { merge: true });

          objectsWritten += cellObjects.length;
          console.log(
            `   ✓ Wrote ${cellObjects.length} objects to cell ${cellId}`
          );
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

export const fetchGithubToken = onRequest(
  {
    memory: '256MiB',
    region: 'us-central1',
    cors: true,
    maxInstances: 10,
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

      try {
        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          console.error('Missing GitHub credentials:', {
            clientId,
            clientSecret,
          });
          return res
            .status(500)
            .json({ error: 'GitHub credentials not configured' });
        }

        const response = await fetch(
          'https://github.com/login/oauth/access_token',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: clientId,
              client_secret: clientSecret,
              code,
            }),
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
