/**
 * tsAnalyzer.js
 *
 * Node adapter for the shared `runTypeScriptAnalysis` seam. Re-exports the
 * single source of truth (src/services/typescriptAnalyzer.js), whose loader
 * is environment-aware: on Node it imports the installed `typescript` package
 * instead of fetching the compiler from a CDN. Keeps browser and server TS
 * enrichment byte-identical.
 */

export { runTypeScriptAnalysis } from '../../../src/services/typescriptAnalyzer.js';