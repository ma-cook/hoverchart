/**
 * enrichmentService.js
 *
 * Merges LSP analysis results into the existing diagram data structures.
 * Transforms raw LSP data into the format expected by the Merfolk generator
 * and diagram store.
 */

import useDiagramStore from '../../stores/diagramStore.js';

/**
 * Merge LSP analysis results into the diagram store.
 * Called after LSP analysis completes to update the graph with accurate
 * definitions, references, and type metadata.
 *
 * @param {import('../lsp/lspClient.js').LspClient} lspClient
 * @param {Array<{path: string, content: string}>} files
 * @param {object} [options]
 * @param {function} [onProgress]
 * @returns {Promise<LspEnrichmentResult>}
 */
export async function enrichDiagramWithLsp(lspClient, files, options = {}, onProgress) {
  const startTime = Date.now();

  try {
    if (onProgress) onProgress({ stage: 'connecting', progress: 0 });

    // Connect to LSP service
    await lspClient.connect();

    if (onProgress) onProgress({ stage: 'analyzing', progress: 10 });

    // Run LSP analysis
    const result = await lspClient.analyze(files, options);

    if (onProgress) onProgress({ stage: 'merging', progress: 90 });

    // Merge results into diagram store
    const merged = mergeLspResults(result);

    // Update diagram store with enriched metadata
    const store = useDiagramStore.getState();
    if (store.graphs) {
      store.setLspMetadata(merged);
    }

    const elapsed = Date.now() - startTime;
    console.log(`[LspEnrichment] Completed in ${elapsed}ms:`);
    console.log(`  ${merged.definitions.length} definitions, ${merged.references.length} references`);
    console.log(`  ${merged.hover.length} hover entries, ${merged.callGraph.length} call graph entries`);

    if (onProgress) onProgress({ stage: 'complete', progress: 100 });

    return merged;
  } catch (err) {
    console.warn('[LspEnrichment] LSP enrichment failed (non-fatal):', err.message);
    if (onProgress) onProgress({ stage: 'error', progress: 100, error: err.message });

    return {
      definitions: [],
      references: [],
      hover: [],
      callGraph: [],
      moduleExports: [],
      errors: [{ file: '', message: err.message, severity: 'error' }],
    };
  }
}

/**
 * Merge and deduplicate LSP results.
 *
 * @param {import('../lsp/lspClient.js').AnalyzeResult} result
 * @returns {LspEnrichmentResult}
 */
export function mergeLspResults(result) {
  const merged = {
    definitions: result.definitions || [],
    references: result.references || [],
    hover: result.hover || [],
    callGraph: result.callGraph || [],
    moduleExports: result.moduleExports || [],
    errors: result.errors || [],
  };

  // Deduplicate definitions by source+target pair
  const defKeys = new Set();
  merged.definitions = merged.definitions.filter(d => {
    const key = `${d.sourceFile}::${d.importName}::${d.targetFile}`;
    if (defKeys.has(key)) return false;
    defKeys.add(key);
    return true;
  });

  // Deduplicate references by source symbol
  const refKeys = new Set();
  merged.references = merged.references.filter(r => {
    const key = `${r.sourceFile}::${r.symbolName}`;
    if (refKeys.has(key)) return false;
    refKeys.add(key);
    return true;
  });

  // Deduplicate hover by file+symbol
  const hoverKeys = new Set();
  merged.hover = merged.hover.filter(h => {
    const key = `${h.file}::${h.symbol}`;
    if (hoverKeys.has(key)) return false;
    hoverKeys.add(key);
    return true;
  });

  return merged;
}

/**
 * Convert LSP results into the format expected by generateMerfolkMarkdown().
 * Used when re-generating Merfolk after LSP enrichment.
 *
 * @param {LspEnrichmentResult} lspData
 * @param {Map} existingModuleImportRelationships
 * @param {Map} existingFunctionCallRelationships
 * @param {Map} existingComponentRelationships
 * @returns {object} Object with updated maps
 */
export function applyLspToMerfolkMaps(lspData, existingModuleImportRelationships, existingFunctionCallRelationships, existingComponentRelationships) {
  const moduleImports = new Map(existingModuleImportRelationships);
  const functionCalls = new Map(existingFunctionCallRelationships);
  const componentRels = new Map(existingComponentRelationships);

  // Apply import definitions
  for (const def of lspData.definitions) {
    const sourceBase = def.sourceFile.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '') || '';
    const targetBase = def.targetFile.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '') || '';
    if (sourceBase && targetBase && sourceBase !== targetBase) {
      const existing = moduleImports.get(sourceBase) || new Set();
      existing.add(targetBase);
      moduleImports.set(sourceBase, existing);
    }
  }

  // Apply call graph
  for (const entry of lspData.callGraph) {
    const callerBase = entry.callerFile.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '') || '';
    const calleeBase = entry.calleeFile.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '') || '';
    if (callerBase && calleeBase) {
      if (!functionCalls.has(callerBase)) {
        functionCalls.set(callerBase, new Set());
      }
      const calls = functionCalls.get(callerBase);
      if (![...calls].some(c => c.target === entry.calleeName)) {
        calls.add({
          target: entry.calleeName,
          label: `calls ${entry.calleeName}`,
          type: 'utility',
        });
      }
    }
  }

  return { moduleImports, functionCalls, componentRels };
}

/**
 * @typedef {Object} LspEnrichmentResult
 * @property {Array} definitions
 * @property {Array} references
 * @property {Array} hover
 * @property {Array} callGraph
 * @property {Array} moduleExports
 * @property {Array} errors
 */

export default enrichDiagramWithLsp;
