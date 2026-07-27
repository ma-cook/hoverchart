/**
 * lspClient.js
 *
 * WebSocket client for connecting to the LSP analysis service.
 * Handles connection management, reconnection, request correlation,
 * and progress streaming.
 */

const RECONNECT_DELAY = 2000;
const MAX_RECONNECT_ATTEMPTS = 5;
const DEFAULT_REQUEST_TIMEOUT = 120000;

/**
 * Resolve the LSP WebSocket URL.
 * Auto-upgrades ws:// to wss:// when the page is served over HTTPS
 * (i.e., production on Cloud Run).
 *
 * @param {string} [explicitUrl]
 * @returns {string}
 */
function resolveLspUrl(explicitUrl) {
  const raw = explicitUrl || import.meta.env.VITE_LSP_URL || 'http://localhost:3001';
  // If the caller already provided a full ws:// or wss:// URL, use it as-is
  if (raw.startsWith('ws://') || raw.startsWith('wss://')) return raw;

  // Parse host:port or http(s)://host:port
  let host = raw;
  let port = '';
  try {
    const u = new URL(raw.startsWith('http') ? raw : `http://${raw}`);
    host = u.hostname;
    port = u.port || '';
  } catch {
    // Fall back to treating raw as host:port
    const parts = raw.split(':');
    host = parts[0];
    port = parts[1] || '';
  }

  // Upgrade to wss:// when the page is HTTPS (Cloud Run, production)
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return port ? `${proto}://${host}:${port}` : `${proto}://${host}`;
}

/**
 * LSP WebSocket client.
 */
export class LspClient {
  constructor(url) {
    this.url = resolveLspUrl(url);
    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;

    /** @type {Map<string, { resolve: Function, reject: Function, timer: ReturnType<typeof setTimeout> }>} */
    this.pendingRequests = new Map();

    this.onStatusChange = null;
    this.onProgress = null;
  }

  /**
   * Connect to the LSP service.
   * @returns {Promise<void>}
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[LspClient] Connected to LSP service');
          this.connected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          this._handleMessage(event.data);
        };

        this.ws.onclose = () => {
          console.log('[LspClient] Disconnected from LSP service');
          this.connected = false;
          this._rejectAllPending('Connection closed');
          this._scheduleReconnect();
          if (this.onStatusChange) this.onStatusChange(false);
        };

        this.ws.onerror = (err) => {
          console.warn('[LspClient] WebSocket error:', err);
          if (!this.connected) reject(new Error('Failed to connect to LSP service'));
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Disconnect from the LSP service.
   */
  disconnect() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.reconnectAttempts = MAX_RECONNECT_ATTEMPTS; // Prevent reconnection

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  /**
   * Analyze files via the LSP service.
   *
   * @param {Array<{path: string, content: string}>} files
   * @param {object} [options]
   * @param {boolean} [options.includeDefinitions=true]
   * @param {boolean} [options.includeReferences=true]
   * @param {boolean} [options.includeHover=true]
   * @param {boolean} [options.includeCallGraph=true]
   * @param {number} [timeout=120000]
   * @returns {Promise<import('./types').AnalyzeResult>}
   */
  async analyze(files, options = {}, timeout = DEFAULT_REQUEST_TIMEOUT) {
    if (!this.connected) {
      await this.connect();
    }

    const id = this._createRequestId();

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error('LSP analysis request timed out'));
      }, timeout);

      this.pendingRequests.set(id, { resolve, reject, timer });

      this.ws.send(JSON.stringify({
        type: 'analyze',
        id,
        payload: { files, options },
      }));
    });
  }

  /**
   * Get the current connection status.
   */
  getStatus() {
    return {
      connected: this.connected,
      url: this.url,
    };
  }

  // ── Private ───────────────────────────────────────────────────────────

  _handleMessage(data) {
    let message;
    try {
      message = JSON.parse(data);
    } catch {
      console.warn('[LspClient] Invalid JSON from LSP service');
      return;
    }

    const { type, id, payload } = message;

    switch (type) {
      case 'analyzeResult': {
        const pending = this.pendingRequests.get(id);
        if (pending) {
          clearTimeout(pending.timer);
          this.pendingRequests.delete(id);
          pending.resolve(payload);
        }
        break;
      }

      case 'progress': {
        if (this.onProgress) this.onProgress(payload);
        break;
      }

      case 'status': {
        console.log('[LspClient] LSP service status:', payload);
        if (this.onStatusChange) this.onStatusChange(true, payload);
        break;
      }

      case 'error': {
        const pending = this.pendingRequests.get(id);
        if (pending) {
          clearTimeout(pending.timer);
          this.pendingRequests.delete(id);
          pending.reject(new Error(payload.message || 'LSP analysis failed'));
        } else {
          console.error('[LspClient] LSP error:', payload.message);
        }
        break;
      }
    }
  }

  _rejectAllPending(reason) {
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error(reason));
    }
    this.pendingRequests.clear();
  }

  _scheduleReconnect() {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.warn('[LspClient] Max reconnection attempts reached');
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`[LspClient] Reconnecting (attempt ${this.reconnectAttempts})...`);
      this.connect().catch(() => {});
    }, RECONNECT_DELAY * Math.min(this.reconnectAttempts + 1, 5));
  }

  _createRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

let defaultClient = null;

/**
 * Get or create the default LSP client.
 * @param {string} [url]
 * @returns {LspClient}
 */
export function getLspClient(url) {
  if (!defaultClient) {
    defaultClient = new LspClient(url);
  }
  return defaultClient;
}

export default LspClient;
