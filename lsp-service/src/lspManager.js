/**
 * lspManager.js
 *
 * Manages language server processes (typescript-language-server, pylsp).
 * Spawns servers on demand, maintains sessions, and routes LSP requests.
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';

// ── Language server configurations ──────────────────────────────────────────

const LANGUAGE_SERVERS = {
  typescript: {
    command: 'typescript-language-server',
    args: ['--stdio'],
    languages: ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'],
    initializationOptions: {
      preferences: {
        includeInlayParameterNameHints: 'none',
        includeInlayVariableTypeHints: false,
        includeInlayFunctionLikeReturnTypeHints: false,
      },
    },
  },
  python: {
    command: 'pylsp',
    args: [],
    languages: ['python'],
    initializationOptions: {
      settings: {
        pylsp: {
          plugins: {
            pycodestyle: { enabled: false },
            pyflakes: { enabled: false },
            mccabe: { enabled: false },
          },
        },
      },
    },
  },
};

// ── LspManager class ────────────────────────────────────────────────────────

export class LspManager {
  constructor() {
    /** @type {Map<string, LanguageServerSession>} */
    this.sessions = new Map();
    this.requestId = 0;
  }

  /**
   * Get or create a language server session for a given language.
   * @param {string} language - e.g. 'typescript', 'python'
   * @returns {Promise<LanguageServerSession>}
   */
  async getSession(language) {
    if (this.sessions.has(language)) {
      const session = this.sessions.get(language);
      if (!session.closed) return session;
      this.sessions.delete(language);
    }

    const config = LANGUAGE_SERVERS[language];
    if (!config) {
      throw new Error(`Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_SERVERS).join(', ')}`);
    }

    const session = await this._spawnServer(language, config);
    this.sessions.set(language, session);
    return session;
  }

  /**
   * Detect which language server(s) are needed for a set of files.
   * @param {Array<{path: string}>} files
   * @returns {string[]} Unique language server IDs
   */
  detectLanguages(files) {
    const languages = new Set();
    for (const file of files) {
      const ext = file.path.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'ts':
        case 'tsx':
        case 'js':
        case 'jsx':
        case 'mjs':
        case 'cjs':
          languages.add('typescript');
          break;
        case 'py':
          languages.add('python');
          break;
      }
    }
    return [...languages];
  }

  /**
   * Send an LSP request to a language server session.
   * @param {string} language
   * @param {string} method - LSP method name (e.g. 'textDocument/definition')
   * @param {object} params
   * @param {number} [timeout=30000]
   * @returns {Promise<any>}
   */
  async request(language, method, params, timeout = 30000) {
    const session = await this.getSession(language);
    return session.request(method, params, timeout);
  }

  /**
   * Shutdown all language server sessions.
   */
  async shutdown() {
    const shutdowns = [];
    for (const [language, session] of this.sessions) {
      shutdowns.push(session.shutdown().catch(() => {}).then(() => {
        console.log(`[LspManager] ${language} server shut down`);
      }));
    }
    await Promise.all(shutdowns);
    this.sessions.clear();
  }

  /**
   * Get status of all active sessions.
   */
  getStatus() {
    const status = {};
    for (const [language, session] of this.sessions) {
      status[language] = {
        ready: !session.closed,
        pid: session.pid,
        uptime: Date.now() - session.startTime,
      };
    }
    return status;
  }

  // ── Private ─────────────────────────────────────────────────────────────

  async _spawnServer(language, config) {
    console.log(`[LspManager] Spawning ${language} language server: ${config.command}`);

    const proc = spawn(config.command, config.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_NO_WARNINGS: '1' },
    });

    const session = new LanguageServerSession(language, proc);

    // Parse stderr for diagnostics (non-fatal)
    proc.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg && !msg.includes('Warning')) {
        console.log(`[${language}] stderr: ${msg.slice(0, 200)}`);
      }
    });

    proc.on('exit', (code) => {
      console.log(`[LspManager] ${language} server exited with code ${code}`);
      session.closed = true;
    });

    proc.on('error', (err) => {
      console.error(`[LspManager] ${language} server error:`, err.message);
      session.closed = true;
    });

    // Initialize the LSP session
    await session.initialize(config.initializationOptions);

    return session;
  }
}

// ── LanguageServerSession class ─────────────────────────────────────────────

class LanguageServerSession {
  constructor(language, proc) {
    this.language = language;
    this.proc = proc;
    this.pid = proc.pid;
    this.startTime = Date.now();
    this.closed = false;
    this.initialized = false;

    /** @type {Map<number, { resolve: Function, reject: Function, timer: ReturnType<typeof setTimeout> }>} */
    this.pendingRequests = new Map();

    // Buffer for Content-Length framed messages
    this.buffer = Buffer.alloc(0);

    // Set up response reader
    this._startReader();
  }

  /**
   * Initialize the LSP session (send initialize + initialized).
   */
  async initialize(initializationOptions) {
    const result = await this.request('initialize', {
      processId: process.pid,
      rootUri: 'file:///workspace',
      capabilities: {
        textDocument: {
          definition: { dynamicRegistration: false },
          references: { dynamicRegistration: false },
          hover: { dynamicRegistration: false },
          completion: { dynamicRegistration: false },
        },
      },
      initializationOptions,
    }, 10000);

    await this.request('initialized', {}, 5000);
    this.initialized = true;
    console.log(`[LspManager] ${this.language} server initialized`);

    return result;
  }

  /**
   * Open a file in the language server.
   */
  async openFile(filePath, content, languageId) {
    return this.request('textDocument/didOpen', {
      textDocument: {
        uri: `file:///${filePath}`,
        languageId: languageId || this._guessLanguageId(filePath),
        version: 1,
        text: content,
      },
    });
  }

  /**
   * Update a file's content.
   */
  async changeFile(filePath, content, version = 1) {
    return this.request('textDocument/didChange', {
      textDocument: {
        uri: `file:///${filePath}`,
        version,
      },
      contentChanges: [{ text: content }],
    });
  }

  /**
   * Close a file session.
   */
  async closeFile(filePath) {
    return this.request('textDocument/didClose', {
      textDocument: {
        uri: `file:///${filePath}`,
      },
    });
  }

  /**
   * Find the definition of a symbol at a given position.
   */
  async getDefinition(filePath, line, character) {
    return this.request('textDocument/definition', {
      textDocument: { uri: `file:///${filePath}` },
      position: { line, character },
    });
  }

  /**
   * Find all references to a symbol at a given position.
   */
  async getReferences(filePath, line, character, includeDeclaration = true) {
    return this.request('textDocument/references', {
      textDocument: { uri: `file:///${filePath}` },
      position: { line, character },
      context: { includeDeclaration },
    });
  }

  /**
   * Get hover information for a symbol.
   */
  async getHover(filePath, line, character) {
    return this.request('textDocument/hover', {
      textDocument: { uri: `file:///${filePath}` },
      position: { line, character },
    });
  }

  /**
   * Send an LSP request and wait for a response.
   */
  request(method, params, timeout = 30000) {
    if (this.closed) {
      return Promise.reject(new Error(`${this.language} server is closed`));
    }

    const id = ++this._requestIdCounter();
    const message = this._buildMessage(id, method, params);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`LSP request ${method} timed out after ${timeout}ms`));
      }, timeout);

      this.pendingRequests.set(id, { resolve, reject, timer });
      this.proc.stdin.write(message);
    });
  }

  _requestIdCounter() {
    if (!this._reqId) this._reqId = 0;
    return ++this._reqId;
  }

  /**
   * Shut down the language server.
   */
  async shutdown() {
    if (this.closed) return;

    try {
      await this.request('shutdown', {}, 5000);
    } catch {
      // Ignore shutdown errors
    }

    try {
      this.proc.stdin.end();
    } catch {
      // Ignore
    }

    this.closed = true;

    // Kill after a short delay if it hasn't exited
    setTimeout(() => {
      try {
        this.proc.kill('SIGTERM');
      } catch {
        // Already exited
      }
    }, 2000);
  }

  // ── Private helpers ───────────────────────────────────────────────────

  _startReader() {
    this.proc.stdout.on('data', (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      this._parseMessages();
    });
  }

  _parseMessages() {
    while (true) {
      // Look for "Content-Length: N\r\n\r\n"
      const headerEnd = this.buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) break;

      const header = this.buffer.slice(0, headerEnd).toString();
      const match = header.match(/Content-Length:\s*(\d+)/);
      if (!match) {
        // Skip malformed header
        this.buffer = this.buffer.slice(headerEnd + 4);
        continue;
      }

      const contentLength = parseInt(match[1], 10);
      const messageStart = headerEnd + 4;

      if (this.buffer.length < messageStart + contentLength) {
        break; // Wait for more data
      }

      const messageBody = this.buffer.slice(messageStart, messageStart + contentLength).toString();
      this.buffer = this.buffer.slice(messageStart + contentLength);

      try {
        const message = JSON.parse(messageBody);
        this._handleMessage(message);
      } catch (err) {
        console.error(`[${this.language}] Failed to parse LSP message:`, err.message);
      }
    }
  }

  _handleMessage(message) {
    // LSP response (has id + result/error)
    if ('id' in message && (message.result !== undefined || message.error !== undefined)) {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(message.id);

        if (message.error) {
          pending.reject(new Error(`LSP error: ${message.error.message}`));
        } else {
          pending.resolve(message.result);
        }
      }
    }
    // LSP notification (has method but no id) — ignore for now
    // LSP request from server (has id + method) — ignore for now
  }

  _buildMessage(id, method, params) {
    const message = { jsonrpc: '2.0', id, method, params };
    const body = JSON.stringify(message);
    return `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
  }

  _guessLanguageId(filePath) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const map = {
      ts: 'typescript', tsx: 'typescriptreact',
      js: 'javascript', jsx: 'javascriptreact',
      py: 'python',
    };
    return map[ext] || 'plaintext';
  }
}

export default LspManager;
