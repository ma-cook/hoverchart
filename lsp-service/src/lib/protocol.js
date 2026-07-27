/**
 * protocol.js
 *
 * Shared WebSocket message types for browser ↔ LSP service communication.
 * Used by both the backend (lsp-service) and browser client (src/services/lsp/).
 */

// ── Request types (browser → server) ────────────────────────────────────────

/**
 * Analyze files with LSP language servers.
 * @typedef {Object} AnalyzeRequest
 * @property {'analyze'} type
 * @property {string} id - Unique request ID for correlation
 * @property {{ files: Array<{path: string, content: string, language?: string}>, options?: AnalyzeOptions }} payload
 */

/**
 * @typedef {Object} AnalyzeOptions
 * @property {boolean} [includeDefinitions=true] - Resolve import definitions
 * @property {boolean} [includeReferences=true] - Find export references
 * @property {boolean} [includeHover=true] - Get type/hover information
 * @property {boolean} [includeCallGraph=true] - Build call graph
 */

/**
 * Update a file's content (incremental).
 * @typedef {Object} FileChangedRequest
 * @property {'fileChanged'} type
 * @property {{ path: string, content: string }} payload
 */

/**
 * Close a file session.
 * @typedef {Object} FileClosedRequest
 * @property {'fileClosed'} type
 * @property {{ path: string }} payload
 */

// ── Response types (server → browser) ───────────────────────────────────────

/**
 * Analysis results.
 * @typedef {Object} AnalyzeResponse
 * @property {'analyzeResult'} type
 * @property {string} id - Correlates to the request ID
 * @property {AnalyzeResult} payload
 */

/**
 * @typedef {Object} AnalyzeResult
 * @property {Array<ImportDefinition>} [definitions]
 * @property {Array<ExportReference>} [references]
 * @property {Array<HoverInfo>} [hover]
 * @property {Array<CallGraphEntry>} [callGraph]
 * @property {Array<ModuleExport>} [moduleExports]
 * @property {AnalysisError[]} [errors]
 */

/**
 * @typedef {Object} ImportDefinition
 * @property {string} sourceFile
 * @property {string} importName
 * @property {string} targetFile
 * @property {number} targetLine
 * @property {string} targetSymbol
 * @property {boolean} isTypeOnly
 */

/**
 * @typedef {Object} ExportReference
 * @property {string} sourceFile
 * @property {number} sourceLine
 * @property {string} symbolName
 * @property {Array<{file: string, line: number}>} referencedBy
 */

/**
 * @typedef {Object} HoverInfo
 * @property {string} file
 * @property {number} line
 * @property {string} symbol
 * @property {string} type
 * @property {string} [documentation]
 */

/**
 * @typedef {Object} CallGraphEntry
 * @property {string} callerFile
 * @property {string} callerName
 * @property {string} calleeFile
 * @property {string} calleeName
 * @property {number} calleeLine
 */

/**
 * @typedef {Object} ModuleExport
 * @property {string} moduleFile
 * @property {string} exportName
 * @property {string} targetFile
 * @property {number} targetLine
 * @property {boolean} isReExport
 */

/**
 * @typedef {Object} AnalysisError
 * @property {string} file
 * @property {string} message
 * @property {'warning' | 'error'} severity
 */

/**
 * Progress update during analysis.
 * @typedef {Object} ProgressNotification
 * @property {'progress'} type
 * @property {{ processed: number, total: number, currentFile: string }} payload
 */

/**
 * Server status notification.
 * @typedef {Object} StatusNotification
 * @property {'status'} type
 * @property {{ ready: boolean, languages: string[], uptime: number }} payload
 */

// ── Message type helpers ────────────────────────────────────────────────────

/** All request message types */
export const REQUEST_TYPES = {
  ANALYZE: 'analyze',
  FILE_CHANGED: 'fileChanged',
  FILE_CLOSED: 'fileClosed',
};

/** All response/notification message types */
export const RESPONSE_TYPES = {
  ANALYZE_RESULT: 'analyzeResult',
  PROGRESS: 'progress',
  STATUS: 'status',
  ERROR: 'error',
};

/**
 * Create a uniquely identifying request ID.
 * @returns {string}
 */
export function createRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Detect language from file path extension.
 * @param {string} filePath
 * @returns {string} Language server ID
 */
export function detectLanguage(filePath) {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts': return 'typescript';
    case 'tsx': return 'typescriptreact';
    case 'js': return 'javascript';
    case 'jsx': return 'javascriptreact';
    case 'mjs': return 'javascript';
    case 'cjs': return 'javascript';
    case 'py': return 'python';
    default: return 'unknown';
  }
}
