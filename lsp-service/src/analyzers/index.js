/**
 * index.js
 *
 * Analyzer registry — routes files to the correct language-specific analyzer
 * and merges results.
 */

import { analyzeTypeScript } from './typescript.js';
import { analyzePython } from './python.js';

/** @type {Map<string, Function>} language → analyzer function */
const ANALYZERS = {
  typescript: analyzeTypeScript,
  python: analyzePython,
};

/**
 * Detect which languages are present in a set of files.
 * @param {Array<{path: string}>} files
 * @returns {string[]}
 */
export function detectLanguages(files) {
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
 * Run LSP analysis on files using the appropriate language server(s).
 * Routes files to the correct analyzer based on extension, then merges results.
 *
 * @param {import('../lspManager.js').LspManager} lspManager
 * @param {Array<{path: string, content: string}>} files
 * @param {object} options
 * @param {boolean} [options.includeDefinitions=true]
 * @param {boolean} [options.includeReferences=true]
 * @param {boolean} [options.includeHover=true]
 * @param {boolean} [options.includeCallGraph=true]
 * @param {function} [onProgress]
 * @returns {Promise<import('../lib/protocol.js').AnalyzeResult>}
 */
export async function analyze(lspManager, files, options = {}, onProgress) {
  const languages = detectLanguages(files);
  console.log(`[Analyzer] Detected languages: ${languages.join(', ')} (${files.length} files)`);

  /** @type {import('../lib/protocol.js').AnalyzeResult} */
  const merged = {
    definitions: [],
    references: [],
    hover: [],
    callGraph: [],
    moduleExports: [],
    errors: [],
  };

  for (const lang of languages) {
    const analyzer = ANALYZERS[lang];
    if (!analyzer) {
      console.warn(`[Analyzer] No analyzer for language: ${lang}`);
      continue;
    }

    try {
      const langFiles = filterFilesForLanguage(files, lang);
      console.log(`[Analyzer] Running ${lang} analyzer on ${langFiles.length} files...`);

      const result = await analyzer(lspManager, langFiles, options, onProgress);

      merged.definitions.push(...(result.definitions || []));
      merged.references.push(...(result.references || []));
      merged.hover.push(...(result.hover || []));
      merged.callGraph.push(...(result.callGraph || []));
      merged.moduleExports.push(...(result.moduleExports || []));
      merged.errors.push(...(result.errors || []));

      console.log(`[Analyzer] ${lang}: ${(result.definitions || []).length} defs, ${(result.references || []).length} refs, ${(result.hover || []).length} hovers`);
    } catch (err) {
      console.error(`[Analyzer] ${lang} analysis failed:`, err.message);
      merged.errors.push({ file: '', message: `${lang} analysis failed: ${err.message}`, severity: 'error' });
    }
  }

  console.log(`[Analyzer] Total: ${merged.definitions.length} defs, ${merged.references.length} refs, ${merged.hover.length} hovers, ${merged.errors.length} errors`);
  return merged;
}

/**
 * Filter files to only those matching a specific language.
 */
function filterFilesForLanguage(files, language) {
  const extMap = {
    typescript: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'],
    python: ['py'],
  };
  const exts = extMap[language] || [];
  return files.filter(f => {
    const ext = f.path.split('.').pop()?.toLowerCase();
    return exts.includes(ext);
  });
}

export default analyze;
