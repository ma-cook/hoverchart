/**
 * index.js
 *
 * Public API for the LSP browser client.
 * Re-exports the client, enrichment service, and types.
 */

export { LspClient, getLspClient } from './lspClient.js';
export { enrichDiagramWithLsp, mergeLspResults, applyLspToMerfolkMaps } from './enrichmentService.js';
