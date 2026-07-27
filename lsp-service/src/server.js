/**
 * server.js
 *
 * WebSocket server for the LSP analysis service.
 * Accepts file analysis requests from the browser, routes them through
 * language servers, and returns enriched definition/reference/type data.
 */

import { WebSocketServer } from 'ws';
import { LspManager } from './lspManager.js';
import { analyze, detectLanguages } from './analyzers/index.js';
import { REQUEST_TYPES, RESPONSE_TYPES, detectLanguage } from './lib/protocol.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const MAX_FILES_PER_REQUEST = parseInt(process.env.MAX_FILES || '500', 10);
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT || '120000', 10);

const lspManager = new LspManager();

// ── WebSocket server ────────────────────────────────────────────────────────

const wss = new WebSocketServer({ port: PORT });

console.log(`[LSP Service] Starting on port ${PORT}`);
console.log(`[LSP Service] Max files per request: ${MAX_FILES_PER_REQUEST}`);
console.log(`[LSP Service] Request timeout: ${REQUEST_TIMEOUT}ms`);

wss.on('connection', (ws, req) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`[LSP Service] Client connected: ${clientIp}`);

  // Send status on connect
  sendStatus(ws);

  ws.on('message', async (data) => {
    let message;
    try {
      message = JSON.parse(data.toString());
    } catch {
      ws.send(JSON.stringify({
        type: RESPONSE_TYPES.ERROR,
        payload: { message: 'Invalid JSON' },
      }));
      return;
    }

    const { type, id, payload } = message;

    switch (type) {
      case REQUEST_TYPES.ANALYZE:
        await handleAnalyze(ws, id, payload);
        break;

      case REQUEST_TYPES.FILE_CHANGED:
        await handleFileChanged(payload);
        break;

      case REQUEST_TYPES.FILE_CLOSED:
        await handleFileClosed(payload);
        break;

      default:
        ws.send(JSON.stringify({
          type: RESPONSE_TYPES.ERROR,
          id,
          payload: { message: `Unknown request type: ${type}` },
        }));
    }
  });

  ws.on('close', () => {
    console.log(`[LSP Service] Client disconnected`);
  });

  ws.on('error', (err) => {
    console.error(`[LSP Service] WebSocket error:`, err.message);
  });
});

// ── Request handlers ────────────────────────────────────────────────────────

async function handleAnalyze(ws, id, payload) {
  const { files, options = {} } = payload;

  if (!files || !Array.isArray(files) || files.length === 0) {
    ws.send(JSON.stringify({
      type: RESPONSE_TYPES.ERROR,
      id,
      payload: { message: 'No files provided' },
    }));
    return;
  }

  if (files.length > MAX_FILES_PER_REQUEST) {
    ws.send(JSON.stringify({
      type: RESPONSE_TYPES.ERROR,
      id,
      payload: { message: `Too many files: ${files.length}. Max: ${MAX_FILES_PER_REQUEST}` },
    }));
    return;
  }

  console.log(`[LSP Service] Analyzing ${files.length} files...`);

  const onProgress = (progress) => {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: RESPONSE_TYPES.PROGRESS,
        payload: progress,
      }));
    }
  };

  try {
    const result = await Promise.race([
      analyze(lspManager, files, options, onProgress),
      timeout(REQUEST_TIMEOUT, 'Analysis timed out'),
    ]);

    if (ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: RESPONSE_TYPES.ANALYZE_RESULT,
        id,
        payload: result,
      }));
    }
  } catch (err) {
    console.error(`[LSP Service] Analysis failed:`, err.message);
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: RESPONSE_TYPES.ERROR,
        id,
        payload: { message: `Analysis failed: ${err.message}` },
      }));
    }
  }
}

async function handleFileChanged(payload) {
  const { path, content } = payload;
  if (!path || content === undefined) return;

  const language = getLanguageForFile(path);
  if (!language) return;

  try {
    const session = await lspManager.getSession(language);
    await session.changeFile(path, content);
  } catch (err) {
    console.warn(`[LSP Service] Failed to update file ${path}:`, err.message);
  }
}

async function handleFileClosed(payload) {
  const { path } = payload;
  if (!path) return;

  const language = getLanguageForFile(path);
  if (!language) return;

  try {
    const session = await lspManager.getSession(language);
    await session.closeFile(path);
  } catch {
    // Non-fatal
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function sendStatus(ws) {
  const status = lspManager.getStatus();
  const languages = Object.keys(status);
  const uptime = Object.values(status).reduce((max, s) => Math.max(max, s.uptime || 0), 0);

  ws.send(JSON.stringify({
    type: RESPONSE_TYPES.STATUS,
    payload: {
      ready: true,
      languages,
      uptime,
      pid: process.pid,
    },
  }));
}

function getLanguageForFile(filePath) {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'typescript';
    case 'py':
      return 'python';
    default:
      return null;
  }
}

function timeout(ms, message) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

// ── Graceful shutdown ───────────────────────────────────────────────────────

process.on('SIGTERM', async () => {
  console.log('[LSP Service] SIGTERM received, shutting down...');
  await lspManager.shutdown();
  wss.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[LSP Service] SIGINT received, shutting down...');
  await lspManager.shutdown();
  wss.close();
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  console.error('[LSP Service] Unhandled rejection:', err);
});
