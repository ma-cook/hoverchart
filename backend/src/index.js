import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { createWSServer } from './ws/index.js';
import { authenticate } from './auth/middleware.js';
import pool from './db.js';
import { runMigrations } from './migrate.js';

const app = express();
const httpServer = createServer(app);
const io = createWSServer(httpServer);

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// Auth routes (no auth middleware)
import { router as authRouter } from './auth/handlers.js';
app.use('/api/auth', authRouter);

// Protected API routes
import { router as spacesRouter } from './api/spaces.js';
import { router as objectsRouter } from './api/objects.js';
import { router as connectionsRouter } from './api/connections.js';
import { router as cellsRouter } from './api/cells.js';
import { router as organizationsRouter } from './api/organizations.js';
import { router as storageRouter } from './api/storage.js';
import { router as bulkRouter } from './api/bulk.js';
import { router as updatesRouter } from './api/updates.js';

app.use('/api/spaces', authenticate, spacesRouter);
app.use('/api/spaces/:spaceId/objects', authenticate, objectsRouter);
app.use('/api/spaces/:spaceId/connections', authenticate, connectionsRouter);
app.use('/api/spaces/:spaceId/cells', authenticate, cellsRouter);
app.use('/api/organizations', authenticate, organizationsRouter);
app.use('/api/storage', authenticate, storageRouter);
app.use('/api/bulk', authenticate, bulkRouter);
app.use('/api/updates', authenticate, updatesRouter);

// Admin routes
import { router as zenRouter } from './workers/runtimeScan.js';
app.use('/api/zen', authenticate, zenRouter);

// WebSocket
import { registerChatHandlers } from './ws/chat.js';
import { registerSignalingHandlers } from './ws/signaling.js';

io.on('connection', (socket) => {
  registerChatHandlers(io, socket);
  registerSignalingHandlers(io, socket);
});

// Start
const PORT = process.env.PORT || 8080;

async function start() {
  await runMigrations();
  httpServer.listen(PORT, () => {
    console.log(`Hoverchart API listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
