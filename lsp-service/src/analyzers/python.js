/**
 * python.js
 *
 * Python LSP analyzer.
 * Uses pylsp (Python Language Server Protocol) to provide definition resolution,
 * reference finding, and type metadata.
 */

/**
 * Analyze Python files using the LSP.
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
export async function analyzePython(lspManager, files, options = {}, onProgress) {
  const {
    includeDefinitions = true,
    includeReferences = true,
    includeHover = true,
    includeCallGraph = true,
  } = options;

  const result = {
    definitions: [],
    references: [],
    hover: [],
    callGraph: [],
    moduleExports: [],
    errors: [],
  };

  const pyFiles = files.filter(f => f.path.endsWith('.py'));
  if (pyFiles.length === 0) return result;

  const language = 'python';

  // Open all files
  for (let i = 0; i < pyFiles.length; i++) {
    const file = pyFiles[i];
    try {
      await lspManager.request(language, 'textDocument/didOpen', {
        textDocument: {
          uri: `file:///${file.path}`,
          languageId: 'python',
          version: 1,
          text: file.content,
        },
      });
    } catch (err) {
      result.errors.push({ file: file.path, message: err.message, severity: 'warning' });
    }

    if (onProgress) {
      onProgress({ processed: i + 1, total: pyFiles.length, currentFile: file.path });
    }
  }

  // Analyze each file
  for (const file of pyFiles) {
    const lines = file.content.split('\n');

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];

      // ── Import definitions ───────────────────────────────────────────
      if (includeDefinitions && /^\s*(from\s+\S+\s+)?import\s/.test(line)) {
        try {
          const importMatch = line.match(/from\s+(\S+)\s+import\s+(\w+)/);
          if (importMatch) {
            const symbol = importMatch[2];
            const col = line.indexOf(symbol);
            const defResult = await lspManager.request(language, 'textDocument/definition', {
              textDocument: { uri: `file:///${file.path}` },
              position: { line: lineIdx, character: col },
            }, 5000);

            if (defResult && (Array.isArray(defResult) ? defResult.length > 0 : defResult)) {
              const defs = Array.isArray(defResult) ? defResult : [defResult];
              for (const def of defs) {
                result.definitions.push({
                  sourceFile: file.path,
                  importName: symbol,
                  targetFile: (def.uri || '').replace('file:///', ''),
                  targetLine: (def.range?.start?.line || 0) + 1,
                  targetSymbol: symbol,
                  isTypeOnly: false,
                });
              }
            }
          }
        } catch (err) {
          result.errors.push({ file: file.path, message: `definition: ${err.message}`, severity: 'warning' });
        }
      }

      // ── Function/class definitions → references ─────────────────────
      if (includeReferences) {
        const defMatch = line.match(/^(?:def|class)\s+(\w+)/);
        if (defMatch) {
          try {
            const col = line.indexOf(defMatch[1]);
            const refsResult = await lspManager.request(language, 'textDocument/references', {
              textDocument: { uri: `file:///${file.path}` },
              position: { line: lineIdx, character: col },
              context: { includeDeclaration: false },
            }, 5000);

            if (refsResult && Array.isArray(refsResult) && refsResult.length > 0) {
              result.references.push({
                sourceFile: file.path,
                sourceLine: lineIdx + 1,
                symbolName: defMatch[1],
                referencedBy: refsResult
                  .filter(r => r.uri !== `file:///${file.path}`)
                  .map(r => ({
                    file: (r.uri || '').replace('file:///', ''),
                    line: (r.range?.start?.line || 0) + 1,
                  })),
              });
            }
          } catch {
            // Non-fatal
          }
        }
      }

      // ── Hover / type info ───────────────────────────────────────────
      if (includeHover) {
        const symbolMatch = line.match(/^(?:def|class)\s+(\w+)/);
        if (symbolMatch) {
          try {
            const col = line.indexOf(symbolMatch[1]);
            const hoverResult = await lspManager.request(language, 'textDocument/hover', {
              textDocument: { uri: `file:///${file.path}` },
              position: { line: lineIdx, character: col },
            }, 5000);

            if (hoverResult?.contents) {
              const typeStr = typeof hoverResult.contents === 'string'
                ? hoverResult.contents
                : hoverResult.contents.value || '';

              if (typeStr) {
                result.hover.push({
                  file: file.path,
                  line: lineIdx + 1,
                  symbol: symbolMatch[1],
                  type: typeStr.slice(0, 200),
                });
              }
            }
          } catch {
            // Non-fatal
          }
        }
      }
    }
  }

  // Close all files
  for (const file of pyFiles) {
    try {
      await lspManager.request(language, 'textDocument/didClose', {
        textDocument: { uri: `file:///${file.path}` },
      });
    } catch {
      // Non-fatal
    }
  }

  return result;
}

export default analyzePython;
